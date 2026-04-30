import { test, expect } from "bun:test"
import { parseS3Url } from "../lib/s3-cache"
import { splitHelperPaths } from "../lib/process"

test("parseS3Url splits bucket and key", () => {
  expect(parseS3Url("s3://my-bucket/foo/bar/baz.yml")).toEqual({
    bucket: "my-bucket",
    key: "foo/bar/baz.yml",
  })
})

test("parseS3Url handles bucket-only URLs", () => {
  expect(parseS3Url("s3://just-a-bucket")).toEqual({
    bucket: "just-a-bucket",
    key: "",
  })
})

test("parseS3Url throws on non-s3 URLs", () => {
  expect(() => parseS3Url("https://example.com/x")).toThrow("Not an S3 URL")
})

test("splitHelperPaths splits on colon for local paths", () => {
  expect(splitHelperPaths("./a:./b:./c")).toEqual(["./a", "./b", "./c"])
})

test("splitHelperPaths preserves s3:// URLs as single tokens", () => {
  expect(splitHelperPaths("s3://bucket/helpers")).toEqual([
    "s3://bucket/helpers",
  ])
})

test("splitHelperPaths mixes local paths and s3:// URLs", () => {
  expect(splitHelperPaths("./local:s3://bucket/path:./other")).toEqual([
    "./local",
    "s3://bucket/path",
    "./other",
  ])
})
