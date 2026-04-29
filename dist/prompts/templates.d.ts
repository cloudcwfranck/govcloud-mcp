export declare function bicepAnalysisTemplate(bicepCode: string, targetLevel: string): string;
export declare function controlNarrativeTemplate(controlId: string, systemName: string, systemDescription: string, azureServices: string[], cspLevel: string, impactLevel: string, orgName?: string): string;
export declare function poamTemplate(gaps: string, systemName: string, systemOwner: string, completionDays: number, impactLevel: string): string;
export declare function sspSectionTemplate(section: string, systemInfo: string, azureServices: string[], impactLevel: string, additionalContext?: string): string;
export declare function landingZoneTemplate(params: {
    missionType: string;
    dataClassification: string;
    userBase: string;
    targetImpactLevel: string;
    estimatedUsers?: number;
    connectedToNIPR?: boolean;
    existingEnclaves?: string;
    cssp: string;
}): string;
//# sourceMappingURL=templates.d.ts.map