export const VALID_BIGBANG_VALUES = `
domain: bigbang.dev

networkPolicies:
  enabled: true

istio:
  enabled: true
  mtls:
    mode: STRICT

monitoring:
  enabled: true
  values:
    prometheus:
      image:
        repository: registry1.dso.mil/ironbank/opensource/prometheus/prometheus
        tag: v2.48.0@sha256:abc123def456

logging:
  enabled: true
  values:
    fluent-bit:
      image:
        repository: registry1.dso.mil/ironbank/opensource/fluent/fluent-bit
        tag: 2.2.0@sha256:789abc123def

policy:
  enabled: true
`;

export const NONCOMPLIANT_BIGBANG_VALUES = `
domain: bigbang.dev

istio:
  enabled: false

monitoring:
  enabled: true
  values:
    prometheus:
      image:
        repository: grafana/grafana
        tag: latest

policy:
  enabled: false
`;

export const MINIMAL_VALUES = `
domain: test.dev
`;

export const OVERSIZED_VALUES = 'x'.repeat(20001);
