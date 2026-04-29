import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
}));

import { handleGccHigh } from '../../../src/tools/architecture/gcc-high-guidance.js';
import { buildMockAnthropicResponse } from '../../fixtures/mock-helpers.js';
import { anthropic } from '../../../src/client.js';

const MOCK_GCC = `
## AKS in Azure GCC High — What You Need to Know

### What's Different
- Container Registry is at mcr.microsoft.com (same endpoint, but some images lag commercial)
- Managed identity federation for workloads needs specific GCC High tenant configuration

### What's Broken / Undocumented
- Azure Arc-enabled Kubernetes connectivity requires special FedRAMP-approved configuration
- Defender for Containers sensor pull from GCC High MCR endpoint has documented lag

### Endpoint Differences
- AKS API server: still *.azmk8s.io but via GCC High management plane
- Azure Monitor: usgovvirginia.monitoring.azure.us

### CAC/PIV Authentication
- Works via Entra ID CBA (Certificate-Based Authentication)
`;

describe('gcc_high_guidance', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects missing service', async () => {
    await expect(handleGccHigh({})).rejects.toThrow();
  });

  it('rejects service over 500 chars', async () => {
    await expect(handleGccHigh({ service: 'x'.repeat(501) })).rejects.toThrow();
  });

  it('returns GCC High guidance', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      buildMockAnthropicResponse(MOCK_GCC) as never
    );
    const result = await handleGccHigh({ service: 'AKS' });
    expect(result).toContain('GCC High');
  });

  it('includes scenario in API call when provided', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      buildMockAnthropicResponse(MOCK_GCC) as never
    );
    await handleGccHigh({ service: 'AKS', scenario: 'CAC authentication setup' });
    const call = vi.mocked(anthropic.messages.create).mock.calls[0][0] as { messages: Array<{ content: string }> };
    expect(call.messages[0].content).toContain('CAC authentication setup');
  });
});
