import fs from "fs"
import { getManifest } from "../manifest";
import type { ApplyFunction } from "./types";
import { apply } from "./apply";
import { runAwsCommand } from "../aws";
import ora, { type Ora } from "ora"
import { handleError } from "../errors";

export const deploy: ApplyFunction = async (crustomizePath, flags) => {
  let spinner: Ora | undefined
  if (!flags.silent) {
    spinner = ora("Deploying CloudFormation stack...").start()
  } else {
    console.log("Deploying CloudFormation stack...")
  }
  try {
    if (crustomizePath.endsWith("/")) {
      crustomizePath = crustomizePath.slice(0, -1)
    }

    const manifest = getManifest(crustomizePath)

    if (!manifest.stack) {
      console.error("'stack' is required in the manifest for deployment.")
      process.exit(1)
    }

    if (!flags.output) {
      fs.mkdirSync('./.crustomize_deploy', { recursive: true })
      flags.output = './.crustomize_deploy'
    }

    apply(crustomizePath, flags)

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
      args.push(
        "--capabilities",
        manifest.stack.capabilities.join(" "),
      )
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
      args.push("--parameter-file", `${flags.output}/params.json`)
    }

    runAwsCommand(args)
    spinner?.stop()

    console.log(`Deployed ${manifest.stack.name}`)
  } catch(e) {
    spinner?.stop()
    if (e instanceof Error) {
      if (e.message.includes("No changes to deploy")) {
        console.log(e.message)
      } else {
        handleError(e, crustomizePath)
      }
    } else {
      handleError(e, crustomizePath)
    }
      
  } finally {
    if (
      fs.existsSync("./.crustomize_deploy") && 
      fs.lstatSync("./.crustomize_deploy").isDirectory()
    ) {
      fs.rmdirSync("./.crustomize_deploy", { recursive: true })
    }
  }
}