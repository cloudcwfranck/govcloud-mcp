export declare const atoReadinessTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
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
            targetAuthorization: {
                type: string;
                enum: string[];
                description: string;
            };
            currentMaturity: {
                type: string;
                enum: string[];
                description: string;
            };
            existingDocumentation: {
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
export declare function handleAtoReadiness(args: unknown): Promise<string>;
//# sourceMappingURL=ato-readiness.d.ts.map