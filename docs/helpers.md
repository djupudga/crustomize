# Helper Functions

Templates rendered with Handlebars gain a set of extra helpers on top of the built in ones provided by [Handlebars](https://handlebarsjs.com/).

| Helper           | Description                                                                                                                                 | Example                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `indent`         | Indents a string by a number of spaces. Useful when reading other files and merging them into a YAML template so indentation stays correct. | `{{indent (getFile "policy.json") 4}}`      |
| `toYaml`         | Converts an object to YAML.                                                                                                                 | `{{toYaml values}}`                         |
| `quote`          | Wraps a value in double quotes.                                                                                                             | `{{quote env.REGION}}`                      |
| `trunc`          | Truncates a string to a maximum length.                                                                                                     | `{{trunc stackName 12}}`                    |
| `toBase64`       | Encodes a string as base64.                                                                                                                 | `{{toBase64 "foo"}}`                        |
| `getFile`        | Reads a file relative to the manifest and returns its contents.                                                                             | `{{getFile "userdata.sh"}}`                 |
| `fileToBase64`   | Reads a file and returns its base64 encoded contents.                                                                                       | `{{fileToBase64 "script.sh"}}`              |
| `lookupCfOutput` | Retrieves an output from an existing CloudFormation stack.                                                                                  | `{{lookupCfOutput "network" "VpcId"}}`      |
| `getParameter`   | Fetches a parameter from AWS Systems Manager Parameter Store.                                                                               | `{{getParameter "/my/param"}}`              |
| `valueOrDefault` | Returns a value or a provided default.                                                                                                      | `{{valueOrDefault env.IMAGE_TAG "latest"}}` |
