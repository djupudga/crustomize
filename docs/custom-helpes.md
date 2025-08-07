# Custom Helpers

In addition to the built in helpers you can define custom ones. You do
so by creating a `JavaScript` file that exports your helpers. Each
helper is a function that returns a function. The returned function is
the actual helper, while the enclosing one receives context parameters.

Example helper signature:
```JavaScript
export function ls({wd, profile, run}) {
  const ls = run.bind(null, "ls")
  return (path) => {
    return ls([path])
  }
}
```

To use the helper you provide a path in the `CRUSTOMIZE_HELPERS` environment
variable. The helper will then be available in your templates:

```
# some template
{{ ls "./path/to/folder" }}
```

and you can tell `crustomize` to use it like this:

```shell
CRUSTOMIZE_HELPERS=./path/to/helpers.js crustomize apply proj/variant/test
```

A practical application in a CI/CD environment would be to create a docker
image with `crustomize` and your custom helpers that you can then use.
