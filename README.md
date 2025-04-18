# crustomize
A Kustomize like CLI but for AWS CloudFormation templates.

Though the tool is standalone, it requires a
local installation of the AWS CLI and cnf-lint.


## Installation
You need to install 'bun' to run this project.
https://bun.sh

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

To build:

```bash
make bundle
```

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.