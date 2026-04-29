export declare const serviceSelectTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            requirement: {
                type: string;
                description: string;
            };
            impactLevel: {
                type: string;
                enum: string[];
            };
            constraints: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            existingServices: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleServiceSelect(args: unknown): Promise<string>;
//# sourceMappingURL=azure-service-selector.d.ts.map