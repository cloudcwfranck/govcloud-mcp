import { z } from 'zod';
import { anthropic, MODEL, BASE_SYSTEM_PROMPT } from '../../client.js';
import { runTool, getTokenBudget } from '../../utils/tool-runner.js';

export const controlLookupTool = {
  name: 'control_lookup',
  description:
    'Look up any NIST 800-53 Rev 5 control and get the full requirement text, Azure implementation guidance, FedRAMP inheritance model, and a copy-ready eMASS narrative starter.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      controlId: {
        type: 'string',
        description: 'NIST 800-53 control ID — e.g. "AC-2", "SC-28", "AC-2(1)"',
      },
      azureContext: {
        type: 'string',
        description: 'Optional: describe your Azure environment for context-specific guidance',
      },
    },
    required: ['controlId'],
  },
};

const Schema = z.object({
  controlId: z
    .string()
    .regex(
      /^[A-Z]{2}-\d{1,2}(\(\d{1,2}\))?$/,
      'Control ID must be NIST format: e.g. AC-2, SC-28, AC-2(1)'
    ),
  azureContext: z.string().max(500).optional(),
});

const CONTROL_SYSTEM = `${BASE_SYSTEM_PROMPT}

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

export async function handleControlLookup(args: unknown): Promise<string> {
  return runTool('control_lookup', args, Schema, async ({ controlId, azureContext }) => {
    const contextNote = azureContext ? `\n\nAzure Environment Context: ${azureContext}` : '';

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: getTokenBudget('control_lookup'),
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
  });
}
