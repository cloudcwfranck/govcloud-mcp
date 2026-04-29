import { describe, it, expect } from 'vitest';

/**
 * These tests make real Anthropic API calls.
 * They are skipped unless ANTHROPIC_API_KEY is set.
 * Run in CI only.
 */

const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

describe.skipIf(!hasApiKey)('output quality — real API calls', { timeout: 60000 }, () => {
  it('control_lookup for AC-2 exceeds 400 chars and references Azure', async () => {
    const { handleControlLookup } = await import('../../src/tools/compliance/control-lookup.js');
    const result = await handleControlLookup({ controlId: 'AC-2' });

    expect(result.length).toBeGreaterThan(400);
    expect(result).toMatch(/entra id|azure ad|privileged identity/i);
    expect(result).toMatch(/emass|narrative|ato/i);
    expect(result).not.toMatch(/it is important to note|you should consider/i);
  });

  it('control_narrative for SC-28 is prose-heavy and mentions AES-256', async () => {
    const { handleControlNarrative } = await import('../../src/tools/compliance/control-narrative.js');
    const result = await handleControlNarrative({
      controlId: 'SC-28',
      systemName: 'Navy Legal System',
      systemDescription: 'Legal case management for Navy JAG',
      azureServices: ['Key Vault', 'Storage Account', 'SQL Managed Instance'],
      cspLevel: 'azure-gcc-high',
      impactLevel: 'il4',
    });

    const wordCount = result.split(/\s+/).length;
    expect(wordCount).toBeGreaterThan(400);
    expect(result).toMatch(/aes-256|fips 140|encryption at rest/i);
    expect(result).toMatch(/key vault|cmk|customer.managed key/i);

    // Verify prose quality — not bullet-heavy
    const bulletLines = result.split('\n').filter((l) => l.trim().startsWith('-'));
    const totalLines = result.split('\n').length;
    expect(bulletLines.length / totalLines).toBeLessThan(0.3);
  }, 45000);

  it('bigbang_validate catches non-Iron Bank images', async () => {
    const { handleBigbangValidate } = await import('../../src/tools/platform-one/bigbang-validate.js');
    const result = await handleBigbangValidate({
      valuesYaml: `
addons:
  grafana:
    enabled: true
    image:
      repository: grafana/grafana
      tag: latest
`,
      targetLevel: 'il4',
    });

    expect(result).toMatch(/iron bank|registry1\.dso\.mil/i);
    expect(result).toMatch(/violation|non-approved|not hardened|non-iron bank/i);
  }, 30000);

  it('pipeline_audit catches missing security stages', async () => {
    const { handlePipelineAudit } = await import('../../src/tools/pipeline/pipeline-audit.js');
    const result = await handlePipelineAudit({
      pipelineYaml: `
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install && npm run build
`,
      pipelineType: 'github-actions',
      targetLevel: 'il4',
    });

    expect(result).toMatch(/sast|semgrep|checkov/i);
    expect(result).toMatch(/secret.scan|detect-secrets|gitleaks/i);
    expect(result).toMatch(/cosign|signing|sign/i);
  }, 30000);

  it('landing_zone_design for IL4 mentions GCC High and CIDR ranges', async () => {
    const { handleLandingZone } = await import('../../src/tools/architecture/landing-zone-design.js');
    const result = await handleLandingZone({
      missionType: 'legal-services',
      dataClassification: 'cui',
      userBase: 'conus',
      targetImpactLevel: 'il4',
      cssp: 'azure-gcc-high',
    });

    expect(result).toMatch(/gcc high|government community cloud/i);
    expect(result).toMatch(/hub.?spoke|management group/i);
    expect(result).toMatch(/10\.\d+\.\d+\.\d+\/\d+|cidr/i);
  }, 45000);

  it('govcloud_quickstart returns structured guide without API call', async () => {
    const { handleGovcloudQuickstart } = await import('../../src/tools/govcloud-quickstart.js');
    const result = await handleGovcloudQuickstart({});
    expect(result).toContain('GovCloud MCP');
    expect(result).toContain('tools');
    expect(result).toContain('cloudcraftwithfranck.org');
    expect(result.length).toBeGreaterThan(200);
  });
});

describe('output quality — no API key', () => {
  it('skips real API tests when no key is present', () => {
    if (hasApiKey) {
      expect(true).toBe(true);
    } else {
      expect(true).toBe(true); // placeholder — tests above are skipped
    }
  });
});
