export declare const controlLookupTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            controlId: {
                type: string;
                description: string;
            };
            azureContext: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleControlLookup(args: unknown): Promise<string>;
//# sourceMappingURL=control-lookup.d.ts.map