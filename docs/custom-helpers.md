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
working directory called `crustomize_helpers` and import all `.js` files. Any
exported function is now available as a helper. You can override the
folder location using the `--helpers/-H` switch.

You can also provide a colon (`:`) separated string of absolute
or relative JS files/folders in the `CRUSTOMIZE_HELPERS` environment variable,
or set `helpers:` in a `.crustomizerc` file (see
[.crustomizerc](config-file.md)).

The priority is this (lower number higher priority):

1. CLI flag (`--helpers/-H`).
2. `.crustomizerc` (`helpers:` key).
3. Environment variable (`CRUSTOMIZE_HELPERS`).
4. Folder (`crustomize_helpers`).

## Loading helpers from S3

Any of the helpers sources above can be an `s3://bucket/prefix` URL in addition
to a local path. Crustomize mirrors the prefix to a local cache at
`.crustomize/cache/s3/<bucket>/<prefix>/` using `aws s3 sync --delete`, then
loads every `.js` file from it. On warm cache, `sync` only transfers files that
actually changed in S3.

Local paths and S3 URLs can be combined in a colon-separated list:

```bash
crustomize apply proj/overlay --helpers ./local-helpers:s3://my-bucket/helpers/v2
```

Or in `.crustomizerc`:

```yaml
helpers: ./local-helpers:s3://my-bucket/helpers/v2
```

**Important notes on S3 helpers:**

- Helpers loaded from S3 must be self-contained — they cannot depend on an
  accompanying `node_modules`.
- Treat S3 locations as immutable: include a version segment in the prefix
  (e.g. `.../helpers/v2`) and bump it to publish a new version. Mutating
  content at an existing S3 path works but blurs which version was used
  for a given deployment.
- Because helpers are JavaScript, loading them from S3 means executing
  code from that bucket. Restrict write access to the helper bucket to
  trusted principals.

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
# or from S3
crustomize apply proj/variant/test --helpers s3://my-bucket/helpers/v2
# or if a crustomize_helpers folder exists
crustomize apply proj/variant/test
```

A practical application in a CI/CD environment would be to create a docker
image with `crustomize` and any custom helpers you need. Another is to keep
helpers centrally in S3 so every project on every developer machine and in
CI picks up the same versioned helper set.
