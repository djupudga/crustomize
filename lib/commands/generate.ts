import { yamlParse } from "yaml-cfn"
import crustomizeSchema from "../schemas/crustomize.json"
import type { ApplyFunction } from "./types"
import fs from "fs"
import { processYaml } from "../process"
import Ajv from "ajv"
import { AjvValidationError } from "../errors"
import { apply } from "./apply"

function validatePath(path: string) {
  if (fs.lstatSync(path).isDirectory()) {
    throw new Error(
      `The path "${path}" is a directory. Please provide a file path instead.`,
    )
  }
  if (!fs.existsSync(path)) {
    throw new Error(
      `The path "${path}" does not exist. Please provide a valid file path.`,
    )
  }
}

export const generate: ApplyFunction = async (path, flags) => {
  validatePath(path)
  // Load app generation
  const fileStr = fs.readFileSync(path, "utf8").toString()
  const genYamlData = yamlParse(fileStr)
  if (!genYamlData.type) {
    throw new Error(`The file "${path}" does not contain a 'type' field.`)
  }
  const type = genYamlData.type
  if (!flags.repo) {
    throw new Error("The --repo flag is required for the 'generate' command.")
  }
  const repo = flags.repo
  // Begin processing crustomize manifest
  const manifestPath = `${repo}/${type}/crustomize.yml.in`
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest file not found: "${manifestPath}".`)
  }
  const manifestFile = fs.readFileSync(manifestPath, "utf8").toString()
  const processedManifest = processYaml(manifestFile, genYamlData, flags, repo)
  const manifestData = yamlParse(processedManifest)
  const ajv = new Ajv()
  const validateManifest = ajv.compile(crustomizeSchema)
  const valid = validateManifest(manifestData)
  if (!valid) {
    throw new AjvValidationError(validateManifest.errors)
  }
  // Validate generate app schema
  const genSchema = JSON.parse(
    fs.readFileSync(`${repo}/${type}/schema.json`, "utf8").toString(),
  )
  const validateYaml = ajv.compile(genSchema)
  const validYaml = validateYaml(genYamlData)
  if (!validYaml) {
    throw new AjvValidationError(validateYaml.errors)
  }
  try {
    // So far so good. Time to generate things.
    fs.writeFileSync(
      `${repo}/${type}/crustomize.yml`,
      processedManifest,
      "utf8",
    )
    await apply(`${repo}/${type}`, flags)
  } finally {
    fs.unlinkSync(`${repo}/${type}/crustomize.yml`)
  }
}
