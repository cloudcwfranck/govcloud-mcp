export declare const poamGenerateTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            gaps: {
                type: string;
                description: string;
            };
            systemName: {
                type: string;
                description: string;
            };
            systemOwner: {
                type: string;
                description: string;
            };
            scheduledCompletionDays: {
                type: string;
                description: string;
            };
            impactLevel: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handlePoamGenerate(args: unknown): Promise<string>;
//# sourceMappingURL=poam-generate.d.ts.map