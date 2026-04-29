import { vi } from 'vitest';

export function buildMockAnthropicResponse(text: string) {
  return {
    id: 'msg_test123',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text }],
    model: 'claude-sonnet-4-6',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 100, output_tokens: 200 },
  };
}

export function buildEmptyAnthropicResponse() {
  return buildMockAnthropicResponse('');
}

export function mockAnthropicCreate(text: string) {
  return vi.fn().mockResolvedValue(buildMockAnthropicResponse(text));
}

export const MOCK_CONTROL_RESPONSE = `
## AC-2 Account Management

### Control Text
The organization manages information system accounts, including establishing, activating,
modifying, reviewing, disabling, and removing accounts.

### FedRAMP Baseline Applicability
- **Low:** AC-2 (base)
- **Moderate:** AC-2 + AC-2(1), AC-2(2), AC-2(3), AC-2(4)
- **High:** AC-2 + all moderate enhancements + AC-2(9), AC-2(10)
- **IL4:** All FedRAMP High plus AC-2(12) for atypical usage monitoring

### Azure Implementation
Microsoft Entra ID provides **Shared** inheritance for this control.

### eMASS Narrative
The system implements account management through Microsoft Entra ID with
Privileged Identity Management (PIM) for just-in-time access...

### Evidence Artifacts
- Entra ID user account export
- PIM configuration screenshots
- Account review policy documentation
`;

export const MOCK_NARRATIVE_RESPONSE = `
The organization implements NIST 800-53 Rev 5 control SC-28, Protection of Information
at Rest, through Microsoft Azure Key Vault and Azure Storage customer-managed encryption
keys (CMK). The system protects the confidentiality and integrity of information at rest
using AES-256 encryption enforced through Azure Storage service encryption and Azure SQL
Transparent Data Encryption (TDE).

The system employs customer-managed keys stored in Azure Key Vault Premium (HSM-backed)
to satisfy the cryptographic protection requirements of SC-28(1). All encryption keys are
generated within FIPS 140-2 Level 2 validated hardware security modules.

## Methods of Testing
The organization tests SC-28 implementation by verifying storage account encryption
settings via Azure Policy compliance reports, confirming Key Vault CMK rotation policies,
and reviewing diagnostic logs for any unauthorized decryption attempts.
`;

export const MOCK_SHORT_RESPONSE = 'Short.';
