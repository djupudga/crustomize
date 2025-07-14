export type Flags = {
  config?: string
  env?: string
  lint?: boolean
  output?: string
  profile?: string
  render?: string
  ci?: boolean
}

export type ApplyFunction = (path: string, flags: Flags) => Promise<void>
