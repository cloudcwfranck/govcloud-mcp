export const GITHUB_ACTIONS_BASIC = `
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build
      - run: az login
      - run: az aks get-credentials --name myaks --resource-group myrg
      - run: kubectl apply -f manifests/
`;

export const GITLAB_CI_HARDENED = `
stages:
  - sast
  - container-scan
  - sca
  - secrets-scan
  - build
  - sign
  - deploy

variables:
  REGISTRY: registry1.dso.mil
  IMAGE_PATH: registry1.dso.mil/ironbank/opensource/nginx/nginx

sast:
  stage: sast
  image: registry1.dso.mil/ironbank/opensource/semgrep/semgrep:1.56.0
  script:
    - semgrep --config=auto --json > sast-results.json
  artifacts:
    reports:
      sast: sast-results.json

container-scan:
  stage: container-scan
  image: registry1.dso.mil/ironbank/anchore/enterprise/enterprise:5.3.0
  script:
    - anchore-cli image add \$IMAGE_PATH
    - anchore-cli image wait \$IMAGE_PATH
    - anchore-cli image vuln \$IMAGE_PATH all
    - anchore-cli evaluate check \$IMAGE_PATH --policy-id dod-il4

sign:
  stage: sign
  script:
    - cosign sign --key env://COSIGN_PRIVATE_KEY \$IMAGE_PATH
`;

export const OVERSIZED_PIPELINE = 'x'.repeat(10001);
