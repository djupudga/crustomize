# `crustomize.yml` file

Each overlay directory contains a **crustomize.yml** manifest describing how to build
your templates. All fields are optional except `base`. If `render` or `profile` are
specified, they override the corresponding command line flags.

The manifest supports variable expansion using the `${var}` syntax. Variables
are defined in the `vars` section of the manifest only and are not available in
templates.

```yaml
vars:
  env: dev
base: ../base
render: ejs
profile: my-aws-profile
stack:
  name: my-stack
  capabilities:
    - CAPABILITY_NAMED_IAM
  tags:
    Environment: ${env}
params: ./params.yml
overlays:
  - ./Template.yml
  - file: ./another-overlay.yml
    arrayMerge: replace
values:
  Stage: ${env}
  Enabled: true
patches:
  - op: replace
    path: "/Resources/Path/To/Array/0/Property"
    value: some value
```

## Fields

| Field      | Description                                                           |
| ---------- | --------------------------------------------------------------------- |
| `vars`     | Variables that are expanded in the `crustomize.yml` manifest only.    |
| `base`     | Path to the directory containing base templates.                      |
| `overlays` | List of overlay files to merge with the base templates.               |
| `params`   | Path to a `params.yml` file converted to JSON when applying.          |
| `render`   | Template engine (`handlebars` or `ejs`). Overrides `--render` if set. |
| `profile`  | AWS CLI profile used by helper functions. Overrides `--profile`.      |
| `stack`    | CloudFormation stack information for deployment commands.             |
| `values`   | Arbitrary values accessible from templates.                           |
| `patches`  | JSON patch operations applied after merging templates.                |

## Crustomize JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "vars": {
      "type": "object",
      "additionalProperties": {
        "type": "string",
        "description": "Variable"
      }
    },
    "base": {
      "type": "string"
    },
    "overlays": {
      "type": "array",
      "items": {
        "oneOf": [
          {
            "type": "string",
            "description": "Overlay path"
          },
          {
            "type": "object",
            "properties": {
              "file": {
                "type": "string",
                "description": "Overlay path"
              },
              "arrayMerge": {
                "type": "string",
                "enum": [
                  "append",
                  "replace",
                  "prepend",
                  "crustomize"
                ]
              }
            },
            "required": [
              "file",
              "arrayMerge"
            ],
            "additionalProperties": false
          }
        ]
      }
    },
    "stack": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "capabilities": {
          "type": "array",
          "uniqueItems": true,
          "items": {
            "type": "string",
            "enum": [
              "CAPABILITY_IAM",
              "CAPABILITY_NAMED_IAM",
              "CAPABILITY_AUTO_EXPAND"
            ]
          }
        },
        "tags": {
          "type": "object",
          "additionalProperties": {
            "type": "string"
          }
        }
      },
      "required": [
        "name"
      ]
    },
    "params": {
      "type": "string"
    },
    "render": {
      "type": "string",
      "enum": [
        "handlebars",
        "ejs"
      ]
    },
    "profile": {
      "type": "string"
    },
    "values": {
      "type": "object",
      "not": {
        "required": [
          "base",
          "overlays"
        ]
      }
    },
    "patches": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "op": {
            "type": "string",
            "enum": [
              "add",
              "remove",
              "replace",
              "move",
              "copy",
              "test"
            ]
          },
          "path": {
            "type": "string"
          },
          "value": {}
        },
        "required": [
          "op",
          "path"
        ]
      }
    }
  },
  "required": [
    "base"
  ],
  "additionalProperties": false
}
```