import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
}));

import { handleBigbangValidate } from '../../../src/tools/platform-one/bigbang-validate.js';
import { buildMockAnthropicResponse } from '../../fixtures/mock-helpers.js';
import {
  VALID_BIGBANG_VALUES,
  NONCOMPLIANT_BIGBANG_VALUES,
  OVERSIZED_VALUES,
} from '../../fixtures/sample-values-yaml.js';
import { anthropic } from '../../../src/client.js';

const MOCK_VALIDATION = `
## IL4 Compliance Score: 65/100

### Critical Violations
- Non-Iron Bank image detected: grafana/grafana (must use registry1.dso.mil)
- Istio mTLS not enforced (mode: PERMISSIVE instead of STRICT)
- Network policies disabled

### Image Policy Violations
| Current Image | Iron Bank Replacement |
|--------------|----------------------|
| grafana/grafana:latest | registry1.dso.mil/ironbank/opensource/grafana/grafana:10.2.3 |

### Hardened values.yaml
\`\`\`yaml
# IL4 hardened configuration
istio:
  mtls:
    mode: STRICT
\`\`\`
`;

describe('bigbang_validate', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('schema validation', () => {
    it('rejects missing valuesYaml', async () => {
      await expect(handleBigbangValidate({ targetLevel: 'il4' })).rejects.toThrow();
    });

    it('rejects empty valuesYaml', async () => {
      await expect(handleBigbangValidate({ valuesYaml: '', targetLevel: 'il4' })).rejects.toThrow();
    });

    it('rejects valuesYaml over 20000 chars', async () => {
      await expect(
        handleBigbangValidate({ valuesYaml: OVERSIZED_VALUES, targetLevel: 'il4' })
      ).rejects.toThrow();
    });

    it('rejects invalid targetLevel', async () => {
      await expect(
        handleBigbangValidate({ valuesYaml: 'domain: test', targetLevel: 'il9' })
      ).rejects.toThrow();
    });

    it('defaults targetLevel to il4', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_VALIDATION) as never
      );
      await expect(
        handleBigbangValidate({ valuesYaml: VALID_BIGBANG_VALUES })
      ).resolves.toBeTruthy();
    });
  });

  describe('output', () => {
    it('returns validation results', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_VALIDATION) as never
      );
      const result = await handleBigbangValidate({
        valuesYaml: NONCOMPLIANT_BIGBANG_VALUES,
        targetLevel: 'il4',
      });
      expect(result).toContain('IL4');
    });

    it('passes valuesYaml content to API', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_VALIDATION) as never
      );
      await handleBigbangValidate({
        valuesYaml: NONCOMPLIANT_BIGBANG_VALUES,
        targetLevel: 'il4',
      });
      const call = vi.mocked(anthropic.messages.create).mock.calls[0][0] as { messages: Array<{ content: string }> };
      expect(call.messages[0].content).toContain('grafana/grafana');
    });
  });
});
