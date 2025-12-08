import { test, expect, spyOn } from "bun:test"
import { deploy } from "../lib/commands/deploy"
import { registerTestCallback } from "./fixtures/hooks/hook"

test("fires pre/post hooks", async () => {
  // Setup
  const mod = await import("../lib/aws")
  spyOn(mod, "runAwsCommand").mockResolvedValue(null as never)
  const crustomizePath = "tests/fixtures/manifest_with_hooks"
  const flags = {
    render: "handlebars",
    env: "",
    profile: "",
    hooks: "tests/fixtures/hooks/hook.js",
  }
  let preHookResults: any = null
  let postHookResults: any = null

  registerTestCallback((_hookName: string, event: string, resource: any) => {
    if (event === "pre") {
      preHookResults = resource
    } else if (event === "post") {
      postHookResults = resource
    }
  })
  // Excercise
  await deploy([crustomizePath], flags)
  // Verify
  expect(preHookResults).toBeDefined()
  expect(postHookResults).toBeDefined()
  expect(preHookResults.Properties.Foo).toBe("bar")
})