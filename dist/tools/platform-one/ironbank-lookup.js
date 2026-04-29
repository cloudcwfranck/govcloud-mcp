"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ironbankLookupTool = void 0;
exports.handleIronbankLookup = handleIronbankLookup;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
const system_prompts_js_1 = require("../../prompts/system-prompts.js");
exports.ironbankLookupTool = {
    name: 'ironbank_lookup',
    description: 'Look up Iron Bank hardened container images for any application. Returns the correct registry1.dso.mil registry path, latest approved version, Cosign verification commands, and pull secret configuration.',
    inputSchema: {
        type: 'object',
        properties: {
            imageName: {
                type: 'string',
                description: 'Application or image name e.g. "nginx", "postgres", "redis", "grafana"',
            },
            version: {
                type: 'string',
                description: 'Specific version to look up (optional — returns latest approved if omitted)',
            },
        },
        required: ['imageName'],
    },
};
const Schema = zod_1.z.object({
    imageName: zod_1.z.string().min(1),
    version: zod_1.z.string().optional(),
});
async function handleIronbankLookup(args) {
    const { imageName, version } = Schema.parse(args);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 4096,
        system: system_prompts_js_1.PLATFORM_ONE_SYSTEM,
        messages: [
            {
                role: 'user',
                content: `Look up the Iron Bank hardened container image for: **${imageName}**${version ? ` version ${version}` : ' (latest approved version)'}

Provide:
1. **Iron Bank Registry Path** — full registry1.dso.mil path (e.g., registry1.dso.mil/ironbank/opensource/nginx/nginx:1.25.3)
2. **Latest Approved Version** — version number and approval date
3. **Image Digest** — SHA256 digest for pinning (e.g., sha256:abc123...)
4. **Cosign Verification Commands**:
   \`\`\`bash
   cosign verify --key https://ironbank.dso.mil/cosign.pub registry1.dso.mil/ironbank/...
   \`\`\`
5. **CVE Status** — known CVE count (Critical/High/Medium/Low), last scan date
6. **Iron Bank Approval Status** — Approved / Conditionally Approved / In Progress
7. **Pull Secret Configuration**:
   - How to create the imagePullSecret for registry1.dso.mil
   - Kubernetes secret YAML
   - Docker config.json format
8. **Kubernetes Image Reference** — exact string to use in pod spec with digest pin
9. **Alternative Images** — if multiple IB variants exist (e.g., UBI-based vs Alpine)
10. **Chainguard Alternative** — if a Chainguard equivalent exists (cgr.dev path)
11. **Known Limitations or Caveats** — configuration differences from upstream image, required init containers, etc.
12. **Big Bang Values Reference** — where this image appears in Big Bang values.yaml (if applicable)

Use accurate Iron Bank registry paths under registry1.dso.mil/ironbank/. Common namespaces: ironbank/opensource/, ironbank/redhat/, ironbank/google/, ironbank/elastic/, ironbank/hashicorp/`,
            },
        ],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
}
//# sourceMappingURL=ironbank-lookup.js.map