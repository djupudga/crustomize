# Project Structure

Crustomize expects a directory containing a **crustomize.yml** manifest.
The manifest defines the base templates, overlay files, optional parameters,
stack information and optional settings like the render engine and AWS
profile. These settings override the corresponding command line flags.

A common layout is to keep reusable base templates under a `base/` folder
and variants that inherit from the base under `variants/` (or `overlays/`).

```
app/
├── base/
│   └── Template.yml
├── variants/
│   ├── dev/
│   │   ├── crustomize.yml
│   │   └── Template.yml
│   └── prod/
│       ├── crustomize.yml
│       └── Template.yml
└── env.yml
```

The variants thus define only the specifics for that environment, such
as a docker image tag or different values for environment variables.
In the layout above, the variants provide overrides for the `Template.yml`
resources.

The `crustomize.yml` file inside each variant references the base directory
and overlay files relative to itself.

```yaml
base: ../base
overlays:
  - ./Template.yml
```

It is also possible to separate resources into multple files, such as:

```
app/
├── base/
│   ├── ec2.yml
│   └── roles.yml
└── variants/
    └── dev/
        ├── crustomize.yml
        ├── ec2.yml
        └── roles.yml
```

Be aware that when resources are merged by crustomize it doesn't care
which file the resources are from, so if you have duplicates in two
different files, the resulting template will only have one of these.

## Cache folder

When `base`, `params`, or `--helpers` point at an `s3://` location,
crustomize mirrors the content to a local cache at
`.crustomize/cache/s3/<bucket>/<key>/` using `aws s3 sync --delete`.
Subsequent runs only transfer changed files, so the cache is
nearly-free after the first invocation.

S3 locations are treated as immutable by convention: pin versions
by including a version segment in the URL (e.g. `s3://bases/ecs/v3`)
and bump it to publish a new version. Mutating content at an
existing S3 path works but blurs which version was used for a
given deployment.

Add `.crustomize/` to your `.gitignore` to keep the cache out of
version control.

## Bases hosted on S3

The `base` field can also point to an S3 prefix instead of a local
directory. Crustomize will list the objects under the prefix and load
all `.yml` / `.yaml` files as base templates:

```yaml
base: s3://my-bases-bucket/ecs/v3
overlays:
  - ./Template.yml
```

The AWS profile used for the S3 calls is the one configured via
`profile:` in the manifest or the `--profile` flag. This is useful
when base templates are shared across teams or repositories and you
do not want to vendor them into every consuming project.

## Params files

If you need CloudFormation parameters, you put these in an overlay file
and define it in the `crustomize.yml` file under the `params:` property.
Below is an example project structure with params file and an `env.yml` file.

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

When processed the params `YAML` file is converted to a `params.json` file
and saved to the output folder.

The `params` field also accepts an `s3://bucket/key` URL if you want to
store parameters centrally rather than in each variant directory:

```yaml
params: s3://my-config-bucket/stacks/my-stack/params.yml
```

The `env.yml` in the project structure's root is used to define
environment variables that are common to all variants. These
values are referenced in a template using `env.VARIABLE_NAME`.
The `env.yml` structure is something like this:

```yaml
account: 1234567
foo: bar
```
