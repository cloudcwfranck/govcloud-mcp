import { z } from 'zod';
import { anthropic, MODEL, BASE_SYSTEM_PROMPT } from '../../client.js';
import { poamTemplate } from '../../prompts/templates.js';
import { runTool, getTokenBudget } from '../../utils/tool-runner.js';
import { withRetry } from '../../utils/retry.js';

export const poamGenerateTool = {
  name: 'poam_generate',
  description:
    'Generate Plan of Action & Milestones (POA&M) entries from compliance gaps. Output is formatted for eMASS import with weakness descriptions, scheduled completion dates, and milestones.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      gaps: {
        type: 'string',
        description: 'Describe compliance gaps or paste bicep_analyze output',
      },
      systemName: { type: 'string', description: 'System name' },
      systemOwner: { type: 'string', description: 'System owner name (optional)' },
      scheduledCompletionDays: {
        type: 'number',
        description: 'Days to complete remediation (default: 90)',
      },
      impactLevel: {
        type: 'string',
        enum: ['moderate', 'high', 'il4', 'il5', 'fedramp-moderate', 'fedramp-high', 'dod-il4', 'dod-il5'],
        description: 'System impact level',
      },
    },
    required: ['gaps', 'systemName', 'impactLevel'],
  },
};

const Schema = z.object({
  gaps: z.string().min(1).max(2000),
  systemName: z.string().max(500),
  systemOwner: z.string().max(500).default('Information System Owner'),
  scheduledCompletionDays: z.number().default(90),
  impactLevel: z.enum(['moderate', 'high', 'il4', 'il5', 'fedramp-moderate', 'fedramp-high', 'dod-il4', 'dod-il5']),
});

const POAM_SYSTEM = `${BASE_SYSTEM_PROMPT}

You are generating eMASS-compatible POA&M entries. Requirements:
- Generate realistic, specific weakness descriptions — not generic "implement control" language
- Include actual technical remediation steps as milestones
- Assign POA&M IDs in format: POAM-YYYY-NNN (e.g., POAM-2025-001)
- Severity must align with CVSS/STIG severity levels: Critical/High/Medium/Low
- Detection Source: Self-Assessment, 3PAO Assessment, Continuous Monitoring, Penetration Test
- Resources Required: specific Azure services, labor hours, tooling
- Milestones must have specific dates relative to today and concrete technical actions
- Status: Open (for all new entries)`;

export async function handlePoamGenerate(args: unknown): Promise<string> {
  return runTool('poam_generate', args, Schema, async ({ gaps, systemName, systemOwner, scheduledCompletionDays, impactLevel: rawImpactLevel }) => {
    const impactLevel = rawImpactLevel
      .replace('dod-il4', 'il4')
      .replace('dod-il5', 'il5')
      .replace('fedramp-moderate', 'moderate')
      .replace('fedramp-high', 'high');

    const prompt = poamTemplate(gaps, systemName, systemOwner ?? 'Information System Owner', scheduledCompletionDays ?? 90, impactLevel);

    const response = await withRetry(
      () => anthropic.messages.create({
        model: MODEL,
        max_tokens: getTokenBudget('poam_generate'),
        system: POAM_SYSTEM,
        messages: [{ role: 'user', content: prompt }],
      }),
      { toolName: 'poam_generate' }
    );

    return response.content[0].type === 'text' ? response.content[0].text : '';
  });
}
