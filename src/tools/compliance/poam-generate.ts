import { z } from 'zod';
import { anthropic, MODEL, BASE_SYSTEM_PROMPT } from '../../client.js';
import { poamTemplate } from '../../prompts/templates.js';

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
        enum: ['moderate', 'high', 'il4', 'il5'],
        description: 'System impact level',
      },
    },
    required: ['gaps', 'systemName', 'impactLevel'],
  },
};

const Schema = z.object({
  gaps: z.string().min(1),
  systemName: z.string(),
  systemOwner: z.string().default('Information System Owner'),
  scheduledCompletionDays: z.number().default(90),
  impactLevel: z.enum(['moderate', 'high', 'il4', 'il5']),
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
  const { gaps, systemName, systemOwner, scheduledCompletionDays, impactLevel } = Schema.parse(args);

  const prompt = poamTemplate(gaps, systemName, systemOwner, scheduledCompletionDays, impactLevel);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: POAM_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
