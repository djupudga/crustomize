import fs from "fs"
import { getManifest } from "../manifest"
import type { ApplyFunction } from "./types"
import { apply } from "./apply"
import { runAwsCommand } from "../aws"
import ora, { type Ora } from "ora"
import { handleError } from "../errors"
import { cleanUpAwsFiles } from "../cleanup"

export const deploy: ApplyFunction = async (crustomizePath, flags) => {
  let spinner: Ora | undefined
  if (!flags.ci) {
    spinner = ora("Deploying CloudFormation stack...").start()
  } else {
    console.log("Deploying CloudFormation stack...")
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
      console.error("'stack' is required in the manifest for deployment.")
      process.exit(1)
    }

    if (!flags.output) {
      fs.mkdirSync("./.crustomize_deploy", { recursive: true })
      flags.output = "./.crustomize_deploy"
    }

    await apply(crustomizePath, flags)

    const args = [
      "cloudformation",
      "deploy",
      "--stack-name",
      manifest.stack.name,
      "--template-file",
      `${flags.output}/template.yml`,
    ]
    if (flags.profile) {
      args.push("--profile", flags.profile)
    }
    if (manifest.stack.capabilities) {
      args.push("--capabilities", manifest.stack.capabilities.join(" "))
    }
    if (manifest.stack.tags) {
      args.push(
        "--tags",
        Object.entries(manifest.stack.tags)
          .map(([key, value]) => `${key}=${value}`)
          .join(" "),
      )
    }
    if (manifest.params) {
      args.push("--parameter-overrides", `file://${flags.output}/params.json`)
    }

    runAwsCommand(args)
    spinner?.stop()

    console.log(`Deployed ${manifest.stack.name}`)
  } catch (e) {
    spinner?.stop()
    if (e instanceof Error) {
      if (e.message.includes("No changes to deploy")) {
        console.log(e.message)
      } else {
        cleanUpAwsFiles()
        handleError(e)
      }
    } else {
      cleanUpAwsFiles()
      handleError(e)
    }
  } finally {
    cleanUpAwsFiles()
  }
}
