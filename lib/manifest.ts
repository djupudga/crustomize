import Ajv from "ajv"
import crustomizeSchema from "./schemas/crustomize.json"
import fs from "fs"
import { AjvValidationError } from "./errors"
import { yamlParse } from "yaml-cfn"

export type CrustomizeManifest = {
  base: string
  overlays?: string[]
  params?: string
  stack?: {
    name: string
    capabilities?: string[]
    tags?: Record<string, string>
  },
  values: any
}

let cached: Record<string, any> = {}

/**
 * Get the crustomize manifest from the given path.
 * @param crustomizePath The path to the crustomize directory.
 * @returns The crustomize manifest.
 */
export function getManifest(crustomizePath: string): CrustomizeManifest {
  const manifestFilePath = `${crustomizePath}/crustomize.yml`
  if (!cached[manifestFilePath]) {
    if (!fs.existsSync(manifestFilePath)) {
      console.error(`Manifest file not found: ${manifestFilePath}`)
      process.exit(1)
    }
    const manifestFile = fs.readFileSync(manifestFilePath, "utf8").toString()
    cached[manifestFilePath] = yamlParse(manifestFile) as CrustomizeManifest
    const ajv = new Ajv()
    const validate = ajv.compile(crustomizeSchema)
    const valid = validate(cached[manifestFilePath])
    if (!valid) {
      throw new AjvValidationError(validate.errors)
    }
  }
  return cached[manifestFilePath]
}