export declare const bigbangHardenTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            baseValues: {
                type: string;
                description: string;
            };
            targetLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            enabledAddons: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            clusterName: {
                type: string;
            };
            registryUrl: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleBigbangHarden(args: unknown): Promise<string>;
//# sourceMappingURL=bigbang-harden.d.ts.map