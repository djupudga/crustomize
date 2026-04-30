import { test, expect } from "bun:test"
import { applyConfig } from "../lib/config"

const configPath = "tests/fixtures/config_defaults/.crustomizerc"

/**
 * Runs `fn` with AWS_PROFILE cleared so `applyConfig` cannot pick up
 * the developer's ambient AWS profile. Restored on exit.
 */
function withoutAwsProfile<T>(fn: () => T): T {
  const saved = process.env["AWS_PROFILE"]
  delete process.env["AWS_PROFILE"]
  try {
    return fn()
  } finally {
    if (saved !== undefined) process.env["AWS_PROFILE"] = saved
  }
}

test("loads defaults from config file", () => {
  withoutAwsProfile(() => {
    const flags: any = { config: configPath }
    const copy = applyConfig(flags)
    expect(copy.render).toBe("ejs")
    expect(copy.profile).toBe("confprof")
  })
})

test("sets defaults if not already set", () => {
  withoutAwsProfile(() => {
    const flags: any = {}
    const copy = applyConfig(flags)
    expect(copy.render).toBe("handlebars")
    expect(copy.profile).toBe("default")
  })
})

test("accepts helpers key with a local path", () => {
  withoutAwsProfile(() => {
    const flags: any = {
      config: "tests/fixtures/config_helpers_local/.crustomizerc",
    }
    const copy = applyConfig(flags)
    expect(copy.helpers).toBe("./tests/fixtures/hooks")
  })
})

test("accepts helpers key with an s3:// URL", () => {
  withoutAwsProfile(() => {
    const flags: any = {
      config: "tests/fixtures/config_helpers_s3/.crustomizerc",
    }
    const copy = applyConfig(flags)
    expect(copy.helpers).toBe("s3://my-bucket/helpers/v1")
  })
})
