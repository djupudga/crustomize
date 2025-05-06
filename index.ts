import meow from "meow"
import { commands } from "./lib/commands/"
import {version} from "./package.json"

const cli = meow(
  `
  cruztomize
    versin: ${version}

  Usage
    $ cruztomize <path> -e <engine> -c <file> -o <file>
  Parameters:
    <path> Path to overlay folder
  Options
    --render, -r    Template engine [Default: ejs]
    --output, -o    Output file [Default: standard out]
    --profile, -p   AWS CLI profile [Default: default]
    --env, -e       Environment file
  Description:
    Applies overlays in <path> and performs pre-processing
    before outputting results to stdout or --output path.
`,
  {
    importMeta: import.meta,
    flags: {
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