import { yamlParse } from "yaml-cfn"
import crustomizeSchema from "../schemas/crustomize.json"
import type { CommandFunction, Flags } from "./types"
import fs from "fs"
import { processYaml } from "../process"
import Ajv from "ajv"
import { AjvValidationError } from "../errors"
import { apply } from "./apply"
import { runAwsCommand } from "../aws"

function validatePath(path: string) {
  if (!path) {
    throw new Error("--repo [path] is required with the 'generate' command.")
  }

  if (path.startsWith("s3://")) {
    // Must not be a file (with an extension)
    if (path.split("/").pop()?.includes(".")) {
      throw new Error(
        `The S3 path "${path}" appears to be a file. Please provide a directory path instead.`,
      )
    }
    // Must have at least bucket and prefix
    const s3Parts = path.replace("s3://", "").split("/")
    if (s3Parts.length < 2) {
      throw new Error(
        `The S3 path "${path}" is not valid. Please provide a full S3 path including bucket and prefix.`,
      )
    }
  } else {
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
}

function downloadFromS3(s3Url: string, localDir: string, flags: Flags) {
  const args = ["s3", "sync", s3Url, localDir]
  if (flags.profile) {
    args.push("--profile", flags.profile)
  }
  runAwsCommand(args)
}

export const generate: CommandFunction = async ([path], flags) => {
  validatePath(path)
  // Load app generation
  const fileStr = fs.readFileSync(path, "utf8").toString()
  const genYamlData: Record<string, any> = yamlParse(fileStr)
  if (!genYamlData["type"]) {
    throw new Error(`The file "${path}" does not contain a 'type' field.`)
  }
  const type = genYamlData["type"]
  // Process repo
  if (!flags.repo) {
    throw new Error("The --repo flag is required for the 'generate' command.")
  }
  let repo = flags.repo

  if (repo.startsWith("s3://")) {
    const repoPath = repo.replace("s3://", "")
    const repoDir = `./.repo/${repoPath}`
    fs.mkdirSync(repoDir, { recursive: true })
    downloadFromS3(repo, repoDir, flags)
    repo = repoDir
  }
  // Validate schemas
  const ajv = new Ajv()
  // Validate generate app schema
  const genSchema = JSON.parse(
    fs.readFileSync(`${repo}/${type}/schema.json`, "utf8").toString(),
  )
  const validateYaml = ajv.compile(genSchema)
  const validYaml = validateYaml(genYamlData)
  if (!validYaml) {
    const e = new AjvValidationError("Manifest validation error", validateYaml.errors)
    console.error(e.message)
    console.error(JSON.stringify(validateYaml.errors, null, 2))
    process.exit(1)
  }
  // Begin processing crustomize manifest
  const manifestPath = `${repo}/${type}/crustomize.yml.in`
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest file not found: "${manifestPath}".`)
  }
  const manifestFile = fs.readFileSync(manifestPath, "utf8").toString()
  const processedManifest = processYaml(manifestFile, genYamlData, flags, repo)
  const manifestData = yamlParse(processedManifest)
  const validateManifest = ajv.compile(crustomizeSchema)
  const valid = validateManifest(manifestData)
  if (!valid) {
    const e = new AjvValidationError("Validation failed for crustomize.yml", validateManifest.errors)
    console.error(e.message)
    console.error(JSON.stringify(validateManifest.errors, null, 2))
    process.exit(1)
  }
  try {
    // So far so good. Time to generate things.
    fs.writeFileSync(
      `${repo}/${type}/crustomize.yml`,
      processedManifest,
      "utf8",
    )
    await apply([`${repo}/${type}`], flags)
  } finally {
    fs.unlinkSync(`${repo}/${type}/crustomize.yml`)
  }
}