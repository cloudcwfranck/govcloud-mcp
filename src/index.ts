#!/usr/bin/env node
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

const server = new Server(
  {
    name: 'govcloud-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleToolCall(name, args ?? {});
    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: RESOURCES.map(({ uri, name, description, mimeType }) => ({
      uri,
      name,
      description,
      mimeType,
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const resource = RESOURCES.find((r) => r.uri === uri);

  if (!resource) {
    throw new Error(`Resource not found: ${uri}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: resource.mimeType,
        text: loadResource(resource.file),
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('GovCloud MCP Server running on stdio\n');
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error}\n`);
  process.exit(1);
});
