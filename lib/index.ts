import type { ApplyFunction } from "./apply"
import { apply } from "./apply"

type Commands = {
  apply: ApplyFunction
}

export const commands: Commands = {
  apply,
}

export function isCommand(cmd: string): cmd is keyof typeof commands {
  return cmd in commands
}
