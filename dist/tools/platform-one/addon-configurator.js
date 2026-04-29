"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addonConfiguratorTool = void 0;
exports.handleAddonConfigurator = handleAddonConfigurator;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
const system_prompts_js_1 = require("../../prompts/system-prompts.js");
exports.addonConfiguratorTool = {
    name: 'addon_configurator',
    description: 'Generate production-ready Big Bang addon configuration values for any Platform One addon. Returns hardened values with Iron Bank images, resource limits, and IL-appropriate security settings.',
    inputSchema: {
        type: 'object',
        properties: {
            addon: {
                type: 'string',
                description: 'Big Bang addon name e.g. "monitoring", "logging", "vault", "keycloak", "gitlab", "sonarqube", "twistlock", "mattermost"',
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
const Schema = zod_1.z.object({
    addon: zod_1.z.string().min(1),
    targetLevel: zod_1.z.enum(['il2', 'il4', 'il5']),
    clusterSize: zod_1.z.enum(['small', 'medium', 'large']).default('medium'),
    existingValues: zod_1.z.string().optional(),
});
async function handleAddonConfigurator(args) {
    const { addon, targetLevel, clusterSize, existingValues } = Schema.parse(args);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 6144,
        system: system_prompts_js_1.PLATFORM_ONE_SYSTEM,
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
}
//# sourceMappingURL=addon-configurator.js.map