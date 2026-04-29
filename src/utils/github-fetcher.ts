import { logger } from './logger.js';

const ESLZ_BASE = 'https://raw.githubusercontent.com/Azure/Enterprise-Scale/main';

interface CacheEntry {
  content: string;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function clearEslzCache(): void {
  cache.clear();
}

export async function fetchEslzContent(path: string): Promise<string> {
  const cached = cache.get(path);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    logger.info('eslz', `Cache hit: ${path}`);
    return cached.content;
  }

  const url = `${ESLZ_BASE}/${path}`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/plain',
        'User-Agent': 'govcloud-mcp/1.0.0',
      },
    });

    if (!response.ok) {
      logger.warn('eslz', `Failed to fetch ${path}`, { status: response.status });
      return '';
    }

    const content = await response.text();
    cache.set(path, { content, fetchedAt: Date.now() });
    logger.info('eslz', `Fetched and cached: ${path}`, { bytes: content.length });
    return content;
  } catch (err) {
    logger.warn('eslz', `Network error fetching ${path}`, { error: String(err) });
    return '';
  }
}

export async function fetchEslzJson(path: string): Promise<object | null> {
  const content = await fetchEslzContent(path);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    logger.warn('eslz', `Failed to parse JSON from ${path}`);
    return null;
  }
}

export async function fetchEslzBatch(paths: string[]): Promise<Map<string, string>> {
  const results = await Promise.allSettled(
    paths.map(async (path) => ({ path, content: await fetchEslzContent(path) }))
  );

  const map = new Map<string, string>();
  for (const result of results) {
    if (result.status === 'fulfilled') {
      map.set(result.value.path, result.value.content);
    }
  }
  return map;
}

// Extract up to 10 policy display names + descriptions from an ESLZ ARM policy definition file.
// Handles both the legacy resources[] format and the modern $fxv#N variables format.
export function extractRelevantPolicies(
  policyJson: string,
  controlFamily: string,
  services: string[]
): string {
  if (!policyJson) return '';
  try {
    const parsed = JSON.parse(policyJson);
    const serviceTerms = services.map((s) => s.toLowerCase());
    const familyLower = controlFamily.toLowerCase();

    // Build a flat list of { name, displayName, description } from whatever structure is present
    const allPolicies: Array<{ name: string; displayName: string; description: string }> = [];

    // Modern ESLZ format: variables.$fxv#N contain individual policy JSON strings
    const variables: Record<string, unknown> = parsed?.variables ?? {};
    for (const [key, val] of Object.entries(variables)) {
      if (!key.startsWith('$fxv#') || typeof val !== 'string') continue;
      try {
        const p = JSON.parse(val);
        const props = (p?.properties ?? {}) as Record<string, string>;
        allPolicies.push({
          name: (p?.name as string) ?? '',
          displayName: props.displayName ?? '',
          description: props.description ?? '',
        });
      } catch {
        // Skip unparseable entries
      }
    }

    // Legacy format: resources array
    if (allPolicies.length === 0) {
      const resources: Array<Record<string, unknown>> = parsed?.resources ?? [];
      for (const r of resources) {
        const props = (r.properties ?? {}) as Record<string, string>;
        allPolicies.push({
          name: (r.name as string) ?? '',
          displayName: props.displayName ?? '',
          description: props.description ?? '',
        });
      }
    }

    const relevant = allPolicies
      .filter(({ name, displayName, description }) => {
        const n = name.toLowerCase();
        const d = displayName.toLowerCase();
        const desc = description.toLowerCase();
        return (
          n.includes(familyLower) || d.includes(familyLower) || desc.includes(familyLower) ||
          serviceTerms.some((s) => n.includes(s) || d.includes(s) || desc.includes(s))
        );
      })
      .slice(0, 10)
      .map(({ displayName, name, description }) =>
        `- **${displayName || name}**: ${description || '(no description)'}`
      )
      .join('\n');

    return relevant || 'No specific policies found for these services.';
  } catch {
    return '';
  }
}

// Pull the section from the architecture doc most relevant to a control family.
// Returns up to 2000 chars of relevant content.
export function extractRelevantArchGuidance(archDoc: string, controlFamily: string): string {
  if (!archDoc) return '';
  const familyKeywords: Record<string, string[]> = {
    AC: ['identity', 'access', 'rbac', 'entra', 'conditional access', 'pim'],
    SC: ['encryption', 'network', 'tls', 'key vault', 'private endpoint', 'firewall'],
    AU: ['logging', 'monitoring', 'diagnostic', 'log analytics', 'sentinel'],
    IA: ['identity', 'authentication', 'mfa', 'cac', 'piv', 'entra'],
    SI: ['defender', 'vulnerability', 'threat', 'security center', 'patch'],
    CM: ['policy', 'configuration', 'azure policy', 'blueprint', 'management'],
    CP: ['backup', 'recovery', 'availability', 'geo-redundant', 'rpo', 'rto'],
    IR: ['incident', 'alert', 'sentinel', 'monitoring', 'response'],
    SA: ['architecture', 'design', 'landing zone', 'management group'],
    RA: ['assessment', 'scanning', 'defender', 'vulnerability'],
  };

  const terms = familyKeywords[controlFamily] ?? [controlFamily.toLowerCase()];
  const lines = archDoc.split('\n');
  const relevant: string[] = [];
  let capturing = false;
  let capturedChars = 0;
  const MAX_CHARS = 2000;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (terms.some((t) => lower.includes(t))) {
      capturing = true;
    }
    if (capturing) {
      relevant.push(line);
      capturedChars += line.length;
      if (capturedChars >= MAX_CHARS) break;
    }
  }

  return relevant.join('\n').trim();
}

export const ESLZ_ATTRIBUTION = `\n\n---\n*Architecture guidance grounded in the official Microsoft [Azure/Enterprise-Scale](https://github.com/Azure/Enterprise-Scale) reference implementation — ${new Date().toISOString().split('T')[0]}*`;
