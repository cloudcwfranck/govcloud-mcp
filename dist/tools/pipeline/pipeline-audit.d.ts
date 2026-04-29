export declare const pipelineAuditTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            pipelineYaml: {
                type: string;
                description: string;
            };
            pipelineType: {
                type: string;
                enum: string[];
                description: string;
            };
            targetLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            scanTools: {
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
export declare function handlePipelineAudit(args: unknown): Promise<string>;
//# sourceMappingURL=pipeline-audit.d.ts.map