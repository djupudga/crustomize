import ejs from "ejs"
import type { CrustomizeManifest, Flags } from "./apply"
import { helpers } from "./helpers"
import handlebars from "handlebars"

// Data should contain all types in helpers
type Data = {
	env: Record<string, string>
	values: Record<string, string>
} & {
	indent: typeof helpers.indent
	toYaml: (obj: any) => string
	quote: (val: any) => string
	trunc: (i: string, n: number) => string
	toBase64: (s: string) => string
	getFile: (file: string) => string
	fileToBase64: (file: string) => string
	lookupCfOutput: (stackName: string, key: string) => string
}

export function processYaml(
	yamlString: string,
	manifest: CrustomizeManifest,
	flags: Flags,
	wd: string,
) {
	const data = { values: manifest.values || {} } as Data
	data.env = Object.assign({}, process.env) as Record<string, string>

	if (flags.engine === "ejs") {
		data.indent = helpers.indent
		data.toYaml = helpers.toYaml
		data.quote = helpers.quote
		data.trunc = helpers.trunc
		data.toBase64 = helpers.toBase64
		data.getFile = helpers.getFile(wd)
		data.fileToBase64 = helpers.fileToBase64(wd)
		data.lookupCfOutput = helpers.lookupCfOutput(flags.profile)

		return ejs.render(yamlString, data, {
			escape: (s: string) => s == null ? "" : s }
		)
	} else if (flags.engine === "handlebars") {
    handlebars.registerHelper('indent', helpers.indent)
    handlebars.registerHelper('toYaml', helpers.toYaml)
    handlebars.registerHelper('quote', helpers.quote)
    handlebars.registerHelper('trunc', helpers.trunc)
    handlebars.registerHelper('toBase64', helpers.toBase64)
		handlebars.unregisterHelper('getFile')
		handlebars.unregisterHelper('fileToBase64')
		handlebars.registerHelper('getFile', helpers.getFile(wd))
		handlebars.registerHelper('fileToBase64', helpers.fileToBase64(wd))
		handlebars.registerHelper('lookupCfOutput', helpers.lookupCfOutput(flags.profile))
		const template = handlebars.compile(yamlString, { noEscape: true })
		return template(data)
	} else {
		throw new Error(`Unsupported engine: ${flags.engine}`)
	}
}