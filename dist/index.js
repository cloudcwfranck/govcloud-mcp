#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const fs_1 = require("fs");
const path_1 = require("path");
const index_js_2 = require("./tools/index.js");
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
function loadResource(filename) {
    try {
        const resourcePath = (0, path_1.join)(__dirname, 'resources', filename);
        return (0, fs_1.readFileSync)(resourcePath, 'utf-8');
    }
    catch {
        return JSON.stringify({ error: `Resource file ${filename} not found` });
    }
}
const server = new index_js_1.Server({
    name: 'govcloud-mcp',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return { tools: index_js_2.allTools };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        const result = await (0, index_js_2.handleToolCall)(name, args ?? {});
        return {
            content: [{ type: 'text', text: result }],
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: 'text', text: `Error: ${message}` }],
            isError: true,
        };
    }
});
server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
    return {
        resources: RESOURCES.map(({ uri, name, description, mimeType }) => ({
            uri,
            name,
            description,
            mimeType,
        })),
    };
});
server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
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
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    process.stderr.write('GovCloud MCP Server running on stdio\n');
}
main().catch((error) => {
    process.stderr.write(`Fatal error: ${error}\n`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map