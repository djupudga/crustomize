# Getting Started

This guide shows how to install **crustomize** and use it for a basic 
deployment.

## Installation

1. Download the latest release from the [GitHub releases page]
   (https://github.com/user/crustomize/releases) and place the binary in 
   your `PATH`.
2. Alternatively clone the repository and build from source. You will 
   need [bun](https://bun.sh) installed.

```bash
bun install
make bundle
sudo cp dist/crustomize-<build> /usr/local/bin/crustomize
```

## Usage

Create a directory with your base templates and another one for your 
variant. The variant should contain a `crustomize.yml` file that points 
to the base templates and overlays.

```bash
/base/
  Template.yml
/variants/
  /prod/
    crustomize.yml
```

Run `crustomize build variants/prod` to produce a merged template.

