#!/usr/bin/env node
import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { allTools, handleToolCall } from './tools/index.js';
import { logger } from './utils/logger.js';
import { formatErrorForMCP } from './utils/errors.js';
import { fetchEslzContent } from './utils/github-fetcher.js';

const ESLZ_RESOURCES = [
  {
    uri: 'govcloud://eslz/architecture',
    name: 'Azure Landing Zones Architecture Overview (Official)',
    description: 'Official Azure Landing Zones (Enterprise-Scale) README from github.com/Azure/Enterprise-Scale',
    mimeType: 'text/markdown',
    eslzPath: 'README.md',
  },
  {
    uri: 'govcloud://eslz/policy-definitions',
    name: 'ALZ Policy Definitions — 161 Custom Policies (Official)',
    description: 'All 161 custom Azure Policy definitions from the Enterprise Scale reference implementation',
    mimeType: 'application/json',
    eslzPath: 'eslzArm/managementGroupTemplates/policyDefinitions/policies.json',
  },
  {
    uri: 'govcloud://eslz/policy-initiatives',
    name: 'ALZ Policy Initiatives — 52 Initiative Definitions (Official)',
    description: 'All 52 policy initiative (set) definitions from the Enterprise Scale reference implementation',
    mimeType: 'application/json',
    eslzPath: 'eslzArm/managementGroupTemplates/policyDefinitions/initiatives.json',
  },
];

const RESOURCES = [
  {
    uri: 'govcloud://nist-800-53-rev5',
    name: 'NIST 800-53 Rev 5 Control Catalog',
    description: 'Complete NIST SP 800-53 Rev 5 security control catalog with descriptions and supplemental guidance',
    mimeType: 'application/json',
    file: 'nist-800-53-rev5.json',
  },
  {
    uri: 'govcloud://azure-compliance-map',
    name: 'Azure Service Compliance Map',
    description: 'Mapping of Azure services to NIST 800-53 controls, FedRAMP authorization status, and IL availability',
    mimeType: 'application/json',
    file: 'azure-compliance-map.json',
  },
  {
    uri: 'govcloud://ironbank-registry',
    name: 'Iron Bank Image Registry',
    description: 'Catalog of Platform One Iron Bank hardened container images with registry paths and metadata',
    mimeType: 'application/json',
    file: 'ironbank-registry.json',
  },
  {
    uri: 'govcloud://fedramp-baselines',
    name: 'FedRAMP Control Baselines',
    description: 'FedRAMP Low, Moderate, and High control baselines with required controls per impact level',
    mimeType: 'application/json',
    file: 'fedramp-baselines.json',
  },
];

function loadResource(filename: string): string {
  try {
    const resourcePath = join(__dirname, 'resources', filename);
    return readFileSync(resourcePath, 'utf-8');
  } catch {
    return JSON.stringify({ error: `Resource file ${filename} not found` });
  }
}

// CJS __dirname substitute (tsconfig module: commonjs)
declare const __dirname: string;

async function validateEnvironment(): Promise<void> {
  const errors: string[] = [];

  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push('ANTHROPIC_API_KEY is not set');
  } else if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    errors.push('ANTHROPIC_API_KEY appears invalid (should start with sk-ant-)');
  }

  const resourceFiles = [
    'nist-800-53-rev5.json',
    'azure-compliance-map.json',
    'ironbank-registry.json',
    'fedramp-baselines.json',
  ];

  for (const file of resourceFiles) {
    try {
      const data = JSON.parse(readFileSync(join(__dirname, 'resources', file), 'utf-8'));
      if (!data || typeof data !== 'object') {
        errors.push(`Resource file invalid: ${file}`);
      }
    } catch {
      errors.push(`Resource file missing or corrupt: ${file}`);
    }
  }

  if (errors.length > 0) {
    process.stderr.write('GovCloud MCP startup errors:\n');
    errors.forEach((e) => process.stderr.write(`  ✗ ${e}\n`));
    process.stderr.write('\nFix these issues before using the MCP server.\n');
    process.exit(1);
  }

  logger.info('server', 'Startup validation passed', { toolCount: allTools.length });
}

const server = new Server(
  { name: 'govcloud-mcp', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleToolCall(name, args ?? {});
    return { content: [{ type: 'text', text: result }] };
  } catch (error) {
    logger.error('server', `Tool call failed: ${name}`, error);
    const userMessage = formatErrorForMCP(error, name);
    return {
      content: [{ type: 'text', text: userMessage }],
      isError: true,
    };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      ...RESOURCES.map(({ uri, name, description, mimeType }) => ({ uri, name, description, mimeType })),
      ...ESLZ_RESOURCES.map(({ uri, name, description, mimeType }) => ({ uri, name, description, mimeType })),
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  // Check ESLZ live resources first
  const eslzResource = ESLZ_RESOURCES.find((r) => r.uri === uri);
  if (eslzResource) {
    const content = await fetchEslzContent(eslzResource.eslzPath);
    return {
      contents: [{
        uri,
        mimeType: eslzResource.mimeType,
        text: content || `(Content temporarily unavailable — fetch failed for ${eslzResource.eslzPath})`,
      }],
    };
  }

  const resource = RESOURCES.find((r) => r.uri === uri);
  if (!resource) throw new Error(`Resource not found: ${uri}`);

  return {
    contents: [{
      uri,
      mimeType: resource.mimeType,
      text: loadResource(resource.file),
    }],
  };
});

async function main() {
  await validateEnvironment();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('GovCloud MCP Server running on stdio\n');
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error}\n`);
  process.exit(1);
});
