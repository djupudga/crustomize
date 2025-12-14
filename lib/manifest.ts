import Ajv from "ajv"
import crustomizeSchema from "./schemas/crustomize.json"
import fs from "fs"
import { AjvValidationError } from "./errors"
import { yamlParse } from "yaml-cfn"

type JsonPatch = {
  op: string
  path: string
  value?: any
}

export type ArrayMergeStrategy = "replace" | "append"

type OverlayComplex = {
  file: string
  arrayMerge: ArrayMergeStrategy
}

type Overlay = string | OverlayComplex

export type NormalizedOverlay = {
  file: string
  arrayMerge: "replace" | "append"
}

export function normalizeOverlay(overlay: Overlay): NormalizedOverlay {
  if (typeof overlay === "string") {
    return { file: overlay, arrayMerge: "append" }
  } else {
    return overlay
  }
}

export type CrustomizeManifest = {
  base: string
  overlays?: Overlay[]
  params?: string
  render?: string
  profile?: string
  stack?: {
    name: string
    capabilities?: string[]
    tags?: Record<string, string>
  }
  values: any
  patches?: JsonPatch[]
}

function traverseAndExpand(obj: any, vars: Record<string, string>): any {
  if (typeof obj === "string") {
    let result = obj
    for (const [key, value] of Object.entries(vars)) {
      const varPattern = new RegExp(`\\$\\{${key}\\}`, "g")
      result = result.replace(varPattern, value)
    }
    return result
  } else if (Array.isArray(obj)) {
    return obj.map((item) => traverseAndExpand(item, vars))
  } else if (typeof obj === "object" && obj !== null) {
    const newObj: any = {}
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = traverseAndExpand(value, vars)
    }
    return newObj
  } else {
    return obj
  }
}

function expandVars(obj: any): any {
  const vars = obj["vars"] || {}
  let results = traverseAndExpand(obj, vars)
  delete results["vars"]
  return results
}

let cached: Record<string, any> = {}

/**
 * Get the crustomize manifest from the given path.
 * @param crustomizePath The path to the crustomize directory.
 * @returns The crustomize manifest.
 */
export function getManifest(crustomizePath: string): CrustomizeManifest {
  const manifestFilePath = normalizeManifestPath(crustomizePath)
  if (!cached[manifestFilePath]) {
    if (!fs.existsSync(manifestFilePath)) {
      console.error(`Manifest file not found: ${manifestFilePath}`)
      process.exit(1)
    }
    const manifestFile = fs.readFileSync(manifestFilePath, "utf8").toString()
    cached[manifestFilePath] = expandVars(yamlParse(manifestFile) as CrustomizeManifest)
    const ajv = new Ajv()
    const validate = ajv.compile(crustomizeSchema)
    const valid = validate(cached[manifestFilePath])
    if (!valid) {
      throw new AjvValidationError("Failed to validate crustomize.yml", validate.errors)
    }
    // Basic structure has been validated. Now we check if there is a
    // path/to/base/.meta/values-schema.json file and validate the values
    // against it.
    const basePath = `${crustomizePath}/${cached[manifestFilePath].base}`
    const valuesSchemaPath = `${basePath}/.meta/values-schema.json`
    if (fs.existsSync(valuesSchemaPath)) {
      const valuesSchemaFile = fs.readFileSync(valuesSchemaPath, "utf8").toString()
      const valuesSchema = JSON.parse(valuesSchemaFile)
      const validateValues = ajv.compile(valuesSchema)
      const validValues = validateValues(cached[manifestFilePath].values)
      if (!validValues) {
      
        throw new AjvValidationError("Incorrect 'values' in crustomize.yml", validateValues.errors)
      }
    }
  }
  return cached[manifestFilePath]
}

/**
 * Normalize the manifest path to ensure it points to crustomize.yml
 * @param crustomizePath The path to the crustomize directory or manifest file.
 * @returns The normalized path to crustomize.yml
 */
function normalizeManifestPath(crustomizePath: string): string {
  if (crustomizePath.endsWith("crustomize.yml")) {
    return crustomizePath
  } else if (crustomizePath.endsWith("/")) {
    return `${crustomizePath}crustomize.yml`
  } else {
    return `${crustomizePath}/crustomize.yml`
  }
}