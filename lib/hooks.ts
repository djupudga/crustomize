import fs from "fs"
import path from "path"
import type { Flags } from "./commands/types"

function solvePaths(p: string): string[] {
  const paths: string[] = []
  if (fs.existsSync(p) === false) {
    throw new Error(`Helpers path does not exist: ${p}`)
  }
  if (p.endsWith(".js")) {
    paths.push(path.resolve(p))
  } else if (fs.lstatSync(p).isDirectory()) {
    const dirFiles = fs.readdirSync(p)
    for (const f of dirFiles) {
      if (f.endsWith(".js")) {
        paths.push(path.resolve(p, f))
      }
    }
  } else {
    throw new Error(`Helpers path is not a .js file or directory: ${p}`)
  }
  return paths
}

let registeredHooks: Record<string, Function> | null = null

function loadCustomHooks(flags: Flags) {
  if (registeredHooks !== null) {
    return registeredHooks
  }
  let hooksPaths = "crustomize_hooks"
  if (process.env["CRUSTOMIZE_HOOKS"]) {
    hooksPaths = process.env["CRUSTOMIZE_HOOKS"]
  }
  if (flags.hooks) {
    hooksPaths = flags.hooks
  }
  if (!hooksPaths) return {}

  if (hooksPaths === "crustomize_hooks" && !fs.existsSync(hooksPaths)) {
    return {}
  }

  // Split and make unique
  const hooks = Array.from(new Set(hooksPaths.split(":")))

  registeredHooks = {}
  for (const hooksPath of hooks) {
    const paths = solvePaths(hooksPath)
    for (const p of paths) {
      if (fs.existsSync(p)) {
        const customHooks = require(p)
        for (const key in customHooks) {
          registeredHooks[key] = customHooks[key]
        }
      } else {
        throw new Error(`Hooks file not found: ${p}`)
      }
    }
  }
  return registeredHooks
}

async function fire(
  hookType: "pre" | "post",
  flags: Flags,
  customResources: Record<string, any>,
) {
  const hooks = loadCustomHooks(flags)
  for (const customResourceKey in customResources) {
    if (hooks[customResourceKey]) {
      await hooks[customResourceKey](
        hookType,
        customResources[customResourceKey],
      )
    } else {
      throw new Error(
        `No hook registered for custom resource: ${customResourceKey}`,
      )
    }
  }
}

export async function firePreHooks(
  flags: Flags,
  customResources: Record<string, any>,
) {
  await fire("pre", flags, customResources)
}

export async function firePostHooks(
  flags: Flags,
  customResources: Record<string, any>,
) {
  await fire("post", flags, customResources)
}
