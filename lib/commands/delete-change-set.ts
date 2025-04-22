import fs from "fs"
import { getManifest } from "../manifest";
import type { ApplyFunction } from "./types";
import { apply } from "./apply";
import { runAwsCommand } from "../aws";
import ora, { type Ora } from "ora"
import { handleError } from "../errors";
import { hashFile } from "../file-hasher";

export const deleteChangeSet: ApplyFunction = async (crustomizePath, flags) => {
  let spinner: Ora | undefined
  if (!flags.silent) {
    spinner = ora("Deleting CloudFormation change set...").start()
  } else {
    console.log("Deleting CloudFormation change set...")
  }
  try {
    if (crustomizePath.endsWith("/")) {
      crustomizePath = crustomizePath.slice(0, -1)
    }

    const manifest = getManifest(crustomizePath)

    if (!manifest.stack) {
      console.error("'stack' is required in the manifest for this operation.")
      process.exit(1)
    }

    if (!flags.output) {
      fs.mkdirSync('./.crustomize_deploy', { recursive: true })
      flags.output = './.crustomize_deploy'
    }

    apply(crustomizePath, flags)

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
    handleError(e)
  } finally {
    if (
      fs.existsSync("./.crustomize_deploy") && 
      fs.lstatSync("./.crustomize_deploy").isDirectory()
    ) {
      fs.rmdirSync("./.crustomize_deploy", { recursive: true })
    }
  }
}