# Custom manifests

While Crustomize mimics **kustomize** with overlays and **Helm Charts**
with its template rendering support, the `generate` command is a bit different.

It enables you to define a DSL like manifest format that results in
a generated AWS CloudFormation template. For example, you could have
a manifest YAML file similar to this:

```yaml
# mydb.yml
type: rds/postgres
name: MyPostgresDB
def:
  cluster: production
  size: small
```

When you run the `crustomize generate mydb.yml -R repo_path` command
it would output a CloudFormation template for bringing up that
resource. This allows you to define standard resources in a DevEx
friendly way.

## How it works

The `generate` command would locate the repository folder and
use the value of the `type` property to find the proper overlay. In the
above example, the repo is located at `./repo_path` and the value of the
`type` property is `rds/postgres`. Crustomize would then look for a
`./repo_path/rds/postgres` folder. That folder should have at minimum two
files: `schema.json` and `crustomize.yml.in`. The JSON schema is used to
validate the correctness of the `mydb.yml` manifest. If successful
Crustomize will then pre-render the `crustomize.yml.in` file using all
the properties of the `mydb.yml` file. Once that step is complete,
Crustomize will then apply the overlay as usual.

Note that in order to deploy the generated template, you must use the
AWS CLI.

## Repo

The repo is just a collection of folders and files and can be located
on the file system or in an S3 bucket. The `--repo/-R` switch should
always point to the root of the repo, in order for the paths contained
in the `type` property to be located.

If you use an S3 bucket, Crustomize will download the repo to a `.repo`
folder in the working directory. This folder will be synced every time
you run the command.

## Repo and custom helpers

If you have custom helpers for a repo, you can store these in a folder
in the repo and then point to these using the `--helpers/-H` cli flag.

For example, if you repo is in an S3 bucket, and you point to it like
this: `--repo s3://bucket/ecs/v3` and your helpers are located at
`s3://bucket/ecs/v3/helpers` the repo will be synced to:
`./.repo/ecs/v3`. Thus, your helpers will be located at:
`./.repo/ecs/v3/helpers`.

## Example usage

```bash
crustomize generate <definition.yml> --repo <repo-path> [options]
```

See the example under `examples/repo` for a working setup:

```bash
crustomize generate examples/repo/examples/example.yml \
  --repo examples/repo/repo --output ./build
```

