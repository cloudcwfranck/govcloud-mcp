"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sspSectionTool = void 0;
exports.handleSspSection = handleSspSection;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
const system_prompts_js_1 = require("../../prompts/system-prompts.js");
const templates_js_1 = require("../../prompts/templates.js");
exports.sspSectionTool = {
    name: 'ssp_section',
    description: 'Generate a complete System Security Plan (SSP) section in eMASS-ready format. Covers system description, boundary, user types, interconnections, laws and regulations, or any NIST 800-18 section.',
    inputSchema: {
        type: 'object',
        properties: {
            section: {
                type: 'string',
                enum: [
                    'system-description',
                    'system-boundary',
                    'user-types',
                    'interconnections',
                    'laws-regulations',
                    'information-types',
                    'security-categorization',
                    'control-summary',
                ],
                description: 'SSP section to generate',
            },
            systemName: { type: 'string', description: 'Official system name (e.g., "ACME Mission System")' },
            systemDescription: {
                type: 'string',
                description: 'Brief description of what the system does',
            },
            azureServices: {
                type: 'array',
                items: { type: 'string' },
                description: 'Azure services in scope e.g. ["AKS","Key Vault","Storage Account","Azure SQL"]',
            },
            impactLevel: {
                type: 'string',
                enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'],
            },
            additionalContext: {
                type: 'string',
                description: 'Additional context specific to your system (optional)',
            },
        },
        required: ['section', 'systemName', 'systemDescription', 'azureServices', 'impactLevel'],
    },
};
const Schema = zod_1.z.object({
    section: zod_1.z.enum([
        'system-description',
        'system-boundary',
        'user-types',
        'interconnections',
        'laws-regulations',
        'information-types',
        'security-categorization',
        'control-summary',
    ]),
    systemName: zod_1.z.string(),
    systemDescription: zod_1.z.string(),
    azureServices: zod_1.z.array(zod_1.z.string()).min(1),
    impactLevel: zod_1.z.enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5']),
    additionalContext: zod_1.z.string().optional(),
});
async function handleSspSection(args) {
    const { section, systemName, systemDescription, azureServices, impactLevel, additionalContext } = Schema.parse(args);
    const systemInfo = `${systemName} — ${systemDescription}`;
    const prompt = (0, templates_js_1.sspSectionTemplate)(section, systemInfo, azureServices, impactLevel, additionalContext);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 6144,
        system: system_prompts_js_1.DOCUMENT_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
}
//# sourceMappingURL=ssp-section.js.map