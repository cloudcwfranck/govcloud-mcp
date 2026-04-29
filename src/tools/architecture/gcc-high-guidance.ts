import { z } from 'zod';
import { anthropic, MODEL, BASE_SYSTEM_PROMPT } from '../../client.js';

export const gccHighTool = {
  name: 'gcc_high_guidance',
  description:
    'Get Azure GCC High specific configuration requirements, limitations, and gotchas for any Azure service or scenario. Includes what works differently in GCC High vs Azure Government vs Commercial.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      service: { type: 'string', description: 'Azure service name or scenario' },
      scenario: { type: 'string', description: 'What you are trying to accomplish (optional)' },
    },
    required: ['service'],
  },
};

const Schema = z.object({
  service: z.string(),
  scenario: z.string().optional(),
});

const GCC_SYSTEM = `${BASE_SYSTEM_PROMPT}

You are the world's most experienced Azure GCC High engineer. This tool exists because GCC High behaves differently from Azure Government and Azure Commercial in ways that are not documented clearly — or not documented at all.

Be brutally honest about limitations. Engineers in DoD environments need the truth, not the sales pitch. Cover:
- What features are NOT available in GCC High (and when they became available, if known)
- What requires special configuration in GCC High vs. Azure Government
- Endpoint differences (management, storage, AAD/Entra, Key Vault, etc.)
- Known limitations and real workarounds that work in production
- CAC/PIV authentication specifics (what actually works, what doesn't)
- Microsoft support escalation paths for GCC High issues
- Tenant configuration requirements (Gov-specific settings often missed)
- What the Microsoft documentation doesn't tell you but every GCC High engineer learns the hard way
- Timeline for feature parity with commercial (if known/estimated)`;

export async function handleGccHigh(args: unknown): Promise<string> {
  const { service, scenario } = Schema.parse(args);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: GCC_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Provide complete GCC High guidance for: **${service}**
${scenario ? `\nScenario: ${scenario}` : ''}

Focus on what's different, what's broken, what's undocumented, and what every GCC High engineer needs to know before they spend days debugging something that should have been a 5-minute warning.`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
