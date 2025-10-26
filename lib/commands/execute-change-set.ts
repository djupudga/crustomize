import fs from "fs"
import { getManifest } from "../manifest"
import type { ApplyFunction } from "./types"
import { apply } from "./apply"
import { runAwsCommand } from "../aws"
import ora, { type Ora } from "ora"
import { handleError } from "../errors"
import { hashFile } from "../file-hasher"
import { cleanUpAwsFiles } from "../cleanup"
import { firePostHooks, firePreHooks } from "../hooks"

export const executeChangeSet: ApplyFunction = async (
  crustomizePath,
  flags,
) => {
  let spinner: Ora | undefined
  if (!flags.ci) {
    spinner = ora("Executing CloudFormation change set...").start()
  } else {
    console.log("Executing CloudFormation change set...")
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

    const customResources = await apply(crustomizePath, flags)

    const hash = await hashFile(`${flags.output}/template.yml`)

    await firePreHooks(flags, customResources)

    const args = [
      "cloudformation",
      "execute-change-set",
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
    await firePostHooks(flags, customResources)

    console.log(`Change set ${manifest.stack.name}-cs-${hash} executed`)

    spinner?.stop()
  } catch (e) {
    spinner?.stop()
    cleanUpAwsFiles()
    handleError(e)
  } finally {
    cleanUpAwsFiles()
  }
}
