# Deploying to AWS

By default, running `crustomize apply [path]`  outputs a template to
the standard output. This output can be written to file either by redirecting
the output to a file or by providing a folder name using the `-o` switch.

After this, the Cloudformation stack can be deployed using the AWS CLI.

In addition, Crustomize has built in support to deploy generated
templates as well as managing Cloudformation change-sets, using the
`deploy`, `create-change-set`, `execute-change-set` and
`delete-change-set` commands.

## Deploying a stack

In order to use the built-in deploy commands, you must provide a Cloudformation
stack name in a `crustomize.yml` file, like this:

```yml
base: ../../base
stack:
  name: stack-name
```

If needed, you can also provide capabilities and stack tags.

```yml
base: ../../base
stack:
  name: stack-name
  capabilities:
    - CAPABILITY_IAM
    - CAPABILITY_NAMED_IAM
  tags:
    TagName: Tag value
    SomeOther: tag
```

In order to deploy, an output folder is required. You can provide
one using the `--output/-o` switch. If you do not, crustomize
will create a `.crustomize_deploy` folder, deploy, and then delete the folder.

If you want the output to persist, you must provide an output folder
manually.

```bash
# Auto create .deploy folder
crustomize deploy path/to/overlay/folder
# Manually create a .deploy folder
crustomize deploy path/to/overlay/folder -o deploy_folder
```

This will create a `template.yml` file in the output folder and then proceed
to deploy the Cloudformation stack. It is also a good practice to lint the
generated template. This is done using the `--lint/-l` switch:

```bash
crustomize deploy path/to/overlay -o folder --lint
```

Similarly you can create and manage change-sets:

```bash
crustomize create-change-set path/to/overlay -o folder
crustomize execute-change-set path/to/overlay -o folder --lint
crustomize delete-change-set path/to/overlay -o folder --lint
```

As with the `deploy` command, if you do not provide and output folder
a temporary `.crustomize_deploy` folder is created and cleaned up.

Note that change-sets, when created, are also reproducible. If you
create a change-set and then modify the base or an overlay and then
attempt to execute or delete the change set, you will get an error,
since the generated template will have diverged from the created one.

## Deploying a stack with parameters

If you need to use a Cloudformation base template with parameters, you
must create a `params.yml` file in a standard AWS Cloudformation
format, that is similar to this:

```yml
- ParameterKey: SomeParameterName
  ParameterValue: Some value
- ParameterKey: AnotherParameterName
  ParameterValue: {{ values.SomeValue }}
```

You then must reference the parameter file in your `crustomize.yml` file:

```yml
base: ../../base
stack:
  name: stack-name
  capabilities:
    - CAPABILITY_IAM
    - CAPABILITY_NAMED_IAM
  tags:
    TagName: Tag value
    SomeOther: tag
params: ./params.yml
```

When you deploy this stack, the output folder will now contain `template.yml`
and a `params.json` file.

When using a `params.yml` file, it is a good practice to validate as well as
lint the template:

```bash
crustomize validate path/to/overlay/folder --lint
crustomize deploy path/to/overlay/folder
```

> Note: Crustomize does not manage the life-cycle of your stack. It can
  only deploy and manage change-sets. Use the AWS CLI to delete stacks.
