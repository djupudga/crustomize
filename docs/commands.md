# Command Line Reference

Crustomize is invoked as:

```bash
crustomize [command] <path> [options]
```

## Commands

- `apply` – Applies overlays to a base file.
- `deploy` – Deploys a CloudFormation stack.
- `create-change-set` – Creates a CloudFormation change set.
- `execute-change-set` – Executes a CloudFormation change set.
- `delete-change-set` – Deletes a CloudFormation change set.
- `validate` – Validates the generated template.

## Options

- `--render`, `-r` – Template engine (default: `handlebars`)
- `--output`, `-o` – Output file (default: standard out)
- `--profile`, `-p` – AWS CLI profile (default: `default`)
- `--lint`, `-l` – Lint the output file (requires `cfn-lint`)
- `--env`, `-e` – Environment file
- `--help`, `-h` – Show help
- `--version`, `-v` – Show version
