export declare const sspSectionTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            section: {
                type: string;
                enum: string[];
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
            impactLevel: {
                type: string;
                enum: string[];
            };
            additionalContext: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleSspSection(args: unknown): Promise<string>;
//# sourceMappingURL=ssp-section.d.ts.map