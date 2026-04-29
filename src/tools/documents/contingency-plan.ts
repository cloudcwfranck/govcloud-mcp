import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { DOCUMENT_SYSTEM } from '../../prompts/system-prompts.js';
import { runTool, getTokenBudget } from '../../utils/tool-runner.js';

export const contingencyPlanTool = {
  name: 'contingency_plan',
  description:
    'Generate a NIST 800-34 compliant Contingency Plan (CP) for an Azure government system. Covers BCP/DR procedures, RTO/RPO targets, activation criteria, recovery procedures, and test schedule.',
  inputSchema: {
    type: 'object' as const,
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

const Schema = z.object({
  systemName: z.string().max(500),
  systemDescription: z.string().max(2000),
  azureServices: z.array(z.string().max(500)).min(1).max(50),
  impactLevel: z.enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5']),
  rtoHours: z.number().default(4),
  rpoHours: z.number().default(1),
  systemOwner: z.string().max(500).default('System Owner'),
});

export async function handleContingencyPlan(args: unknown): Promise<string> {
  return runTool('contingency_plan', args, Schema, async ({ systemName, systemDescription, azureServices, impactLevel, rtoHours, rpoHours, systemOwner }) => {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: getTokenBudget('contingency_plan'),
      system: DOCUMENT_SYSTEM,
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
  });
}
