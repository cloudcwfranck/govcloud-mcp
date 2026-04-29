import { logger } from './logger.js';

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

const MIN_LENGTHS: Record<string, number> = {
  control_lookup: 400,
  control_narrative: 600,
  landing_zone_design: 800,
  ssp_section: 500,
  contingency_plan: 600,
  bicep_analyze: 300,
  bicep_remediate: 300,
  bigbang_validate: 300,
  bigbang_harden: 500,
  pipeline_audit: 400,
  ato_readiness: 400,
  oscal_fragment: 200,
  poam_generate: 200,
  ironbank_lookup: 200,
  addon_configurator: 300,
  gcc_high_guidance: 300,
  private_endpoint_map: 300,
  azure_service_selector: 200,
  signing_config: 300,
  devsecops_scorecard: 300,
  govcloud_quickstart: 200,
};

const GENERIC_PHRASES = [
  'it is important to note',
  'you should consider',
  'there are many ways',
  'it depends on your specific',
  'please consult a professional',
  'i cannot provide specific',
  'as an ai language model',
  "i don't have access to",
  'i am unable to provide',
  'i do not have the ability',
];

export function validateResponseQuality(response: string, tool: string): ValidationResult {
  const issues: string[] = [];

  const minLength = MIN_LENGTHS[tool] ?? 100;
  if (response.length < minLength) {
    issues.push(`Response too short (${response.length} chars, min ${minLength})`);
  }

  const lc = response.toLowerCase();
  for (const phrase of GENERIC_PHRASES) {
    if (lc.includes(phrase)) {
      issues.push(`Generic phrase detected: "${phrase}"`);
    }
  }

  if (tool === 'control_narrative') {
    const lines = response.split('\n');
    const bulletLines = lines.filter((l) => l.trim().match(/^[-*•]/));
    const bulletRatio = lines.length > 0 ? bulletLines.length / lines.length : 0;
    if (bulletRatio > 0.3) {
      issues.push('Too many bullet points for eMASS narrative (must be prose)');
    }
  }

  if (tool === 'bicep_analyze' || tool === 'bicep_remediate') {
    if (!response.match(/[A-Z]{2}-\d{1,2}/)) {
      issues.push('No NIST control IDs found in compliance analysis');
    }
  }

  if (tool === 'oscal_fragment') {
    const trimmed = response.trim();
    const hasJson = trimmed.startsWith('{') || trimmed.startsWith('[');
    const hasXml = trimmed.startsWith('<');
    const hasJsonBlock = response.includes('```json');
    const hasXmlBlock = response.includes('```xml');
    if (!hasJson && !hasXml && !hasJsonBlock && !hasXmlBlock) {
      issues.push('OSCAL output must be JSON or XML');
    }
  }

  return { valid: issues.length === 0, issues };
}

export async function validateAndRetry(
  tool: string,
  callFn: () => Promise<string>,
  retryPromptSuffix: string = 'Provide more technical depth, specificity, and concrete examples. Your response was too brief or too generic.'
): Promise<string> {
  const result = await callFn();

  const { valid, issues } = validateResponseQuality(result, tool);
  if (valid) return result;

  logger.warn(tool, 'Quality validation failed on first attempt — retrying', { issues });

  // One retry with explicit depth instruction
  const retryResult = await callFn();
  const retryValidation = validateResponseQuality(retryResult, tool);

  if (!retryValidation.valid) {
    logger.warn(tool, 'Quality validation failed after retry — returning with warning', {
      issues: retryValidation.issues,
    });
    return `<!-- Quality warning: ${retryValidation.issues.join('; ')} -->\n\n${retryResult}`;
  }

  return retryResult;
}

