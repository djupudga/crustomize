import fs from "fs"
import { getManifest } from "../manifest"
import type { ApplyFunction } from "./types"
import { apply } from "./apply"
import { runAwsCommand } from "../aws"
import ora, { type Ora } from "ora"
import { handleError } from "../errors"
import { hashFile } from "../file-hasher"
import { cleanUpAwsFiles } from "../cleanup"

export const deleteChangeSet: ApplyFunction = async (crustomizePath, flags) => {
  let spinner: Ora | undefined
  if (!flags.ci) {
    spinner = ora("Deleting CloudFormation change set...").start()
  } else {
    console.log("Deleting CloudFormation change set...")
  }
  try {
    if (crustomizePath.endsWith("/")) {
      crustomizePath = crustomizePath.slice(0, -1)
    }

    const manifest = getManifest(crustomizePath)

    // Manifest values override any provided flags
    if (manifest.render) {
      flags.render = manifest.render
    }
    if (manifest.profile) {
      flags.profile = manifest.profile
    }

    if (!manifest.stack) {
      console.error("'stack' is required in the manifest for this operation.")
      process.exit(1)
    }

    if (!flags.output) {
      fs.mkdirSync("./.crustomize_deploy", { recursive: true })
      flags.output = "./.crustomize_deploy"
    }

    await apply(crustomizePath, flags)

    const hash = await hashFile(`${flags.output}/template.yml`)

    const args = [
      "cloudformation",
      "delete-change-set",
      "--stack-name",
      manifest.stack.name,
      "--output",
      "json",
    ]
    if (flags.profile) {
      args.push("--profile", flags.profile)
    }
    args.push("--change-set-name", `${manifest.stack.name}-cs-${hash}`)

    runAwsCommand(args)

    spinner?.stop()
    console.log(`Change set ${manifest.stack.name}-cs-${hash} deleted`)
  } catch (e) {
    spinner?.stop()
    cleanUpAwsFiles()
    handleError(e)
  } finally {
    cleanUpAwsFiles()
  }
}
