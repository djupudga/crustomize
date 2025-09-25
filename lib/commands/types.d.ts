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
}

export type ApplyFunction = (path: string, flags: Flags) => Promise<void>