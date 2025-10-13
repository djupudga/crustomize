import fs from "fs"
import path from "path"
import { handleError } from "../errors"
import { yamlDump, yamlParse } from "yaml-cfn"
import { processYaml } from "../process"
import deepmerge from "deepmerge"
import { lint, lintStdin } from "../lint"
import type { ApplyFunction, Flags } from "./types.d"
import { getManifest } from "../manifest"
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"
import { jsonpatch } from "json-p3"

type BaseFiles = Record<string, any>
type OverlayFiles = Record<string, any>

async function getS3Files(
  base: string,
  flags: Flags,
  values: Record<string, any>,
  stack?: Record<string, any>
): Promise<BaseFiles> {
  const options = flags.profile ? { profile: flags.profile } : {}
  const s3 = new S3Client(options)
  const bucket = base.split("/")[2]
  const prefix = base.split("/").slice(3).join("/")
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  })
  const response = await s3.send(command)
  if (!response.Contents) return {}

  const files: BaseFiles = {}
  for (const item of response.Contents) {
    if (!item.Key) continue
    if (item.Key.endsWith(".yaml") || item.Key.endsWith(".yml")) {
      const key = item.Key
      const params = {
        Bucket: bucket,
        Key: key,
      }
      const output = await s3.send(new GetObjectCommand(params))
      const fileStr = await output.Body?.transformToString()
      if (fileStr) {
        const file = processYaml(fileStr, values, flags, base, stack)
        const fileName = key.split("/").pop() as string
        files[fileName] = yamlParse(file) || {}
      }
    }
  }
  return files
}

function ymlFilter(fileName: string): boolean {
  return fileName.endsWith(".yaml") || fileName.endsWith(".yml")
}

async function getBaseFiles(
  base: string,
  crustomizePath: string,
  flags: Flags,
  values: Record<string, any>,
  stack?: Record<string, any>,
): Promise<BaseFiles> {
  if (base.startsWith("s3://")) {
    return getS3Files(base, flags, values, stack)
  } else {
    const basePath = path.resolve(crustomizePath, base)
    const baseFileNames = fs.readdirSync(basePath).filter(ymlFilter)
    const baseFiles = baseFileNames.reduce<BaseFiles>((acc, fileName) => {
      const filePath = `${basePath}/${fileName}`
      if (!fs.lstatSync(filePath).isFile()) return acc

      const fileStr = fs.readFileSync(filePath, "utf8").toString()
      const file = processYaml(fileStr, values, flags, basePath, stack)
      acc[fileName] = yamlParse(file) || {}
      return acc
    }, {})
    return baseFiles
  }
}

export const apply: ApplyFunction = async (crustomizePath, flags) => {
  if (crustomizePath.endsWith("/")) {
    crustomizePath = crustomizePath.slice(0, -1)
  }
  try {
    const manifest = getManifest(crustomizePath)

    // Manifest values override any provided flags
    if (manifest.render) {
      flags.render = manifest.render
    }
    if (manifest.profile) {
      flags.profile = manifest.profile
    }

    // If the manifest defines params, then the --output parameter is required.
    if (manifest.params && !flags.output) {
      console.error(
        "The --output parameter is required when the manifest defines params.",
      )
      process.exit(1)
    }

    // Load all files in the base directory.
    const baseFiles = await getBaseFiles(
      manifest.base,
      crustomizePath,
      flags,
      manifest.values,
      manifest.stack
    )

    // Load all overlay files
    const overlayFiles: OverlayFiles = {}
    const overlayPaths = (manifest.overlays || []).map((overlay) =>
      path.resolve(crustomizePath, overlay),
    )
    overlayPaths.forEach((overlayPath) => {
      const filePath = `${overlayPath}`
      if (!fs.lstatSync(filePath).isFile()) return
      const fileStr = fs.readFileSync(filePath, "utf8").toString()
      const file = processYaml(fileStr, manifest.values, flags, overlayPath, manifest.stack)
      const fileName = overlayPath.split("/").pop() as string
      overlayFiles[fileName] = yamlParse(file) || {}
    })

    // Merge all base files into a single object
    let merged = {}
    for (const baseFile of Object.values(baseFiles)) {
      merged = deepmerge(merged, baseFile)
    }
    // Merge all overlay files into the merged object
    for (const overlayFile of Object.values(overlayFiles)) {
      merged = deepmerge(merged, overlayFile)
    }
    // Apply JSON patches, if there are any
    if (manifest.patches) {
      merged = jsonpatch.apply(manifest.patches, merged) as any
    }

    const result = yamlDump(merged)

    // Write out the results
    if (flags.output) {
      if (!fs.existsSync(flags.output)) {
        fs.mkdirSync(flags.output, { recursive: true })
      }
      if (!fs.lstatSync(flags.output).isDirectory()) {
        console.error(
          `Output path "${flags.output}" is not a folder. Please specify a folder.`,
        )
        process.exit(1)
      } else {
        fs.writeFileSync(path.join(flags.output, "template.yml"), result)
      }
      if (flags.lint) {
        lint(path.join(flags.output, "template.yml"))
      }
    } else {
      if (flags.lint) {
        lintStdin(result)
      }
      console.log(result)
    }
    if (manifest.params) {
      const paramsPath = path.resolve(crustomizePath, manifest.params)
      const paramsYaml = processYaml(
        fs.readFileSync(paramsPath, "utf8").toString(),
        manifest.values,
        flags,
        path.resolve(crustomizePath),
        manifest.stack,
      )
      if (flags.output) {
        const paramsJson = yamlParse(paramsYaml)
        fs.writeFileSync(
          path.join(flags.output, "params.json"),
          JSON.stringify(paramsJson, null, 2),
        )
      }
    }
  } catch (err) {
    if (process.env["DEBUG"]) console.error(err)
    handleError(err)
  }
}