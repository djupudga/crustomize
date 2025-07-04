# Getting Started

Crustomize is a small CLI that merges and deploys CloudFormation templates.

### Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/)
- [cfn-lint](https://github.com/aws-cloudformation/cfn-lint) if you plan to use the `--lint` flag
- [bun](https://bun.sh) &mdash; only required when building from source

### Installation

1. Download a binary from the release page and place it in your `$PATH`.
2. Verify the installation:

```bash
crustomize --help
```

### Building from source

If you prefer to build the binary yourself:

1. Install dependencies with `bun install`.
2. Build using `make bundle`.
3. Copy the executable from `dist/` to your `$PATH`.

See the examples under `examples/` for sample templates.
