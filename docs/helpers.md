# Helper Functions

Templates rendered with [Handlebars](https://handlebarsjs.com/) or
[EJS](https://ejs.co/) gain a set of extra helpers on top of any
that are built into the respective Template Rendering Engine.

In addition to built in helpers, you can define your own helper
functions in JavaScript. Crustomize will look for a folder in the 
working directory called `crustomiez_helpers` and import all `.js` files. Any
exported function is now available as a helper. You can override the
folder location using the `--helpers/-H` switch.

Finally, you can also provide a colon (`:`) separated string of absolute 
or relative files in the `CRUSTOMIZE_HELPERS` environment variable. 

A helper function is a function that receives a few context parameters
and returns a helper function. Read more about custom helpers
[here](custom-helpers.md).

## indent

Indents a string by a number of spaces. Useful when reading other files
and merging them into a YAML template so indentation stays correct.

**Example**
<!-- {% raw %} -->
```handlebars
{{indent (getFile "policy.json") 4}}
```
<!-- {% endraw %} -->

## toYaml

Converts an object to YAML

**Example**
<!-- {% raw %} -->
```handlebars
{{toYaml values}}
```
<!-- {% endraw %} -->

## quote

Wraps a value in double quotes.

**Example**
<!-- {% raw %} -->
```handlebars
{{quote env.REGION}}
```
<!-- {% endraw %} -->

## trunc

Truncates a string to a maximum length.

**Example**
<!-- {% raw %} -->
```handlebars
{{trunc stackName 12}}
```
<!-- {% endraw %} -->

## toBase64

Encodes a string as base64.

**Example**
<!-- {% raw %} -->
```handlebars
{{toBase64 "foo"}}
```
<!-- {% endraw %} -->

## getFile

Reads a file relative to the manifest and returns its contents.

**Example**
<!-- {% raw %} -->
```handlebars
{{getFile "userdata.sh"}}
```
<!-- {% endraw %} -->

## fileToBase64

Reads a file relative to the manifest and returns its base64 encoded contents.

**Example**
<!-- {% raw %} -->
```handlebars
{{fileToBase64 "userdata.sh"}}
```
<!-- {% endraw %} -->

## lookupCfOutput

Retrieves an output from an existing CloudFormation stack.

**Example**
<!-- {% raw %} -->
```handlebars
{{lookupCfOutput "network", "VpcId"}}
```
<!-- {% endraw %} -->

## getParameter

Fetches a parameter from AWS Systems Manager Parameter Store.

**Example**
<!-- {% raw %} -->
```handlebars
{{getParameter "/my/param"}}
```
<!-- {% endraw %} -->

## valueOrDefault

Returns a value or a provided default.

**Example**
<!-- {% raw %} -->
```handlebars
{{valueOrDefault env.IMAGE_TAG "latest"}}
```
<!-- {% endraw %} -->
