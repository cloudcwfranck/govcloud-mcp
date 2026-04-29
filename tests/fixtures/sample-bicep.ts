export const VALID_BICEP_IL4 = `
param location string = 'usgovarizona'
param keyVaultName string

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: { family: 'A', name: 'premium' }
    tenantId: subscription().tenantId
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    enableRbacAuthorization: true
    publicNetworkAccess: 'Disabled'
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: '\${keyVaultName}-pe'
  location: location
  properties: {
    subnet: { id: '/subscriptions/xxx/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/pe-subnet' }
    privateLinkServiceConnections: [{
      name: 'kvConnection'
      properties: {
        privateLinkServiceId: keyVault.id
        groupIds: ['vault']
      }
    }]
  }
}
`;

export const NONCOMPLIANT_BICEP = `
param location string = 'usgovarizona'
param storageAccountName string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_0'
    supportsHttpsTrafficOnly: false
  }
}
`;

export const EMPTY_BICEP = '';

export const OVERSIZED_BICEP = 'x'.repeat(20001);
