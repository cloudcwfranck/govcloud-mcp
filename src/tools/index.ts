import { bicepAnalyzeTool, handleBicepAnalyze } from './compliance/bicep-analyze.js';
import { bicepRemediateTool, handleBicepRemediate } from './compliance/bicep-remediate.js';
import { controlLookupTool, handleControlLookup } from './compliance/control-lookup.js';
import { controlNarrativeTool, handleControlNarrative } from './compliance/control-narrative.js';
import { poamGenerateTool, handlePoamGenerate } from './compliance/poam-generate.js';
import { atoReadinessTool, handleAtoReadiness } from './compliance/ato-readiness.js';
import { oscalFragmentTool, handleOscalFragment } from './compliance/oscal-fragment.js';

import { landingZoneTool, handleLandingZone } from './architecture/landing-zone-design.js';
import { serviceSelectTool, handleServiceSelect } from './architecture/azure-service-selector.js';
import { gccHighTool, handleGccHigh } from './architecture/gcc-high-guidance.js';
import { privateEndpointTool, handlePrivateEndpoint } from './architecture/private-endpoint-map.js';

import { bigbangValidateTool, handleBigbangValidate } from './platform-one/bigbang-validate.js';
import { bigbangHardenTool, handleBigbangHarden } from './platform-one/bigbang-harden.js';
import { ironbankLookupTool, handleIronbankLookup } from './platform-one/ironbank-lookup.js';
import { addonConfiguratorTool, handleAddonConfigurator } from './platform-one/addon-configurator.js';

import { pipelineAuditTool, handlePipelineAudit } from './pipeline/pipeline-audit.js';
import { signingConfigTool, handleSigningConfig } from './pipeline/signing-config.js';
import { devsecopsScoreCardTool, handleDevsecopsScorecard } from './pipeline/devsecops-scorecard.js';

import { sspSectionTool, handleSspSection } from './documents/ssp-section.js';
import { contingencyPlanTool, handleContingencyPlan } from './documents/contingency-plan.js';

import { govcloudQuickstartTool, handleGovcloudQuickstart } from './govcloud-quickstart.js';

export const allTools = [
  // Compliance
  bicepAnalyzeTool,
  bicepRemediateTool,
  controlLookupTool,
  controlNarrativeTool,
  poamGenerateTool,
  atoReadinessTool,
  oscalFragmentTool,
  // Architecture
  landingZoneTool,
  serviceSelectTool,
  gccHighTool,
  privateEndpointTool,
  // Platform One
  bigbangValidateTool,
  bigbangHardenTool,
  ironbankLookupTool,
  addonConfiguratorTool,
  // Pipeline
  pipelineAuditTool,
  signingConfigTool,
  devsecopsScoreCardTool,
  // Documents
  sspSectionTool,
  contingencyPlanTool,
  // Meta
  govcloudQuickstartTool,
];

export async function handleToolCall(name: string, args: unknown): Promise<string> {
  switch (name) {
    case 'bicep_analyze':         return handleBicepAnalyze(args);
    case 'bicep_remediate':       return handleBicepRemediate(args);
    case 'control_lookup':        return handleControlLookup(args);
    case 'control_narrative':     return handleControlNarrative(args);
    case 'poam_generate':         return handlePoamGenerate(args);
    case 'ato_readiness':         return handleAtoReadiness(args);
    case 'oscal_fragment':        return handleOscalFragment(args);
    case 'landing_zone_design':   return handleLandingZone(args);
    case 'azure_service_selector': return handleServiceSelect(args);
    case 'gcc_high_guidance':     return handleGccHigh(args);
    case 'private_endpoint_map':  return handlePrivateEndpoint(args);
    case 'bigbang_validate':      return handleBigbangValidate(args);
    case 'bigbang_harden':        return handleBigbangHarden(args);
    case 'ironbank_lookup':       return handleIronbankLookup(args);
    case 'addon_configurator':    return handleAddonConfigurator(args);
    case 'pipeline_audit':        return handlePipelineAudit(args);
    case 'signing_config':        return handleSigningConfig(args);
    case 'devsecops_scorecard':   return handleDevsecopsScorecard(args);
    case 'ssp_section':           return handleSspSection(args);
    case 'contingency_plan':      return handleContingencyPlan(args);
    case 'govcloud_quickstart':   return handleGovcloudQuickstart(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
