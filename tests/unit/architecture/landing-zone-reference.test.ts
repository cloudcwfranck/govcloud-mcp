import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
}));

vi.mock('../../../src/utils/github-fetcher.js', () => ({
  fetchEslzContent: vi.fn().mockResolvedValue('# Azure Enterprise Scale\n\nManagement Group hierarchy...'),
  extractRelevantPolicies: vi.fn().mockReturnValue('- **Deny-RDP-From-Internet**: Block inbound RDP'),
  extractRelevantArchGuidance: vi.fn().mockReturnValue('## Identity and Access Management'),
  ESLZ_ATTRIBUTION: '\n\n---\n*Grounded in Azure/Enterprise-Scale*',
}));

import { handleLandingZoneReference } from '../../../src/tools/architecture/landing-zone-reference.js';
import { buildMockAnthropicResponse } from '../../fixtures/mock-helpers.js';
import { anthropic } from '../../../src/client.js';

const MOCK_LZ_REF = `## IL4 Mission Landing Zone — Navy Legal Case Management

### Management Group Hierarchy
- Tenant Root
  - Platform
    - Management
    - Connectivity
    - Identity
  - Landing Zones
    - Corp (IL4)
  - Sandbox

### Hub-Spoke Network
- Hub VNet: 10.0.0.0/16
- Spoke: 10.1.0.0/16

This design aligns with the Azure/Enterprise-Scale reference implementation.

### Policy Assignments
- Deploy-MDFC-Config
- Deny-RDP-From-Internet`;

describe('landing_zone_reference', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('schema validation', () => {
    it('rejects missing scenario', async () => {
      await expect(
        handleLandingZoneReference({ impactLevel: 'il4', csp: 'azure-gcc-high', missionType: 'test', subscriptionCount: '4-10' })
      ).rejects.toThrow();
    });

    it('rejects invalid scenario', async () => {
      await expect(
        handleLandingZoneReference({ scenario: 'invalid', impactLevel: 'il4', csp: 'azure-gcc-high', missionType: 'test', subscriptionCount: '4-10' })
      ).rejects.toThrow();
    });

    it('rejects invalid csp', async () => {
      await expect(
        handleLandingZoneReference({ scenario: 'mission-landing-zone', impactLevel: 'il4', csp: 'azure-commercial', missionType: 'test', subscriptionCount: '4-10' })
      ).rejects.toThrow();
    });

    it('rejects invalid subscriptionCount', async () => {
      await expect(
        handleLandingZoneReference({ scenario: 'mission-landing-zone', impactLevel: 'il4', csp: 'azure-gcc-high', missionType: 'test', subscriptionCount: '100' })
      ).rejects.toThrow();
    });

    it('accepts all valid scenarios', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_LZ_REF) as never
      );
      // Mock fetch for GitHub API directory call
      global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [], text: async () => '' });
      const scenarios = ['greenfield-government', 'brownfield-migration', 'sovereign-landing-zone', 'mission-landing-zone'];
      for (const scenario of scenarios) {
        await expect(
          handleLandingZoneReference({ scenario, impactLevel: 'il4', csp: 'azure-gcc-high', missionType: 'test', subscriptionCount: '4-10' })
        ).resolves.toBeTruthy();
      }
    });
  });

  describe('output', () => {
    beforeEach(() => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_LZ_REF) as never
      );
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ name: 'managementGroupTemplates' }, { name: 'subscriptionTemplates' }],
        text: async () => '',
      });
    });

    it('returns landing zone architecture with Management Group hierarchy', async () => {
      const result = await handleLandingZoneReference({
        scenario: 'mission-landing-zone',
        impactLevel: 'il4',
        csp: 'azure-gcc-high',
        missionType: 'Navy legal case management',
        subscriptionCount: '4-10',
      });
      expect(result).toContain('Management Group');
    });

    it('appends ESLZ attribution when grounding content available', async () => {
      const result = await handleLandingZoneReference({
        scenario: 'mission-landing-zone',
        impactLevel: 'il4',
        csp: 'azure-gcc-high',
        missionType: 'Navy legal case management',
        subscriptionCount: '4-10',
      });
      expect(result).toContain('Enterprise-Scale');
    });

    it('injects ESLZ grounding context into Claude prompt', async () => {
      await handleLandingZoneReference({
        scenario: 'mission-landing-zone',
        impactLevel: 'il4',
        csp: 'azure-gcc-high',
        missionType: 'test workload',
        subscriptionCount: '1-3',
      });
      const call = vi.mocked(anthropic.messages.create).mock.calls[0][0] as { messages: Array<{ content: string }> };
      expect(call.messages[0].content).toContain('Enterprise Scale');
    });
  });
});
