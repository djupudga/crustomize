import fs from "fs"
import { getManifest } from "../manifest"
import type { ApplyFunction } from "./types"
import { apply } from "./apply"
import { runAwsCommand } from "../aws"
import ora, { type Ora } from "ora"
import { handleError } from "../errors"
import { hashFile } from "../file-hasher"
import { colorize } from "json-colorizer"
import { cleanUpAwsFiles } from "../cleanup"

function stackExists(stackName: string, profile?: string): boolean {
  const args = ["cloudformation", "describe-stacks", "--stack-name", stackName]
  if (profile) {
    args.push("--profile", profile)
  }
  try {
    runAwsCommand(args)
    return true
  } catch {
    return false
  }
}

export const createChangeSet: ApplyFunction = async (crustomizePath, flags) => {
  let spinner: Ora | undefined
  if (!flags.ci) {
    spinner = ora("Creating CloudFormation change set...").start()
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
      "create-change-set",
      "--stack-name",
      manifest.stack.name,
      "--template-body",
      `file://./${flags.output}/template.yml`,
    ]
    if (flags.profile) {
      args.push("--profile", flags.profile)
    }
    if (manifest.stack.capabilities) {
      args.push("--capabilities", manifest.stack.capabilities.join(" "))
    }
    if (manifest.stack.tags) {
      args.push("--tags")
      Object.entries(manifest.stack.tags).forEach(([key, value]) => {
        args.push(`Key=${key},Value=${value}`)
      })
    }
    //   args.push(
    //     "--tags",
    //     `${Object.entries(manifest.stack.tags)
    //         .map(([key, value]) => `"Key=${key},Value=${value}"`)
    //         .join(" ")}`,
    //   )
    // }
    if (manifest.params) {
      args.push("--parameters", `file://${flags.output}/params.json`)
    }
    if (stackExists(manifest.stack.name, flags.profile)) {
      args.push("--change-set-type", "UPDATE")
    } else {
      args.push("--change-set-type", "CREATE")
    }
    args.push("--change-set-name", `${manifest.stack.name}-cs-${hash}`)

    runAwsCommand(args)

    const waitArgs = [
      "cloudformation",
      "wait",
      "change-set-create-complete",
      "--stack-name",
      manifest.stack.name,
      "--change-set-name",
      `${manifest.stack.name}-cs-${hash}`,
    ]
    if (flags.profile) {
      waitArgs.push("--profile", flags.profile)
    }
    runAwsCommand(waitArgs)

    const describeArgs = [
      "cloudformation",
      "describe-change-set",
      "--stack-name",
      manifest.stack.name,
      "--change-set-name",
      `${manifest.stack.name}-cs-${hash}`,
      "--output",
      "json",
    ]
    if (flags.profile) {
      describeArgs.push("--profile", flags.profile)
    }
    const describeResult = runAwsCommand(describeArgs)
    spinner?.stop()
    console.log(colorize(JSON.parse(describeResult)))
  } catch (e) {
    spinner?.stop()
    cleanUpAwsFiles()
    handleError(e)
  } finally {
    cleanUpAwsFiles()
  }
}