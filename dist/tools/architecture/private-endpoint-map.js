"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privateEndpointTool = void 0;
exports.handlePrivateEndpoint = handlePrivateEndpoint;
const zod_1 = require("zod");
const client_js_1 = require("../../client.js");
const system_prompts_js_1 = require("../../prompts/system-prompts.js");
exports.privateEndpointTool = {
    name: 'private_endpoint_map',
    description: 'Generate the complete private endpoint architecture required for a list of Azure services at a given FedRAMP/IL compliance level. Returns Bicep for every required private endpoint and DNS configuration.',
    inputSchema: {
        type: 'object',
        properties: {
            services: {
                type: 'array',
                items: { type: 'string' },
                description: 'Azure services e.g. ["Key Vault","Storage Account","AKS"]',
            },
            impactLevel: {
                type: 'string',
                enum: ['fedramp-moderate', 'fedramp-high', 'il4', 'il5'],
            },
            vnetCidr: { type: 'string', description: 'VNet CIDR e.g. "10.0.0.0/16"' },
            dnsZoneSubscriptionId: { type: 'string', description: 'Subscription ID for private DNS zones' },
        },
        required: ['services', 'impactLevel'],
    },
};
const Schema = zod_1.z.object({
    services: zod_1.z.array(zod_1.z.string()).min(1),
    impactLevel: zod_1.z.enum(['fedramp-moderate', 'fedramp-high', 'il4', 'il5']),
    vnetCidr: zod_1.z.string().optional(),
    dnsZoneSubscriptionId: zod_1.z.string().optional(),
});
async function handlePrivateEndpoint(args) {
    const { services, impactLevel, vnetCidr, dnsZoneSubscriptionId } = Schema.parse(args);
    const response = await client_js_1.anthropic.messages.create({
        model: client_js_1.MODEL,
        max_tokens: 6144,
        system: system_prompts_js_1.ARCHITECTURE_SYSTEM,
        messages: [
            {
                role: 'user',
                content: `Generate the complete private endpoint architecture for these Azure services at ${impactLevel}.

**Services:** ${services.join(', ')}
**Impact Level:** ${impactLevel}
${vnetCidr ? `**VNet CIDR:** ${vnetCidr}` : ''}
${dnsZoneSubscriptionId ? `**DNS Zone Subscription:** ${dnsZoneSubscriptionId}` : ''}

Provide:
1. Which services REQUIRE private endpoints at ${impactLevel} (with NIST control rationale)
2. Which services RECOMMEND but don't require private endpoints
3. All private DNS zones needed (exact zone names: privatelink.*.azure.com)
4. Subnet requirements and CIDR recommendations (with justification)
5. Complete Bicep for all private endpoints and DNS zone group linkages
6. NSG rules required to allow private endpoint traffic
7. DNS forwarding configuration for hybrid on-prem scenarios
8. GCC High-specific endpoint differences where applicable

Use actual Azure private link DNS zone names and ARM resource types.`,
            },
        ],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
}
//# sourceMappingURL=private-endpoint-map.js.map