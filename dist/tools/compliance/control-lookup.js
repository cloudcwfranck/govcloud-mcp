"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.controlLookupTool = void 0;
exports.handleControlLookup = handleControlLookup;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
exports.controlLookupTool = {
    name: 'control_lookup',
    description: 'Look up any NIST 800-53 Rev 5 control with full text, Azure implementation guidance, FedRAMP inheritance model, and copy-ready eMASS narrative starter.',
    inputSchema: {
        type: 'object',
        properties: {
            controlId: {
                type: 'string',
                description: 'NIST 800-53 control ID, e.g. "AC-2", "SC-28", "AU-12"',
            },
            azureContext: {
                type: 'string',
                description: 'Optional: describe your Azure environment for context-specific guidance',
            },
        },
        required: ['controlId'],
    },
};
const Schema = zod_1.z.object({
    controlId: zod_1.z.string().min(2),
    azureContext: zod_1.z.string().optional(),
});
const CONTROL_SYSTEM = `${client_js_1.BASE_SYSTEM_PROMPT}

You have the complete NIST 800-53 Rev 5 control catalog memorized. For every control lookup provide:
1. Control title and full requirement text (verbatim from SP 800-53 Rev 5)
2. FedRAMP applicability (Low/Mod/High baseline — which enhancements required at each)
3. Azure services that provide inheritance for this control (specify "Full", "Shared", or "Customer" inheritance)
4. Customer responsibility portion (what the customer must implement vs. what Azure inherits)
5. Implementation guidance specific to Azure GCC High if the control has GCC High nuances
6. Example eMASS control narrative (300-500 words, AO-ready third-person prose)
7. Evidence artifacts typically required by FedRAMP reviewers / DoD AOs
8. Common audit findings for this control (what gets flagged during 3PAO assessments)

Format with clear markdown sections. Be precise — AOs will read this.`;
async function handleControlLookup(args) {
    const { controlId, azureContext } = Schema.parse(args);
    const contextNote = azureContext
        ? `\n\nAzure Environment Context: ${azureContext}`
        : '';
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 4096,
        system: CONTROL_SYSTEM,
        messages: [
            {
                role: 'user',
                content: `Provide the complete reference for NIST 800-53 Rev 5 control: **${controlId}**${contextNote}

Include all enhancements and their FedRAMP baseline applicability.`,
            },
        ],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
}
//# sourceMappingURL=control-lookup.js.map