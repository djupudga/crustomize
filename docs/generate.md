# `generate` command

The `generate` command creates a CloudFormation manifest from a template repository. It reads an input file with at least a `type` field and applies a matching `crustomize.yml.in` template from the repository before running `apply`.

## Usage

```bash
crustomize generate <definition.yml> --repo <repo-path> [options]
```

The repository directory must contain a subfolder that matches the `type` value. That folder requires a `crustomize.yml.in` file and may include a `schema.json` used to validate the input file.

See the example under `examples/repo` for a working setup:

```bash
crustomize generate examples/repo/examples/example.yml \
  --repo examples/repo/repo --output ./build
```

This command generates a temporary `crustomize.yml` from the template, applies it and writes the resulting CloudFormation template to `./build`.

