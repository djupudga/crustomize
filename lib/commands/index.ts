import type { ApplyFunction } from "./types.d"
import { apply } from "./apply"
import { deploy } from "./deploy"
import { createChangeSet } from "./create-change-set"
import { executeChangeSet } from "./execute-change-set"
import { deleteChangeSet } from "./delete-change-set"
import { validate } from "./validate"

type Commands = {
  apply: ApplyFunction
  deploy: ApplyFunction
  ["create-change-set"]: ApplyFunction
  ["execute-change-set"]: ApplyFunction
  ["delete-change-set"]: ApplyFunction
  validate: ApplyFunction
}

export const commands: Commands = {
  apply,
  deploy,
  ["create-change-set"]: createChangeSet,
  ["execute-change-set"]: executeChangeSet,
  ["delete-change-set"]: deleteChangeSet,
  validate,
}
