"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allTools = void 0;
exports.handleToolCall = handleToolCall;
const bicep_analyze_js_1 = require("./compliance/bicep-analyze.js");
const bicep_remediate_js_1 = require("./compliance/bicep-remediate.js");
const control_lookup_js_1 = require("./compliance/control-lookup.js");
const control_narrative_js_1 = require("./compliance/control-narrative.js");
const poam_generate_js_1 = require("./compliance/poam-generate.js");
const ato_readiness_js_1 = require("./compliance/ato-readiness.js");
const oscal_fragment_js_1 = require("./compliance/oscal-fragment.js");
const landing_zone_design_js_1 = require("./architecture/landing-zone-design.js");
const azure_service_selector_js_1 = require("./architecture/azure-service-selector.js");
const gcc_high_guidance_js_1 = require("./architecture/gcc-high-guidance.js");
const private_endpoint_map_js_1 = require("./architecture/private-endpoint-map.js");
const bigbang_validate_js_1 = require("./platform-one/bigbang-validate.js");
const bigbang_harden_js_1 = require("./platform-one/bigbang-harden.js");
const ironbank_lookup_js_1 = require("./platform-one/ironbank-lookup.js");
const addon_configurator_js_1 = require("./platform-one/addon-configurator.js");
const pipeline_audit_js_1 = require("./pipeline/pipeline-audit.js");
const signing_config_js_1 = require("./pipeline/signing-config.js");
const devsecops_scorecard_js_1 = require("./pipeline/devsecops-scorecard.js");
const ssp_section_js_1 = require("./documents/ssp-section.js");
const contingency_plan_js_1 = require("./documents/contingency-plan.js");
exports.allTools = [
    // Compliance
    bicep_analyze_js_1.bicepAnalyzeTool,
    bicep_remediate_js_1.bicepRemediateTool,
    control_lookup_js_1.controlLookupTool,
    control_narrative_js_1.controlNarrativeTool,
    poam_generate_js_1.poamGenerateTool,
    ato_readiness_js_1.atoReadinessTool,
    oscal_fragment_js_1.oscalFragmentTool,
    // Architecture
    landing_zone_design_js_1.landingZoneTool,
    azure_service_selector_js_1.serviceSelectTool,
    gcc_high_guidance_js_1.gccHighTool,
    private_endpoint_map_js_1.privateEndpointTool,
    // Platform One
    bigbang_validate_js_1.bigbangValidateTool,
    bigbang_harden_js_1.bigbangHardenTool,
    ironbank_lookup_js_1.ironbankLookupTool,
    addon_configurator_js_1.addonConfiguratorTool,
    // Pipeline
    pipeline_audit_js_1.pipelineAuditTool,
    signing_config_js_1.signingConfigTool,
    devsecops_scorecard_js_1.devsecopsScoreCardTool,
    // Documents
    ssp_section_js_1.sspSectionTool,
    contingency_plan_js_1.contingencyPlanTool,
];
async function handleToolCall(name, args) {
    switch (name) {
        case 'bicep_analyze':
            return (0, bicep_analyze_js_1.handleBicepAnalyze)(args);
        case 'bicep_remediate':
            return (0, bicep_remediate_js_1.handleBicepRemediate)(args);
        case 'control_lookup':
            return (0, control_lookup_js_1.handleControlLookup)(args);
        case 'control_narrative':
            return (0, control_narrative_js_1.handleControlNarrative)(args);
        case 'poam_generate':
            return (0, poam_generate_js_1.handlePoamGenerate)(args);
        case 'ato_readiness':
            return (0, ato_readiness_js_1.handleAtoReadiness)(args);
        case 'oscal_fragment':
            return (0, oscal_fragment_js_1.handleOscalFragment)(args);
        case 'landing_zone_design':
            return (0, landing_zone_design_js_1.handleLandingZone)(args);
        case 'azure_service_selector':
            return (0, azure_service_selector_js_1.handleServiceSelect)(args);
        case 'gcc_high_guidance':
            return (0, gcc_high_guidance_js_1.handleGccHigh)(args);
        case 'private_endpoint_map':
            return (0, private_endpoint_map_js_1.handlePrivateEndpoint)(args);
        case 'bigbang_validate':
            return (0, bigbang_validate_js_1.handleBigbangValidate)(args);
        case 'bigbang_harden':
            return (0, bigbang_harden_js_1.handleBigbangHarden)(args);
        case 'ironbank_lookup':
            return (0, ironbank_lookup_js_1.handleIronbankLookup)(args);
        case 'addon_configurator':
            return (0, addon_configurator_js_1.handleAddonConfigurator)(args);
        case 'pipeline_audit':
            return (0, pipeline_audit_js_1.handlePipelineAudit)(args);
        case 'signing_config':
            return (0, signing_config_js_1.handleSigningConfig)(args);
        case 'devsecops_scorecard':
            return (0, devsecops_scorecard_js_1.handleDevsecopsScorecard)(args);
        case 'ssp_section':
            return (0, ssp_section_js_1.handleSspSection)(args);
        case 'contingency_plan':
            return (0, contingency_plan_js_1.handleContingencyPlan)(args);
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
//# sourceMappingURL=index.js.map