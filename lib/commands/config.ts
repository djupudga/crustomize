import { yamlDump, yamlParse } from "yaml-cfn";
import type { CommandFunction, Flags } from "./types";
import fs from "fs"
import { toCorrectType, validKeys } from "../config";


export const config: CommandFunction = async ([command, location, key, value], flags) => {
  switch (command) {
    case "delete":
      return deleteCmd([location, key], flags)
    case "set":
      return set([location, key, value], flags)
    case "show":
      return show([location], flags)
    default:
      throw new Error(`Unknown config command: ${command}`)
  }
}

const validLocations = ["global", "local"]

function getCrustomizeRcFor(location: string) {
  if (!validLocations.includes(location)) {
    throw new Error(`Invalid location "${location}". Valid locations are: ${validLocations.join(", ")}`)
  }
  if (location === "global") {
    const homeDir = process.env["HOME"]
    return `${homeDir}/.crustomizerc`
  } else {
    return ".crustomizerc"
  }
}

const show: CommandFunction = async ([location], _flags) => {
  if (!location) {
    throw new Error("Location must be provided: show <location>")
  }

  const rcPath = getCrustomizeRcFor(location)
  if (!fs.existsSync(rcPath)) {
    throw new Error(`No config file found at location: ${rcPath}`)
  }
  const file = fs.readFileSync(rcPath, "utf8").toString()
  // const cfg = yamlParse(file) as Record<string, any>
  console.log(file)
  return
}

const deleteCmd: CommandFunction = async ([location, key], _flags) => {
  if (!location || !key) {
    throw new Error("Location and key must be provided: delete <location> <key>")
  }

  if (!validKeys.includes(key as keyof Flags)) {
    throw new Error(`Invalid key "${key}". Valid keys are: ${validKeys.join(", ")}`)
  }

  const rcPath = getCrustomizeRcFor(location)
  if (!fs.existsSync(rcPath)) {
    throw new Error(`No config file found at location: ${rcPath}`)
  }
  const file = fs.readFileSync(rcPath, "utf8").toString()
  const cfg = yamlParse(file) as Record<string, any>
  delete cfg[key]
  fs.writeFileSync(rcPath, yamlDump(cfg))
  return
}

const set: CommandFunction = async ([location, key, value], _flags) => {
  if (!location || !key || !value) {
    throw new Error("Location,  key and value must be provided: set <location> <key> <value>")
  }

  if (!validKeys.includes(key as keyof Flags)) {
    throw new Error(`Invalid key "${key}". Valid keys are: ${validKeys.join(", ")}`)
  }

  const rcPath = getCrustomizeRcFor(location)
  if (!fs.existsSync(rcPath)) {
    fs.writeFileSync(rcPath, "{}")
  }
  const file = fs.readFileSync(rcPath, "utf8").toString()
  const cfg = yamlParse(file) as Record<string, any>
  cfg[key] = toCorrectType(value)
  fs.writeFileSync(rcPath, yamlDump(cfg))
}