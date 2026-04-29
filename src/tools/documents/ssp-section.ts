import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { DOCUMENT_SYSTEM } from '../../prompts/system-prompts.js';
import { sspSectionTemplate } from '../../prompts/templates.js';

export const sspSectionTool = {
  name: 'ssp_section',
  description:
    'Generate a complete System Security Plan (SSP) section in eMASS-ready format. Covers system description, boundary, user types, interconnections, laws and regulations, or any NIST 800-18 section.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      section: {
        type: 'string',
        enum: [
          'system-description',
          'system-boundary',
          'user-types',
          'interconnections',
          'laws-regulations',
          'information-types',
          'security-categorization',
          'control-summary',
        ],
        description: 'SSP section to generate',
      },
      systemName: { type: 'string', description: 'Official system name (e.g., "ACME Mission System")' },
      systemDescription: {
        type: 'string',
        description: 'Brief description of what the system does',
      },
      azureServices: {
        type: 'array',
        items: { type: 'string' },
        description: 'Azure services in scope e.g. ["AKS","Key Vault","Storage Account","Azure SQL"]',
      },
      impactLevel: {
        type: 'string',
        enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'],
      },
      additionalContext: {
        type: 'string',
        description: 'Additional context specific to your system (optional)',
      },
    },
    required: ['section', 'systemName', 'systemDescription', 'azureServices', 'impactLevel'],
  },
};

const Schema = z.object({
  section: z.enum([
    'system-description',
    'system-boundary',
    'user-types',
    'interconnections',
    'laws-regulations',
    'information-types',
    'security-categorization',
    'control-summary',
  ]),
  systemName: z.string(),
  systemDescription: z.string(),
  azureServices: z.array(z.string()).min(1),
  impactLevel: z.enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5']),
  additionalContext: z.string().optional(),
});

export async function handleSspSection(args: unknown): Promise<string> {
  const { section, systemName, systemDescription, azureServices, impactLevel, additionalContext } =
    Schema.parse(args);

  const systemInfo = `${systemName} — ${systemDescription}`;
  const prompt = sspSectionTemplate(section, systemInfo, azureServices, impactLevel, additionalContext);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 6144,
    system: DOCUMENT_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
