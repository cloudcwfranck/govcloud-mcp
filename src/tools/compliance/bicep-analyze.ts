import { z } from 'zod';
import { callSiteApi } from '../../client.js';

export const bicepAnalyzeTool = {
  name: 'bicep_analyze',
  description:
    'Analyze Azure Bicep IaC code for NIST 800-53 Rev 5 compliance coverage. Returns controls addressed, gaps, security findings, and overall FedRAMP/IL4 readiness score.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      bicepCode: {
        type: 'string',
        description: 'The Bicep code to analyze',
      },
      targetLevel: {
        type: 'string',
        enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'],
        description: 'Compliance target level (default: fedramp-high)',
      },
    },
    required: ['bicepCode'],
  },
};

const Schema = z.object({
  bicepCode: z.string().min(1),
  targetLevel: z
    .enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5'])
    .default('fedramp-high'),
});

interface ControlData {
  controlId: string;
  controlName: string;
  family: string;
  explanation?: string;
  azureService?: string;
  gap?: string;
  remediation?: string;
  bicepSnippet?: string;
  severity?: string;
  reason?: string;
}

interface SecurityFinding {
  finding: string;
  severity: string;
  affectedResource: string;
  fix: string;
  bicepSnippet?: string;
}

interface OverallScore {
  score: number;
  fedrampReadiness: string;
  il4Ready: boolean;
  summary: string;
}

interface AnalysisResult {
  controlsCovered: ControlData[];
  controlsPartial: ControlData[];
  controlsMissing: ControlData[];
  securityFindings: SecurityFinding[];
  overallScore: OverallScore;
}

function formatAnalysis(data: AnalysisResult, targetLevel: string): string {
  const { controlsCovered, controlsPartial, controlsMissing, securityFindings, overallScore } = data;
  const lines: string[] = [];

  lines.push(`## Bicep Compliance Analysis — ${targetLevel.toUpperCase()}`);
  lines.push('');
  lines.push(`### Overall Score: ${overallScore.score}/100 — ${overallScore.fedrampReadiness}`);
  lines.push(`**IL4 Ready:** ${overallScore.il4Ready ? 'Yes ✓' : 'No ✗'}`);
  lines.push('');
  lines.push(`> ${overallScore.summary}`);
  lines.push('');

  if (controlsCovered.length > 0) {
    lines.push(`### Controls Addressed (${controlsCovered.length})`);
    lines.push('');
    lines.push('| Control ID | Control Name | Azure Service |');
    lines.push('|-----------|-------------|--------------|');
    for (const c of controlsCovered) {
      lines.push(`| ${c.controlId} | ${c.controlName} | ${c.azureService ?? '—'} |`);
    }
    lines.push('');
  }

  if (controlsPartial.length > 0) {
    lines.push(`### Partial Controls — Gaps Present (${controlsPartial.length})`);
    lines.push('');
    lines.push('| Control ID | Gap | Remediation | Severity |');
    lines.push('|-----------|-----|-------------|----------|');
    for (const c of controlsPartial) {
      lines.push(`| ${c.controlId} | ${c.gap ?? '—'} | ${c.remediation ?? '—'} | ${c.severity ?? '—'} |`);
    }
    lines.push('');
  }

  if (controlsMissing.length > 0) {
    const critical = controlsMissing.filter((c) => c.severity === 'critical');
    const others = controlsMissing.filter((c) => c.severity !== 'critical');

    if (critical.length > 0) {
      lines.push(`### Missing Controls — Critical (${critical.length})`);
      lines.push('');
      lines.push('| Control ID | Control Name | Reason | Remediation |');
      lines.push('|-----------|-------------|--------|-------------|');
      for (const c of critical) {
        lines.push(`| ${c.controlId} | ${c.controlName} | ${c.reason ?? '—'} | ${c.remediation ?? '—'} |`);
      }
      lines.push('');
    }

    if (others.length > 0) {
      lines.push(`### Missing Controls — Other (${others.length})`);
      lines.push('');
      lines.push('| Control ID | Control Name | Severity | Remediation |');
      lines.push('|-----------|-------------|----------|-------------|');
      for (const c of others) {
        lines.push(`| ${c.controlId} | ${c.controlName} | ${c.severity ?? '—'} | ${c.remediation ?? '—'} |`);
      }
      lines.push('');
    }
  }

  if (securityFindings.length > 0) {
    lines.push(`### Security Findings (${securityFindings.length})`);
    lines.push('');
    lines.push('| Severity | Finding | Affected Resource | Fix |');
    lines.push('|----------|---------|------------------|-----|');
    for (const f of securityFindings) {
      lines.push(`| ${f.severity.toUpperCase()} | ${f.finding} | ${f.affectedResource} | ${f.fix} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export async function handleBicepAnalyze(args: unknown): Promise<string> {
  const { bicepCode, targetLevel } = Schema.parse(args);

  const data = (await callSiteApi('/api/bicep-analyze', {
    bicepCode,
    targetLevel,
  })) as AnalysisResult;

  return formatAnalysis(data, targetLevel);
}
