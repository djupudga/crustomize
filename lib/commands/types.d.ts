export type Flags = {
  config?: string
  env?: string
  lint?: boolean
  output?: string
  profile?: string
  render?: string
  ci?: boolean
  repo?: string
  helpers?: string
  hooks?: string
}

export type CommandFunction<R = void> = (args: string[], flags: Flags) => Promise<R>