export declare const addonConfiguratorTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            addon: {
                type: string;
                description: string;
            };
            targetLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            clusterSize: {
                type: string;
                enum: string[];
                description: string;
            };
            existingValues: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleAddonConfigurator(args: unknown): Promise<string>;
//# sourceMappingURL=addon-configurator.d.ts.map