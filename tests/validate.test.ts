import { test, expect } from "bun:test"
import fs from "fs"
import path from "path"
import os from "os"
import { validate } from "../lib/commands/validate"

function setupAwsScript(content: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aws-bin-"))
  const script = path.join(dir, "aws")
  fs.writeFileSync(script, content)
  fs.chmodSync(script, 0o755)
  const oldPath = process.env.PATH
  process.env.PATH = `${dir}:${oldPath}`
  return () => {
    process.env.PATH = oldPath
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

test("validate prints aws output", async () => {
  const cleanup = setupAwsScript(`#\!/bin/sh\necho '{"Status":"OK"}'\n`)
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
    cleanup()
  }
  expect(output.trim()).toBe('{"Status":"OK"}')
})

test("validate reports aws errors", async () => {
  const cleanup = setupAwsScript(
    `#\!/bin/sh\necho 'bad template' >&2\nexit 1\n`,
  )
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
  await expect(validate("tests/fixtures/base_variant", flags)).rejects.toThrow()
  console.error = oldError
  process.exit = oldExit
  cleanup()
  expect(errMsg).toContain("bad template")
})
