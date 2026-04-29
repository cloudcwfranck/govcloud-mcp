import { z } from 'zod';
import { anthropic, MODEL } from '../../client.js';
import { PIPELINE_SYSTEM } from '../../prompts/system-prompts.js';
import { runTool, getTokenBudget } from '../../utils/tool-runner.js';

export const pipelineAuditTool = {
  name: 'pipeline_audit',
  description:
    'Audit a CI/CD pipeline configuration (GitLab CI, GitHub Actions, Tekton, Jenkins) for DoD DevSecOps compliance. Returns a scored audit with violations and hardened pipeline YAML.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      pipelineYaml: {
        type: 'string',
        description: 'Paste your pipeline YAML (.gitlab-ci.yml, GitHub Actions workflow, Tekton Pipeline, etc.)',
      },
      pipelineType: {
        type: 'string',
        enum: ['gitlab-ci', 'github-actions', 'tekton', 'jenkins'],
        description: 'Pipeline type',
      },
      targetLevel: {
        type: 'string',
        enum: ['il2', 'il4', 'il5'],
        description: 'DoD IL compliance target (default: il4)',
      },
      scanTools: {
        type: 'array',
        items: { type: 'string' },
        description: 'Security scan tools currently used e.g. ["twistlock","sonarqube","anchore"]',
      },
    },
    required: ['pipelineYaml', 'pipelineType'],
  },
};

const Schema = z.object({
  pipelineYaml: z.string().min(1).max(20000),
  pipelineType: z.enum(['gitlab-ci', 'github-actions', 'tekton', 'jenkins']),
  targetLevel: z.enum(['il2', 'il4', 'il5']).default('il4'),
  scanTools: z.array(z.string().max(500)).max(50).default([]),
});

export async function handlePipelineAudit(args: unknown): Promise<string> {
  return runTool('pipeline_audit', args, Schema, async ({ pipelineYaml, pipelineType, targetLevel, scanTools }) => {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: getTokenBudget('pipeline_audit'),
      system: PIPELINE_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Audit this ${pipelineType} pipeline for ${targetLevel} DevSecOps compliance.
${(scanTools ?? []).length > 0 ? `\n**Current Scan Tools:** ${(scanTools ?? []).join(', ')}` : ''}

\`\`\`yaml
${pipelineYaml}
\`\`\`

Provide:
1. **DevSecOps Compliance Score** (0-100) — with breakdown by category:
   - SAST (Static Analysis): /20
   - Container Security: /20
   - SCA (Software Composition Analysis): /20
   - Secrets Scanning: /15
   - Artifact Signing: /15
   - DAST (Dynamic Analysis): /10

2. **Critical Violations** — gaps that would block an IL Authorization to Operate:
   - Missing required scan stages
   - Images not pulled from registry1.dso.mil / approved registry
   - No artifact signing (Sigstore/Cosign)
   - Secrets in plain text (env vars, hardcoded values)
   - No SBOM generation
   - Privileged containers in pipeline

3. **Required Stages for ${targetLevel}** — with tool recommendations:
   | Stage | Required Tool | Iron Bank Image | Purpose |
   |-------|--------------|-----------------|---------|

4. **Secrets Management Issues** — any hardcoded secrets, missing Vault integration

5. **Hardened Pipeline YAML** — complete rewrite with:
   - All required security stages added
   - Iron Bank images for all scanner tools
   - Artifact signing with Cosign
   - SBOM generation (Syft/Grype)
   - Secrets pulled from Vault/sealed-secrets
   - Fail-fast on critical findings

6. **Platform One Integration** — how to integrate with:
   - Iron Bank image scanning (Anchore Enterprise)
   - Platform One Artifact Repository
   - DoD-approved SAST tools (Fortify, Checkmarx)

7. **Line References** — specific line numbers from the original pipeline with issues`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  });
}
