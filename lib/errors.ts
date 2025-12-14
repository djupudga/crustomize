import type { ErrorObject } from "ajv"

export class CrustomizeError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message)
    this.name = "CrustomizeError"
  }
}

export class AjvValidationError extends Error {
  public readonly errors: ErrorObject[] | null | undefined

  constructor(msg: string, errors: ErrorObject[] | null | undefined) {
    const message =
      errors == null
        ? "Validation error"
        : AjvValidationError.formatErrors(errors)

    super(`${msg}\n${message}`)
    this.errors = errors
    Object.setPrototypeOf(this, AjvValidationError.prototype)
  }

  private static formatErrors(errors: ErrorObject[]): string {
    if (!errors || errors.length === 0) {
      return "Unknown validation error."
    }

    return errors
      .map((err, index) => {
        const path = AjvValidationError.cleanPath(err.instancePath)

        switch (err.keyword) {
          case "enum":
            return `${index + 1}: ${path} must be one of: ${err.params["allowedValues"].join(", ")}`

          case "type":
            return `${index + 1}: ${path} must be of type ${err.params["type"]}`

          case "required":
            return `${index + 1}: Missing required property '${err.params["missingProperty"]}' at ${path || "(root)"}`

          case "additionalProperties":
            return `${index + 1}: ${path} has unknown property '${err.params["additionalProperty"]}'`

          case "minimum":
          case "maximum":
            return `${index + 1}: ${path} ${err.message}`

          case "pattern":
            return `${index + 1}: ${path} must match pattern: ${err.params["pattern"]}`

          case "const":
            return `${index + 1}: ${path} must be exactly: ${JSON.stringify(err.params["allowedValue"])}`

          case "errorMessage": // from ajv-errors extension
            return `${index + 1}: ${path} ${err.message}`

          default:
            return `${index + 1}: ${path} ${err.message}`
        }
      })
      .join("\n")
  }

  private static cleanPath(path: string): string {
    if (!path) return ""
    return path
      .replace(/^\//, "")
      .replace(/\//g, ".")
      .replace(/^values\./, "values.")
  }
}

export function handleError(err: any): void {
  if ("code" in err) {
    switch (err.code) {
      case "ENOENT":
        console.error(`Error: ${err.message}`)
        break
      case "EACCES":
        console.error(`Error: permission denied for ${err.path}`)
        break
      case "EISDIR":
        console.error(`Error: ${err.path} is a directory`)
        break
      case "EEXIST":
        console.error(`Error: file already exists at ${err.path}`)
        break
      case "ENOTDIR":
        console.error(`Error: ${err.path} is not a directory`)
        break
      case "ELOOP":
        console.error(`Error: ${err.path} is a symlink loop`)
        break
      case "ENOTEMPTY":
        console.error(`Error: ${err.path} is not empty`)
        break
      default:
        if (err instanceof Error) {
          console.error(`Error: ${err.message}`)
        } else {
          console.error(`Error: ${err}`)
        }
        break
    }
  } else {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`)
    } else {
      console.error(`Error: ${err}`)
    }
  }
  process.exit(1)
}