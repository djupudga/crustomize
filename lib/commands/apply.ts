import fs from "fs"
import path from "path"
import { handleError } from "../errors"
import { yamlDump, yamlParse } from "yaml-cfn"
import { processYaml } from "../process"
import deepmerge from "deepmerge"
import { lint } from "../lint"
import type { ApplyFunction } from "./types.d"
import { getManifest } from "../manifest"


type BaseFiles = Record<string, any>
type OverlayFiles = Record<string, any>

export const apply: ApplyFunction = async (crustomizePath, flags) => {
  if (crustomizePath.endsWith("/")) {
    crustomizePath = crustomizePath.slice(0, -1)
  }
  try {
    const manifest = getManifest(crustomizePath)
    
    // If the manifest defines params, then the --output parameter is required.
    if (manifest.params && !flags.output) {
      console.error(
        "The --output parameter is required when the manifest defines params.",
      )
      process.exit(1)
    }

    // Load all files in the base directory.
    const baseFiles: BaseFiles = {}
    const basePath = path.resolve(crustomizePath, manifest.base)
    const baseFileNames = fs.readdirSync(basePath)
    baseFileNames.forEach((fileName) => {
      const filePath = `${basePath}/${fileName}`
      if (!fs.lstatSync(filePath).isFile()) return
      const fileStr = fs.readFileSync(filePath, "utf8").toString()
      const file = processYaml(fileStr, manifest, flags, basePath)
      baseFiles[fileName] = yamlParse(file) || {}
    })
    // Load all overlay files
    const overlayFiles: OverlayFiles = {}
    const overlayPaths = (manifest.overlays || []).map((overlay) =>
      path.resolve(crustomizePath, overlay),
    )
    overlayPaths.forEach((overlayPath) => {
      const filePath = `${overlayPath}`
      if (!fs.lstatSync(filePath).isFile()) return
      const fileStr = fs.readFileSync(filePath, "utf8").toString()
      const file = processYaml(fileStr, manifest, flags, overlayPath)
      const fileName = overlayPath.split("/").pop() as string
      overlayFiles[fileName] = yamlParse(file) || {}
    })
    // Apply the overlay files to the base files
    for (const [fileName, baseFile] of Object.entries(baseFiles)) {
      const overlayFile = overlayFiles[fileName]
      if (overlayFile) {
        baseFiles[fileName] = deepmerge(baseFile, overlayFile)
      }
    }
    // Finally merge all files into a single object
    let merged = {}
    for (const baseFile of Object.values(baseFiles)) {
      merged = deepmerge(merged, baseFile)
    }
    const result = yamlDump(merged)
    // Write out the results
    if (flags.output) {
      if (!fs.lstatSync(flags.output).isDirectory()) {
        console.error(
          `Output path "${flags.output}" is not a folder. Please specify a folder.`,
        )
        process.exit(1)
      } else {
        fs.writeFileSync(path.join(flags.output, "template.yml"), result)
      }
    } else {
      console.log(result)
    }
    if (manifest.params) {
      const paramsPath = path.resolve(crustomizePath, manifest.params)
      const paramsYaml = processYaml(
        fs.readFileSync(paramsPath, "utf8").toString(),
        manifest,
        flags,
        path.resolve(crustomizePath),
      )
      if (flags.output) {
        const paramsJson = yamlParse(paramsYaml)
        fs.writeFileSync(
          path.join(flags.output, "params.json"),
          JSON.stringify(paramsJson, null, 2)
        )
      }
    }
    if (flags.output) {
      lint(path.join(flags.output, "template.yml"))
    }
  } catch (err) {
    if (process.env["DEBUG"]) console.error(err)
    handleError(err, crustomizePath)
  }
}