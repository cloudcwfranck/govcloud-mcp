export declare const gccHighTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            service: {
                type: string;
                description: string;
            };
            scenario: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleGccHigh(args: unknown): Promise<string>;
//# sourceMappingURL=gcc-high-guidance.d.ts.map