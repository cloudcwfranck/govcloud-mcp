export class GovCloudMCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly tool: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'GovCloudMCPError';
  }
}

export class ValidationError extends GovCloudMCPError {
  constructor(message: string, tool: string) {
    super(message, 'VALIDATION_ERROR', tool, false);
    this.name = 'ValidationError';
  }
}

export class AIResponseError extends GovCloudMCPError {
  constructor(tool: string) {
    super(
      'AI response was invalid or empty. Please try again.',
      'AI_RESPONSE_ERROR',
      tool,
      true
    );
    this.name = 'AIResponseError';
  }
}

export class RateLimitError extends GovCloudMCPError {
  constructor(tool: string) {
    super(
      'Anthropic API rate limit reached. Please wait 60 seconds and retry.',
      'RATE_LIMIT',
      tool,
      true
    );
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends GovCloudMCPError {
  constructor(tool: string, timeoutMs: number) {
    super(
      `Tool ${tool} timed out after ${timeoutMs}ms. The request may be too complex — try with fewer services or a smaller input.`,
      'TIMEOUT',
      tool,
      true
    );
    this.name = 'TimeoutError';
  }
}

export class SiteApiError extends GovCloudMCPError {
  constructor(tool: string) {
    super(
      'Site API unreachable. Check SITE_API_BASE environment variable and network connectivity.',
      'SITE_API_ERROR',
      tool,
      true
    );
    this.name = 'SiteApiError';
  }
}

export function formatErrorForMCP(error: unknown, tool: string): string {
  if (error instanceof GovCloudMCPError) {
    const retryHint = error.retryable ? ' (retryable)' : '';
    return `[${error.code}] ${error.message}${retryHint}`;
  }
  if (error instanceof Error) {
    // Anthropic API error shapes
    const msg = error.message;
    if (msg.includes('rate_limit') || msg.includes('429')) {
      return new RateLimitError(tool).message;
    }
    if (msg.includes('overloaded') || msg.includes('529')) {
      return 'Anthropic API is overloaded. Please wait 30 seconds and retry. (retryable)';
    }
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
      return new TimeoutError(tool, 0).message;
    }
    if (msg.includes('JSON') || msg.includes('parse')) {
      return 'AI response malformed. Retrying may help. (retryable)';
    }
    // Never expose raw internal errors — only the message, never the stack
    return `Tool execution failed: ${msg}`;
  }
  return 'An unexpected error occurred. Please try again.';
}
