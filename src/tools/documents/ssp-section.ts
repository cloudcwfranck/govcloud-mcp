import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { DOCUMENT_SYSTEM } from '../../prompts/system-prompts.js';
import { sspSectionTemplate } from '../../prompts/templates.js';
import { runTool, getTokenBudget } from '../../utils/tool-runner.js';
import { withRetry } from '../../utils/retry.js';

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
        enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5', 'moderate', 'high', 'dod-il4', 'dod-il5'],
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
  systemName: z.string().max(500),
  systemDescription: z.string().max(2000),
  azureServices: z.array(z.string().max(500)).min(1).max(50),
  impactLevel: z.enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5', 'moderate', 'high', 'dod-il4', 'dod-il5']),
  additionalContext: z.string().max(500).optional(),
});

export async function handleSspSection(args: unknown): Promise<string> {
  return runTool('ssp_section', args, Schema, async ({ section, systemName, systemDescription, azureServices, impactLevel: rawImpactLevel, additionalContext }) => {
    const impactLevel = rawImpactLevel
      .replace('dod-il4', 'il4')
      .replace('dod-il5', 'il5')
      .replace(/^moderate$/, 'fedramp-moderate')
      .replace(/^high$/, 'fedramp-high');

    const systemInfo = `${systemName} — ${systemDescription}`;
    const prompt = sspSectionTemplate(section, systemInfo, azureServices, impactLevel, additionalContext);

    const response = await withRetry(
      () => anthropic.messages.create({
        model: MODEL,
        max_tokens: getTokenBudget('ssp_section'),
        system: DOCUMENT_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      }),
      { toolName: 'ssp_section' }
    );

    return response.content[0].type === 'text' ? response.content[0].text : '';
  });
}
