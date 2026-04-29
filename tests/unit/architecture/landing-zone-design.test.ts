import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/client.js', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODEL: 'claude-sonnet-4-6',
  BASE_SYSTEM_PROMPT: 'test',
}));

import { handleLandingZone } from '../../../src/tools/architecture/landing-zone-design.js';
import { buildMockAnthropicResponse } from '../../fixtures/mock-helpers.js';
import { anthropic } from '../../../src/client.js';

const MOCK_LZ = `
## IL4 Landing Zone Design — Web Application

### Management Group Hierarchy
- Root MG
  - GovernmentWorkloads
    - IL4-Production
    - IL4-NonProd

### Hub-Spoke Network Design
- Hub VNet: 10.0.0.0/16
  - GatewaySubnet: 10.0.0.0/27
  - AzureFirewallSubnet: 10.0.1.0/26
- Spoke VNet: 10.1.0.0/16

### Azure Firewall Premium
ExpressRoute Gateway required for GCC High connectivity.

### CIDR Ranges
10.0.0.0/16 Hub network
10.1.0.0/16 Workload spoke
`;

describe('landing_zone_design', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('schema validation', () => {
    it('rejects missing missionType', async () => {
      await expect(
        handleLandingZone({ dataClassification: 'cui', userBase: 'conus', targetImpactLevel: 'il4', cssp: 'azure-gcc-high' })
      ).rejects.toThrow();
    });

    it('rejects missing targetImpactLevel', async () => {
      await expect(
        handleLandingZone({ missionType: 'legal-services', dataClassification: 'cui', userBase: 'conus', cssp: 'azure-gcc-high' })
      ).rejects.toThrow();
    });

    it('rejects invalid targetImpactLevel', async () => {
      await expect(
        handleLandingZone({ missionType: 'legal-services', dataClassification: 'cui', userBase: 'conus', targetImpactLevel: 'top-secret', cssp: 'azure-gcc-high' })
      ).rejects.toThrow();
    });

    it('rejects invalid cssp', async () => {
      await expect(
        handleLandingZone({ missionType: 'legal-services', dataClassification: 'cui', userBase: 'conus', targetImpactLevel: 'il4', cssp: 'aws' })
      ).rejects.toThrow();
    });
  });

  describe('output', () => {
    it('returns landing zone design', async () => {
      vi.mocked(anthropic.messages.create).mockResolvedValue(
        buildMockAnthropicResponse(MOCK_LZ) as never
      );
      const result = await handleLandingZone({
        missionType: 'legal-services',
        dataClassification: 'cui',
        userBase: 'conus',
        targetImpactLevel: 'il4',
        cssp: 'azure-gcc-high',
      });
      expect(result).toContain('Hub');
    });
  });
});
