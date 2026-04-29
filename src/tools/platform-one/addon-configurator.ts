import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { PLATFORM_ONE_SYSTEM } from '../../prompts/system-prompts.js';
import { runTool, getTokenBudget } from '../../utils/tool-runner.js';

export const addonConfiguratorTool = {
  name: 'addon_configurator',
  description:
    'Generate production-ready Big Bang addon configuration values for any Platform One addon. Returns hardened values with Iron Bank images, resource limits, and IL-appropriate security settings.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      addon: {
        type: 'string',
        description:
          'Big Bang addon name e.g. "monitoring", "logging", "vault", "keycloak", "gitlab", "sonarqube", "twistlock", "mattermost"',
      },
      targetLevel: {
        type: 'string',
        enum: ['il2', 'il4', 'il5'],
        description: 'DoD IL target level',
      },
      clusterSize: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        description: 'Cluster size for resource sizing (default: medium)',
      },
      existingValues: {
        type: 'string',
        description: 'Existing addon values to extend or override (optional)',
      },
    },
    required: ['addon', 'targetLevel'],
  },
};

const Schema = z.object({
  addon: z.string().min(1).max(500),
  targetLevel: z.enum(['il2', 'il4', 'il5']),
  clusterSize: z.enum(['small', 'medium', 'large']).default('medium'),
  existingValues: z.string().max(20000).optional(),
});

export async function handleAddonConfigurator(args: unknown): Promise<string> {
  return runTool('addon_configurator', args, Schema, async ({ addon, targetLevel, clusterSize, existingValues }) => {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: getTokenBudget('addon_configurator'),
      system: PLATFORM_ONE_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Generate production-ready Big Bang addon configuration for **${addon}** at **${targetLevel}** on a **${clusterSize}** cluster.
${existingValues ? `\n**Existing Values to Extend:**\n\`\`\`yaml\n${existingValues}\n\`\`\`` : ''}

Provide:
1. **Complete Addon values.yaml block** — ready to paste into Big Bang values.yaml:
   - Iron Bank image from registry1.dso.mil with SHA256 digest pin
   - Resource requests and limits sized for ${clusterSize} cluster
   - Non-root security context
   - Read-only root filesystem where supported
   - Network policy configuration
   - Istio PeerAuthentication (STRICT mTLS)
   - Persistence configuration (size, storageClass)

2. **${targetLevel.toUpperCase()} Required Configurations** — what MUST be set for compliance:
   - STIG controls that drive specific settings
   - Authentication integration (CAC/PIV/Keycloak)
   - Audit logging configuration
   - Encryption settings

3. **Required Secrets** — Kubernetes secrets to create before deploying ${addon}:
   \`\`\`bash
   kubectl create secret ...
   \`\`\`

4. **Resource Requirements** — node requirements, storage classes, PVC sizes

5. **Integration Configuration** — how to wire ${addon} into:
   - Keycloak SSO (if applicable)
   - Monitoring/alerting (ServiceMonitor, PrometheusRule)
   - Logging (Fluentbit/Loki integration)
   - Vault for secrets (if applicable)

6. **Post-Deploy Verification** — commands to confirm ${addon} is healthy and ${targetLevel}-compliant

7. **Common Issues** — top 5 problems people hit deploying ${addon} in Big Bang and their fixes

Use exact Iron Bank image paths and realistic resource values for a ${clusterSize} cluster.`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  });
}
