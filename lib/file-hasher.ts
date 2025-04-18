import { CryptoHasher } from "bun";

/**
 * Hashes a file using SHA-256 and returns the hash as a hex string.
 * @param path - The path to the file to hash.
 * @returns A promise that resolves to the SHA-256 hash of the file as a hex string.
 */
export async function hashFile(
  path: string,
): Promise<string> {
  const file = Bun.file(path);
  const buffer = await file.arrayBuffer();
  const hasher = new CryptoHasher("md5");
  hasher.update(new Uint8Array(buffer));
  const digest = hasher.digest(); // Uint8Array
  return Array.from(digest)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}