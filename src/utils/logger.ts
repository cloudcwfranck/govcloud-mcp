// All output goes to stderr — stdout is reserved for MCP JSON-RPC protocol

interface LogMeta {
  [key: string]: unknown;
}

function redactSecrets(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj.replace(/sk-ant-[A-Za-z0-9_-]+/g, '[REDACTED]');
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, redactSecrets(v)])
    );
  }
  return obj;
}

export const logger = {
  info(tool: string, message: string, meta?: LogMeta): void {
    const entry: Record<string, unknown> = {
      level: 'INFO', tool, message, timestamp: new Date().toISOString(),
    };
    if (meta) Object.assign(entry, redactSecrets(meta) as LogMeta);
    process.stderr.write(JSON.stringify(entry) + '\n');
  },

  error(tool: string, message: string, error?: unknown): void {
    const entry: Record<string, unknown> = {
      level: 'ERROR', tool, message, timestamp: new Date().toISOString(),
      error: error instanceof Error
        ? { name: error.name, message: error.message }
        : redactSecrets(error),
    };
    process.stderr.write(JSON.stringify(entry) + '\n');
  },

  perf(tool: string, durationMs: number, tokenCount?: number): void {
    process.stderr.write(
      JSON.stringify({ level: 'PERF', tool, durationMs, tokenCount, timestamp: new Date().toISOString() }) + '\n'
    );
  },

  warn(tool: string, message: string, meta?: LogMeta): void {
    const entry: Record<string, unknown> = {
      level: 'WARN', tool, message, timestamp: new Date().toISOString(),
    };
    if (meta) Object.assign(entry, redactSecrets(meta) as LogMeta);
    process.stderr.write(JSON.stringify(entry) + '\n');
  },
};
