import fs from "fs"
import path from "path"
import { apply } from "./apply"
import { runAwsCommand } from "../aws"
import { lint } from "../lint"
import { handleError } from "../errors"
import { cleanUpAwsFiles } from "../cleanup"
import type { ApplyFunction } from "./types.d"

export const validate: ApplyFunction = async (crustomizePath, flags) => {
  try {
    if (crustomizePath.endsWith("/")) {
      crustomizePath = crustomizePath.slice(0, -1)
    }

    if (!flags.output) {
      fs.mkdirSync("./.crustomize_deploy", { recursive: true })
      flags.output = "./.crustomize_deploy"
    }

    const applyFlags = { ...flags, lint: false }
    await apply(crustomizePath, applyFlags)

    const args = [
      "cloudformation",
      "validate-template",
      "--template-body",
      `file://./${flags.output}/template.yml`,
      "--output",
      "json",
    ]
    if (flags.profile) {
      args.push("--profile", flags.profile)
    }

    const result = runAwsCommand(args)
    console.log(result.trim())

    if (flags.lint) {
      lint(path.join(flags.output, "template.yml"))
    }
  } catch (err) {
    handleError(err)
  } finally {
    cleanUpAwsFiles()
  }
}
