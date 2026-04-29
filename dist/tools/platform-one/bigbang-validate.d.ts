export declare const bigbangValidateTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            valuesYaml: {
                type: string;
                description: string;
            };
            targetLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            bigbangVersion: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleBigbangValidate(args: unknown): Promise<string>;
//# sourceMappingURL=bigbang-validate.d.ts.map