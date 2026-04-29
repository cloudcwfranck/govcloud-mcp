import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
  SITE_API_BASE: 'https://www.cloudcraftwithfranck.org',
  callSiteApi: vi.fn().mockResolvedValue({
    overallScore: { score: 72, fedrampReadiness: 'Moderate-Ready', il4Ready: true, summary: 'Good baseline compliance posture with gaps in audit logging.' },
    controlsCovered: [{ controlId: 'SC-28', controlName: 'Protection of Information at Rest', family: 'SC', azureService: 'Key Vault', explanation: 'CMK via Key Vault' }],
    controlsPartial: [{ controlId: 'AC-3', controlName: 'Access Enforcement', family: 'AC', gap: 'RBAC not fully configured', severity: 'medium' }],
    controlsMissing: [{ controlId: 'AU-2', controlName: 'Event Logging', family: 'AU', remediation: 'Add diagnostic settings', severity: 'high' }],
    securityFindings: [{ finding: 'TLS 1.0 allowed', severity: 'High', affectedResource: 'storage', fix: 'Set minimumTlsVersion to TLS1_2' }],
  }),
}));

import { handleBicepAnalyze } from '../../../src/tools/compliance/bicep-analyze.js';
import { VALID_BICEP_IL4, NONCOMPLIANT_BICEP, OVERSIZED_BICEP } from '../../fixtures/sample-bicep.js';

const MOCK_ANALYSIS = `## Compliance Analysis

### IL4 Score: 72/100

### Controls Addressed
| Control | Coverage |
|---------|----------|
| SC-28 | Full — CMK encryption via Key Vault |
| AC-17 | Full — Private endpoint |

### Critical Gaps
- AC-2: No RBAC configuration
- AU-2: No diagnostic settings

### NIST Control IDs Found: SC-28, AC-4, SI-7`;

describe('bicep_analyze', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('schema validation', () => {
    it('rejects missing bicepCode', async () => {
      await expect(handleBicepAnalyze({ targetLevel: 'fedramp-high' })).rejects.toThrow();
    });

    it('defaults targetLevel to fedramp-high when omitted', async () => {
      await expect(handleBicepAnalyze({ bicepCode: VALID_BICEP_IL4 })).resolves.toBeTruthy();
    });

    it('rejects invalid targetLevel', async () => {
      await expect(
        handleBicepAnalyze({ bicepCode: 'param x string', targetLevel: 'invalid' })
      ).rejects.toThrow();
    });

    it('rejects bicepCode over 20000 chars', async () => {
      await expect(
        handleBicepAnalyze({ bicepCode: OVERSIZED_BICEP, targetLevel: 'fedramp-high' })
      ).rejects.toThrow();
    });

    it('accepts all valid targetLevel values', async () => {
      const levels = ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'];
      for (const level of levels) {
        await expect(
          handleBicepAnalyze({ bicepCode: VALID_BICEP_IL4, targetLevel: level })
        ).resolves.toBeTruthy();
      }
    });
  });

  describe('output', () => {
    it('returns analysis text with NIST controls from site API', async () => {
      const result = await handleBicepAnalyze({
        bicepCode: VALID_BICEP_IL4,
        targetLevel: 'il4',
      });
      expect(result).toContain('SC-28');
    });

    it('includes NIST control IDs in output', async () => {
      const result = await handleBicepAnalyze({
        bicepCode: NONCOMPLIANT_BICEP,
        targetLevel: 'fedramp-high',
      });
      expect(result).toMatch(/[A-Z]{2}-\d+/);
    });
  });
});
