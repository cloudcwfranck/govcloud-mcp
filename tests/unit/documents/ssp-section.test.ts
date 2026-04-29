import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
}));

import { handleSspSection } from '../../../src/tools/documents/ssp-section.js';
import { buildMockAnthropicResponse } from '../../fixtures/mock-helpers.js';
import { anthropic } from '../../../src/client.js';

const MOCK_SSP = `
## 1. System Description

The [System Name] is a cloud-hosted federal information system deployed on
Microsoft Azure Government (GCC High) that provides case management capabilities
to authorized federal users.

### System Purpose
The system processes Controlled Unclassified Information (CUI) at Impact Level 4.

### Technology Stack
- Azure Kubernetes Service (AKS): Container orchestration
- Azure Key Vault: Secrets and cryptographic key management
`;

const VALID_ARGS = {
  section: 'system-description' as const,
  systemName: 'Test Legal System',
  systemDescription: 'Legal case management system',
  azureServices: ['AKS', 'Key Vault'],
  impactLevel: 'il4' as const,
};

describe('ssp_section', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('schema validation', () => {
    it('rejects missing section', async () => {
      await expect(handleSspSection({ ...VALID_ARGS, section: undefined })).rejects.toThrow();
    });

    it('rejects invalid section value', async () => {
      await expect(handleSspSection({ ...VALID_ARGS, section: 'invalid-section' })).rejects.toThrow();
    });

    it('rejects empty azureServices', async () => {
      await expect(handleSspSection({ ...VALID_ARGS, azureServices: [] })).rejects.toThrow();
    });

    it('rejects invalid impactLevel', async () => {
      await expect(handleSspSection({ ...VALID_ARGS, impactLevel: 'il9' })).rejects.toThrow();
    });

    it('accepts all valid section values', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_SSP) as never
      );
      const sections = [
        'system-description', 'system-boundary', 'user-types', 'interconnections',
        'laws-regulations', 'information-types', 'security-categorization', 'control-summary',
      ] as const;
      for (const section of sections) {
        await expect(handleSspSection({ ...VALID_ARGS, section })).resolves.toBeTruthy();
      }
    });
  });

  describe('output', () => {
    it('returns SSP section content', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_SSP) as never
      );
      const result = await handleSspSection(VALID_ARGS);
      expect(result).toContain('System');
    });
  });
});
