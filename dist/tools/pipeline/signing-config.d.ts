export declare const signingConfigTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            signingMethod: {
                type: string;
                enum: string[];
                description: string;
            };
            pipelineType: {
                type: string;
                enum: string[];
                description: string;
            };
            registry: {
                type: string;
                description: string;
            };
            enforceInCluster: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleSigningConfig(args: unknown): Promise<string>;
//# sourceMappingURL=signing-config.d.ts.map