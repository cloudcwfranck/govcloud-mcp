"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigbangValidateTool = void 0;
exports.handleBigbangValidate = handleBigbangValidate;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
const system_prompts_js_1 = require("../../prompts/system-prompts.js");
exports.bigbangValidateTool = {
    name: 'bigbang_validate',
    description: 'Validate a Platform One Big Bang values.yaml against DoD IL compliance requirements. Returns compliance score, specific violations, and hardened values.',
    inputSchema: {
        type: 'object',
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
const Schema = zod_1.z.object({
    valuesYaml: zod_1.z.string().min(1),
    targetLevel: zod_1.z.enum(['il2', 'il4', 'il5']).default('il4'),
    bigbangVersion: zod_1.z.string().optional(),
});
async function handleBigbangValidate(args) {
    const { valuesYaml, targetLevel, bigbangVersion } = Schema.parse(args);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 6144,
        system: system_prompts_js_1.PLATFORM_ONE_SYSTEM,
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
//# sourceMappingURL=bigbang-validate.js.map