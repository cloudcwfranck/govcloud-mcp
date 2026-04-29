export declare const landingZoneTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            missionType: {
                type: string;
                enum: string[];
                description: string;
            };
            dataClassification: {
                type: string;
                enum: string[];
            };
            userBase: {
                type: string;
                enum: string[];
            };
            targetImpactLevel: {
                type: string;
                enum: string[];
            };
            estimatedUsers: {
                type: string;
                description: string;
            };
            connectedToNIPR: {
                type: string;
            };
            existingEnclaves: {
                type: string;
                description: string;
            };
            cssp: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleLandingZone(args: unknown): Promise<string>;
//# sourceMappingURL=landing-zone-design.d.ts.map