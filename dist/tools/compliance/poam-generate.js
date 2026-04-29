"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.poamGenerateTool = void 0;
exports.handlePoamGenerate = handlePoamGenerate;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
const templates_js_1 = require("../../prompts/templates.js");
exports.poamGenerateTool = {
    name: 'poam_generate',
    description: 'Generate Plan of Action & Milestones (POA&M) entries from compliance gaps. Output is formatted for eMASS import with weakness descriptions, scheduled completion dates, and milestones.',
    inputSchema: {
        type: 'object',
        properties: {
            gaps: {
                type: 'string',
                description: 'Describe compliance gaps or paste bicep_analyze output',
            },
            systemName: { type: 'string', description: 'System name' },
            systemOwner: { type: 'string', description: 'System owner name (optional)' },
            scheduledCompletionDays: {
                type: 'number',
                description: 'Days to complete remediation (default: 90)',
            },
            impactLevel: {
                type: 'string',
                enum: ['moderate', 'high', 'il4', 'il5'],
                description: 'System impact level',
            },
        },
        required: ['gaps', 'systemName', 'impactLevel'],
    },
};
const Schema = zod_1.z.object({
    gaps: zod_1.z.string().min(1),
    systemName: zod_1.z.string(),
    systemOwner: zod_1.z.string().default('Information System Owner'),
    scheduledCompletionDays: zod_1.z.number().default(90),
    impactLevel: zod_1.z.enum(['moderate', 'high', 'il4', 'il5']),
});
const POAM_SYSTEM = `${client_js_1.BASE_SYSTEM_PROMPT}

You are generating eMASS-compatible POA&M entries. Requirements:
- Generate realistic, specific weakness descriptions — not generic "implement control" language
- Include actual technical remediation steps as milestones
- Assign POA&M IDs in format: POAM-YYYY-NNN (e.g., POAM-2025-001)
- Severity must align with CVSS/STIG severity levels: Critical/High/Medium/Low
- Detection Source: Self-Assessment, 3PAO Assessment, Continuous Monitoring, Penetration Test
- Resources Required: specific Azure services, labor hours, tooling
- Milestones must have specific dates relative to today and concrete technical actions
- Status: Open (for all new entries)`;
async function handlePoamGenerate(args) {
    const { gaps, systemName, systemOwner, scheduledCompletionDays, impactLevel } = Schema.parse(args);
    const prompt = (0, templates_js_1.poamTemplate)(gaps, systemName, systemOwner, scheduledCompletionDays, impactLevel);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 4096,
        system: POAM_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
}
//# sourceMappingURL=poam-generate.js.map