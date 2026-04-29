import { describe, it, expect, vi, beforeEach } from 'vitest';
import { allTools } from '../../src/tools/index.js';
import { handleToolCall } from '../../src/tools/index.js';

// Mock Anthropic to prevent real API calls
vi.mock('../../src/client.js', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Mock response for integration test with sufficient length to pass quality validation minimum thresholds set in response-validator.' }],
        usage: { input_tokens: 50, output_tokens: 100 },
      }),
    },
  },
  MODEL: 'claude-sonnet-4-6',
  SITE_API_BASE: 'https://www.cloudcraftwithfranck.org',
  BASE_SYSTEM_PROMPT: 'Test system prompt',
  callSiteApi: vi.fn().mockRejectedValue(new Error('Site API not available in tests')),
}));

describe('MCP server — tool call routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('govcloud_quickstart resolves without API call', async () => {
    const result = await handleToolCall('govcloud_quickstart', {});
    expect(result).toContain('GovCloud MCP');
    expect(result).toContain('tools');
  });

  it('handleToolCall routes to correct handler', async () => {
    const result = await handleToolCall('gcc_high_guidance', { service: 'AKS' });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('handleToolCall throws on unknown tool name', async () => {
    await expect(handleToolCall('does_not_exist', {})).rejects.toThrow(/unknown tool/i);
  });

  it('handleToolCall rejects invalid args with user-friendly error', async () => {
    await expect(handleToolCall('control_lookup', {})).rejects.toThrow();
  });

  it('handles all testable tools without crashing on valid minimal inputs', async () => {
    // bicep_analyze and bicep_remediate require the site API — skip in unit integration tests
    const minimalValidArgs: Record<string, unknown> = {
      control_lookup: { controlId: 'AC-2' },
      control_narrative: { controlId: 'AC-2', systemName: 'Test', systemDescription: 'Test system', azureServices: ['AKS'], cspLevel: 'azure-gcc-high', impactLevel: 'il4' },
      poam_generate: { gaps: 'Missing MFA', systemName: 'Test', systemOwner: 'Owner', impactLevel: 'il4' },
      ato_readiness: { systemDescription: 'Mission critical system on AKS', azureServices: ['AKS'], targetAuthorization: 'fedramp-high', currentMaturity: 'initial' },
      oscal_fragment: { resourceDescription: 'Azure Key Vault for secrets management', controlIds: ['AC-2'], impactLevel: 'il4' },
      landing_zone_design: { missionType: 'legal-services', dataClassification: 'cui', userBase: 'conus', targetImpactLevel: 'il4', cssp: 'azure-gcc-high' },
      azure_service_selector: { requirement: 'managed kubernetes', impactLevel: 'il4' },
      gcc_high_guidance: { service: 'AKS' },
      private_endpoint_map: { services: ['Key Vault'], impactLevel: 'il4' },
      bigbang_validate: { valuesYaml: 'domain: test.dev\n', targetLevel: 'il4' },
      bigbang_harden: { targetLevel: 'il4' },
      ironbank_lookup: { imageName: 'nginx' },
      addon_configurator: { addon: 'monitoring', targetLevel: 'il4' },
      pipeline_audit: { pipelineYaml: 'stages:\n  - build', pipelineType: 'gitlab-ci' },
      signing_config: { signingMethod: 'cosign-keyless', pipelineType: 'github-actions' },
      devsecops_scorecard: { programName: 'Test', currentCapabilities: ['gitlab-ci'], targetLevel: 'il4' },
      ssp_section: { section: 'system-description', systemName: 'Test', systemDescription: 'Test system', azureServices: ['AKS'], impactLevel: 'il4' },
      contingency_plan: { systemName: 'Test', systemDescription: 'Test system', azureServices: ['AKS'], impactLevel: 'il4' },
      govcloud_quickstart: {},
    };

    for (const tool of allTools) {
      const args = minimalValidArgs[tool.name];
      if (!args) continue;
      await expect(
        handleToolCall(tool.name, args),
        `${tool.name} should not throw on valid minimal input`
      ).resolves.toBeTruthy();
    }
  });
});
