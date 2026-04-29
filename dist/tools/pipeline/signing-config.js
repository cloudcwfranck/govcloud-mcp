"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signingConfigTool = void 0;
exports.handleSigningConfig = handleSigningConfig;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
const system_prompts_js_1 = require("../../prompts/system-prompts.js");
exports.signingConfigTool = {
    name: 'signing_config',
    description: 'Generate complete artifact signing and verification configuration using Sigstore/Cosign, Notary v2, or DoD PKI. Returns pipeline integration code, Kubernetes admission webhook config, and verification commands.',
    inputSchema: {
        type: 'object',
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
const Schema = zod_1.z.object({
    signingMethod: zod_1.z.enum(['cosign-keyless', 'cosign-key', 'notary-v2', 'dod-pki']),
    pipelineType: zod_1.z.enum(['gitlab-ci', 'github-actions', 'tekton', 'jenkins']),
    registry: zod_1.z.string().default('registry1.dso.mil'),
    enforceInCluster: zod_1.z.boolean().default(true),
});
async function handleSigningConfig(args) {
    const { signingMethod, pipelineType, registry, enforceInCluster } = Schema.parse(args);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 5120,
        system: system_prompts_js_1.PIPELINE_SYSTEM,
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
}
//# sourceMappingURL=signing-config.js.map