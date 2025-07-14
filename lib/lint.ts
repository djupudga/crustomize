import { spawnSync } from "child_process"
import { run } from "./run"
import path from "path"
import os from "os"
import fs from "fs"

export function lint(crustomizePath: string) {
  try {
    run("cfn-lint", ["--version"])
  } catch (e) {
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

export function lintStdin(result: string) {
  try {
    run("cfn-lint", ["--version"])
  } catch (e) {
    console.error(
      "cfn-lint is not installed. Please install it with `pip install cfn-lint`.",
    )
    process.exit(1)
  }
  const tmpFile = path.join(os.tmpdir(), "template.tmp.yaml")
  fs.writeFileSync(tmpFile, result, "utf-8")

  const resultProcess = spawnSync("cfn-lint", [tmpFile], {
    encoding: "utf-8",
  })

  if (resultProcess.error) {
    throw resultProcess.error
  }

  if (resultProcess.status !== 0) {
    console.error("cfn-lint exit code: " + resultProcess.status)
    console.error(resultProcess.stdout)
    console.error(resultProcess.stderr)
    console.error("cfn-lint failed. Please fix the errors above and try again.")
    process.exit(1)
  }
}
