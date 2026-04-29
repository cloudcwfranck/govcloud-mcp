import { z } from 'zod';
import { anthropic, MODEL, BASE_SYSTEM_PROMPT } from '../../client.js';
import { controlNarrativeTemplate } from '../../prompts/templates.js';

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
  controlId: z.string(),
  systemName: z.string(),
  systemDescription: z.string(),
  azureServices: z.array(z.string()),
  cspLevel: z.enum(['azure-commercial', 'azure-government', 'azure-gcc-high']),
  impactLevel: z.enum(['low', 'moderate', 'high', 'il4', 'il5']),
  organizationName: z.string().optional(),
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
  const { controlId, systemName, systemDescription, azureServices, cspLevel, impactLevel, organizationName } =
    Schema.parse(args);

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
    max_tokens: 4096,
    system: NARRATIVE_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
