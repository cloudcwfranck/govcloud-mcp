"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gccHighTool = void 0;
exports.handleGccHigh = handleGccHigh;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
exports.gccHighTool = {
    name: 'gcc_high_guidance',
    description: 'Get Azure GCC High specific configuration requirements, limitations, and gotchas for any Azure service or scenario. Includes what works differently in GCC High vs Azure Government vs Commercial.',
    inputSchema: {
        type: 'object',
        properties: {
            service: { type: 'string', description: 'Azure service name or scenario' },
            scenario: { type: 'string', description: 'What you are trying to accomplish (optional)' },
        },
        required: ['service'],
    },
};
const Schema = zod_1.z.object({
    service: zod_1.z.string(),
    scenario: zod_1.z.string().optional(),
});
const GCC_SYSTEM = `${client_js_1.BASE_SYSTEM_PROMPT}

You are the world's most experienced Azure GCC High engineer. This tool exists because GCC High behaves differently from Azure Government and Azure Commercial in ways that are not documented clearly — or not documented at all.

Be brutally honest about limitations. Engineers in DoD environments need the truth, not the sales pitch. Cover:
- What features are NOT available in GCC High (and when they became available, if known)
- What requires special configuration in GCC High vs. Azure Government
- Endpoint differences (management, storage, AAD/Entra, Key Vault, etc.)
- Known limitations and real workarounds that work in production
- CAC/PIV authentication specifics (what actually works, what doesn't)
- Microsoft support escalation paths for GCC High issues
- Tenant configuration requirements (Gov-specific settings often missed)
- What the Microsoft documentation doesn't tell you but every GCC High engineer learns the hard way
- Timeline for feature parity with commercial (if known/estimated)`;
async function handleGccHigh(args) {
    const { service, scenario } = Schema.parse(args);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 4096,
        system: GCC_SYSTEM,
        messages: [
            {
                role: 'user',
                content: `Provide complete GCC High guidance for: **${service}**
${scenario ? `\nScenario: ${scenario}` : ''}

Focus on what's different, what's broken, what's undocumented, and what every GCC High engineer needs to know before they spend days debugging something that should have been a 5-minute warning.`,
            },
        ],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
}
//# sourceMappingURL=gcc-high-guidance.js.map