import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
}));

import { handlePoamGenerate } from '../../../src/tools/compliance/poam-generate.js';
import { buildMockAnthropicResponse } from '../../fixtures/mock-helpers.js';
import { anthropic } from '../../../src/client.js';

const MOCK_POAM = `
| POA&M ID | Control ID | Weakness Name | Weakness Description | Detection Source | Scheduled Completion | Milestones | Resources | Status | Severity |
|----------|------------|---------------|---------------------|------------------|---------------------|------------|-----------|--------|----------|
| POAM-001 | AC-2 | Missing MFA | MFA not enforced for all users | Internal audit | 30 days | Week 1: Enable Entra ID MFA policies | 40 hours | Open | High |
`;

describe('poam_generate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects missing gaps', async () => {
    await expect(
      handlePoamGenerate({ systemName: 'Test', systemOwner: 'Owner', impactLevel: 'il4' })
    ).rejects.toThrow();
  });

  it('rejects missing systemName', async () => {
    await expect(
      handlePoamGenerate({ gaps: 'Missing MFA', systemOwner: 'Owner', impactLevel: 'il4' })
    ).rejects.toThrow();
  });

  it('rejects gaps over 2000 chars', async () => {
    await expect(
      handlePoamGenerate({
        gaps: 'x'.repeat(2001),
        systemName: 'Test',
        systemOwner: 'Owner',
        impactLevel: 'il4',
      })
    ).rejects.toThrow();
  });

  it('generates POA&M with valid inputs', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      buildMockAnthropicResponse(MOCK_POAM) as never
    );
    const result = await handlePoamGenerate({
      gaps: 'Missing MFA, No audit logging on Key Vault',
      systemName: 'Test System',
      systemOwner: 'ISSO Jane Doe',
      impactLevel: 'il4',
    });
    expect(result).toContain('POAM');
  });

  it('uses default completionDays of 90', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      buildMockAnthropicResponse(MOCK_POAM) as never
    );
    await handlePoamGenerate({
      gaps: 'Missing MFA',
      systemName: 'Test',
      systemOwner: 'Owner',
      impactLevel: 'il4',
    });
    const call = vi.mocked(anthropic.messages.create).mock.calls[0][0] as { messages: Array<{ content: string }> };
    expect(call.messages[0].content).toContain('90');
  });
});
