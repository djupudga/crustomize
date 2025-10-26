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

The parameters and values the outer function receives are:

- wd: A string that points to the folder of the `crustomize.yml` that
  is being processed.
- profile: String, AWS_PROFILE or the value of the `--profile/-p` switch
  or the the default "default" value.
- run: Function that can run a shell process and return the output.
  Throws an error in case of a non-zero exit code. Basically a wrapper
  around nodejs `spawnSync` function.

Crustomize will look for a folder in the
working directory called `crustomiez_helpers` and import all `.js` files. Any
exported function is now available as a helper. You can override the
folder location using the `--helpers/-H` switch.

Finally, you can also provide a colon (`:`) separated string of absolute
or relative JS files/folders in the `CRUSTOMIZE_HELPERS` environment variable.

The priority is this (lower number higher priority):

1. CLI flag (`--helpers/-H`).
2. Environment variable (`CRUSTOMIZE_HELPERS`).
3. Folder (`crustomize_helpers`).

The helpers can then be used in your templates.

```
# some template
{{ ls "./path/to/folder" }}
```

and you can tell `crustomize` to use it like this:

```bash
crustomize apply proj/overlay/test --helpers ./helpers
# or
CRUSTOMIZE_HELPERS=./helpers crustomize apply proj/variant/test
# or if a crustomize_helpers folder exists
crustomize apply proj/variant/test
```

A practical application in a CI/CD environment would be to create a docker
image with `crustomize` and any custom helpers you need.
