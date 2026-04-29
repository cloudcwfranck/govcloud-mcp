import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { ARCHITECTURE_SYSTEM } from '../../prompts/system-prompts.js';

export const serviceSelectTool = {
  name: 'azure_service_selector',
  description:
    'Select the right Azure service for a government workload requirement with compliance rationale, GCC High availability confirmation, and alternatives analysis.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      requirement: { type: 'string', description: 'Describe what you need to accomplish' },
      impactLevel: {
        type: 'string',
        enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'],
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: 'e.g. ["no-public-endpoint","fips-140-2-required","cac-piv-auth"]',
      },
      existingServices: {
        type: 'array',
        items: { type: 'string' },
        description: 'Azure services already in the environment',
      },
    },
    required: ['requirement', 'impactLevel'],
  },
};

const Schema = z.object({
  requirement: z.string(),
  impactLevel: z.enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5']),
  constraints: z.array(z.string()).default([]),
  existingServices: z.array(z.string()).default([]),
});

export async function handleServiceSelect(args: unknown): Promise<string> {
  const { requirement, impactLevel, constraints, existingServices } = Schema.parse(args);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: ARCHITECTURE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Select the right Azure service(s) for this government workload requirement.

**Requirement:** ${requirement}
**Impact Level:** ${impactLevel}
**Constraints:** ${constraints.length > 0 ? constraints.join(', ') : 'None specified'}
**Existing Services:** ${existingServices.length > 0 ? existingServices.join(', ') : 'None specified'}

For each recommendation provide:
- Service name and exact SKU/tier recommendation
- Why it's the right choice for ${impactLevel}
- GCC High availability (Yes / No / Limited — be specific about limitations)
- FedRAMP authorization status
- Key compliance configurations required out of the box
- What NOT to use and why (common mistakes at this impact level)
- Cost implication: $ / $$ / $$$
- Integration notes with existing services

If multiple services are viable, rank them and explain the trade-offs.`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
