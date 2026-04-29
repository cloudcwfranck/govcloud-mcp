export declare const oscalFragmentTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            resourceDescription: {
                type: string;
                description: string;
            };
            controlIds: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            format: {
                type: string;
                enum: string[];
                description: string;
            };
            systemId: {
                type: string;
                description: string;
            };
            componentName: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleOscalFragment(args: unknown): Promise<string>;
//# sourceMappingURL=oscal-fragment.d.ts.map