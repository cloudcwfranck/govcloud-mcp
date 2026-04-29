export declare const privateEndpointTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            services: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            impactLevel: {
                type: string;
                enum: string[];
            };
            vnetCidr: {
                type: string;
                description: string;
            };
            dnsZoneSubscriptionId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handlePrivateEndpoint(args: unknown): Promise<string>;
//# sourceMappingURL=private-endpoint-map.d.ts.map