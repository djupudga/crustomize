import { yamlDump, yamlParse } from "yaml-cfn";
import type { CommandFunction, Flags } from "./types";
import fs from "fs"
import { getCrustomizeRcFor, toCorrectType, validKeys } from "../config";


export const config: CommandFunction = async ([command, location, key, value], flags) => {
  if (!value) {
    value = key
    key = location
    location = "local"
  }
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

const show: CommandFunction = async ([location], _flags) => {
  const rcPath = getCrustomizeRcFor(location)
  if (!fs.existsSync(rcPath)) {
    throw new Error(`No config file found at location: ${rcPath}`)
  }
  const file = fs.readFileSync(rcPath, "utf8").toString()
  console.log(file)
  return
}

const deleteCmd: CommandFunction = async ([location, key], _flags) => {
  if (!key) {
    throw new Error("key must be provided: delete [location] <key>")
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
  if (!key) {
    throw new Error("key must be provided: set [location] <key> <value>")
  }
  if (!value) {
    throw new Error("value must be provided: set [location] <key> <value>")
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