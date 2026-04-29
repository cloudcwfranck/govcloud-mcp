import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { PIPELINE_SYSTEM } from '../../prompts/system-prompts.js';
import { runTool, getTokenBudget } from '../../utils/tool-runner.js';

export const signingConfigTool = {
  name: 'signing_config',
  description:
    'Generate complete artifact signing and verification configuration using Sigstore/Cosign, Notary v2, or DoD PKI. Returns pipeline integration code, Kubernetes admission webhook config, and verification commands.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      signingMethod: {
        type: 'string',
        enum: ['cosign-keyless', 'cosign-key', 'notary-v2', 'dod-pki'],
        description: 'Signing method to configure',
      },
      pipelineType: {
        type: 'string',
        enum: ['gitlab-ci', 'github-actions', 'tekton', 'jenkins'],
        description: 'Pipeline type to generate signing steps for',
      },
      registry: {
        type: 'string',
        description: 'Container registry URL (default: registry1.dso.mil)',
      },
      enforceInCluster: {
        type: 'boolean',
        description: 'Generate Kubernetes admission controller config to enforce signed images (default: true)',
      },
    },
    required: ['signingMethod', 'pipelineType'],
  },
};

const Schema = z.object({
  signingMethod: z.enum(['cosign-keyless', 'cosign-key', 'notary-v2', 'dod-pki']),
  pipelineType: z.enum(['gitlab-ci', 'github-actions', 'tekton', 'jenkins']),
  registry: z.string().max(500).default('registry1.dso.mil'),
  enforceInCluster: z.boolean().default(true),
});

export async function handleSigningConfig(args: unknown): Promise<string> {
  return runTool('signing_config', args, Schema, async ({ signingMethod, pipelineType, registry, enforceInCluster }) => {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: getTokenBudget('signing_config'),
      system: PIPELINE_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Generate complete artifact signing configuration using **${signingMethod}** for **${pipelineType}** pipelines targeting registry **${registry}**.
${enforceInCluster ? '\nAlso generate Kubernetes admission controller configuration to enforce signed images cluster-wide.' : ''}

Provide:
1. **Setup Instructions** — one-time configuration steps:
   - Key generation (for key-based methods)
   - Fulcio/Rekor integration (for keyless)
   - DoD PKI certificate configuration (if dod-pki)
   - Kubernetes Secret for signing keys

2. **Pipeline Signing Stage** — complete ${pipelineType} YAML block to add:
   \`\`\`yaml
   # Sign image after push
   sign-image:
     ...
   \`\`\`

3. **SBOM Generation** — integrate Syft SBOM generation and signing:
   - Generate SBOM in SPDX/CycloneDX format
   - Attach signed SBOM as OCI artifact

4. **Verification Commands**:
   \`\`\`bash
   # Verify image signature
   cosign verify ...
   # Verify SBOM
   cosign verify-attestation ...
   \`\`\`

${enforceInCluster ? `5. **Kubernetes Admission Enforcement**:
   - Kyverno ClusterPolicy to require signed images from ${registry}
   - OR Gatekeeper OPA constraint
   - Test admission policy with signed vs unsigned image
   - Exemptions for system namespaces` : ''}

6. **Transparency Log** — how signatures are recorded in Rekor and how to query:
   \`\`\`bash
   rekor-cli search --email ...
   \`\`\`

7. **DoD Compliance Rationale** — which NIST 800-53 / CISA controls this satisfies (SA-10, SI-7, CM-14)

8. **Iron Bank Verification** — how to verify Iron Bank images specifically with their Cosign public key

Use production-ready commands with actual Sigstore endpoints and realistic key formats.`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  });
}
