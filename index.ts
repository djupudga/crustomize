import meow from "meow"
import { commands } from "./lib/commands/"
import {version} from "./package.json"

const cli = meow(
  `
  cruztomize
    version: v${version}

  Usage
    $ cruztomize [command] <path> -e <engine> -c <file> -o <file>

  Commands:
    apply              Applies overlays to a base file
    deploy             Deploys a CloudFormation stack
    create-change-set  Creates a CloudFormation change set
    execute-change-set Executes a CloudFormation change set
    delete-change-set  Deletes a CloudFormation change set
  Parameters:
    <path> Path to overlay folder
  Options
    --render, -r    Template engine [Default: ejs]
    --output, -o    Output file [Default: standard out]
    --profile, -p   AWS CLI profile [Default: default]
    --env, -e       Environment file
    --help, -h      Show help
    --version, -v   Show version
  Description:
    Applies overlays in <path> and performs pre-processing
    before outputting results to stdout or --output path
    or to a CloudFormation stack.
`,
  {
    importMeta: import.meta,
    autoVersion: false,
    flags: {
      version: {
        type: "boolean",
        isRequired: false,
        default: false,
        aliases: ["v"],
      },
      profile: {
        type: "string",
        isRequired: false,
        aliases: ["p"],
        // default: "default",
      },
      render: {
        type: "string",
        isRequired: false,
        aliases: ["r"],
        default: "handlebars",
      },
      output: {
        type: "string",
        isRequired: false,
        aliases: ["o"],
      },
      env: {
        type: "string",
        isRequired: false,
        aliases: ["e"],
      },
    },
  },
)

const [command, path] = cli.input

type CommandName = keyof typeof commands

function isCommand(name: string | undefined): name is CommandName {
  return name !== undefined && name in commands
}

if (cli.flags.version) {
  console.log(`cruztomize: v${version}`)
  process.exit(0)
}
if (command == undefined) {
  cli.showHelp()
  process.exit(0)
}

if (isCommand(command)) {
  if (path) {
    await commands[command](path, cli.flags)
  } else {
    cli.showHelp()
  }
} else {
  console.error(`Unknown command: "${command}".`)
  process.exit(1)
}