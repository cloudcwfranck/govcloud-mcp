import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
}));

vi.mock('../../../src/utils/github-fetcher.js', () => ({
  fetchEslzContent: vi.fn().mockResolvedValue(''),
  extractRelevantPolicies: vi.fn().mockReturnValue(''),
  extractRelevantArchGuidance: vi.fn().mockReturnValue(''),
  ESLZ_ATTRIBUTION: '\n\n---\n*Test attribution*',
}));

import { handleControlNarrative } from '../../../src/tools/compliance/control-narrative.js';
import { buildMockAnthropicResponse, MOCK_NARRATIVE_RESPONSE } from '../../fixtures/mock-helpers.js';
import { anthropic } from '../../../src/client.js';

const VALID_ARGS = {
  controlId: 'SC-28',
  systemName: 'Navy Legal Case Management',
  systemDescription: 'Legal case management system for Navy JAG',
  azureServices: ['Key Vault', 'Storage Account'],
  cspLevel: 'azure-gcc-high',
  impactLevel: 'il4' as const,
};

describe('control_narrative', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('schema validation', () => {
    it('rejects missing controlId', async () => {
      await expect(handleControlNarrative({ ...VALID_ARGS, controlId: undefined })).rejects.toThrow();
    });

    it('rejects invalid control ID format', async () => {
      await expect(
        handleControlNarrative({ ...VALID_ARGS, controlId: 'INVALID' })
      ).rejects.toThrow(/NIST format/i);
    });

    it('rejects missing systemName', async () => {
      await expect(handleControlNarrative({ ...VALID_ARGS, systemName: undefined })).rejects.toThrow();
    });

    it('rejects azureServices over 50 items', async () => {
      await expect(
        handleControlNarrative({ ...VALID_ARGS, azureServices: Array(51).fill('AKS') })
      ).rejects.toThrow();
    });

    it('rejects invalid impactLevel', async () => {
      await expect(
        handleControlNarrative({ ...VALID_ARGS, impactLevel: 'il9' })
      ).rejects.toThrow();
    });

    it('rejects systemDescription over 2000 chars', async () => {
      await expect(
        handleControlNarrative({ ...VALID_ARGS, systemDescription: 'x'.repeat(2001) })
      ).rejects.toThrow();
    });
  });

  describe('output', () => {
    it('returns narrative text', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_NARRATIVE_RESPONSE) as never
      );
      const result = await handleControlNarrative(VALID_ARGS);
      expect(result).toContain('SC-28');
    });

    it('includes required control in API call', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_NARRATIVE_RESPONSE) as never
      );
      await handleControlNarrative(VALID_ARGS);
      const call = vi.mocked(anthropic.messages.create).mock.calls[0][0] as { messages: Array<{ content: string }> };
      expect(call.messages[0].content).toContain('SC-28');
    });
  });
});
