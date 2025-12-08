import { test, expect } from "bun:test"
import { getManifest } from "../lib/manifest"

test("loads a good manifest", () => {
  const manifest = getManifest("tests/fixtures/good_manifest")
  expect(manifest).toEqual({
    base: "../base",
    overlays: ["./Template.yml"],
    params: "./params.yml",
    stack: {
      name: "foobar",
      capabilities: ["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"],
      tags: { Name: "foobar", Environment: "dev" },
    },
    values: {
      NetworkMode: "awsvpc",
      VpcStackName: "SomeName",
      Foo: true,
    },
  })
})

test("loads a manifest with complex overlays", () => {
  const manifest = getManifest("tests/fixtures/complex_manifest")
  expect(manifest).toEqual({
    base: "../base",
    overlays: [
      "myFile.yml",
      { file: "./Template.yml", arrayMerge: "replace" },
      { file: "./params.yml", arrayMerge: "append" },
    ],
    values: {
      Foo: true,
    },
  })
})

test("throws when manifest is bad", () => {
  const manifest = () => getManifest("tests/fixtures/bad_manifest")
  expect(manifest).toThrow()
})