# Command Line Reference

Crustomize is invoked as:

```bash
crustomize [command] <path> [options]
```

## path
Path to a folder containing a `crustomize.yml` file and, if use,
YAML overlays.

## option
Crustomize supports the following options:

```
    --render, -r    Template engine, default is "handlebars"
    --output, -o    Output directory
    --profile, -p   AWS CLI profile, default is "default"
    --repo, -R      Used with 'generate' command to specify the repository
    --config, -c    Config file with flag defaults
    --lint, -l      Lint the output file (requires cfn-lint)
    --env, -e       Environment file
    --help, -h      Show help
    --version, -v   Show version
    --ci, -i        CI/CD mode
```

To disable spinners, use the `--ci/-i` switch.
The `--profile/-p` and `--render/-r` switches can be overridden in a
`crustomize.yml` file if needed.

All switches can be defined in a `.crustomizerc` file in YAML format.
If you run `crustomize` in the same folder, it will pick up the switches
from there, unless you provide them specifically in the terminal.

## command

### apply

Applies overlays to base files and generates a CloudFormation template. If
using `params.yml` file, it also generates a `params.json` file. In that
case you must use the `--output/-o` switch.

**Examples:**
```bash
# Output to standard out
crustomize apply path/to/overlay/folder
# Redirect standard out to a file
crustomize apply path/to/overlay/folder > template.yml
# Write output to a file(s) in out_folder
crustomize apply path/to/overlay/folder --output out_folder
# Lint generated template
crustomize apply path/to/overlay --lint
```

### deploy

Generates a template or a template and a `params.json` file (if the
`crustomize.yml` file contains a `params:` property) to an
output folder. If you don't provide your own output folder with the
`--output/-o` switch, a temporary folder is created at `.crustomize_deploy`
and then cleaned up, once deployment is complete. If you need to
persist the generated templates, you must provide your own `--output` folder.

**Examples:**
```bash
# Auto output
crustomize deploy path/to/overlay
# Specific output
crustomize deploy path/to/overlay -o folder
```


### create-change-set

Creates a CloudFormation change-set on an existing stack. Once the change-set
has been created, it will output a JSON description of the changes to
standard output. See `deploy` above for switches and other behaviour.

**Examples:**
```bash
# Auto output
crustomize create-change-set path/to/overlay
# Specific output
crustomize create-change-set path/to/overlay -o folder
```

### execute-change-set

Executes an already created change-set. See `deploy` above for switches
and other behaviour.

**Examples:**
```bash
# Auto output
crustomize execute-change-set path/to/overlay
# Specific output
crustomize execute-change-set path/to/overlay -o folder
```

### delete-change-set

Deletes an already created change-set. See `deploy` above for switches
and other behaviour.

**Examples:**
```bash
# Auto output
crustomize delete-change-set path/to/overlay
# Specific output
crustomize delete-change-set path/to/overlay -o folder
```

### validate

Validates a generated template and `params.json` if one is generated
as well.

**Examples:**
```bash
# Auto output
crustomize validate path/to/overlay
# Specific output
crustomize validate path/to/overlay -o folder
# With linting
crustomize validate path/to/overlay --lint
```

## generate

Generates a CloudFormation template from a custom manifest file.

A custom manifest is a YAML file with a `type` property that
points to a Crustomize overlay in a "repository". Thus, the
`type` property is simply a relative path inside a folder that
has been "designated" as a repository. When executed, Crustomize
will locate the overlay and pre-render it using the content
of the custom manifest and then perform a final render of the
overlay (i.e. `apply` the overlay).

This can be useful for defining minimal and standardized
deployments. For example `type: lambda/v1` could deploy
a lambda function, `type: db/postgres` a postgres
instance in AWS RDS.

**Examples:**
```bash
crustomize generate path/to/manifest.yml -r path/to/repo/folder
```
