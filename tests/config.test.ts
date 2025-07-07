import { test, expect } from "bun:test"
import { applyConfig } from "../lib/config"

const configPath = "tests/fixtures/config_defaults/.crustomizerc"

test("loads defaults from config file", () => {
  const flags: any = { config: configPath }
  const copy = applyConfig(flags)
  expect(copy.render).toBe("ejs")
  expect(copy.profile).toBe("confprof")
})

test("sets defaults if not already set", () => {
  const flags: any = {}
  const copy = applyConfig(flags)
  expect(copy.render).toBe("handlebars")
  expect(copy.profile).toBe("default")
})
