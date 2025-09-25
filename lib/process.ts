import ejs from "ejs"
import fs from "fs"
import handlebars from "handlebars"
import type { Flags } from "./commands/types.d"
import { helpers } from "./helpers"
import { yamlParse } from "yaml-cfn"
import path from "path"
import { run } from "./run"

// Data should contain all types in helpers
type Data = {
  env: Record<string, string>
  values: Record<string, any>
} & {
  indent: typeof helpers.indent
  toYaml: (obj: any) => string
  quote: (val: any) => string
  trunc: (i: string, n: number) => string
  toBase64: (s: string) => string
  getFile: (file: string) => string
  fileToBase64: (file: string) => string
  lookupCfOutput: (stackName: string, key: string) => string
  getParameter: (name: string, query?: string) => string
  valueOrDefault: (value: any, defaultValue: any) => any
}

function solvePaths(p: string): string[] {
  const paths: string[] = []
  if (fs.existsSync(p) === false) {
    throw new Error(`Helpers path does not exist: ${p}`)
  }
  if (p.endsWith(".js")) {
    paths.push(p)
  } else if (fs.lstatSync(p).isDirectory()) {
    const dirFiles = fs.readdirSync(p)
    for (const f of dirFiles) {
      if (f.endsWith(".js")) {
        paths.push(path.resolve(p, f))
      }
    }
  } else {
    throw new Error(`Helpers path is not a .js file or directory: ${p}`)
  }
  return paths
}

function loadCustomHelpers(wd: string, data: Data, flags: Flags, renderEngine: "handlebars" | "ejs") {
  let helpersPaths = "crustomize_helpers"
  if (process.env["CRUSTOMIZE_HELPERS"]) {
    helpersPaths = process.env["CRUSTOMIZE_HELPERS"]
  }
  if (flags.helpers) {
    helpersPaths = flags.helpers
  }
  if (!helpersPaths) return

  if (helpersPaths === "crustomize_helpers" && !fs.existsSync(helpersPaths)) {
    return
  }

  const helpers = helpersPaths.split(":")

  for (const helpersPath of helpers) {
    const paths = solvePaths(helpersPath)
    for (const p of paths) {
      if (fs.existsSync(p)) {
        const customHelpers = require(p)
        const args = {
          wd,
          profile: flags.profile,
          run,
        }
        for (const key in customHelpers) {
          if (renderEngine === "handlebars") {
            // @ts-ignore
            handlebars.registerHelper(key, customHelpers[key](args))
          } else if (renderEngine === "ejs") {
            // @ts-ignore
            data[key] = customHelpers[key](args)
          }
        }
      } else {
        throw new Error(`Helpers file not found: ${p}`)
      }
    }
  }
}

export function processYaml(
  yamlString: string,
  values: Record<string, any> | undefined,
  flags: Flags,
  wd: string,
) {
  const data = { values: values || {} } as Data
  data.env = Object.assign({}, process.env) as Record<string, string>
  if (flags.env) {
    const envFile = flags.env
    const env = fs.readFileSync(envFile, "utf8").toString()
    const envData = yamlParse(env)
    if (envData) {
      data.env = Object.assign(data.env, envData)
    }
  }

  if (flags.render === "ejs") {
    data.indent = helpers.indent
    data.toYaml = helpers.toYaml
    data.quote = helpers.quote
    data.trunc = helpers.trunc
    data.toBase64 = helpers.toBase64
    data.getFile = helpers.getFile(wd)
    data.fileToBase64 = helpers.fileToBase64(wd)
    data.lookupCfOutput = helpers.lookupCfOutput(flags.profile)
    data.getParameter = helpers.getParameter(flags.profile)
    data.valueOrDefault = helpers.valueOrDefault

    loadCustomHelpers(wd, data, flags, "ejs")

    return ejs.render(yamlString, data, {
      escape: (s: string) => (s == null ? "" : s),
    })
  } else if (flags.render === "handlebars") {
    handlebars.registerHelper("indent", helpers.indent)
    handlebars.registerHelper("toYaml", helpers.toYaml)
    handlebars.registerHelper("quote", helpers.quote)
    handlebars.registerHelper("trunc", helpers.trunc)
    handlebars.registerHelper("toBase64", helpers.toBase64)
    handlebars.unregisterHelper("getFile")
    handlebars.unregisterHelper("fileToBase64")
    handlebars.registerHelper("getFile", helpers.getFile(wd))
    handlebars.registerHelper("fileToBase64", helpers.fileToBase64(wd))
    handlebars.registerHelper(
      "lookupCfOutput",
      helpers.lookupCfOutput(flags.profile),
    )
    handlebars.registerHelper("valueOrDefault", helpers.valueOrDefault)
    handlebars.registerHelper(
      "getParameter",
      helpers.getParameter(flags.profile),
    )

    loadCustomHelpers(wd, data, flags, "handlebars")

    const template = handlebars.compile(yamlString, { noEscape: true })
    return template(data)
  } else {
    throw new Error(`Unsupported rendering engine: ${flags.render}`)
  }
}