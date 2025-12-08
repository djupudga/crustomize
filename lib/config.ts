import fs from "fs"
import path from "path"
import { yamlParse } from "yaml-cfn"
import type { Flags } from "./commands/types.d"

export const validKeys = [
  "env",
  "lint",
  "output",
  "profile",
  "render",
  "silent",
  "ci",
  "repo",
] as (keyof Flags)[]

export function toCorrectType(value: string): string | boolean {
  if (value.toLowerCase() === "true") {
    return true
  } else if (value.toLowerCase() === "false") {
    return false
  } else {
    return value
  }
}

function findConfigFile(): string {
  const localPath = path.resolve(process.cwd(), ".crustomizerc")
  if (fs.existsSync(localPath)) {
    return path.resolve(process.cwd(), localPath)
  }
  const homeDir = process.env["HOME"]
  if (homeDir) {
    const globalPath = path.resolve(homeDir, ".crustomizerc")
    if (fs.existsSync(globalPath)) {
      return path.resolve(globalPath)
    }
  }
  return path.resolve(process.cwd(), localPath)
}

export function applyConfig(flags: Flags): Flags {
  const copy = { ...flags }
  const configPath = flags.config
    ? path.resolve(process.cwd(), flags.config)
    : findConfigFile()
  if (fs.existsSync(configPath)) {
    try {
      const file = fs.readFileSync(configPath, "utf8").toString()
      const cfg = yamlParse(file) as Record<string, any>
      for (const [key, value] of Object.entries(cfg)) {
        if (!validKeys.includes(key as keyof Flags)) {
          throw new Error(
            `Error reading .crustomizerc - unknown config key: ${key}`,
          )
        }
        copy[key as keyof Flags] = value
      }
    } catch (e) {
      console.error(`Unable to load config file: ${configPath}`)
      console.error((e as Error).message)
      process.exit(1)
    }
  }
  // Set default values if not already set
  if (!copy.render) {
    copy.render = "handlebars"
  }
  if (!copy.profile) {
    // TODO: Remove this and use system defaults
    copy.profile = process.env["AWS_PROFILE"] ?? "default"
  }
  return copy
}