"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contingencyPlanTool = void 0;
exports.handleContingencyPlan = handleContingencyPlan;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
const system_prompts_js_1 = require("../../prompts/system-prompts.js");
exports.contingencyPlanTool = {
    name: 'contingency_plan',
    description: 'Generate a NIST 800-34 compliant Contingency Plan (CP) for an Azure government system. Covers BCP/DR procedures, RTO/RPO targets, activation criteria, recovery procedures, and test schedule.',
    inputSchema: {
        type: 'object',
        properties: {
            systemName: { type: 'string', description: 'System name' },
            systemDescription: { type: 'string', description: 'What the system does' },
            azureServices: {
                type: 'array',
                items: { type: 'string' },
                description: 'Azure services that need recovery procedures',
            },
            impactLevel: {
                type: 'string',
                enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'],
            },
            rtoHours: {
                type: 'number',
                description: 'Recovery Time Objective in hours (default: 4)',
            },
            rpoHours: {
                type: 'number',
                description: 'Recovery Point Objective in hours (default: 1)',
            },
            systemOwner: {
                type: 'string',
                description: 'System owner name and organization',
            },
        },
        required: ['systemName', 'systemDescription', 'azureServices', 'impactLevel'],
    },
};
const Schema = zod_1.z.object({
    systemName: zod_1.z.string(),
    systemDescription: zod_1.z.string(),
    azureServices: zod_1.z.array(zod_1.z.string()).min(1),
    impactLevel: zod_1.z.enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5']),
    rtoHours: zod_1.z.number().default(4),
    rpoHours: zod_1.z.number().default(1),
    systemOwner: zod_1.z.string().default('System Owner'),
});
async function handleContingencyPlan(args) {
    const { systemName, systemDescription, azureServices, impactLevel, rtoHours, rpoHours, systemOwner } = Schema.parse(args);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 8192,
        system: system_prompts_js_1.DOCUMENT_SYSTEM,
        messages: [
            {
                role: 'user',
                content: `Generate a complete NIST SP 800-34 Contingency Plan for **${systemName}** at **${impactLevel}**.

**System:** ${systemName}
**Description:** ${systemDescription}
**Azure Services:** ${azureServices.join(', ')}
**System Owner:** ${systemOwner}
**RTO:** ${rtoHours} hours
**RPO:** ${rpoHours} hours

Generate a complete, eMASS-ready Contingency Plan with these sections:

## 1. Introduction and Purpose
- Applicable laws, policies, and regulations (FISMA, FedRAMP, DoDI 8500.01)
- Scope and applicability

## 2. System Description and Architecture
- ${systemName} overview
- Azure services in scope with criticality ratings
- Dependencies (external systems, network connectivity, personnel)

## 3. Roles and Responsibilities
- Contingency Plan Coordinator
- System Owner (${systemOwner})
- IT Security Manager
- Cloud Service Provider (Microsoft Azure) responsibilities
- Communication tree

## 4. Activation and Notification
- Activation criteria (what triggers the CP)
- Notification procedures and contact list template
- Initial assessment checklist

## 5. Recovery Objectives
- RTO: ${rtoHours} hours — what must be restored and by when
- RPO: ${rpoHours} hours — maximum acceptable data loss
- Minimum Operating Requirements (MOR) for each service

## 6. Recovery Procedures — for each Azure service (${azureServices.join(', ')}):
- Backup strategy (Azure Backup, geo-redundant storage, snapshots)
- Step-by-step recovery procedure
- Verification steps to confirm successful recovery
- Azure CLI / PowerShell commands for recovery

## 7. Reconstitution Procedures
- System validation checklist
- Security scan requirements before returning to production
- Change management for recovery actions

## 8. Testing and Exercises
- ${impactLevel}-required test frequency (annual tabletop, functional, full-scale)
- Test scenario templates
- Lessons learned process

## 9. Plan Maintenance
- Review schedule
- Update triggers (significant changes, annual review, after exercises)

Write in formal third-person government document style. Include actual Azure recovery commands and service-specific procedures.`,
            },
        ],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
}
//# sourceMappingURL=contingency-plan.js.map