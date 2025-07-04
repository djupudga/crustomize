# Crustomize Documentation

Crustomize lets you build reproducible AWS CloudFormation deployments by merging base templates with overlays.

## Contents

- [Getting started](#getting-started)
- [Structuring your project](project-structure.md)
- Writing templates and overlays
- Deploying to AWS
- References
  - crustomize.yml file
  - [Helper functions](helpers.md)

## Getting Started

Crustomize is a small CLI that merges and deploys CloudFormation templates. You will need [bun](https://bun.sh) when building from source and the [AWS CLI](https://aws.amazon.com/cli/) installed locally.

1. Install dependencies with `bun install`.
2. Build the binary using `make bundle`.
3. Copy the resulting executable from `dist/` to your `$PATH`.

See the examples under `examples/` for sample templates.
