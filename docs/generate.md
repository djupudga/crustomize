# Custom manifests

While Crustomize mimics **kustomize** with overlays and **Helm Charts**
with its template rendering support, the `generate` command is a bit different.

It allows you to create a central "Repo" of standard patterns (e.g. an RDS
definition, a Lambda setup) and lets developers "consume" them using a simple
manifest. The generated template can be immediately deployed or, if you prefer,
"vendored" into a folder you check into version control. This "vendored"
template can now act as a base template for your overlays.

This "vendor pattern" workflow is as follows:

- **Hydrate**: Generate standard template into a folder
- **Commit**: Commit the template into source control
- **Overlay**: Point your local `crustomize.yml` to this vendor folder
  as its `base`, applying your own project specific customizations on top.

## Developer Experience

Instead of the writing 500 lines of CloudFormation code, the developer
writes a simple manifest, referencing a service definition in the
service catalog (repo), like this:

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
resource.

Think of the "Vendor Workflow" exactly like managing a software library in a
JavaScript or Python project.

| **Crustomize Concept** | **Software Dev Analogy** | **Explanation** |
| :--- | :--- | :--- |
| **`manifest.yml`** | **`package.json`** | This is your high-level declaration. You don't write the database code here; you just declare, "I need the `rds/postgres` package, specifically the `production` variant." |
| **`crustomize generate`** | **`npm install`** | This is the build step. It goes out to the registry (your Repo), fetches the logic, and compiles it into local files. |
| **`./vendor` folder** | **`node_modules/`** | This is where the complex code lives. Just like you **never edit files inside `node_modules` manually** (because they get overwritten on the next install), you never edit the `./vendor` CloudFormation files directly. |
| **`crustomize.yml`** | **`import ... extends`** | This is your application logic. You are effectively saying: `import BaseStack from './vendor'; class MyStack extends BaseStack { ...apply patches... }`. |

## Direct Workflow

In the "Direct Workflow" the manifest is deployed directly to AWS and
involves these steps:

- **Generate**: Generate the CloudFormation template from the manifest
- **Deploy**: Deploy the generated template using the aws cli.

Any changes to the Service definition in the Service Catalog since the
last deploy are immediately present in the deployed service.

## The Vendor Workflow

While you can deploy the generated template directly, the most robust way
is to use `generate` and to treat the output as a base for your own
customizations.

1. Generate the base (hydrate)

```shell
# Compile the manifest into a standard CloudFormation template in ./vendor
crustomize generate mydb.yml --repo ./my-catalog --output ./vendor
```

2. Extend with Overlays
Create a local crustomize.yml that treats the generated ./vendor folder as
your base. This allows you to "patch" the standard catalog item without
modifying the generated files directly.

```yml
# crustomize.yml
base: ./vendor
overlays:
  - overlays/prod/permissions.yml
values:
  Foo: true
patches:
  - op: replace
    path: "/Resources/Path/To/Array/0/Property"
    value: some value
```

## How it works internally

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