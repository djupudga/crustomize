import type { ApplyFunction } from "./types.d"
import { apply } from "./apply"
import { deploy } from "./deploy"
import { createChangeSet } from "./create-change-set"
import { executeChangeSet } from "./execute-change-set"
import { deleteChangeSet } from "./delete-change-set"

type Commands = {
  apply: ApplyFunction
  deploy: ApplyFunction
  ["create-change-set"]: ApplyFunction
  ["execute-change-set"]: ApplyFunction
  ["delete-change-set"]: ApplyFunction
}

export const commands: Commands = {
  apply,
  deploy,
  ["create-change-set"]: createChangeSet,
  ["execute-change-set"]: executeChangeSet,
  ["delete-change-set"]: deleteChangeSet,
}
