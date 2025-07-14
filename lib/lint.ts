import { spawnSync } from "child_process"
import { run } from "./run"
import path from "path"
import os from "os"
import fs from "fs"
import { cleanUpAwsFiles } from "./cleanup"

/**
 * Lint a CloudFormation template using cfn-lint.
 * @param crustomizePath - The path to the CloudFormation template to lint.
 */
export function lint(crustomizePath: string) {
  try {
    run("cfn-lint", ["--version"])
  } catch {
    console.error(
      "cfn-lint is not installed. Please install it with `pip install cfn-lint`.",
    )
    process.exit(1)
  }

  const result = spawnSync("cfn-lint", [crustomizePath], { encoding: "utf-8" })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    console.error("cfn-lint exit code: " + result.status)
    console.error(result.stdout)
    console.error(result.stderr)
    console.error("cfn-lint failed. Please fix the errors above and try again.")
    process.exit(1)
  }
}

/**
 * Lint a CloudFormation template from stdin using cfn-lint.
 * @param result - The CloudFormation template as a string.
 */
export function lintStdin(result: string) {
  try {
    run("cfn-lint", ["--version"])
  } catch {
    console.error(
      "cfn-lint is not installed. Please install it with `pip install cfn-lint`.",
    )
    process.exit(1)
  }
  const tmpFile = path.join(os.tmpdir(), "template.tmp.yaml")
  try {
    // Write the result to a temporary file
    fs.writeFileSync(tmpFile, result)

    const resultProcess = spawnSync("cfn-lint", [tmpFile], {
      encoding: "utf-8",
    })

    if (resultProcess.error) {
      throw resultProcess.error
    }

    if (resultProcess.status !== 0) {
      let msg = `cfn-lint failed with exit code ${resultProcess.status}.\n`
      msg += "Errors:\n"
      msg += (resultProcess.stdout || "").trim() + "\n"
      msg += (resultProcess.stderr || "").trim() + "\n"
      msg += "Please fix the errors above and try again.\n"
      throw new Error(msg)
    }
  } finally {
    cleanUpAwsFiles(tmpFile)
  }
}
