# Project Structure

Crustomize expects a directory containing a **crustomize.yml** manifest. The manifest defines the base templates, overlay files, optional parameters, stack information and optional settings like the render engine and AWS profile. These settings override the corresponding command line flags. A common layout is to keep reusable base templates under a `base/` folder and variants that inherit from the base under `variants/`.

```
my-app/
├── base/
│   └── Template.yml
├── variants/
│   ├── dev/
│   │   ├── crustomize.yml
│   │   ├── Template.yml
│   │   └── params.yml
│   └── prod/
│       ├── crustomize.yml
│       ├── Template.yml
│       └── params.yml
└── env.yml
```

The `crustomize.yml` file inside each variant references the base directory and overlay files relative to itself. If a `params.yml` file is present it is converted to JSON when using the `apply` or deployment commands.

## Example `crustomize.yml`

```yaml
base: ../base
render: handlebars
profile: my-profile
overlays:
  - ./Template.yml
stack:
  name: my-stack
  capabilities:
    - CAPABILITY_IAM
  tags:
    Environment: dev
params: ./params.yml
values:
  NetworkMode: awsvpc
  VpcStackName: SomeStack
```

## Using `apply`

Generate a merged template to stdout:

```bash
crustomize apply variants/dev
```

### No `params.yml`

When the manifest does not include a `params` entry, `--output` is optional and it will print output to standard out:

```bash
crustomize apply path/to/variant
```

### With `params.yml`

If `params` is set, provide an output directory so `params.json` can be generated:

```bash
crustomize apply path/to/variant --output ./build
```

### Stack name in manifest

Including `stack.name` allows using deployment related commands:

```bash
crustomize deploy path/to/variant
crustomize create-change-set path/to/variant
crustomize execute-change-set path/to/variant
crustomize delete-change-set path/to/variant
crustomize validate path/to/variant
```

### Environment variables

You may pass environment variables directly:

```bash
FOO_BAR=bar crustomize apply path/to/variant
```

### Variables from `env.yml`

To load a YAML file and merge the values into the `env` object accessible from templates:

```bash
crustomize apply path/to/variant --env ./env.yml
```

`env.yml` is helpful for defining static values that are reused across multiple variants.
