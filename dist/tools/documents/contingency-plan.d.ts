export declare const contingencyPlanTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            systemName: {
                type: string;
                description: string;
            };
            systemDescription: {
                type: string;
                description: string;
            };
            azureServices: {
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
            rtoHours: {
                type: string;
                description: string;
            };
            rpoHours: {
                type: string;
                description: string;
            };
            systemOwner: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleContingencyPlan(args: unknown): Promise<string>;
//# sourceMappingURL=contingency-plan.d.ts.map