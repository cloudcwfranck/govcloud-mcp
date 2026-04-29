import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
}));

import { handlePipelineAudit } from '../../../src/tools/pipeline/pipeline-audit.js';
import { buildMockAnthropicResponse } from '../../fixtures/mock-helpers.js';
import {
  GITHUB_ACTIONS_BASIC,
  GITLAB_CI_HARDENED,
  OVERSIZED_PIPELINE,
} from '../../fixtures/sample-pipeline-yaml.js';
import { anthropic } from '../../../src/client.js';

const MOCK_AUDIT = `
## DevSecOps Compliance Score: 28/100

### Critical Violations
- No SAST stage (missing semgrep/checkov)
- No container scanning
- No secret scanning (missing detect-secrets/gitleaks)
- No SBOM generation (missing syft/cyclonedx)
- No artifact signing (missing cosign)
- Images not from registry1.dso.mil

### Required Stages for IL4
| Stage | Required Tool | Iron Bank Image | Purpose |
|-------|--------------|-----------------|---------|
| SAST | Semgrep | registry1.dso.mil/ironbank/opensource/semgrep/semgrep:1.56.0 | Static analysis |
| Secrets | Detect-secrets | N/A | Secret scanning |
| Container | Anchore Enterprise | registry1.dso.mil/ironbank/anchore/enterprise:5.3.0 | CVE scanning |
`;

describe('pipeline_audit', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('schema validation', () => {
    it('rejects missing pipelineYaml', async () => {
      await expect(
        handlePipelineAudit({ pipelineType: 'gitlab-ci' })
      ).rejects.toThrow();
    });

    it('rejects missing pipelineType', async () => {
      await expect(
        handlePipelineAudit({ pipelineYaml: 'stages:\n  - build' })
      ).rejects.toThrow();
    });

    it('rejects invalid pipelineType', async () => {
      await expect(
        handlePipelineAudit({ pipelineYaml: 'stages:', pipelineType: 'travis' })
      ).rejects.toThrow();
    });

    it('rejects pipelineYaml over 10000 chars', async () => {
      await expect(
        handlePipelineAudit({ pipelineYaml: OVERSIZED_PIPELINE, pipelineType: 'gitlab-ci' })
      ).rejects.toThrow();
    });

    it('accepts all valid pipelineType values', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_AUDIT) as never
      );
      const types = ['gitlab-ci', 'github-actions', 'tekton', 'jenkins'] as const;
      for (const type of types) {
        await expect(
          handlePipelineAudit({ pipelineYaml: 'stages:\n  - build', pipelineType: type })
        ).resolves.toBeTruthy();
      }
    });
  });

  describe('output', () => {
    it('returns audit results for basic pipeline', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_AUDIT) as never
      );
      const result = await handlePipelineAudit({
        pipelineYaml: GITHUB_ACTIONS_BASIC,
        pipelineType: 'github-actions',
        targetLevel: 'il4',
      });
      expect(result).toContain('28');
    });

    it('passes pipeline content to API', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_AUDIT) as never
      );
      await handlePipelineAudit({
        pipelineYaml: GITLAB_CI_HARDENED,
        pipelineType: 'gitlab-ci',
      });
      const call = vi.mocked(anthropic.messages.create).mock.calls[0][0] as { messages: Array<{ content: string }> };
      expect(call.messages[0].content).toContain('cosign');
    });
  });
});
