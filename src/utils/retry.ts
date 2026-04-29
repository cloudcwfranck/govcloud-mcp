export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    toolName?: string;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 2000, toolName = 'unknown' } = options;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = error instanceof Error && (
        error.message.includes('529') ||
        error.message.includes('overloaded') ||
        error.message.includes('rate limit') ||
        error.message.includes('timeout')
      );
      if (!isRetryable || attempt === maxAttempts) throw error;
      console.error(JSON.stringify({
        level: 'WARN',
        tool: toolName,
        message: `Attempt ${attempt} failed, retrying in ${delayMs * attempt}ms`,
        error: (error as Error).message,
      }));
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw new Error('Max retry attempts exceeded');
}
