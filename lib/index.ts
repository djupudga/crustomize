import type { ApplyFunction } from "./apply"
import { apply } from "./apply"

type Commands = {
  apply: ApplyFunction
}

export const commands: Commands = {
  apply,
}
