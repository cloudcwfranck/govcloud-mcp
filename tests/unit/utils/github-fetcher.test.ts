import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger to keep test output clean
vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), perf: vi.fn() },
}));

// Reset module between tests so cache state is fresh
import {
  fetchEslzContent,
  fetchEslzJson,
  fetchEslzBatch,
  extractRelevantPolicies,
  extractRelevantArchGuidance,
  clearEslzCache,
} from '../../../src/utils/github-fetcher.js';

describe('github-fetcher', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearEslzCache(); // prevent cache bleed between tests
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearEslzCache();
  });

  describe('extractRelevantPolicies', () => {
    const samplePolicyJson = JSON.stringify({
      resources: [
        {
          type: 'Microsoft.Authorization/policyDefinitions',
          name: 'Deny-Storage-http',
          properties: {
            displayName: 'Secure transfer to storage accounts should be enabled',
            description: 'Enforce HTTPS for storage account transfers',
          },
        },
        {
          type: 'Microsoft.Authorization/policyDefinitions',
          name: 'Deploy-KeyVault-Diagnostics',
          properties: {
            displayName: 'Deploy Diagnostic Settings for Key Vault',
            description: 'Deploy diagnostic settings for Key Vault to Log Analytics',
          },
        },
        {
          type: 'Microsoft.Authorization/policyDefinitions',
          name: 'Unrelated-Policy',
          properties: {
            displayName: 'Some unrelated policy',
            description: 'Completely unrelated',
          },
        },
      ],
    });

    it('returns matching policies for given services', () => {
      const result = extractRelevantPolicies(samplePolicyJson, 'SC', ['storage', 'key vault']);
      expect(result).toContain('Secure transfer to storage accounts');
      expect(result).toContain('Key Vault');
    });

    it('filters out unrelated policies', () => {
      const result = extractRelevantPolicies(samplePolicyJson, 'SC', ['storage']);
      expect(result).not.toContain('Unrelated-Policy');
    });

    it('returns fallback string when no policies match', () => {
      const result = extractRelevantPolicies(samplePolicyJson, 'XX', ['zzznomatch']);
      expect(result).toContain('No specific policies found');
    });

    it('returns empty string on invalid JSON', () => {
      const result = extractRelevantPolicies('not-json', 'SC', ['storage']);
      expect(result).toBe('');
    });

    it('returns empty string on empty input', () => {
      expect(extractRelevantPolicies('', 'SC', ['storage'])).toBe('');
    });
  });

  describe('extractRelevantArchGuidance', () => {
    const archDoc = `
# Azure Enterprise Scale Architecture

## Identity and Access Management
Entra ID provides identity services. PIM manages privileged access.
Conditional Access enforces MFA and device compliance.

## Network Security
Azure Firewall Premium provides IDPS. Private endpoints eliminate public exposure.
TLS 1.2+ enforced on all services.

## Compliance Monitoring
Azure Policy enforces configuration baseline.
`;

    it('extracts identity-related content for AC family', () => {
      const result = extractRelevantArchGuidance(archDoc, 'AC');
      expect(result.toLowerCase()).toContain('identity');
    });

    it('extracts network-related content for SC family', () => {
      const result = extractRelevantArchGuidance(archDoc, 'SC');
      expect(result.toLowerCase()).toContain('network');
    });

    it('returns empty string on empty input', () => {
      expect(extractRelevantArchGuidance('', 'SC')).toBe('');
    });
  });

  describe('fetchEslzContent — graceful degradation', () => {
    it('returns empty string when fetch fails with network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network unavailable'));
      const result = await fetchEslzContent('docs/test.md');
      expect(result).toBe('');
    });

    it('returns empty string when server returns 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });
      const result = await fetchEslzContent('docs/nonexistent.md');
      expect(result).toBe('');
    });

    it('returns content when fetch succeeds', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '# Test Content',
      });
      const result = await fetchEslzContent('docs/test.md');
      expect(result).toBe('# Test Content');
    });
  });

  describe('fetchEslzJson — graceful degradation', () => {
    it('returns null when content is empty', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network unavailable'));
      const result = await fetchEslzJson('policies/test.json');
      expect(result).toBeNull();
    });

    it('returns null on invalid JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'not-valid-json{{{',
      });
      const result = await fetchEslzJson('policies/test.json');
      expect(result).toBeNull();
    });

    it('returns parsed object on valid JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '{"resources":[]}',
      });
      const result = await fetchEslzJson('policies/test.json');
      expect(result).toEqual({ resources: [] });
    });
  });

  describe('fetchEslzBatch', () => {
    it('returns results for all paths', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => 'content-a' })
        .mockResolvedValueOnce({ ok: true, text: async () => 'content-b' });
      const map = await fetchEslzBatch(['path/a.md', 'path/b.md']);
      expect(map.size).toBe(2);
    });

    it('returns partial results when some fetches fail', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, text: async () => 'content-a' })
        .mockRejectedValueOnce(new Error('fail'));
      const map = await fetchEslzBatch(['path/a.md', 'path/fail.md']);
      // Both keys should exist (failed fetch returns empty string, not rejection)
      expect(map.size).toBe(2);
      expect(map.get('path/a.md')).toBe('content-a');
      expect(map.get('path/fail.md')).toBe('');
    });
  });
});
