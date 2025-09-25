# Helper Functions

Templates rendered with [Handlebars](https://handlebarsjs.com/) or
[EJS](https://ejs.co/) gain a set of extra helpers on top of any
that are built into the respective Template Rendering Engine.


| Helper           | Description                                                                                                                                 | Example                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `indent`         | Indents a string by a number of spaces. Useful when reading other files and merging them into a YAML template so indentation stays correct. | <!-- {% raw %} -->`{{indent (getFile "policy.json") 4}}`<!-- {% endraw %} --> |
| `toYaml`         | Converts an object to YAML.                                                                                                                 | <!-- {% raw %} -->`{{toYaml values}}`<!-- {% endraw %} --> |
| `quote`          | Wraps a value in double quotes.                                                                                                             | <!-- {% raw %} -->`{{quote env.REGION}}`<!-- {% endraw %} --> |
| `trunc`          | Truncates a string to a maximum length.                                                                                                     | <!-- {% raw %} -->`{{trunc stackName 12}}`<!-- {% endraw %} --> |
| `toBase64`       | Encodes a string as base64.                                                                                                                 | <!-- {% raw %} -->`{{toBase64 "foo"}}`<!-- {% endraw %} --> |
| `getFile`        | Reads a file relative to the manifest and returns its contents.                                                                             | <!-- {% raw %} -->`{{getFile "userdata.sh"}}`<!-- {% endraw %} --> |
| `fileToBase64`   | Reads a file and returns its base64 encoded contents.                                                                                       | <!-- {% raw %} -->`{{fileToBase64 "script.sh"}}`<!-- {% endraw %} --> |
| `lookupCfOutput` | Retrieves an output from an existing CloudFormation stack.                                                                                  | <!-- {% raw %} -->`{{lookupCfOutput "network" "VpcId"}}`<!-- {% endraw %} -->      |
| `getParameter`   | Fetches a parameter from AWS Systems Manager Parameter Store.                                                                               | <!-- {% raw %} -->`{{getParameter "/my/param"}}`<!-- {% endraw %} -->              |
| `valueOrDefault` | Returns a value or a provided default.                                                                                                      | <!-- {% raw %} -->`{{valueOrDefault env.IMAGE_TAG "latest"}}`<!-- {% endraw %} --> |