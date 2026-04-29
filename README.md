# @cloudcraftwithfranck/govcloud-mcp

An MCP (Model Context Protocol) server providing 20 AI-powered tools for DoD/FedRAMP cloud engineering. Built for Claude Desktop, Cursor, VS Code, and any MCP-compatible AI client.

## What It Does

Stop googling NIST controls and Iron Bank image paths. This server puts government cloud engineering knowledge directly into your AI assistant — compliance analysis, architecture design, Platform One Big Bang configuration, DevSecOps pipelines, and ATO documentation.

## Quick Start

### Prerequisites

- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com))

### Install

```bash
npm install -g @cloudcraftwithfranck/govcloud-mcp
```

Or run without installing:

```bash
npx @cloudcraftwithfranck/govcloud-mcp
```

### Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "govcloud": {
      "command": "npx",
      "args": ["-y", "@cloudcraftwithfranck/govcloud-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-your-key-here"
      }
    }
  }
}
```

### Configure Cursor / VS Code

Add to your MCP settings:

```json
{
  "govcloud": {
    "command": "npx",
    "args": ["-y", "@cloudcraftwithfranck/govcloud-mcp"],
    "env": {
      "ANTHROPIC_API_KEY": "sk-ant-your-key-here"
    }
  }
}
```

---

## Tools Reference

### Compliance (7 tools)

| Tool | Description |
|------|-------------|
| `bicep_analyze` | Analyze Bicep templates for FedRAMP/IL compliance — compliance score, control gaps, security findings |
| `bicep_remediate` | Auto-remediate Bicep compliance violations — returns fixed template with annotations |
| `control_lookup` | Full NIST 800-53 Rev 5 control details with FedRAMP baselines, Azure inheritance, eMASS starters |
| `control_narrative` | Generate eMASS-ready third-person control implementation narratives (400-800 words) |
| `poam_generate` | Build POA&M entries from compliance gaps — eMASS-formatted with milestones and severity |
| `ato_readiness` | Score ATO readiness 0-100 with 30/60/90 day remediation roadmap |
| `oscal_fragment` | Generate OSCAL 1.1.2 JSON/XML SSP fragments for eMASS machine-readable import |

### Architecture (4 tools)

| Tool | Description |
|------|-------------|
| `landing_zone_design` | Design complete Azure government landing zones with Hub-Spoke topology, Bicep, and compliance mapping |
| `azure_service_selector` | Select the right Azure service for government workloads with GCC High availability confirmation |
| `gcc_high_guidance` | GCC High-specific configuration requirements, undocumented limitations, and production workarounds |
| `private_endpoint_map` | Generate complete private endpoint architecture with Bicep and private DNS zone configuration |

### Platform One (4 tools)

| Tool | Description |
|------|-------------|
| `bigbang_validate` | Validate Big Bang values.yaml against DoD IL requirements — scored with violations and hardened output |
| `bigbang_harden` | Generate fully hardened Big Bang values.yaml with Iron Bank digest-pinned images |
| `ironbank_lookup` | Look up Iron Bank hardened images — registry path, digest, Cosign verification, pull secret config |
| `addon_configurator` | Generate production-ready Big Bang addon configuration for any Platform One addon |

### Pipeline (3 tools)

| Tool | Description |
|------|-------------|
| `pipeline_audit` | Audit CI/CD pipelines for DoD DevSecOps compliance — scored with violations and hardened YAML |
| `signing_config` | Configure artifact signing with Cosign/Sigstore/DoD PKI plus Kubernetes admission enforcement |
| `devsecops_scorecard` | DoD DevSecOps maturity scorecard against the Reference Design with prioritized improvement roadmap |

### Documents (2 tools)

| Tool | Description |
|------|-------------|
| `ssp_section` | Generate eMASS-ready SSP sections (system description, boundary, user types, interconnections, etc.) |
| `contingency_plan` | Generate NIST 800-34 compliant Contingency Plans with Azure-specific recovery procedures |

---

## Example Prompts

**Compliance:**
> "Analyze this Bicep template for FedRAMP High compliance" *(paste template)*

> "Write an eMASS control narrative for IA-2(12) for our AKS-based system in Azure Government"

> "Generate a POA&M for these compliance findings: missing MFA enforcement, no audit logging on Key Vault, public storage endpoint"

**Architecture:**
> "Design an IL4 landing zone for a containerized mission app with AKS, Key Vault, and Azure SQL"

> "What's different about configuring AKS in GCC High vs Azure Government?"

> "Generate private endpoint configuration for Key Vault, Storage, and ACR at FedRAMP High"

**Platform One:**
> "Validate this Big Bang values.yaml for IL4 compliance" *(paste values)*

> "Look up the Iron Bank image for nginx and give me the Cosign verification command"

> "Generate hardened Big Bang addon config for Keycloak at IL4"

**Pipeline:**
> "Audit this GitLab CI pipeline for IL4 DevSecOps compliance" *(paste .gitlab-ci.yml)*

> "Configure Cosign keyless signing for our GitHub Actions pipeline targeting registry1.dso.mil"

**Documents:**
> "Write the system description section of our SSP for a FedRAMP High AKS system"

> "Generate a Contingency Plan for our system with RTO 4 hours, RPO 1 hour, using AKS, Key Vault, and Azure SQL"

---

## Resources

The server also exposes these resources via the `govcloud://` URI scheme:

- `govcloud://nist-800-53-rev5` — NIST 800-53 Rev 5 control catalog
- `govcloud://azure-compliance-map` — Azure service → NIST control mapping with IL availability
- `govcloud://ironbank-registry` — Iron Bank image catalog with registry paths
- `govcloud://fedramp-baselines` — FedRAMP Low/Moderate/High and DoD IL control lists

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key |
| `SITE_API_BASE` | No | `https://www.cloudcraftwithfranck.org` | Override site API base URL |

---

## Development

```bash
git clone https://github.com/cloudcwfranck/govcloud-mcp
cd govcloud-mcp
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm run build
npm start
```

---

## License

MIT — see [LICENSE](LICENSE)

---

Built by [CloudCraft with Franck](https://cloudcraftwithfranck.org) — Azure government cloud engineering for the DoD community.
