import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
}));

import { handleIronbankLookup } from '../../../src/tools/platform-one/ironbank-lookup.js';
import { buildMockAnthropicResponse } from '../../fixtures/mock-helpers.js';
import { anthropic } from '../../../src/client.js';

const MOCK_IRONBANK = `
## Iron Bank Image: nginx

### Registry Path
\`registry1.dso.mil/ironbank/opensource/nginx/nginx:1.25.3\`

### Image Digest
\`sha256:a1b2c3d4e5f6789...\`

### Cosign Verification
\`\`\`bash
cosign verify --key https://ironbank.dso.mil/repomap/cosign.pub registry1.dso.mil/ironbank/opensource/nginx/nginx:1.25.3
\`\`\`

### Pull Secret
\`\`\`bash
kubectl create secret docker-registry registry1-creds \\
  --docker-server=registry1.dso.mil \\
  --docker-username=<USERNAME> \\
  --docker-password=<CLI_SECRET>
\`\`\`
`;

describe('ironbank_lookup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects missing imageName', async () => {
    await expect(handleIronbankLookup({})).rejects.toThrow();
  });

  it('rejects empty imageName', async () => {
    await expect(handleIronbankLookup({ imageName: '' })).rejects.toThrow();
  });

  it('rejects imageName over 500 chars', async () => {
    await expect(handleIronbankLookup({ imageName: 'x'.repeat(501) })).rejects.toThrow();
  });

  it('looks up image by name', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      buildMockAnthropicResponse(MOCK_IRONBANK) as never
    );
    const result = await handleIronbankLookup({ imageName: 'nginx' });
    expect(result).toContain('registry1.dso.mil');
  });

  it('includes version in API call when provided', async () => {
    vi.mocked(anthropic.messages.create).mockResolvedValue(
      buildMockAnthropicResponse(MOCK_IRONBANK) as never
    );
    await handleIronbankLookup({ imageName: 'nginx', version: '1.25.3' });
    const call = vi.mocked(anthropic.messages.create).mock.calls[0][0] as { messages: Array<{ content: string }> };
    expect(call.messages[0].content).toContain('1.25.3');
  });
});
