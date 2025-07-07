import fs from "fs"
import path from "path"
import { yamlParse } from "yaml-cfn"
import type { Flags } from "./commands/types.d"

export function applyConfig(flags: Flags) {
  const configPath = flags.config
    ? path.resolve(process.cwd(), flags.config)
    : path.resolve(process.cwd(), ".crustomizerc")
  if (fs.existsSync(configPath)) {
    try {
      const file = fs.readFileSync(configPath, "utf8").toString()
      const cfg = yamlParse(file) as Record<string, any>
      const validKeys = [
        "env",
        "lint",
        "output",
        "profile",
        "render",
        "silent",
      ] as (keyof Flags)[]
      for (const [key, value] of Object.entries(cfg)) {
        if (!validKeys.includes(key as keyof Flags)) {
          throw new Error(`Error reading .crustomizerc - unknown config key: ${key}`)

        }
        if (flags[key as keyof Flags] === undefined || flags[key as keyof Flags] === "") {
          flags[key as keyof Flags] = value
        }
      }
      // Set default values if not already set
      if (flags.render === undefined) {
        flags.render = "handlebars"
      }
      if (flags.profile === undefined) {
        flags.profile = "default"
      }
    } catch (e) {
      console.error(`Unable to load config file: ${configPath}`)
      console.error((e as Error).message)
      process.exit(1)
    }
  }
}
