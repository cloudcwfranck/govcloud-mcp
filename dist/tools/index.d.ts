export declare const allTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            bicepCode: {
                type: string;
                description: string;
            };
            targetLevel: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            controlId: {
                type: string;
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
            cspLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            impactLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            organizationName: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            gaps: {
                type: string;
                description: string;
            };
            systemName: {
                type: string;
                description: string;
            };
            systemOwner: {
                type: string;
                description: string;
            };
            scheduledCompletionDays: {
                type: string;
                description: string;
            };
            impactLevel: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
} | {
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
} | {
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
} | {
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
} | {
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
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            services: {
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
            vnetCidr: {
                type: string;
                description: string;
            };
            dnsZoneSubscriptionId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            baseValues: {
                type: string;
                description: string;
            };
            targetLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            enabledAddons: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            clusterName: {
                type: string;
            };
            registryUrl: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            addon: {
                type: string;
                description: string;
            };
            targetLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            clusterSize: {
                type: string;
                enum: string[];
                description: string;
            };
            existingValues: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            signingMethod: {
                type: string;
                enum: string[];
                description: string;
            };
            pipelineType: {
                type: string;
                enum: string[];
                description: string;
            };
            registry: {
                type: string;
                description: string;
            };
            enforceInCluster: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            programName: {
                type: string;
                description: string;
            };
            currentCapabilities: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            targetLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            softwareFactoryType: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
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
            rtoHours: {
                type: string;
                description: string;
            };
            rpoHours: {
                type: string;
                description: string;
            };
            systemOwner: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
})[];
export declare function handleToolCall(name: string, args: unknown): Promise<string>;
//# sourceMappingURL=index.d.ts.map