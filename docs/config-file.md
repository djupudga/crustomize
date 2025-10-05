# .crustomizerc

Command line flags can be stored in a `.crustomizerc` file written in YAML. When
running `crustomize` it will look for this file in the current working directory.
You may also specify an alternative path using the `--config` flag.

Example:

```yaml
render: ejs
profile: my-profile
lint: true
output: deploy_folder
```

Values in the config file are used as defaults. Flags passed on the command line
override the config values. However, `render` and `profile` settings in
`crustomize.yml` override both.
