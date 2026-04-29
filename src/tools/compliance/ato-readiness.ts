import { z } from 'zod';
import { anthropic, MODEL, BASE_SYSTEM_PROMPT } from '../../client.js';

export const atoReadinessTool = {
  name: 'ato_readiness',
  description:
    'Score a system description against FedRAMP/DoD ATO requirements. Returns readiness score, critical gaps, estimated timeline, and prioritized next actions.',
  inputSchema: {
    type: 'object' as const,
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

const Schema = z.object({
  systemDescription: z.string(),
  azureServices: z.array(z.string()),
  targetAuthorization: z.enum(['fedramp-moderate', 'fedramp-high', 'dod-il4', 'dod-il5', 'dod-il6']),
  currentMaturity: z.enum(['initial', 'developing', 'defined', 'managed']),
  existingDocumentation: z.array(z.string()).default([]),
});

const ATO_SYSTEM = `${BASE_SYSTEM_PROMPT}

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

export async function handleAtoReadiness(args: unknown): Promise<string> {
  const { systemDescription, azureServices, targetAuthorization, currentMaturity, existingDocumentation } =
    Schema.parse(args);

  const response = await anthropic.messages.create({
    model: MODEL,
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
