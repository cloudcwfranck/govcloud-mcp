"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.landingZoneTool = void 0;
exports.handleLandingZone = handleLandingZone;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
const system_prompts_js_1 = require("../../prompts/system-prompts.js");
const templates_js_1 = require("../../prompts/templates.js");
exports.landingZoneTool = {
    name: 'landing_zone_design',
    description: 'Design a complete Azure Landing Zone architecture for government workloads. Returns hub-spoke topology, subscription structure, network layout, security services, and Bicep scaffold.',
    inputSchema: {
        type: 'object',
        properties: {
            missionType: {
                type: 'string',
                enum: ['combat-support', 'admin-backoffice', 'legal-services', 'healthcare', 'intelligence-analytics', 'logistics', 'communications'],
                description: 'Mission type drives architecture decisions',
            },
            dataClassification: {
                type: 'string',
                enum: ['unclassified', 'cui', 'fouo', 'secret'],
            },
            userBase: {
                type: 'string',
                enum: ['conus', 'oconus', 'both', 'disconnected'],
            },
            targetImpactLevel: {
                type: 'string',
                enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'],
            },
            estimatedUsers: { type: 'number', description: 'Approximate user count' },
            connectedToNIPR: { type: 'boolean' },
            existingEnclaves: { type: 'string', description: 'Describe existing enclaves/networks' },
            cssp: {
                type: 'string',
                enum: ['azure-government', 'azure-gcc-high'],
                description: 'Cloud service provider (default: azure-gcc-high)',
            },
        },
        required: ['missionType', 'dataClassification', 'userBase', 'targetImpactLevel'],
    },
};
const Schema = zod_1.z.object({
    missionType: zod_1.z.enum(['combat-support', 'admin-backoffice', 'legal-services', 'healthcare', 'intelligence-analytics', 'logistics', 'communications']),
    dataClassification: zod_1.z.enum(['unclassified', 'cui', 'fouo', 'secret']),
    userBase: zod_1.z.enum(['conus', 'oconus', 'both', 'disconnected']),
    targetImpactLevel: zod_1.z.enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5']),
    estimatedUsers: zod_1.z.number().optional(),
    connectedToNIPR: zod_1.z.boolean().optional(),
    existingEnclaves: zod_1.z.string().optional(),
    cssp: zod_1.z.enum(['azure-government', 'azure-gcc-high']).default('azure-gcc-high'),
});
async function handleLandingZone(args) {
    const params = Schema.parse(args);
    const prompt = (0, templates_js_1.landingZoneTemplate)(params);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 6144,
        system: system_prompts_js_1.ARCHITECTURE_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
}
//# sourceMappingURL=landing-zone-design.js.map