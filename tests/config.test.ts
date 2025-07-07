import { test, expect } from "bun:test"
import { applyConfig } from "../lib/config"

const configPath = "tests/fixtures/config_defaults/.crustomizerc"

test("loads defaults from config file", () => {
  const flags: any = { config: configPath }
  applyConfig(flags)
  expect(flags.render).toBe("ejs")
  expect(flags.profile).toBe("confprof")
})

