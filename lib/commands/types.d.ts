export type Flags = {
  profile?: string
  output?: string
  render: string
  env?: string
  silent?: boolean
}

export type ApplyFunction = (path: string, flags: Flags) => Promise<void>