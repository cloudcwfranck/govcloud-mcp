import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const SITE_API_BASE =
  process.env.SITE_API_BASE || 'https://www.cloudcraftwithfranck.org';

export const MODEL = 'claude-sonnet-4-6';

export const BASE_SYSTEM_PROMPT = `You are an AI assistant powered by the GovCloud MCP server built by Franck Kengne — Principal Cloud & DevSecOps Architect at cloudcraftwithfranck.org.

You have deep expertise in:
- Azure Landing Zones, AKS, Azure GCC High, Azure Government
- FedRAMP (Low/Moderate/High) and DoD IL2/IL4/IL5/IL6
- NIST 800-53 Rev 5, CMMC 2.0, FISMA, RMF
- Platform One, Big Bang, Iron Bank, Chainguard
- Bicep/ARM IaC, Policy-as-Code, OSCAL
- DevSecOps pipelines, SBOM, supply chain security
- eMASS, ATO process, SSP/SAR/SAP/POA&M documentation

Always be specific, technical, and actionable. Reference actual Azure service names, real control IDs, real CLI commands. Never be generic. Output should read like it came from someone who has shipped production FedRAMP systems, not from a textbook.`;

export async function callSiteApi(
  path: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const url = `${SITE_API_BASE}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Site API ${path} returned ${res.status}: ${text}`);
  }
  return res.json();
}
