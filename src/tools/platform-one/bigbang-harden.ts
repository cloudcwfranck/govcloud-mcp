import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { PLATFORM_ONE_SYSTEM } from '../../prompts/system-prompts.js';

export const bigbangHardenTool = {
  name: 'bigbang_harden',
  description:
    'Generate a fully hardened Big Bang values.yaml targeting DoD IL4 or IL5 from scratch or from an existing values file. Includes Chainguard/Iron Bank digest-pinned images.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      baseValues: { type: 'string', description: 'Existing values.yaml to start from (optional)' },
      targetLevel: { type: 'string', enum: ['il4', 'il5'], description: 'IL target level' },
      enabledAddons: {
        type: 'array',
        items: { type: 'string' },
        description: 'Big Bang addons to include e.g. ["istio","monitoring","logging","policy","vault","keycloak"]',
      },
      clusterName: { type: 'string' },
      registryUrl: {
        type: 'string',
        description: 'Registry URL (default: registry1.dso.mil)',
      },
    },
    required: ['targetLevel'],
  },
};

const Schema = z.object({
  baseValues: z.string().optional(),
  targetLevel: z.enum(['il4', 'il5']),
  enabledAddons: z.array(z.string()).default(['istio', 'monitoring', 'logging', 'policy']),
  clusterName: z.string().default('bb-cluster'),
  registryUrl: z.string().default('registry1.dso.mil'),
});

export async function handleBigbangHarden(args: unknown): Promise<string> {
  const { baseValues, targetLevel, enabledAddons, clusterName, registryUrl } = Schema.parse(args);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: PLATFORM_ONE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Generate a fully hardened Big Bang values.yaml for ${targetLevel}.

**Cluster Name:** ${clusterName}
**Registry:** ${registryUrl}
**Enabled Addons:** ${enabledAddons.join(', ')}
${baseValues ? `\n**Base Values to Start From:**\n\`\`\`yaml\n${baseValues}\n\`\`\`` : ''}

Provide:
1. **Complete hardened values.yaml** with all security configurations
   - Iron Bank images from ${registryUrl} with SHA256 digest pins
   - Istio strict mTLS (PeerAuthentication STRICT mode)
   - OPA Gatekeeper / Kyverno policies enabled
   - NetworkPolicies restricting inter-namespace traffic
   - Resource limits on all workloads
   - Non-root containers enforced
   - Read-only root filesystems where possible
   - Secrets encryption at rest
2. **Iron Bank Images Used** — table: Image | IB Path | Digest | Version
3. **Required Kubernetes Secrets** to create before deployment (with creation commands)
4. **Pre-deployment Checklist** (cluster requirements: node sizes, storage classes, etc.)
5. **Post-deployment Verification Commands** to confirm ${targetLevel} compliance

Use realistic Iron Bank registry paths and include actual STIG/IL requirements that drive each configuration.`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
