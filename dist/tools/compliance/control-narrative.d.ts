export declare const controlNarrativeTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            controlId: {
                type: string;
                description: string;
            };
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
            cspLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            impactLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            organizationName: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleControlNarrative(args: unknown): Promise<string>;
//# sourceMappingURL=control-narrative.d.ts.map