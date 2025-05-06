# Crustomize Documentation

## Installation

Crustomize is distributed as a standalone binary for multiple platforms. You can download the latest release from the GitHub repository's **Releases** page. Choose the appropriate build for your operating system and CPU architecture:

* **macOS (Intel/x64)** – Download the `darwin-amd64` (or similar x64) release artifact.
* **macOS (Apple Silicon/ARM64)** – Download the `darwin-arm64` release artifact.
* **Linux (x86\_64/AMD64)** – Download the `linux-amd64` release artifact.
* **Linux (ARM64)** – Download the `linux-arm64` release artifact.

After downloading, if the file is archived (e.g., a `.zip` or `.tar.gz`), extract it to obtain the `crustomize` binary. Then install the binary by moving it into your system PATH. For example, on Unix-like systems:

```bash
chmod +x crustomize-linux-amd64      # Make sure the binary is executable
sudo mv crustomize-linux-amd64 /usr/local/bin/crustomize
```

*(Rename the binary to just **`crustomize`** as desired and ensure it’s in a directory like `/usr/local/bin` that is in your `$PATH`.)*

**Prerequisites:** Although Crustomize is a standalone CLI tool, it relies on some external tools being available on your system:

* **AWS CLI:** The AWS Command Line Interface must be installed and configured (for deploying CloudFormation stacks).
* **cfn-lint:** Install AWS CloudFormation Linter (`cfn-lint`) to enable template validation. Crustomize will use this to validate your templates.

