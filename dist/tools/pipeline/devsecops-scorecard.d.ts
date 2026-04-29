export declare const devsecopsScoreCardTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            programName: {
                type: string;
                description: string;
            };
            currentCapabilities: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            targetLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            softwareFactoryType: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleDevsecopsScorecard(args: unknown): Promise<string>;
//# sourceMappingURL=devsecops-scorecard.d.ts.map