import { z } from 'zod';
import { logger } from './logger.js';
import { sanitizeInput } from './sanitize.js';
import { validateResponseQuality } from './response-validator.js';
import { formatErrorForMCP, TimeoutError } from './errors.js';

// Per-tool token budgets
export const TOKEN_BUDGETS: Record<string, number> = {
  control_narrative: 8192,
  ssp_section: 8192,
  contingency_plan: 8192,
  bigbang_harden: 8192,
  bicep_remediate: 8192,
  landing_zone_design: 6144,
  pipeline_audit: 6144,
  ato_readiness: 4096,
  control_lookup: 4096,
  poam_generate: 4096,
  oscal_fragment: 4096,
  addon_configurator: 4096,
  private_endpoint_map: 4096,
  devsecops_scorecard: 3072,
  bigbang_validate: 3072,
  gcc_high_guidance: 2048,
  signing_config: 2048,
  azure_service_selector: 2048,
  ironbank_lookup: 1024,
  govcloud_quickstart: 1024,
  bicep_analyze: 4096,
};

// Per-tool timeouts (ms)
export const TOOL_TIMEOUTS: Record<string, number> = {
  ironbank_lookup: 15000,
  azure_service_selector: 15000,
  govcloud_quickstart: 15000,
  gcc_high_guidance: 20000,
  signing_config: 20000,
  control_lookup: 30000,
  bicep_analyze: 30000,
  bigbang_validate: 30000,
  pipeline_audit: 30000,
  devsecops_scorecard: 30000,
  ato_readiness: 30000,
  poam_generate: 30000,
  private_endpoint_map: 30000,
  addon_configurator: 45000,
  oscal_fragment: 45000,
  control_narrative: 60000,
  ssp_section: 60000,
  contingency_plan: 60000,
  bigbang_harden: 60000,
  bicep_remediate: 60000,
  landing_zone_design: 60000,
};

function getTimeout(tool: string): number {
  return TOOL_TIMEOUTS[tool] ?? 30000;
}

export function getTokenBudget(tool: string): number {
  return TOKEN_BUDGETS[tool] ?? 4096;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, toolName: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(toolName, timeoutMs)), timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function runTool<T>(
  toolName: string,
  args: unknown,
  schema: z.ZodSchema<T>,
  fn: (validated: T) => Promise<string>
): Promise<string> {
  const start = Date.now();
  logger.info(toolName, 'Tool invoked');

  try {
    const validated = schema.parse(args);

    // Sanitize all string fields in the validated input
    const sanitized = sanitizeValidated(validated);

    const result = await withTimeout(fn(sanitized), getTimeout(toolName), toolName);

    if (!result || result.trim().length === 0) {
      throw new Error('Empty response from AI');
    }

    const { valid, issues } = validateResponseQuality(result, toolName);
    if (!valid) {
      logger.warn(toolName, 'Response quality issues', { issues });
    }

    logger.perf(toolName, Date.now() - start);
    return result;
  } catch (error) {
    logger.error(toolName, 'Tool execution failed', error);
    // Re-throw with user-friendly message for MCP error handling
    const userMessage = formatErrorForMCP(error, toolName);
    throw new Error(userMessage);
  }
}

function sanitizeValidated<T>(validated: T): T {
  if (!validated || typeof validated !== 'object') return validated;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(validated as Record<string, unknown>)) {
    if (typeof value === 'string') {
      result[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => (typeof item === 'string' ? sanitizeInput(item) : item));
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
