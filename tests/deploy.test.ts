import { test, expect, spyOn } from "bun:test"
import { deploy } from "../lib/commands/deploy"

function findArgValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag)
  if (idx === -1 || idx === args.length - 1) return undefined
  return args[idx + 1]
}

test("passes --s3-bucket and --s3-prefix when set in manifest", async () => {
  // Setup
  const mod = await import("../lib/aws")
  let capturedArgs: string[] = []
  spyOn(mod, "runAwsCommand").mockImplementation((args: string[]) => {
    capturedArgs = args
    return null as never
  })
  const crustomizePath = "tests/fixtures/manifest_with_s3"
  const flags = {
    render: "handlebars",
    env: "",
    profile: "",
  }

  // Exercise
  await deploy([crustomizePath], flags)

  // Verify
  expect(findArgValue(capturedArgs, "--s3-bucket")).toBe("my-template-bucket")
  expect(findArgValue(capturedArgs, "--s3-prefix")).toBe("some/prefix")
})

test("omits --s3-bucket and --s3-prefix when not set in manifest", async () => {
  // Setup
  const mod = await import("../lib/aws")
  let capturedArgs: string[] = []
  spyOn(mod, "runAwsCommand").mockImplementation((args: string[]) => {
    capturedArgs = args
    return null as never
  })
  const crustomizePath = "tests/fixtures/manifest_with_hooks"
  const flags = {
    render: "handlebars",
    env: "",
    profile: "",
    hooks: "tests/fixtures/hooks/hook.js",
  }

  // Exercise
  await deploy([crustomizePath], flags)

  // Verify
  expect(capturedArgs).not.toContain("--s3-bucket")
  expect(capturedArgs).not.toContain("--s3-prefix")
})
