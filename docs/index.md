---
layout: default
title: Crustomize
---

# Crustomize Documentation

Crustomize lets you build reproducible AWS CloudFormation deployments
by merging base templates with overlays. If you have used k8s kustomize
you should be familiar with the method.

Additionally, crustomize allows you to create custom `YAML` files, validated
using a JSON Schema. This allows you to create simplified and standardized
deployment specs for developers, exposing only what is needed.

## Who is this for

Ideally you are using some other tool, such as CDK, Pulumi or terraform.
If so, this is not the tool for you. If you are using CloudFormation and
are looking for an alternative to CloudFormation/AWS CLI process, you
should probably look at the alternatives.

This tool is mainly for projects that are stuck with CloudFormation templates,
perhaps driving the process using bash, and want a more declaritive
way of working with CloudFormation.

## How does it work?

Crustomize takes a base template and renders it using ejs or handlebars.
It will then repeat that process for all overlays and finally merge
the rendered overlays into the rendered base template, effectively
transforming it. Assuming input data values are static, this process
becomes reproducible, and is the ideal way to work with crustomize.

The outcome is a deployable CloudFormation template. Because you are using
overlays, there is no real need for CloudFormation parameters, though you
may generate a `params.json` file using this process.

## Contents

- [Getting started](getting-started.md)
- [Structuring your project](project-structure.md)
- Writing templates and overlays
- Deploying to AWS
- [Command line reference](commands.md)
- References
  - [crustomize.yml file](crustomize-yml.md)
  - [.crustomizerc config](config-file.md)
  - [Helper functions](helpers.md)
  - [generate command](generate.md)
