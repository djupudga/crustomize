import { createHash } from "crypto"
import { readFile } from "fs/promises"

/**
 * Hashes a file using md5 and returns the hash as a hex string.
 * @param path - The path to the file to hash.
 * @returns A promise that resolves to the md5 hash of the file as a hex string.
 */
export async function hashFile(path: string): Promise<string> {
  const data = await readFile(path)
  return createHash("md5").update(data).digest("hex")
}
