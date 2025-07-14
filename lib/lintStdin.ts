import { spawnSync } from "child_process"
import path from "path"
import os from "os"
import { run } from "./run"
import fs from "fs"
import { cleanUpAwsFiles } from "./cleanup"

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