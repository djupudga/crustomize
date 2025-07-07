import { test, expect, mock } from "bun:test"
import { validate } from "../lib/commands/validate"

let callback: () => string = () => "OK"
mock.module("../lib/aws", () => {
  return {
    runAwsCommand: () => {
      return callback()
    },
  }
})

test("validate prints aws output", async () => {
  const flags = { render: "handlebars", env: "", profile: "" }
  let output = ""
  const oldLog = console.log
  console.log = (msg: any) => {
    output += msg
  }
  try {
    await validate("tests/fixtures/base_variant", flags)
  } finally {
    console.log = oldLog
  }
  expect(output.trim()).toBe("OK")
})

test("validate reports aws errors", async () => {
  callback = () => {
    throw new Error("Error: ValidationError")
  }
  const flags = { render: "handlebars", env: "", profile: "" }
  const oldError = console.error
  const oldExit = process.exit
  let errMsg = ""
  console.error = (msg: any) => {
    errMsg += msg
  }
  process.exit = ((code?: number) => {
    throw new Error(`exit ${code}`)
  }) as any
  expect(validate("tests/fixtures/manifest_with_bad_base", flags)).rejects.toThrow()
  console.error = oldError
  process.exit = oldExit
  expect(errMsg).toContain("ValidationError")
})