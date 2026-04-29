export function bicepAnalysisTemplate(bicepCode: string, targetLevel: string): string {
  return `Analyze the following Azure Bicep code for ${targetLevel} compliance.

Return a structured analysis covering:
1. Controls addressed (with coverage level: full/partial)
2. Critical gaps blocking ${targetLevel} authorization
3. Security findings with severity ratings
4. Overall compliance score (0-100)
5. FedRAMP readiness tier and IL4 readiness

Format as markdown with tables. Be specific — cite exact control IDs and Azure service configurations.

\`\`\`bicep
${bicepCode}
\`\`\``;
}

export function controlNarrativeTemplate(
  controlId: string,
  systemName: string,
  systemDescription: string,
  azureServices: string[],
  cspLevel: string,
  impactLevel: string,
  orgName?: string
): string {
  return `Generate an eMASS-ready control implementation narrative for control ${controlId}.

System: ${systemName}
Description: ${systemDescription}
Azure Services in Scope: ${azureServices.join(', ')}
Cloud Service Provider Level: ${cspLevel}
Impact Level: ${impactLevel}
Organization: ${orgName || 'The Organization'}

Requirements:
- Third-person prose ("The system...", "The organization...")
- Reference specific Azure services by exact name
- Address all enhancements required at ${impactLevel}
- Include specific configuration details
- 400-800 words
- End with "Methods of Testing" section
- No bullet points in main narrative
- AO-review quality`;
}

export function poamTemplate(
  gaps: string,
  systemName: string,
  systemOwner: string,
  completionDays: number,
  impactLevel: string
): string {
  return `Generate eMASS-compatible POA&M entries for the following compliance gaps.

System: ${systemName}
System Owner: ${systemOwner}
Impact Level: ${impactLevel}
Scheduled Completion: ${completionDays} days from today

Gaps/Findings:
${gaps}

For each gap, generate a POA&M entry with these exact columns:
POA&M ID | Control ID | Weakness Name | Weakness Description | Detection Source | Scheduled Completion | Milestones with Completion Dates | Resources Required | Status | Severity

Use realistic, specific weakness descriptions and technical milestones — not generic "implement control" language.
Format as a markdown table.`;
}

export function sspSectionTemplate(
  section: string,
  systemInfo: string,
  azureServices: string[],
  impactLevel: string,
  additionalContext?: string
): string {
  return `Generate SSP section "${section}" for a federal system.

System Information: ${systemInfo}
Azure Services: ${azureServices.join(', ')}
Impact Level: ${impactLevel}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Requirements:
- Match exact FedRAMP SSP template format for this section
- Reference FedRAMP SSP template section numbers
- Include required tables where the template specifies them
- AO-review quality prose
- Specific to Azure ${impactLevel} environment`;
}

export function landingZoneTemplate(params: {
  missionType: string;
  dataClassification: string;
  userBase: string;
  targetImpactLevel: string;
  estimatedUsers?: number;
  connectedToNIPR?: boolean;
  existingEnclaves?: string;
  cssp: string;
}): string {
  return `Design a complete Azure Landing Zone for a government workload with these parameters:

Mission Type: ${params.missionType}
Data Classification: ${params.dataClassification}
User Base: ${params.userBase}
Target Impact Level: ${params.targetImpactLevel}
CSP Level: ${params.cssp}
${params.estimatedUsers ? `Estimated Users: ${params.estimatedUsers}` : ''}
${params.connectedToNIPR !== undefined ? `Connected to NIPR: ${params.connectedToNIPR}` : ''}
${params.existingEnclaves ? `Existing Enclaves: ${params.existingEnclaves}` : ''}

Provide:
1. Management Group hierarchy (with naming convention)
2. Subscription topology
3. Hub-spoke network design (CIDR ranges, subnet layout)
4. Required Azure security services
5. Identity architecture (Entra ID + MFA + PIM)
6. Connectivity model
7. Bicep scaffold structure
8. Estimated monthly cost range
9. ATO path recommendation
10. What is typically missed on ${params.missionType} deployments

Be specific to the mission type — ${params.missionType} has unique requirements.`;
}
