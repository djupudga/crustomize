import type { ErrorObject } from "ajv"

export class CrustomizeError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message)
    this.name = "CrustomizeError"
    this.code = code
  }
}

export class AjvValidationError extends Error {
  public readonly errors: ErrorObject[] | null | undefined

  constructor(errors: ErrorObject[] | null | undefined) {
    // Build a detailed error message using the static formatter.
    const message =
      errors == null
        ? "validation error"
        : AjvValidationError.formatErrors(errors)
    super(message)

    // Set the errors array as a property on this instance.
    this.errors = errors

    // Restore the prototype chain (necessary when extending built-in types).
    Object.setPrototypeOf(this, AjvValidationError.prototype)
  }

  /**
   * Format AJV errors into a human readable message.
   * @param errors Array of AJV ErrorObjects.
   * @returns A string with each error on a new line.
   */
  private static formatErrors(errors: ErrorObject[]): string {
    if (!errors || errors.length === 0) {
      return "Unknown validation error."
    }

    return errors
      .map((err, index) => {
        // Use instancePath if available (AJV v7+), otherwise fallback to dataPath.
        const path = err.instancePath || ""
        // Format the message; trim in case path is empty.
        return `${index + 1}: "${path}" ${err.message}`.trim()
      })
      .join("\n")
  }
}

export function handleError(err: any, extra: string): void {
  if ("code" in err) {
    switch (err.code) {
      case "ENOENT":
        console.error(`Error: file not found at ${extra}`)
        break
      case "EACCES":
        console.error(`Error: permission denied for ${extra}`)
        break
      case "EISDIR":
        console.error(`Error: ${extra} is a directory`)
        break
      case "EEXIST":
        console.error(`Error: file already exists at ${extra}`)
        break
      case "ENOTDIR":
        console.error(`Error: ${extra} is not a directory`)
        break
      case "ELOOP":
        console.error(`Error: ${extra} is a symlink loop`)
        break
      case "ENOTEMPTY":
        console.error(`Error: ${extra} is not empty`)
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
