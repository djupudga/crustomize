# `crustomize.yml` file

Each variant directory contains a **crustomize.yml** manifest describing how to build
your templates. All fields are optional except `base`. If `render` or `profile` are
specified, they override the corresponding command line flags.

```yaml
base: ../base
render: ejs
profile: my-aws-profile
stack:
  name: my-stack
  capabilities:
    - CAPABILITY_IAM
  tags:
    Environment: dev
params: ./params.yml
overlays:
  - ./Template.yml
values:
  Foo: true
```

## Fields

| Field      | Description                                                           |
| ---------- | --------------------------------------------------------------------- |
| `base`     | Path to the directory containing base templates.                      |
| `overlays` | List of overlay files to merge with the base templates.               |
| `params`   | Path to a `params.yml` file converted to JSON when applying.          |
| `render`   | Template engine (`handlebars` or `ejs`). Overrides `--render` if set. |
| `profile`  | AWS CLI profile used by helper functions. Overrides `--profile`.      |
| `stack`    | CloudFormation stack information for deployment commands.             |
| `values`   | Arbitrary values accessible from templates.                           |
| `patches`  | JSON patch operations applied after merging templates.                |