import { logger } from './logger.js';

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+)?(?:previous\s+)?instructions/gi,
  /forget\s+(?:your\s+)?(?:all\s+)?(?:previous\s+)?instructions/gi,
  /system\s+prompt/gi,
  /jailbreak/gi,
  /you\s+are\s+now\s+/gi,
  /pretend\s+(?:you\s+are|to\s+be)/gi,
  /act\s+as\s+(?:if\s+you\s+are|a\s+)/gi,
  /disregard\s+(?:all\s+)?(?:previous\s+)?/gi,
  /override\s+(?:previous\s+)?(?:your\s+)?/gi,
];

export function sanitizeInput(input: string): string {
  let sanitized = input;
  let wasModified = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, '[REMOVED]');
      wasModified = true;
    }
  }

  if (wasModified) {
    logger.warn('sanitize', 'Potential prompt injection detected and sanitized');
  }

  return sanitized;
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'string' ? sanitizeInput(value) : value;
  }
  return result as T;
}
