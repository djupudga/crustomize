import meow from "meow"
import { commands } from "./lib/"

const cli = meow(`
	Usage
	  $ cruztomize <path> -e <engine> -c <file> -o <file>
  Parameters:
		<path> Path to overlay folder
	Options
    --output, -o	Output file [Default: standard out]
		--profile, -p	AWS CLI profile [Default: default]
	Description:
		Applies overlays in <path> and performs pre-processing
		before outputting results to stdout or --output path.
`, {
	importMeta: import.meta,
	flags: {
		profile: {
			type: 'string',
			isRequired: false,
			aliases: ['p'],
			default: 'default'
		},
		output: {
			type: 'string',
			isRequired: false,
			aliases: ['o'],
		}
	}
})

const [path] = cli.input

if (path) {
	commands.apply(path, cli.flags)
} else {
	cli.showHelp()
}