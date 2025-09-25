# Writing templates and overlays

This document will use the example CloudFormation YAML template
provided
[here](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/quickref-ecs.html),
but you can use your own if you prefer. In this guide we will create
one **test** overlay and one **prod** overlay.

## Step 1: Folder structure
Start your project by defining a **base** template. First
create a folder in your project for templates and overlays:

```bash
cd [your project]
mkdir crustomize
mkdir crustomize/base
mkdir -p crustomize/overlays/test
```

## Step 2: Overlays

Place the CloudFormation template in `crustomize/base/template-name.yml`.
The name doesn't matter, all YAML files in `base/` will be read and
merged into one master base template.

Create a `crustomize.yml` file in the `crustomize/overlays/test` folder
with this content:

```yml
base: ../../base
```

Verify it works by running `crustomize apply crustomize/overlays/test`. The
command should output the template itself.

Next, add an overlay in `crustomize/overlays/test/ECSTaskExecutionRole.yml`
Here, we will just add a `Description` property:

```yml
Resources:
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      Description: This is a test execution role
```
Note that the `Resources:` property is crucial for **crustomize** to merge
the overlay.

Add the overlay to `crustomize.yml` like this:

```yml
base: ../../
overlays:
  - ECSTaskExecutionRole.yml
```

Verify by running `crustomize apply crustomize/overlays/test`. The outputted
template should contain the added `Description` property.

Create a prod overlay by creating a `crustomize/overlays/prod` folder.
Copy the `test/crustomize.yml` file to that folder along with the
`ECSTaskExecutionRole.yml` overlay.

Modify the `crustomize/overlays/prod/ECSTaskExecutionRole.yml` like this:

```yml
Resources:
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      Description: This is a prod execution role
```

Verify by running `crustomize apply crustomize/overlays/prod`. There should
now be a different description.

## Step 3: JSON Patch

Sometimes overlays are not enough, particularly when you need to target
a specific item in an array. In these cases it may be necessary to use
a JSON patch. JSON patch can target specific elements and perform the
operations you define. Here, we will target the `ClusterSettings` list
and set the name using JSON patch.

Modify `test/crustomize.yml` like this:

```yml
base: ../../
overlays:
  - ECSTaskExecutionRole.yml
patches:
  - op: replace
    path: "/Resources/ECSCluster/Properties/ClusterSettings/0/Name"
    value: containerInsightsTest
```

Run `crustomize apply crustomize/overlays/test` to verify the cluster
name has been changed to `containerInsightsTest`.

Repeat the same for the `prod` overlay and verify your changes.
For more information, consult [Javascript Object Notation
Patch](https://datatracker.ietf.org/doc/html/rfc6902)
IETF specifications.

## Step 4: Template rendering

You can use either EJS or Handlebars as a template rendering engine.
Handlebars offers a more strict method of rendering by limiting
what sort of in-process commands can be used. EJS is more flexible
in that regard. In this example we'll use Handlebars.

Modify the `ECSCluster` section in the base template so it looks like this:

```yml
{% raw %}
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      {{#if values.Description}}
      Description: {{values.Description}}
      {{/if}}
      ClusterSettings:
        - Name: containerInsightsTest
          Value: enabled
{% endraw %}
```

Add a Description value in `test/crustomize.yml` like this:

```yml
base: ../../
overlays:
  - ECSTaskExecutionRole.yml
patches:
  - op: replace
    path: "/Resources/ECSCluster/Properties/ClusterSettings/0/Name"
    value: containerInsightsTest
values:
  Description: Test cluster
```

Verify and repeat the process for `prod/crustomize.yml` but with a different
Description.

You can also add templating instructions in overlays. Modify
`test/crustomize.yml` and add a `Stage` value property:

```yml
base: ../../
overlays:
  - ECSTaskExecutionRole.yml
patches:
  - op: replace
    path: "/Resources/ECSCluster/Properties/ClusterSettings/0/Name"
    value: containerInsightsTest
values:
  Description: Test cluster
  Stage: test
```

Modify the `test/ECSTaskExecutionRole.yml` like this:

```yml
{% raw %}
Resources:
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      Description: This is a {{values.Stage}} execution role
{% endraw %}
```

When you run `crustomize apply crustomize/overlays/test` the `{{values.Stage}}`
directive will be replaced with the value defined in the relevant
`crustomize.yml` file. Now, repeat for `overlays/prod/`.

In addition to `values.xxx` you can use the helpers documented in
[doc/helpers.md](./helpers.md) as well as environment variables.
Environment variables are accessed using `env.NAME_OF_VARIABLE`.
You can also defined common variables in an `env.yml` file and reference
it using the `-e` flag. These will also be accessible using the `env.NAME`
method.

If you have used or created Helm charts, you should be familiar with many
of the helper functions. If you find you need a specific helper, you can
create your own helper functions and expose them to `crustomize` using the
`CRUSTOMIZE_HELPERS` environment variable.

A custom helpers is just a Javascript function that returns a helper
function, like this:

```javascript
// Params:
//   wd: String: This is the folder of the current overlay/crustomize.yml
//       i.e. /path/to/overlay folder
//   profile: AWS_PROFILE, default is 'default'
//   bin: function that runs a shell process
export function cat({wd, profile, run}) {
  return function (filename) {
    const cat = bin.bind('cat')
    return cat([filename])
  }
}
```

One possible use case is to bind `bin` to the `aws` CLI in order to perfom
lookup operations against resources in AWS.