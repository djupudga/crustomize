import { test, expect } from "bun:test"
import fs from "fs"
import { validate } from "../lib/commands/validate"

function writeAwsScript(content: string) {
  fs.writeFileSync("/usr/local/bin/aws", content)
  fs.chmodSync("/usr/local/bin/aws", 0o755)
}

function removeAwsScript() {
  fs.rmSync("/usr/local/bin/aws", { force: true })
}

test("validate prints aws output", async () => {
  writeAwsScript(`#\!/bin/sh\necho '{"Status":"OK"}'\n`)
  const flags = { render: "handlebars", env: "", profile: "" }
  let output = ""
  const oldLog = console.log
  console.log = (msg: any) => { output += msg }
  try {
    await validate("tests/fixtures/base_variant", flags)
  } finally {
    console.log = oldLog
    removeAwsScript()
  }
  expect(output.trim()).toBe('{"Status":"OK"}')
})

test("validate reports aws errors", async () => {
  writeAwsScript(`#\!/bin/sh\necho 'bad template' >&2\nexit 1\n`)
  const flags = { render: "handlebars", env: "", profile: "" }
  const oldError = console.error
  const oldExit = process.exit
  let errMsg = ""
  console.error = (msg: any) => { errMsg += msg }
  process.exit = ((code?: number) => { throw new Error(`exit ${code}`) }) as any
  await expect(validate("tests/fixtures/base_variant", flags)).rejects.toThrow()
  console.error = oldError
  process.exit = oldExit
  removeAwsScript()
  expect(errMsg).toContain('bad template')
})
