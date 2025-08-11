# Getting Started

Crustomize is a small CLI that merges and deploys CloudFormation templates.

### Prerequisites

Make sure you have [AWS CLI](https://aws.amazon.com/cli/) installed.

We also recommend to install [cfn-lint](https://github.com/aws-cloudformation/cfn-lint)
for linting the generated templates.

[bun](https://bun.sh) is only required when building from source.

### Installation

1. Download a binary from the release page and place it in your `$PATH`.
2. Verify the installation:

```bash
crustomize --help
```

### Building from source

If you prefer to build the binary yourself:

```shell
git clone git@github.com:djupudga/crustomize.git
cd crustomize
bun install
make bundle
```

Then copy the relevant executable from `dist/` to your `$PATH`, or, if you
are on a linux machine you should be able to run `make install`

Test the installation by running `crustomize --help`.
