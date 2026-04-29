"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oscalFragmentTool = void 0;
exports.handleOscalFragment = handleOscalFragment;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
exports.oscalFragmentTool = {
    name: 'oscal_fragment',
    description: 'Generate valid OSCAL SSP fragment (JSON or XML) for Azure resource configurations. Machine-readable output compatible with eMASS OSCAL import.',
    inputSchema: {
        type: 'object',
        properties: {
            resourceDescription: {
                type: 'string',
                description: 'Describe the Azure resource or configuration',
            },
            controlIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Control IDs to generate OSCAL for, e.g. ["SC-28","SC-12"]',
            },
            format: {
                type: 'string',
                enum: ['json', 'xml'],
                description: 'Output format (default: json)',
            },
            systemId: {
                type: 'string',
                description: 'eMASS system ID (optional)',
            },
            componentName: {
                type: 'string',
                description: 'Component name (optional)',
            },
        },
        required: ['resourceDescription', 'controlIds'],
    },
};
const Schema = zod_1.z.object({
    resourceDescription: zod_1.z.string(),
    controlIds: zod_1.z.array(zod_1.z.string()).min(1),
    format: zod_1.z.enum(['json', 'xml']).default('json'),
    systemId: zod_1.z.string().optional(),
    componentName: zod_1.z.string().optional(),
});
const OSCAL_SYSTEM = `${client_js_1.BASE_SYSTEM_PROMPT}

You generate valid OSCAL 1.1.2 compliant fragments for eMASS import. Requirements:
- Generate valid OSCAL JSON or XML (user specified)
- Include implemented-requirements with by-components
- Include set-parameters where the control has configurable parameters
- Use proper OSCAL UUIDs (use placeholder UUIDs in format: 00000000-0000-4000-8000-NNNNNNNNNNNN)
- Use "implementation-status": "implemented" or "partial" based on context
- Include "description" fields with specific technical implementation text
- Reference the Azure service as the component
- Include "responsible-roles" mapping to customer/provider
- OSCAL output must be syntactically valid — it will be imported into eMASS`;
async function handleOscalFragment(args) {
    const { resourceDescription, controlIds, format, systemId, componentName } = Schema.parse(args);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 4096,
        system: OSCAL_SYSTEM,
        messages: [
            {
                role: 'user',
                content: `Generate an OSCAL 1.1.2 SSP fragment in ${format.toUpperCase()} format.

**Resource/Configuration:** ${resourceDescription}
**Controls to Cover:** ${controlIds.join(', ')}
${systemId ? `**eMASS System ID:** ${systemId}` : ''}
${componentName ? `**Component Name:** ${componentName}` : ''}

Generate the complete OSCAL fragment with implemented-requirements, by-components, and set-parameters sections.`,
            },
        ],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
}
//# sourceMappingURL=oscal-fragment.js.map