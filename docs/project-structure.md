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

The `env.yml` in the project structure's root is used to define
environment variables that are common to all variants. These
values are referenced in a template using `env.VARIABLE_NAME`.
The `env.yml` structure is something like this:

```yaml
account: 1234567
foo: bar
```
