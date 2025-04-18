# crustomize
A Kustomize like CLI but for AWS CloudFormation templates.

Though the tool is standalone, it requires a
local installation of the AWS CLI and cnf-lint.

> **Note:** This is a work in progress and is not yet ready for production use.
> Also, the templates must end with `.yml`.

## Features
- Apply patches to CloudFormation templates
- Deploy to AWS
- Create, execute and delete changesets
- Validate templates with cnf-lint

Why would you use this? Normally I would recommend using AWS CDK or
Terraform, but if you are already using CloudFormation and perhaps
using bash scripts, going declarative has some advantages. The main
advantage is that deployments are reproducible and not dependent on
parameters passed to the AWS CLI or bash scripts.

Also, you won't really need to use parameters in your templates
because the overlays will basically do this for you.

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
You need to install 'bun' to run this project.
https://bun.sh

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

To build:

```bash
make bundle
```
