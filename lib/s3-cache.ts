import fs from "fs"
import path from "path"
import { run } from "./run"

const CACHE_ROOT = ".crustomize/cache/s3"

/**
 * Syncs an S3 location to a local cache and returns the local path.
 *
 * - kind="prefix": syncs the URL as-is, returns the cache directory path.
 * - kind="file":   syncs the URL's enclosing prefix, returns the specific
 *                  file path inside the cache.
 *
 * Always runs `aws s3 sync --delete` so the cache mirrors S3 (including
 * deletions). On a warm cache, this is cheap: one ListObjectsV2 call
 * and zero bytes transferred for unchanged files.
 *
 * S3 locations are treated as immutable by convention — bump the prefix
 * or filename to get a new version.
 */
export function syncS3(
  s3Url: string,
  profile: string | undefined,
  kind: "prefix" | "file",
): string {
  const { bucket, key } = parseS3Url(s3Url)

  let prefix: string
  let returnPath: string
  if (kind === "file") {
    const slashIdx = key.lastIndexOf("/")
    prefix = slashIdx === -1 ? "" : key.substring(0, slashIdx)
    const cacheDir = path.join(CACHE_ROOT, bucket, prefix)
    returnPath = path.join(cacheDir, path.basename(key))
  } else {
    prefix = key
    returnPath = path.join(CACHE_ROOT, bucket, prefix)
  }

  const cacheDir = path.join(CACHE_ROOT, bucket, prefix)
  fs.mkdirSync(cacheDir, { recursive: true })

  const s3Source = prefix ? `s3://${bucket}/${prefix}` : `s3://${bucket}`
  const args = ["s3", "sync", s3Source, cacheDir, "--delete"]
  if (profile) args.push("--profile", profile)
  run("aws", args)

  return returnPath
}

export function parseS3Url(s3Url: string): { bucket: string; key: string } {
  if (!s3Url.startsWith("s3://")) {
    throw new Error(`Not an S3 URL: ${s3Url}`)
  }
  const rest = s3Url.slice(5)
  const slashIdx = rest.indexOf("/")
  if (slashIdx === -1) return { bucket: rest, key: "" }
  return { bucket: rest.slice(0, slashIdx), key: rest.slice(slashIdx + 1) }
}
