import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { ARCHITECTURE_SYSTEM } from '../../prompts/system-prompts.js';
import { landingZoneTemplate } from '../../prompts/templates.js';
import { runTool, getTokenBudget } from '../../utils/tool-runner.js';

export const landingZoneTool = {
  name: 'landing_zone_design',
  description:
    'Design a complete Azure Landing Zone architecture for government workloads. Returns hub-spoke topology, subscription structure, network layout, security services, and Bicep scaffold.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      missionType: {
        type: 'string',
        enum: ['combat-support', 'admin-backoffice', 'legal-services', 'healthcare', 'intelligence-analytics', 'logistics', 'communications'],
        description: 'Mission type drives architecture decisions',
      },
      dataClassification: {
        type: 'string',
        enum: ['unclassified', 'cui', 'fouo', 'secret'],
      },
      userBase: {
        type: 'string',
        enum: ['conus', 'oconus', 'both', 'disconnected'],
      },
      targetImpactLevel: {
        type: 'string',
        enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'],
      },
      estimatedUsers: { type: 'number', description: 'Approximate user count' },
      connectedToNIPR: { type: 'boolean' },
      existingEnclaves: { type: 'string', description: 'Describe existing enclaves/networks' },
      cssp: {
        type: 'string',
        enum: ['azure-government', 'azure-gcc-high'],
        description: 'Cloud service provider (default: azure-gcc-high)',
      },
    },
    required: ['missionType', 'dataClassification', 'userBase', 'targetImpactLevel'],
  },
};

const Schema = z.object({
  missionType: z.enum(['combat-support', 'admin-backoffice', 'legal-services', 'healthcare', 'intelligence-analytics', 'logistics', 'communications']),
  dataClassification: z.enum(['unclassified', 'cui', 'fouo', 'secret']),
  userBase: z.enum(['conus', 'oconus', 'both', 'disconnected']),
  targetImpactLevel: z.enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5']),
  estimatedUsers: z.number().optional(),
  connectedToNIPR: z.boolean().optional(),
  existingEnclaves: z.string().max(500).optional(),
  cssp: z.enum(['azure-government', 'azure-gcc-high']).default('azure-gcc-high'),
});

export async function handleLandingZone(args: unknown): Promise<string> {
  return runTool('landing_zone_design', args, Schema, async (params) => {
    const prompt = landingZoneTemplate({ ...params, cssp: params.cssp ?? 'azure-gcc-high' });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: getTokenBudget('landing_zone_design'),
      system: ARCHITECTURE_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  });
}
