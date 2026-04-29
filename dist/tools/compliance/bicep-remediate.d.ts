export declare const bicepRemediateTool: {
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
            analysisJson: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleBicepRemediate(args: unknown): Promise<string>;
//# sourceMappingURL=bicep-remediate.d.ts.map