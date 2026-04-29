import { z } from 'zod';
import { anthropic, MODEL, BASE_SYSTEM_PROMPT } from '../../client.js';
import { controlNarrativeTemplate } from '../../prompts/templates.js';
import { runTool, getTokenBudget } from '../../utils/tool-runner.js';

export const controlNarrativeTool = {
  name: 'control_narrative',
  description:
    'Generate eMASS-ready control implementation narratives for any NIST 800-53 Rev 5 control given your system description. Output is AO-review quality prose.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      controlId: { type: 'string', description: 'e.g. "AC-2", "SC-28"' },
      systemName: { type: 'string', description: 'Name of the system' },
      systemDescription: { type: 'string', description: 'What the system does' },
      azureServices: {
        type: 'array',
        items: { type: 'string' },
        description: 'Azure services in scope',
      },
      cspLevel: {
        type: 'string',
        enum: ['azure-commercial', 'azure-government', 'azure-gcc-high'],
        description: 'Cloud service provider level',
      },
      impactLevel: {
        type: 'string',
        enum: ['low', 'moderate', 'high', 'il4', 'il5'],
        description: 'System impact level',
      },
      organizationName: { type: 'string', description: 'Organization name (optional)' },
    },
    required: ['controlId', 'systemName', 'systemDescription', 'azureServices', 'cspLevel', 'impactLevel'],
  },
};

const Schema = z.object({
  controlId: z.string().regex(
    /^[A-Z]{2}-\d{1,2}(\(\d{1,2}\))?$/,
    'Control ID must be NIST format: e.g. AC-2, SC-28, AC-2(1)'
  ),
  systemName: z.string().max(500),
  systemDescription: z.string().max(2000),
  azureServices: z.array(z.string().max(500)).max(50),
  cspLevel: z.enum(['azure-commercial', 'azure-government', 'azure-gcc-high']),
  impactLevel: z.enum(['low', 'moderate', 'high', 'il4', 'il5']),
  organizationName: z.string().max(500).optional(),
});

const NARRATIVE_SYSTEM = `${BASE_SYSTEM_PROMPT}

You are writing eMASS-ready control narrative prose for federal systems.
Requirements:
- Write in third person ("The system...", "The organization...")
- Reference specific Azure services by exact name
- Reference specific Azure Policy display names where applicable
- Include both automated and procedural implementation details
- Address all control enhancements required at the specified impact level
- Include specific configuration details — no vague statements
- Length: 400-800 words per control narrative
- End with a "Methods of Testing" section (bulleted)
- No bullet points in the main narrative — flowing prose only
- This will be read by an Authorizing Official. Make it precise.`;

export async function handleControlNarrative(args: unknown): Promise<string> {
  return runTool('control_narrative', args, Schema, async ({ controlId, systemName, systemDescription, azureServices, cspLevel, impactLevel, organizationName }) => {
    const prompt = controlNarrativeTemplate(
      controlId,
      systemName,
      systemDescription,
      azureServices,
      cspLevel,
      impactLevel,
      organizationName
    );

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: getTokenBudget('control_narrative'),
      system: NARRATIVE_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  });
}
