import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { PIPELINE_SYSTEM } from '../../prompts/system-prompts.js';

export const devsecopsScoreCardTool = {
  name: 'devsecops_scorecard',
  description:
    'Generate a DoD DevSecOps maturity scorecard for a software factory or program. Scores against the DoD DevSecOps Reference Design and CNCF security best practices. Returns a scored assessment with a prioritized improvement roadmap.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      programName: { type: 'string', description: 'Program or system name' },
      currentCapabilities: {
        type: 'array',
        items: { type: 'string' },
        description:
          'List current DevSecOps capabilities e.g. ["gitlab-ci","sonarqube","twistlock","vault","big-bang","tekton"]',
      },
      targetLevel: {
        type: 'string',
        enum: ['il2', 'il4', 'il5'],
        description: 'Target IL level',
      },
      softwareFactoryType: {
        type: 'string',
        enum: ['platform-one', 'custom', 'iron-bank-consumer'],
        description: 'Type of software factory (default: platform-one)',
      },
    },
    required: ['programName', 'currentCapabilities', 'targetLevel'],
  },
};

const Schema = z.object({
  programName: z.string(),
  currentCapabilities: z.array(z.string()),
  targetLevel: z.enum(['il2', 'il4', 'il5']),
  softwareFactoryType: z.enum(['platform-one', 'custom', 'iron-bank-consumer']).default('platform-one'),
});

export async function handleDevsecopsScorecard(args: unknown): Promise<string> {
  const { programName, currentCapabilities, targetLevel, softwareFactoryType } = Schema.parse(args);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 5120,
    system: PIPELINE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Generate a DoD DevSecOps maturity scorecard for **${programName}** targeting **${targetLevel}** using a **${softwareFactoryType}** software factory.

**Current Capabilities:** ${currentCapabilities.length > 0 ? currentCapabilities.join(', ') : 'None specified'}

Score against the DoD DevSecOps Reference Design v2.0 pillars:

1. **Overall Maturity Score** (0-100) with level:
   - 0-25: Initial (ad hoc)
   - 26-50: Managed (repeatable)
   - 51-75: Defined (standardized)
   - 76-90: Measured (quantified)
   - 91-100: Optimized (continuous improvement)

2. **Pillar Scores** (0-20 each):
   | Pillar | Score | Status | Key Gaps |
   |--------|-------|--------|----------|
   | Source Code Security | /20 | | |
   | Build Security | /20 | | |
   | Container Security | /20 | | |
   | Deploy Security | /20 | | |
   | Runtime Security | /20 | | |

3. **${targetLevel.toUpperCase()} Compliance Gaps** — capabilities required but missing:
   - What's blocking ATO at ${targetLevel}
   - Specific DoD policy references (DoDI 5000.82, CISA guidance)

4. **Capability Matrix**:
   | Capability | Required for ${targetLevel} | Current Status | Gap |
   |------------|--------------------------|----------------|-----|

5. **Prioritized Improvement Roadmap**:
   - **Immediate (0-30 days):** Quick wins that unblock ATO
   - **Short-term (30-90 days):** Foundation capabilities
   - **Medium-term (90-180 days):** Full ${targetLevel} compliance
   - Each item: effort (S/M/L), impact (High/Med/Low), tool recommendation

6. **Platform One Specific Guidance** (if platform-one factory):
   - Which Platform One capabilities to leverage vs. build
   - Big Bang addons that address specific gaps

7. **Authority to Operate Impact** — how current score affects ATO timeline and what the AO will focus on`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
