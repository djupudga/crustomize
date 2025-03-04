import Ajv from "ajv"
import crustomizeSchema from "./schemas/crustomize.json"
import fs from "fs"
import path from "path"
import { AjvValidationError, handleError } from "./errors"
import {yamlDump, yamlParse} from "yaml-cfn"
import { processYaml } from "./process"
import deepmerge from "deepmerge"
import * as patch from "fast-json-patch"

export type Flags = {
	profile: string
	output: string | undefined
};

export type ApplyFunction = (path: string, flags: Flags) => void

export type CrustomizeManifest = {
	base: string
	overlays?: string[]
  params?: string
	values: any
}
type BaseFiles = Record<string, any>
type OverlayFiles = Record<string, any>

export const apply: ApplyFunction = (
	crustomizePath,
	flags,
) => {
	if (crustomizePath.endsWith("/")) {
		crustomizePath = crustomizePath.slice(0, -1)
	}
	try {
		const manifestFilePath = `${crustomizePath}/crustomize.yml`
		const manifestFile = fs.readFileSync(manifestFilePath, "utf8").toString()
		const manifest = yamlParse(manifestFile) as CrustomizeManifest
		const ajv = new Ajv()
		const validate = ajv.compile(crustomizeSchema)
		const valid = validate(manifest)
		if (!valid) {
			throw new AjvValidationError(validate.errors)
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
		// Write results to --output file
		if (flags.output) {
			fs.writeFileSync(path.join(flags.output, "crusted.yml"), result)
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
				fs.writeFileSync(path.join(flags.output, "params.yml"), paramsYaml)
			} else {
				console.log("\n---\n")
				console.log("# Params file")
				console.log(paramsYaml)
			}
		}

	} catch (err) {
		if (process.env["DEBUG"]) console.error(err)
		handleError(err, crustomizePath)
	}
}