# .crustomizerc

Command line flags can be stored in a `.crustomizerc` file written in YAML. When
running `crustomize` it will look for this file in the current working directory
first, then in your home folder (`~/.crustomizerc`). You may also specify an
alternative path using the `--config` flag.

## Valid keys

Only the following keys may appear in `.crustomizerc`. Any other key causes
crustomize to exit with an error.

| Key       | CLI flag         | Description                                         |
| --------- | ---------------- | --------------------------------------------------- |
| `ci`      | `--ci / -i`      | Disable spinners for CI/CD environments.            |
| `env`     | `--env / -e`     | Path to an environment file.                        |
| `helpers` | `--helpers / -H` | Custom helpers path(s). Supports `s3://` URLs.      |
| `hooks`   | `--hooks / -K`   | Custom hooks path(s).                               |
| `lint`    | `--lint / -l`    | Lint the output file using `cfn-lint`.              |
| `output`  | `--output / -o`  | Output directory.                                   |
| `profile` | `--profile / -p` | AWS CLI profile.                                    |
| `render`  | `--render / -r`  | Template engine (`handlebars` or `ejs`).            |
| `repo`    | `--repo / -R`    | Repository path, used by the `generate` command.    |
| `silent`  |                  | Suppress non-essential output.                      |

## Examples

Basic defaults:

```yaml
render: ejs
profile: my-profile
lint: true
output: deploy_folder
```

Point at a shared helpers folder for all projects on your machine (stored in
`~/.crustomizerc`):

```yaml
helpers: ~/work/crustomize-helpers
```

Or pull helpers from S3. Crustomize mirrors the prefix to
`.crustomize/cache/s3/<bucket>/<key>/` via `aws s3 sync --delete`:

```yaml
helpers: s3://my-bucket/crustomize-helpers/v2
```

Combine local and S3 sources (colon-separated):

```yaml
helpers: ./local-helpers:s3://my-bucket/crustomize-helpers/v2
```

## Precedence

Values in `.crustomizerc` are used as **defaults**. Flags passed on the
command line override them. For `render` and `profile`, settings in
`crustomize.yml` override both the command line and `.crustomizerc`.
