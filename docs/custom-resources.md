# Custom Resources using hooks

Crustomize provides a quick, albeit rudimentary, way
of defining custom resources. These resources are added
to your templates as any normal AWS resources. However
when the CloudFormation template is generated these
resources are removed from the output. Instead, a hook
of your choice is called twice for each resource: First
before a template is deployed ("pre") and then after
a template has been deployed ("post").

The hook will receive two parameters: `event` and
`resource`. The `event` parameter will contain either
`"pre"` or `"post"` as values. The `resource` parameter
will contain the custom resource as an Object.

Example resource:
```yaml
Resources:
  MyCustomResource:
    Type: Crustomize::functionName
    Properties:
      Foo: bar
```

Example hook:
```JavaScript
export function functionName(event, resource) {
  if (event == "pre") {
    // handle resource
  }
}
```

The hooks are registered similarly to how helpers
are registered:

- cli clag (--hooks/-K)
- Colon separated in an evironment variable: `CRUSTOMIZE_HOOKS`
- Folder (`crustomize_hooks`)

Since Cruztomize is based on Bun, your hooks can
call the `require` function to load dependencies.

Practical applications of hooks are amongst others:
- Upload files to an S3 bucket
- Issue commands via the AWS CLI
- Update a database