Additionally, if you prefer to build Crustomize from source or are working from a cloned repository, you will need to install [**Bun**](https://bun.sh) (a JavaScript runtime). Once Bun is installed, you can build from source by running:

```bash
bun install        # install dependencies
make bundle        # build the project
sudo cp dist/crustomize-<platform> /usr/local/bin/crustomize  # install built binary
```

*(Replace `<platform>` with the actual build name output, e.g., `crustomize-darwin-arm64`.)*

After installation, test the CLI by running `crustomize --help` to see the available commands and options.

## Setting Up a Project

Setting up a new project with Crustomize involves organizing your AWS CloudFormation templates into a **base** configuration and any number of **overlays** for different environments or variations. The structure is conceptually similar to Kubernetes Kustomize. Here’s a step-by-step guide:

1. **Create a Base Template:** Start by writing your base CloudFormation template(s) that contain the default or common configuration. These templates reside in a base directory (for example, a folder named `base/`). You can organize them logically (by feature or component). For example:

   ```text
   my-project/
     base/
       network.yml
       database.yml
       app.yml
   ```

   In this structure, `base/` contains three YAML templates (`network.yml`, `database.yml`, `app.yml`) representing the core infrastructure.

2. **Create an Overlay Directory:** For each environment or variant you need (such as **test**, **staging**, **production**), create an overlay directory. Overlays contain modifications (patches) to the base templates, and a special file named `crustomize.yml` which tells Crustomize how to apply the overlay. For example:

   ```text
   my-project/
     base/
       ... (base templates as above)
     overlays/
       prod/
         crustomize.yml
         network-patch.yml
         app-patch.yml
       staging/
         crustomize.yml
         network-patch.yml
         app-patch.yml
   ```

   In this example, we have two overlays (`prod` and `staging`), each with its own `crustomize.yml` and some patch files. The patches (like `network-patch.yml`) will describe changes to apply to the base templates for that environment.

3. **Define the Overlay Configuration (`crustomize.yml`):** Inside each overlay folder, the `crustomize.yml` file describes how to derive the final templates for that environment. At minimum, it will specify the base and any patches or parameter overrides. For example, an overlay’s `crustomize.yml` might look like:

   ```yaml
   base: ../../base            # path to the base templates directory (relative to this overlay)
   patches:
     - path: /Resources/MyDB/Properties/DBInstanceClass
       op: replace
       value: db.t3.large
     - path: /Resources/MyApp/Properties/EnvironmentName
       op: add
       value: Production
   # params:                  # (Not recommended; see Best Practices)
   #   SomeParameter: SomeValue
   stacks:
     - name: MyAppStack
       template: app.yml
     - name: NetworkStack
       template: network.yml
   ```

   Let’s break down this example:

   * **`base`** points to the base directory containing original YAMLs. Crustomize will load all `.yml` files from there as the starting point.
   * **`patches`** is a list of modifications to apply. Each patch uses a JSON Patch-like syntax with an operation (`op`) such as `add`, `replace`, or `remove`, and a `path` (JSON path in the YAML document) and `value`. In the above example, one patch replaces the database instance type in the base template, and another adds an `EnvironmentName` property.
   * **`params`** (commented out above) could be used to directly specify values, but we avoid it in favor of patches or environment files (see **Best Practices** below).
   * **`stacks`** defines CloudFormation stacks to be deployed (here, two stacks: `MyAppStack` using the `app.yml` template, and `NetworkStack` using `network.yml`). More on this in the AWS Deployment section.

4. **Repeat for Other Overlays:** Create similar `crustomize.yml` files and patch files for each environment’s overlay, specifying environment-specific changes. For instance, the `staging/crustomize.yml` might set smaller instance sizes or different names.

5. **Project Initialization Example:** If you prefer a starting template, you can copy the structure from the repository’s `examples/` folder. For example, the repository provides an example layout like this:

   ```text
   examples/
     base/
       ecs-task.yml
       ecs-task-roles.yml
     overlays/
       staging/
         crustomize.yml
         ecs-task.yml        # overlay version or patch of ecs-task
         ecs-task-roles.yml  # overlay version or patch of roles
       prod/
         crustomize.yml
         ecs-task.yml
         ecs-task-roles.yml
   ```

   *(This mirrors the structure shown in the README.)*

   In such examples, the overlay’s `crustomize.yml` may simply reference the base and possibly override entire files by providing an overlay version (e.g., a modified `ecs-task.yml` in the overlay directory acts as a patch/override of the base file with the same name).

6. **Run Crustomize:** Once your base and overlay are set up, you can generate the final templated output or deploy it. For instance, to build the production templates without deploying, you might run:

   ```bash
   crustomize apply -o prod    # apply overlays for 'prod', output the merged templates
   ```

   (Assuming `-o` or similar flag indicates the overlay; actual CLI flags are covered later.) The output will be the base YAML merged with your production patches.

Following these steps, you have a structured project where common infrastructure code is in **base templates**, and differences per environment are captured in **overlay patches**. This makes it easy to manage multiple environments without duplicating entire CloudFormation templates.

## Best Practices

When using Crustomize, consider the following best practices to make your configurations maintainable and clear:

* **Prefer Overlays to Parameters:** Avoid using the `params` property in your `crustomize.yml` if possible. While Crustomize supports a `params` section to define template values, using it essentially applies an overlay of values anyway. It’s clearer to explicitly represent changes as patch files or overlay templates. In fact, you often don’t need traditional CloudFormation parameters at all, since overlays handle variable configuration for different scenarios. By relying on overlay files and patches for customization, you ensure that each environment’s differences are tracked as code.

* **Keep Base Templates Generic:** Your base CloudFormation templates should be environment-agnostic. Do not hard-code environment-specific values in the base. Instead, use placeholders or default values that make sense broadly, and then use overlays to inject specifics (like sizes, endpoints, toggles, etc.).

* **One Overlay per Environment:** Structure your overlays so that each environment (or variant) has its own directory and `crustomize.yml`. This isolates environment changes clearly. For example, have separate overlays for `dev`, `test`, `staging`, `prod` etc., rather than one overlay trying to handle multiple environments at once.

* **Use Meaningful Patch Paths:** When writing patches in `crustomize.yml`, ensure the JSON paths (the `path` field) clearly target the intended part of the template. This makes it easier to understand what each patch does. For complex changes, you can also directly provide an overlay version of the whole resource or use multiple smaller patches for clarity.

* **Template File Naming:** Ensure all CloudFormation template files have the `.yml` extension. Crustomize only processes files ending in `.yml`.

* **Version Control Everything:** Commit your base templates, overlay patches, and environment config files (except secrets) to version control. This way, your entire infrastructure configuration is tracked. You might exclude actual secret values and instead reference environment variables or AWS Secrets Manager in the templates.

By following these practices, you maintain a clear separation of concerns: base templates hold common definitions, overlays adjust those definitions for specific contexts, and the process remains transparent and reproducible (no hidden CLI parameters affecting your stacks).

## Base and Overlays

**Base** and **overlay** are core concepts in Crustomize that determine how your CloudFormation templates are composed and customized:

* **Base Templates:** A base is a set of one or more CloudFormation YAML files that define the default state of your infrastructure. This could be a single monolithic template or multiple templates (for modular stacks). The base is usually stored in a directory (e.g., `base/`). In your overlay’s `crustomize.yml`, you specify the base location using the `base` property. For example: `base: ../base` (relative path) or even an S3 URL (see below). The base has no knowledge of overlays, which means you can reuse the same base for different overlays without modifying the base itself (similar to how Kustomize bases work).

* **Overlays:** An overlay represents customizations applied on top of a base. Each overlay is typically for a specific environment or variant. Overlays can:

  * Add new resources or properties,
  * Override or replace values from the base,
  * Remove resources or properties that are not needed.

  Overlays are implemented via the combination of overlay template files and patch operations in `crustomize.yml`. For instance, if you want to override an entire resource definition, you can include a file in the overlay with the same name/path as the base resource file. Crustomize will recognize it and treat it as an overlay replacement for that base file. Alternatively, use the `patches` list in `crustomize.yml` to do fine-grained changes (as shown in the example earlier where we replaced a property value).

**Base from S3:** Crustomize supports storing your base templates in an Amazon S3 bucket. This is useful if you maintain a common baseline in a central location. To use an S3 base, set the `base` property in `crustomize.yml` to the S3 URI of a folder. For example:

```yaml
base: s3://my-config-bucket/cloudformation/base-v1
```

When you run Crustomize with this configuration, it will fetch all `.yml` files from that S3 location (recursively if nested) and use them as the base. Ensure that your AWS credentials (or AWS CLI profile, see **Using the `--profile` Option** below) allow access to that S3 bucket. Crustomize will download the files and then apply your overlay patches to them as if they were local.

**Applying Overlays:** When you run `crustomize apply` (or a deploy command) for a given overlay, the tool will load the base templates, then sequentially apply each patch from the overlay’s `crustomize.yml`. Patches are applied in order, so the final output is the base modified by all your overlay changes. If you have overlay files that completely replace base files, those are swapped in as well. The resulting merged template(s) can then be output for review or immediately used for deployment.

**Example:** Suppose your base `app.yml` defines an SNS topic without any subscription, and for production you want to add a subscription. Your production overlay’s `crustomize.yml` could include:

```yaml
patches:
  - op: add
    path: /Resources/MyTopic/Properties/Subscription/-
    value: 
      Endpoint: ops@example.com
      Protocol: email
```

This patch says: “add a new element to the end of the `Subscription` array of resource `MyTopic` in the template, with the given value.” After applying the base and overlay, the production template will have the email subscription added, whereas other environments without that patch will not.

Using bases and overlays, you achieve a clean separation: the base defines core infrastructure, and overlays tweak that core for specific needs.

## Environment Overlays

Environment overlays allow you to maintain multiple environment configurations (such as **test**, **staging**, **production**) without duplicating entire templates for each environment. Each environment gets its own overlay directory and `crustomize.yml`, capturing the differences from the base.

In practice, you will create an overlay for each environment:

* For example, an overlay for **test** might use smaller resource sizes or dummy domain names.
* A **staging** overlay might mirror production but with different tags or fewer instances.
* The **production** overlay might have the highest settings and real domain names.

**Usage:** To use an environment overlay, you invoke Crustomize pointing to that overlay. If your directory structure is as suggested (e.g., `overlays/prod/crustomize.yml`), you might run:

```bash
crustomize apply path/to/overlays/prod
```

This will load the base, then apply the prod overlay, producing the prod-specific template output. Similarly, `overlays/staging` would produce the staging variant.

Because each environment’s overlay can have its own set of patches and even its own additional files, you have full flexibility. You could, for instance, have a resource defined only in a particular environment’s overlay that doesn’t exist elsewhere.

**Example – Multiple Environments:** Let’s say your base template defines a VPC and subnets. In production, you need 3 subnets across AZs, but in test you only need 1 subnet. Your base `network.yml` might define one subnet as a starting point. Then:

* **test overlay**: patch the subnets resource count to 1 (or do nothing if base already has one).
* **prod overlay**: use a patch or overlay file to add two additional subnet resources.

In `overlays/prod/crustomize.yml`, you might list patches to add `Subnet2` and `Subnet3` resources. In `overlays/test/crustomize.yml`, you might not have any patch for subnets, meaning it will just use what’s in base (a single subnet).

Another use of environment overlays is to specify environment-specific configurations such as AMI IDs, ARNs, or other references that differ between accounts or regions. This can be done via patches or via the environment values mechanism described next.

By structuring overlays per environment, switching the output from one environment to another is as simple as pointing Crustomize to a different overlay. The base stays the same, ensuring that all environments are consistent where they should be, and only differ where you intend them to.

## Referencing Values in Templates

Crustomize allows you to inject custom values into your CloudFormation templates using template syntax. This is especially useful for pieces of data that might differ between deployments (for example, names, sizes, or toggles) that you don't want to hard-code in the base template. Instead of using CloudFormation Parameters and having to pass them in at deploy time, you can bake these values into your templates at build time using Crustomize.

Crustomize supports two templating syntaxes in your CloudFormation YAML: **Handlebars** and **EJS**. You can choose either according to your preference. Below, we demonstrate how to reference values using each syntax.

* **Using Handlebars Syntax:** Handlebars templates use double curly braces `{{ }}` to denote variables. In your base or overlay template file, you can include placeholders like `{{SomeValue}}`. These placeholders will be replaced by actual values provided via Crustomize's context (which comes from `params`, environment files, or environment variables). For example:

  ```yaml
  Resources:
    MyBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: {{BucketName}}
        LifecycleConfiguration: {{#if EnableLifecycle}}{{ env.current.LifecyclePolicy }}{{/if}}
  ```

  In this snippet:

  * `{{BucketName}}` is a placeholder for a bucket name.
  * The `{{#if EnableLifecycle}}...{{/if}}` block will include the lifecycle policy only if a boolean `EnableLifecycle` is set to true in the values.
  * `{{ env.current.LifecyclePolicy }}` shows a potential usage of an environment-specific value (assuming `env.current` is set appropriately; more on env variables below).

  You would supply `BucketName` and `EnableLifecycle` (and possibly `LifecyclePolicy`) via your overlay’s `params` or environment file so that when Crustomize processes the template, these get substituted.

* **Using EJS Syntax:** EJS templates use `<%= %>` for printing values and `<% %>` for logic. The same example in EJS would look like:

  ```yaml
  Resources:
    MyBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: <%= BucketName %>
        <% if (EnableLifecycle) { %>
        LifecycleConfiguration: <%- env.current.LifecyclePolicy %>
        <% } %>
  ```

  Here:

  * `<%= BucketName %>` inserts the BucketName value.
  * The `if` statement controls including the `LifecycleConfiguration` section.
  * `<%- ... %>` is used to insert a block of YAML (like a policy) without escaping (assuming `LifecyclePolicy` contains YAML snippet).

**Providing Values:** There are a few ways to provide the values for these placeholders:

* You could define them in the overlay `crustomize.yml` under a `params` section (though we recommend using overlays or env files instead of `params` when possible).
* You can supply them via environment-specific files (discussed in the next section).
* You might also set environment variables in your shell which Crustomize can pull in (discussed further below).

At build time, Crustomize will process the template files. It detects Handlebars or EJS syntax and replaces them with the provided values. The end result is a fully populated CloudFormation template with no remaining template syntax.

**Example:** If your overlay has a value `BucketName: myapp-prod-bucket` (perhaps from an environment file for production), and the base template contains `BucketName: {{BucketName}}`, then after running Crustomize for the prod overlay, the output CloudFormation template will have `BucketName: myapp-prod-bucket`. If the staging overlay provides a different `BucketName`, the staging output gets that instead.

Using templating within YAML gives you flexibility akin to what CloudFormation parameters offer, but with the benefit that each environment’s values are resolved before deployment. This means you don’t have to pass parameters via CLI or console – your final template is already customized for its environment.

## Referencing Environment Variables

Often, you may want to inject values that come from your environment (shell) or CI/CD pipeline, such as secrets or dynamic parameters, rather than hard-coding them in files. Crustomize supports referencing environment variables directly in your templates using the `env.` prefix.

During template processing, Crustomize provides an `env` object to the templating engine:

* In Handlebars, you can access an environment variable as `{{ env.VAR_NAME }}`.
* In EJS, you would use `<%= env.VAR_NAME %>`.

Here `VAR_NAME` corresponds to an actual environment variable in the running environment where you invoke Crustomize. For example, if you have an environment variable `DB_PASSWORD` set in your shell, you can write in your template:

```yaml
Parameters:
  DatabasePassword:
    Type: String
    Default: {{env.DB_PASSWORD}}
```

In EJS, the equivalent line would be:

```yaml
Default: <%= env.DB_PASSWORD %>
```

When Crustomize runs, it will replace `{{env.DB_PASSWORD}}` with the actual value of the `DB_PASSWORD` environment variable. This is very useful for sensitive values or config that you do not want to check into source control. You can keep such secrets in your environment or a secure storage and only inject them at build time.

**Important:** Ensure that environment variables are set in the context where you run Crustomize. If a variable is not set, the template might end up with an empty value or the literal placeholder could remain if not handled. It’s good practice to provide defaults or handle missing env vars in your templates (perhaps using conditional logic in the template).

For example, using Handlebars you could do:

```yaml
BucketName: {{ env.BUCKET_NAME || "my-default-bucket" }}
```

This would use the environment variable if present, or a default string if not.

In summary, `env.X` in templates gives you a direct line to `X` from your process environment. This feature, combined with environment-specific files (next section), means you can dynamically inject both static config values and truly dynamic runtime values into your CloudFormation templates.

## Using the `-e` Flag (Environment-Specific Files)

Crustomize provides an `-e` option (stands for "environment") to specify an environment context. This is primarily intended for supporting multiple AWS accounts or environment-specific configurations that are not covered by the overlay differences alone. By using the `-e` flag, you can load a set of variables specific to a named environment (like test, staging, prod) from an external file.

**Environment Files:** For each environment/account, create a YAML or JSON file that contains key-value pairs for configuration specific to that environment. For example, you might have files like:

* `test.env.yaml` – for the test account settings
* `staging.env.yaml` – for staging account settings
* `prod.env.yaml` – for production account settings

These could reside in a central `environments/` directory or at the root of your project. The content might look like:

```yaml
# prod.env.yaml
AccountId: "123456789012"
DomainName: "prod.mycompany.com"
EnableMonitoring: true
```

```yaml
# test.env.yaml
AccountId: "210987654321"
DomainName: "test.mycompany.com"
EnableMonitoring: false
```

**Loading with -e:** When you run Crustomize, use the `-e` flag to specify which environment file to load. For instance:

```bash
crustomize deploy overlays/prod -e prod
```

This tells Crustomize to load the variables from `prod.env.yaml`. All keys from that file will be made available in the template context under an object named after the environment. Specifically, if you have an environment named "prod", Crustomize will expose those values under `env.prod`.

Continuing the example above, running with `-e prod` means in your templates you can do:

* Handlebars: `{{ env.prod.AccountId }}`
* EJS: `<%= env.prod.AccountId %>`

to get `123456789012` inserted. Likewise, `{{env.prod.DomainName}}` would insert `"prod.mycompany.com"`.

For the test environment, running `-e test` and using `{{ env.test.DomainName }}` would insert `"test.mycompany.com"`.

**How to Use in Templates:** Typically, you will pair environment files with overlays. For example, your production overlay might not need to explicitly contain the account ID – you can just reference `{{ env.prod.AccountId }}` in the base template or overlay patch, and supply that via the environment file. This avoids hard-coding account IDs or other secrets in your repo.

You might also use environment files for less sensitive but environment-specific values like AMI IDs or VPC IDs that differ per environment. The pattern is:

1. Put them in the env file,
2. Reference them via `env.<envName>.<Key>` in the templates.

**Note:** The variables from environment files are namespaced by the environment name (i.e., `env.prod.X`). This means your templates should reference the correct environment’s values. If you accidentally reference a different environment’s namespace (e.g., using `env.prod` while running with `-e test`), that value will likely be empty. One way to avoid that is to reference via a dynamic current environment context. If Crustomize sets a current env, e.g., `env.current`, you could use `env.current.AccountId` regardless of which `-e` is used. (Check Crustomize’s documentation or updates: as of now, you should explicitly use `env.<name>` as provided.)

In summary, the `-e` flag and environment-specific files let you cleanly separate per-account or per-stage configuration (like account IDs, special flags, etc.) from your overlay logic. It’s a powerful way to handle multi-account deployments: you keep one overlay per stage, and also load that stage’s account settings easily.

## AWS CloudFormation Deployment

Crustomize isn’t just about templating— it also helps you deploy your templates to AWS CloudFormation. It wraps CloudFormation deployment commands, making it easier to go from YAML to actual stacks. Below are key aspects of using Crustomize for deployments:

### The `stacks` Property in crustomize.yml

In your overlay’s `crustomize.yml`, you can define a `stacks` section which lists one or multiple CloudFormation stacks to deploy. Each entry in `stacks` typically has:

* a **name** – the CloudFormation Stack name to be created/updated,
* a **template** – which template file to use for that stack (after overlays are applied),
* optionally, additional settings like **parameters** or **capabilities** if needed (though ideally you’ve baked in most config via overlays).

For example:

```yaml
stacks:
  - name: CoreNetwork
    template: network.yml
    region: us-east-1
  - name: AppServer
    template: app.yml
    tags:
      Environment: Production
      Team: WebApp
```

In this example, after building the final templates, Crustomize knows that it should deploy two stacks:

* **CoreNetwork** using the merged `network.yml` template,
* **AppServer** using the merged `app.yml` template.

You can also specify the AWS region or tags for the stack here. If you need to pass CloudFormation Parameters, you could include them in the stack definition as well (though as noted, using template parameters is usually unnecessary if you’ve utilized overlays for config).

### Deploying Stacks with AWS CLI (Under the Hood)

When you invoke Crustomize’s deploy functionality (for instance by running `crustomize deploy` on an overlay), Crustomize will:

1. Build the overlay with the base to produce the final template(s).
2. Validate the templates using **cfn-lint** (if installed), to catch any CloudFormation syntax or configuration issues early.
3. For each stack in the `stacks` list, call the AWS CloudFormation deployment command. Under the hood, Crustomize uses the AWS CLI to create or update the stack.

This means you should have AWS CLI configured (with credentials and default region or specified region) on the machine. The advantage is that you don’t have to manually run `aws cloudformation deploy ...` for each stack – Crustomize does it in one go according to your configuration.

During deployment, if AWS CloudFormation requires certain capabilities (like CAPABILITY\_IAM for creating roles), ensure Crustomize knows to pass those. You might include a `capabilities` field in each stack entry (e.g., `capabilities: ["CAPABILITY_NAMED_IAM"]`) or Crustomize may automatically detect it if an IAM resource is present (check the tool’s specifics).

### Using the `--profile` Option

If you use multiple AWS CLI profiles (as defined in your `~/.aws/credentials` and `~/.aws/config`), Crustomize can use a specific profile for AWS operations. Crustomize likely provides a `--profile <name>` flag (or something analogous) that you can use when running the deploy command. For example:

```bash
crustomize deploy overlays/prod -e prod --profile prod-account
```

This would instruct the underlying AWS CLI calls to use the `prod-account` profile (instead of default). The code internally passes the profile to the AWS SDK/CLI calls. This is particularly useful if each environment (test, staging, prod) is in a different AWS account – you can maintain profiles for each and use the corresponding one with the `-e` flag:

* `-e test --profile test-account`
* `-e staging --profile staging-account`
* etc.

Make sure the profile you use has the necessary permissions to create/update the CloudFormation stacks and resources.

### Template Validation with cfn-lint

Before deploying, Crustomize will validate your generated CloudFormation templates using **cfn-lint** (AWS’s CloudFormation Linter). If `cfn-lint` is not installed, this step might be skipped or result in an error, so it's recommended to have it installed. The linter will parse your template JSON/YAML and catch common errors (like invalid resource types, missing required properties, etc.). If it finds issues, Crustomize will likely report them and halt, so you can fix the template before attempting deployment.

Running `cfn-lint` as part of Crustomize ensures that you’re not sending a broken template to CloudFormation (which would result in a failed stack operation). Instead, you get quick feedback locally.

**Note:** Install cfn-lint via pip (`pip install cfn-lint`) or brew (`brew install cfn-lint`) depending on your system.

### Deployment Process

When everything is set (templates merged, linted, AWS CLI ready), Crustomize will initiate the deployment for each defined stack:

* If the stack does not exist in the target AWS account, it will create it.
* If it exists, it will attempt an update with the new template.

Crustomize will use the CloudFormation deployment command which handles creating or updating as needed. It may show you progress or output from the AWS CLI. For example, you might see the changes being executed or any errors from CloudFormation (like if a resource fails to create).

If you have multiple stacks listed, Crustomize might deploy them sequentially (take note if there are dependencies between stacks – CloudFormation itself can handle some cross-stack references via exported outputs, but Crustomize won't inherently know the dependency order unless you ensure the order in the `stacks` list or handle it via CloudFormation mechanisms).

You can also specify stack parameters (if you still use them) and tags in the `stacks` config, which Crustomize will pass to the AWS CLI command.

Finally, once deployment is done, you’ll have your stacks up to date in AWS. You can verify in the AWS CloudFormation Console that the stacks are created/updated with the expected names and that all resources are in place.

## Change Sets

AWS CloudFormation Change Sets allow you to preview changes to your stack before executing them. Crustomize provides convenient commands to work with change sets, integrating them into your deployment flow.

You can create a change set, review it, and then execute or discard it using Crustomize commands, rather than manually using the AWS CLI for these steps. Here’s how to use them:

* **Creating a Change Set:** Instead of directly deploying, you might want to generate a change set. For example, you may run:

  ```bash
  crustomize changeset create overlays/prod -e prod --profile prod-account --changeset-name MyChangeSet
  ```

  This would take the prod overlay, build the template, and create a CloudFormation change set named “MyChangeSet” for the target stack(s) rather than executing the update immediately. Under the hood, this likely calls `aws cloudformation create-change-set` with the new template. The output will include the change set ID or name, and a summary of changes (added/modified/deleted resources).

* **Viewing a Change Set:** Once created, you might want to inspect the change set to see what changes are proposed. Crustomize might automatically fetch the change set details and display them, or you can use an AWS CLI command like `aws cloudformation describe-change-set`. If Crustomize has a subcommand, it could be:

  ```bash
  crustomize changeset list -s MyStackName
  ```

  (Hypothetical example: listing change sets for a stack, or describing a specific one.)

* **Executing a Change Set:** After reviewing, to apply the changes, you execute the change set. Crustomize likely has:

  ```bash
  crustomize changeset execute --changeset-name MyChangeSet 
  ```

  (plus target overlay/stack context if not already known). Executing the change set will instruct CloudFormation to proceed with the update using that change set. The stack will then be updated and you’ll see the events stream as it makes the changes.

* **Deleting a Change Set:** If you decide not to apply a change set (perhaps the changes were not as expected or you want to create a new one), you should delete it to clean up. Use:

  ```bash
  crustomize changeset delete --changeset-name MyChangeSet 
  ```

  This will remove the change set from CloudFormation. (CloudFormation will automatically delete change sets after some time or after execution, but it’s good practice to clean up if you’re not using it.)

**Use Case:** The change set workflow is particularly useful in scenarios where you need approval or want to double-check changes in a production environment. You can generate a change set, have it reviewed (e.g., by a team lead or through a change management process), and only execute it once approved. Crustomize streamlines these steps so you don’t have to manually construct the AWS CLI commands each time.

**Note:** When creating change sets, you often provide a custom name or let CloudFormation generate one. Ensure you use unique names if you create multiple change sets, or delete old ones, to avoid confusion.

In summary, Crustomize’s change set commands help you safely manage updates:

* **Create** a change set to see what will happen.
* **Review** it (out-of-band or via CLI output).
* **Execute** it to apply, or **delete** if not needed.

This adds an extra layer of control on top of the direct deploy capability.

## Template Languages: Handlebars and EJS

Crustomize’s power comes from its ability to process templates with dynamic content. As mentioned, it supports two template languages: **Handlebars** and **EJS**. You can use either based on your comfort. This section provides guidance and examples for each, highlighting how to achieve common tasks in both.

Crustomize will automatically detect the syntax used in your template files:

* If it sees `<%` `%>` style tags, it will treat the file as EJS.
* If it sees `{{` `}}`, it will treat it as Handlebars.
  *(If a file contains both, the behavior might be undefined or one might take precedence; it’s best to stick to one style per file.)*

Below are some examples side-by-side:

### Basic Variable Insertion

* **Handlebars:** `{{VarName}}`
* **EJS:** `<%= VarName %>`

Both will replace the placeholder with the value of `VarName` provided in the context (via `params`, env file, or environment variable). For instance, if `VarName` is "HelloWorld", a YAML line `Description: {{VarName}}` becomes `Description: HelloWorld` in the output.

### Conditional Logic

* **Handlebars:** uses `{{#if ...}} ... {{/if}}` for conditionals.

  ```yaml
  Logging:
    {{#if EnableLogging}}
    Destination: {{LogDestination}}
    {{/if}}
  ```

  This will include the `Destination` line only if `EnableLogging` is truthy.

* **EJS:** uses normal JavaScript `if`:

  ```yaml
  Logging:
    <% if (EnableLogging) { %>
    Destination: <%= LogDestination %>
    <% } %>
  ```

  This does the equivalent in EJS. Make sure to close the `%>` tags properly.

### Loops (Repeating sections)

* **Handlebars:** uses `{{#each array}} ... {{/each}}`.

  ```yaml
  Subnets:
    {{#each SubnetList}}
    - ID: {{this}}
      CIDR: {{../SubnetCidr}}
    {{/each}}
  ```

  If `SubnetList` is an array, this will produce a list item for each entry. (Note: `this` refers to the current array element, and `../` goes up one scope to access a parent context if needed.)

* **EJS:** uses JavaScript loops:

  ```yaml
  Subnets:
  <% SubnetList.forEach(function(item) { %>
    - ID: <%= item %>
      CIDR: <%= SubnetCidr %>
  <% }); %>
  ```

  This will similarly produce repeated entries.

### Comments in Templates

Sometimes you want to include a comment that is removed in processing (not ending up in final YAML):

* **Handlebars:** you can use `{{!-- comment --}}` to add a comment that will not appear in output.
* **EJS:** use `<%# comment %>` for a comment.

### Escaping

If you need to output literal `{{` or `<%` in your CloudFormation (not as template but as actual text), you’ll need to escape them:

* In Handlebars, `\{{` can escape the double braces.
* In EJS, you might have to concatenate or otherwise trick it, since `<%` always starts code. Alternatively, if that scenario arises, consider switching the template syntax or splitting into two strings.

### Including File Snippets

Crustomize doesn’t directly include files, but you can simulate includes:

* With Handlebars, you could register partials (if supported) or use a custom helper if Crustomize allows it.
* With EJS, you could use `<%- include('filename.ejs') %>` if the system is set up for it (this depends on Crustomize’s implementation of EJS).

Check the Crustomize documentation for partials/includes support. If not present, you may just copy common sections into templates or use base templates to avoid repetition.

**Always Show Handlebars First:** In our examples and documentation, we’ve shown Handlebars syntax first because it’s a bit more readable for non-programmers (it's just placeholders and simple helpers). EJS examples follow for those who prefer writing in JavaScript logic. You can achieve the same outcomes with both; it’s purely a matter of preference.

If you’re undecided, Handlebars is a good starting choice for template simplicity, whereas EJS gives you the full power of JavaScript if you need more complex computations in your templates.

### Example Recap

Suppose you want to insert an environment-specific ARN for an SNS topic that is defined in your environment files:

* In **Handlebars** (assuming `TopicARN` is defined in env file for each env):

  ```yaml
  TopicArn: {{ env.prod.TopicARN }}
  ```

  When running with `-e prod`, this becomes the actual ARN from the prod file. If you were to run with staging, you’d write it as `{{ env.staging.TopicARN }}` or use a generic reference that points to the current env context.

* In **EJS**:

  ```yaml
  TopicArn: <%= env.prod.TopicARN %>
  ```

  (Likewise adjusting for staging or making it dynamic.)

Both approaches yield the same final CloudFormation YAML, e.g., `TopicArn: arn:aws:sns:us-east-1:123456789012:MyTopic`.

**Tip:** Choose one template language for your project to avoid confusion. Mixed usage isn’t necessary since either can express the needed logic. If your team is not deeply familiar with either, Handlebars might be slightly easier to adopt due to its limited, logic-lite nature. If you have complex logic to embed, EJS (with JavaScript) might be more powerful.

---

With the above documentation, you should be able to install Crustomize, set up your project structure, configure overlays for various environments, use templating syntax to inject dynamic values, and deploy your CloudFormation stacks with confidence. By following best practices and the provided examples, managing CloudFormation through Crustomize becomes a more streamlined and maintainable process. Enjoy automated and reproducible AWS deployments with your new **crustomize** workflow!
