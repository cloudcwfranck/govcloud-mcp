"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atoReadinessTool = void 0;
exports.handleAtoReadiness = handleAtoReadiness;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
exports.atoReadinessTool = {
    name: 'ato_readiness',
    description: 'Score a system description against FedRAMP/DoD ATO requirements. Returns readiness score, critical gaps, estimated timeline, and prioritized next actions.',
    inputSchema: {
        type: 'object',
        properties: {
            systemDescription: { type: 'string', description: 'Describe the system' },
            azureServices: {
                type: 'array',
                items: { type: 'string' },
                description: 'Azure services in scope',
            },
            targetAuthorization: {
                type: 'string',
                enum: ['fedramp-moderate', 'fedramp-high', 'dod-il4', 'dod-il5', 'dod-il6'],
                description: 'Target authorization level',
            },
            currentMaturity: {
                type: 'string',
                enum: ['initial', 'developing', 'defined', 'managed'],
                description: 'Current compliance maturity',
            },
            existingDocumentation: {
                type: 'array',
                items: { type: 'string' },
                description: 'Existing docs e.g. ["SSP draft","PIA","FIPS-199"]',
            },
        },
        required: ['systemDescription', 'azureServices', 'targetAuthorization', 'currentMaturity'],
    },
};
const Schema = zod_1.z.object({
    systemDescription: zod_1.z.string(),
    azureServices: zod_1.z.array(zod_1.z.string()),
    targetAuthorization: zod_1.z.enum(['fedramp-moderate', 'fedramp-high', 'dod-il4', 'dod-il5', 'dod-il6']),
    currentMaturity: zod_1.z.enum(['initial', 'developing', 'defined', 'managed']),
    existingDocumentation: zod_1.z.array(zod_1.z.string()).default([]),
});
const ATO_SYSTEM = `${client_js_1.BASE_SYSTEM_PROMPT}

You are a federal ATO readiness assessor with experience at the FedRAMP PMO and as a DoD AO advisor. You give brutally honest assessments. Generic advice is worthless here — you know what actually kills ATOs.

Your assessment must include:
- Overall readiness score (0-100) with specific scoring breakdown
- FedRAMP readiness tier or DoD IL readiness classification
- Estimated timeline to authorization (realistic, not optimistic)
- Top 10 critical gaps (technically specific — not "implement logging")
- Recommended authorization path (JAB, Agency ATO, cATO, etc.)
- 30/60/90 day action plan with specific owners and deliverables
- What will get you killed in the AO kickoff meeting — be specific about what AOs actually challenge

The last item is where your expertise shows. Document what actually fails assessments.`;
async function handleAtoReadiness(args) {
    const { systemDescription, azureServices, targetAuthorization, currentMaturity, existingDocumentation } = Schema.parse(args);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 4096,
        system: ATO_SYSTEM,
        messages: [
            {
                role: 'user',
                content: `Assess ATO readiness for this system:

**Target Authorization:** ${targetAuthorization}
**Current Maturity:** ${currentMaturity}
**Azure Services:** ${azureServices.join(', ')}
**Existing Documentation:** ${existingDocumentation.length > 0 ? existingDocumentation.join(', ') : 'None'}

**System Description:**
${systemDescription}

Provide the complete readiness assessment including the brutally honest AO kickoff risks.`,
            },
        ],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
}
//# sourceMappingURL=ato-readiness.js.map