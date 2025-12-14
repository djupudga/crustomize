import type { CommandFunction } from "./types.d"
import { apply } from "./apply"
import { deploy } from "./deploy"
import { createChangeSet } from "./create-change-set"
import { executeChangeSet } from "./execute-change-set"
import { deleteChangeSet } from "./delete-change-set"
import { validate } from "./validate"
import { generate } from "./generate"
import { config } from "./config"
import { repo } from "./repo"

type Commands = {
  apply: CommandFunction<Record<string, any>> // deprecated
  compile: CommandFunction<Record<string, any>>
  deploy: CommandFunction
  ["create-change-set"]: CommandFunction
  ["execute-change-set"]: CommandFunction
  ["delete-change-set"]: CommandFunction
  validate: CommandFunction
  generate: CommandFunction
  config: CommandFunction
  repo: CommandFunction
}

export const commands: Commands = {
  apply,
  compile: apply,
  deploy,
  ["create-change-set"]: createChangeSet,
  ["execute-change-set"]: executeChangeSet,
  ["delete-change-set"]: deleteChangeSet,
  validate,
  generate,
  config,
  repo,
}