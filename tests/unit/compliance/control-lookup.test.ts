import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
}));

import { handleControlLookup } from '../../../src/tools/compliance/control-lookup.js';
import { buildMockAnthropicResponse, MOCK_CONTROL_RESPONSE } from '../../fixtures/mock-helpers.js';
import { anthropic } from '../../../src/client.js';

describe('control_lookup', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('schema validation', () => {
    it('rejects missing controlId', async () => {
      await expect(handleControlLookup({})).rejects.toThrow();
    });

    it('rejects invalid control ID format', async () => {
      await expect(handleControlLookup({ controlId: 'NOTACONTROL' })).rejects.toThrow(
        /NIST format/i
      );
    });

    it('rejects lowercase control ID', async () => {
      await expect(handleControlLookup({ controlId: 'ac-2' })).rejects.toThrow();
    });

    it('rejects control with wrong separator', async () => {
      await expect(handleControlLookup({ controlId: 'AC2' })).rejects.toThrow();
    });

    it('rejects azureContext over 500 chars', async () => {
      await expect(
        handleControlLookup({ controlId: 'AC-2', azureContext: 'x'.repeat(501) })
      ).rejects.toThrow();
    });
  });

  describe('valid inputs', () => {
    const validIds = ['AC-2', 'SC-28', 'AU-12', 'CM-6', 'IA-2', 'AC-2(1)', 'SC-28(1)', 'SI-3(10)'];

    for (const id of validIds) {
      it(`accepts valid NIST control ID: ${id}`, async () => {
        vi.mocked(anthropic.messages.create).mockResolvedValue(
          buildMockAnthropicResponse(MOCK_CONTROL_RESPONSE) as never
        );
        await expect(handleControlLookup({ controlId: id })).resolves.toBeTruthy();
      });
    }

    it('returns text content from API response', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_CONTROL_RESPONSE) as never
      );
      const result = await handleControlLookup({ controlId: 'AC-2' });
      expect(result).toContain('AC-2');
    });

    it('passes azureContext to prompt', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_CONTROL_RESPONSE) as never
      );
      await handleControlLookup({ controlId: 'AC-2', azureContext: 'AKS on GCC High' });
      const call = vi.mocked(anthropic.messages.create).mock.calls[0][0] as { messages: Array<{ content: string }> };
      expect(call.messages[0].content).toContain('AKS on GCC High');
    });
  });

  describe('error handling', () => {
    it('propagates API errors with user-friendly message', async () => {
      vi.mocked(anthropic.messages.create).mockRejectedValue(
        new Error('rate_limit exceeded')
      );
      await expect(handleControlLookup({ controlId: 'AC-2' })).rejects.toThrow(
        /rate limit/i
      );
    });

    it('throws on empty API response', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse('') as never
      );
      await expect(handleControlLookup({ controlId: 'AC-2' })).rejects.toThrow();
    });
  });
});
