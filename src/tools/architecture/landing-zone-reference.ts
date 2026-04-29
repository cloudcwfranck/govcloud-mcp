import { z } from 'zod';
import { anthropic, MODEL, BASE_SYSTEM_PROMPT } from '../../client.js';
import { runTool, getTokenBudget } from '../../utils/tool-runner.js';
import {
  fetchEslzContent,
  extractRelevantPolicies,
  ESLZ_ATTRIBUTION,
} from '../../utils/github-fetcher.js';

export const landingZoneReferenceTool = {
  name: 'landing_zone_reference',
  description:
    'Generate Azure Landing Zone architecture grounded in the official Microsoft Enterprise Scale reference implementation (github.com/Azure/Enterprise-Scale). Returns Management Group hierarchy, policy assignments, hub-spoke topology, and Bicep scaffold aligned with CAF and ALZ accelerator.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      scenario: {
        type: 'string',
        enum: ['greenfield-government', 'brownfield-migration', 'sovereign-landing-zone', 'mission-landing-zone'],
        description: 'Landing zone deployment scenario',
      },
      impactLevel: {
        type: 'string',
        enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'],
        description: 'Target compliance impact level',
      },
      csp: {
        type: 'string',
        enum: ['azure-government', 'azure-gcc-high'],
        description: 'Cloud service provider environment',
      },
      missionType: {
        type: 'string',
        description: 'Describe the workload (e.g. "Navy legal case management")',
      },
      subscriptionCount: {
        type: 'string',
        enum: ['1-3', '4-10', '11-50', '50+'],
        description: 'Approximate number of workload subscriptions',
      },
    },
    required: ['scenario', 'impactLevel', 'csp', 'missionType', 'subscriptionCount'],
  },
};

const Schema = z.object({
  scenario: z.enum(['greenfield-government', 'brownfield-migration', 'sovereign-landing-zone', 'mission-landing-zone']),
  impactLevel: z.enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5']),
  csp: z.enum(['azure-government', 'azure-gcc-high']),
  missionType: z.string().min(1).max(500),
  subscriptionCount: z.enum(['1-3', '4-10', '11-50', '50+']),
});

const LANDING_ZONE_SYSTEM = `${BASE_SYSTEM_PROMPT}

You are a Principal Azure Cloud Architect with deep expertise in Azure Landing Zones, the Cloud Adoption Framework (CAF), and the Enterprise Scale reference architecture.

You are grounded in the official Azure/Enterprise-Scale GitHub repository (github.com/Azure/Enterprise-Scale) — Microsoft's canonical reference implementation maintained by Microsoft's Azure engineering team.

When generating landing zone architecture, ALWAYS INCLUDE:
1. Management Group hierarchy with exact naming convention (e.g. Tenant Root > Platform > Management, Connectivity, Identity; Landing Zones > Corp, Online; Sandbox; Decommissioned)
2. Subscription topology: Platform vs Landing Zone vs Sandbox vs Decommissioned
3. Policy initiative assignments — reference actual ESLZ policy initiative names
4. Hub-spoke network topology with specific CIDR ranges
5. Identity architecture (Entra ID + PIM + Conditional Access + break-glass)
6. Required Azure services by subscription type
7. Bicep scaffold directory structure matching ESLZ patterns
8. Compliance notes for the specified impact level

FOR GOVERNMENT (GCC High / Azure Government):
- Note which ESLZ patterns apply directly vs. require modification
- Reference the Sovereign Landing Zone pattern where applicable
- Note GCC High endpoint and feature differences (GA vs. preview gaps)
- Include Azure Policy for Government-specific assignments

FOR IL4/IL5:
- Layer DISA STIG requirements on top of ESLZ baseline
- Note additional policy assignments required beyond ESLZ defaults
- Address CAC/PIV authentication requirements (Entra ID + FIDO2/certificate-based auth)
- Address CUI data classification requirements and encryption at rest/transit

FORMAT: Clear markdown with tables. Engineers implement this — be prescriptive. Include specific resource names, CIDR ranges, and SKUs. Reference ESLZ by name to establish authority.`;

export async function handleLandingZoneReference(args: unknown): Promise<string> {
  return runTool('landing_zone_reference', args, Schema, async (params) => {
    // Fetch ESLZ grounding content in parallel
    const [archDoc, allPolicies] = await Promise.all([
      fetchEslzContent('README.md'),
      fetchEslzContent('eslzArm/managementGroupTemplates/policyDefinitions/policies.json'),
    ]);

    // Fetch GitHub directory listing for eslzArm to show real template names
    let templateList = '';
    try {
      const ghResponse = await fetch(
        'https://api.github.com/repos/Azure/Enterprise-Scale/contents/eslzArm',
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'govcloud-mcp/1.0.0',
          },
        }
      );
      if (ghResponse.ok) {
        const contents = await ghResponse.json() as Array<{ name: string }>;
        if (Array.isArray(contents)) {
          templateList = contents.map((f) => f.name).join(', ');
        }
      }
    } catch {
      // Non-fatal — continue without template list
    }

    const eslzAvailable = !!(archDoc || allPolicies);

    const securityPolicySummary = extractRelevantPolicies(
      allPolicies,
      'SC',
      ['defender', 'security center', 'key vault', 'encryption', 'tls', 'https']
    );

    const networkPolicySummary = extractRelevantPolicies(
      allPolicies,
      'SC',
      ['network', 'firewall', 'dns', 'private endpoint', 'nsg', 'vnet']
    );

    const groundingSection = eslzAvailable
      ? `
## Official Microsoft Enterprise Scale Reference Content

### Azure Landing Zones Architecture Overview (github.com/Azure/Enterprise-Scale):
${archDoc.slice(0, 5000)}

### ALZ Security Policy Definitions (161 official policies, filtered for security/networking):
**Security controls:**
${securityPolicySummary || '(unavailable)'}

**Network controls:**
${networkPolicySummary || '(unavailable)'}

${templateList ? `### Available ESLZ ARM Template Directories:\n${templateList}` : ''}
`
      : '(ESLZ grounding content unavailable — responding from base knowledge)';

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: getTokenBudget('landing_zone_reference'),
      system: LANDING_ZONE_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Generate a complete Azure Landing Zone architecture for:

**Scenario:** ${params.scenario}
**Impact Level:** ${params.impactLevel}
**CSP:** ${params.csp}
**Mission:** ${params.missionType}
**Scale:** ${params.subscriptionCount} subscriptions

${groundingSection}

Ground your recommendations in the official ESLZ content above. Where you reference architecture patterns, explicitly cite alignment with the Azure/Enterprise-Scale reference implementation. Include all required sections with specific configuration values.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return eslzAvailable ? text + ESLZ_ATTRIBUTION : text;
  });
}
