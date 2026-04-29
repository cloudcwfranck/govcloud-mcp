import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { PLATFORM_ONE_SYSTEM } from '../../prompts/system-prompts.js';

export const bigbangValidateTool = {
  name: 'bigbang_validate',
  description:
    'Validate a Platform One Big Bang values.yaml against DoD IL compliance requirements. Returns compliance score, specific violations, and hardened values.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      valuesYaml: { type: 'string', description: 'Paste your values.yaml content' },
      targetLevel: {
        type: 'string',
        enum: ['il2', 'il4', 'il5'],
        description: 'IL compliance target (default: il4)',
      },
      bigbangVersion: { type: 'string', description: 'Big Bang version e.g. "2.31.0"' },
    },
    required: ['valuesYaml'],
  },
};

const Schema = z.object({
  valuesYaml: z.string().min(1),
  targetLevel: z.enum(['il2', 'il4', 'il5']).default('il4'),
  bigbangVersion: z.string().optional(),
});

export async function handleBigbangValidate(args: unknown): Promise<string> {
  const { valuesYaml, targetLevel, bigbangVersion } = Schema.parse(args);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 6144,
    system: PLATFORM_ONE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Validate this Big Bang values.yaml for ${targetLevel} compliance.
${bigbangVersion ? `Big Bang Version: ${bigbangVersion}` : ''}

\`\`\`yaml
${valuesYaml}
\`\`\`

Provide:
1. **IL Compliance Score** (0-100) with scoring breakdown
2. **Critical Violations** (blocking deployment approval at ${targetLevel})
   - Non-Iron Bank images (must use registry1.dso.mil)
   - Disabled required security addons
   - mTLS not enforced
   - Network policies missing
   - Insecure default credentials not rotated
3. **Image Policy Violations** — list each non-IB image with its Iron Bank replacement path
4. **Missing Required Addons** for ${targetLevel} with justification
5. **Network Policy Gaps** (Istio, NetworkPolicy, Calico)
6. **mTLS Configuration Issues** (Istio PeerAuthentication)
7. **Hardened values.yaml** with ALL violations corrected
8. **Line references** from the original values pointing to specific violations

Reference specific Iron Bank image paths (registry1.dso.mil/ironbank/...) for all replacements.`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
