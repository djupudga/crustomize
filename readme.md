# crustomize
A Kustomize like CLI but for AWS CloudFormation templates.

Though the tool is standalone, it requires a
local installation of the AWS CLI and cfn-lint.

> **Note:** This is a work in progress and is not yet ready for production use.
> Also, the templates must end with `.yml`.

## Features
- Apply patches to CloudFormation templates
- Deploy to AWS
- Create, execute and delete changesets
- Validate templates with cfn-lint
- Validate templates against AWS with `validate`

Why would you use this? Normally I would recommend using AWS CDK or
Terraform, but if you are already using CloudFormation and perhaps
using bash scripts, going declarative has some advantages. The main
advantage is that deployments are reproducible and not dependent on
parameters passed to the AWS CLI or bash scripts.

Also, you won't really need to use parameters in your templates
because the overlays will basically do this for you.

For a more detailed guide and additional documentation see [docs/index.md](docs/index.md). The documentation is also published as a GitHub Pages site.
You may store default CLI flags in a `.crustomizerc` file in your project
directory. See [docs/config-file.md](docs/config-file.md) for details.

## Usage
Like kustomize, crustomize allows you to create base CloudFormation templates
and then apply patches to them. How you structure your project is up to you,
below you may find an example of how you could go about it.

```bash
/base/
  /ecs/
    /task/
      /task.yml
      /task-roles.yml
/variants
  /prod/
    /ecs/
      /task/
        /crustomize.yml
        /task.yml
        /task-roles.yml
  /staging/
    /ecs/
      /task/
        /crustomize.yml
        /task.yml
        /task-roles.yml

```

## Installation

Download the latest release or clone the repository. 

You need to install 'bun' if you build from source.
https://bun.sh

To install dependencies:

```bash
bun install
```

To build:

```bash
make bundle
```

To install the binary:

```bash
sudo cp dist/crustomize-<build> /usr/local/bin/crustomize
```