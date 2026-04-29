export declare const bicepAnalyzeTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            bicepCode: {
                type: string;
                description: string;
            };
            targetLevel: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleBicepAnalyze(args: unknown): Promise<string>;
//# sourceMappingURL=bicep-analyze.d.ts.map