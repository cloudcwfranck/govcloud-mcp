"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bicepRemediateTool = void 0;
exports.handleBicepRemediate = handleBicepRemediate;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
exports.bicepRemediateTool = {
    name: 'bicep_remediate',
    description: 'Auto-remediate Azure Bicep code to meet FedRAMP or DoD IL compliance targets. Returns hardened Bicep with a change log mapping each modification to the NIST 800-53 control it addresses.',
    inputSchema: {
        type: 'object',
        properties: {
            bicepCode: {
                type: 'string',
                description: 'The Bicep code to harden',
            },
            targetLevel: {
                type: 'string',
                enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'],
                description: 'Compliance target level',
            },
            analysisJson: {
                type: 'string',
                description: 'Optional: previous bicep_analyze output to avoid re-analysis',
            },
        },
        required: ['bicepCode'],
    },
};
const Schema = zod_1.z.object({
    bicepCode: zod_1.z.string().min(1),
    targetLevel: zod_1.z
        .enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5'])
        .default('fedramp-high'),
    analysisJson: zod_1.z.string().optional(),
});
async function handleBicepRemediate(args) {
    const { bicepCode, targetLevel, analysisJson } = Schema.parse(args);
    // Try site API first; fall back to direct Claude call
    try {
        const data = (await (0, client_js_1.callSiteApi)('/api/bicep-remediate', {
            bicepCode,
            targetLevel,
            analysisJson,
        }));
        const lines = [];
        lines.push(`## Hardened Bicep — ${targetLevel.toUpperCase()}`);
        lines.push('');
        if (data.scoreBefore !== undefined && data.scoreAfter !== undefined) {
            lines.push(`**Score:** ${data.scoreBefore}/100 → ${data.scoreAfter}/100`);
            lines.push('');
        }
        if (data.hardenedBicep) {
            lines.push('### Hardened Bicep');
            lines.push('');
            lines.push('```bicep');
            lines.push(data.hardenedBicep);
            lines.push('```');
            lines.push('');
        }
        if (data.changelog && Array.isArray(data.changelog) && data.changelog.length > 0) {
            lines.push('### Change Log');
            lines.push('');
            lines.push('| Change | Control ID | Rationale |');
            lines.push('|--------|-----------|-----------|');
            for (const entry of data.changelog) {
                lines.push(`| ${entry.change ?? ''} | ${entry.controlId ?? ''} | ${entry.rationale ?? ''} |`);
            }
        }
        return lines.join('\n');
    }
    catch {
        // Fall back to Claude for remediation if site API not available
        const contextPrompt = analysisJson
            ? `\n\nPrevious analysis:\n${analysisJson}`
            : '';
        const response = await client_js_1.anthropic.messages.create({
            model: client_js_1.MODEL,
            max_tokens: 8192,
            system: client_js_1.BASE_SYSTEM_PROMPT +
                `\n\nYou are remediating Bicep code for ${targetLevel} compliance. Return:
1. The complete hardened Bicep code block
2. Score improvement estimate (before → after)
3. Changelog table: | Change | Control ID | Rationale |

Map every change to the specific NIST 800-53 Rev 5 control it addresses.`,
            messages: [
                {
                    role: 'user',
                    content: `Harden this Bicep code for ${targetLevel} compliance:${contextPrompt}

\`\`\`bicep
${bicepCode}
\`\`\``,
                },
            ],
        });
        return response.content[0].type === 'text' ? response.content[0].text : '';
    }
}
//# sourceMappingURL=bicep-remediate.js.map