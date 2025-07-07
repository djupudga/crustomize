import fs from "fs"
import path from "path"
import { yamlParse } from "yaml-cfn"

export function applyConfig(flags: Record<string, any>) {
  const configPath = flags.config
    ? path.resolve(process.cwd(), flags.config)
    : path.resolve(process.cwd(), ".crustomizerc")
  if (fs.existsSync(configPath)) {
    try {
      const file = fs.readFileSync(configPath, "utf8").toString()
      const cfg = yamlParse(file) as Record<string, any>
      for (const [key, value] of Object.entries(cfg)) {
        if (flags[key] === undefined || flags[key] === "") {
          flags[key] = value
        }
      }
    } catch (_) {
      console.error(`Unable to load config file: ${configPath}`)
    }
  }
}

