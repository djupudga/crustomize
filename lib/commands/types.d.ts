export type Flags = {
  profile?: string
  output: string | undefined
  render: string
  env?: string
  silent?: boolean
}

export type ApplyFunction = (path: string, flags: Flags) => Promise<void>