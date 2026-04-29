import { z } from 'zod';
import { anthropic, MODEL, BASE_SYSTEM_PROMPT } from '../../client.js';

export const oscalFragmentTool = {
  name: 'oscal_fragment',
  description:
    'Generate valid OSCAL SSP fragment (JSON or XML) for Azure resource configurations. Machine-readable output compatible with eMASS OSCAL import.',
  inputSchema: {
    type: 'object' as const,
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

const Schema = z.object({
  resourceDescription: z.string(),
  controlIds: z.array(z.string()).min(1),
  format: z.enum(['json', 'xml']).default('json'),
  systemId: z.string().optional(),
  componentName: z.string().optional(),
});

const OSCAL_SYSTEM = `${BASE_SYSTEM_PROMPT}

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

export async function handleOscalFragment(args: unknown): Promise<string> {
  const { resourceDescription, controlIds, format, systemId, componentName } = Schema.parse(args);

  const response = await anthropic.messages.create({
    model: MODEL,
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
