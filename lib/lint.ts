import { spawnSync } from "child_process"
import {run} from "./run"

export function lint(crustomizePath: string) {
  try {
    run("cfn-lint", ["--version"])
  } catch (e) {
    console.error(
      "cfn-lint is not installed. Please install it with `pip install cfn-lint`.",
    )
    process.exit(1)
  }

  const result = 
    spawnSync("cfn-lint", [crustomizePath], { encoding: "utf-8" })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    console.error(
      "cfn-lint exit code: " + result.status
    )
    console.error(
      result.stdout
    )
    console.error(
      result.stderr
    )
    console.error(
      "cfn-lint failed. Please fix the errors above and try again.",
    )
    process.exit(1)
  }
 
}