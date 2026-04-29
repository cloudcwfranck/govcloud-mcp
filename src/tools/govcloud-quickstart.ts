import { z } from 'zod';
import { allTools } from './index.js';
import { runTool } from '../utils/tool-runner.js';

export const govcloudQuickstartTool = {
  name: 'govcloud_quickstart',
  description:
    "Confirm the GovCloud MCP server is running correctly and get the top example prompts for every tool category — the ideal first call after installation.",
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

const Schema = z.object({});

export async function handleGovcloudQuickstart(args: unknown): Promise<string> {
  return runTool('govcloud_quickstart', args, Schema, async () => {
    const toolCount = allTools.length;

    return `# GovCloud MCP — Ready ✓

Server is running correctly with **${toolCount} tools** loaded.

---

## Top 5 Prompts to Try Right Now

### 1. Bicep compliance analysis
\`\`\`
Analyze this Bicep template for FedRAMP High compliance and give me NIST control coverage:
[paste your .bicep file]
\`\`\`

### 2. eMASS control narrative
\`\`\`
Write an eMASS-ready control narrative for IA-2(12) for our AKS system
in Azure GCC High with Entra ID CAC/PIV authentication.
\`\`\`

### 3. Big Bang IL4 validation
\`\`\`
Validate this Big Bang values.yaml for IL4 compliance and flag any
non-Iron Bank images or missing security configurations:
[paste values.yaml]
\`\`\`

### 4. GCC High gotchas
\`\`\`
What are the undocumented limitations and production gotchas for
AKS in Azure GCC High that every engineer needs to know?
\`\`\`

### 5. ATO readiness score
\`\`\`
Score the ATO readiness for a system using AKS, Key Vault,
Azure SQL, and Log Analytics at IL4. Current controls: RBAC on all resources,
private endpoints deployed, Defender for Cloud enabled, audit logs flowing.
\`\`\`

---

## Tool Categories

| Category | Tools | Use When |
|----------|-------|----------|
| **Compliance** | 7 tools | Bicep analysis, NIST lookups, POA&M, ATO scoring, OSCAL |
| **Architecture** | 4 tools | Landing zones, service selection, GCC High, private endpoints |
| **Platform One** | 4 tools | Big Bang, Iron Bank images, addon configuration |
| **Pipeline** | 3 tools | CI/CD audit, artifact signing, DevSecOps maturity |
| **Documents** | 2 tools | SSP sections, Contingency Plans |

---

## All Available Tools

${allTools
  .map((t) => `- **\`${t.name}\`** — ${t.description.substring(0, 100)}${t.description.length > 100 ? '…' : ''}`)
  .join('\n')}

---

## Full Documentation
https://cloudcraftwithfranck.org/mcp

## Source
https://github.com/cloudcwfranck/govcloud-mcp`;
  });
}
