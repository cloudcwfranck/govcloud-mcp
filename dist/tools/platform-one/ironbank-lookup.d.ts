export declare const ironbankLookupTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            imageName: {
                type: string;
                description: string;
            };
            version: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleIronbankLookup(args: unknown): Promise<string>;
//# sourceMappingURL=ironbank-lookup.d.ts.map