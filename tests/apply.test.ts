import { test, expect } from "bun:test"
import { apply } from "../lib/commands/apply"
import fs from "fs"
import path from "path"

test("crustomize a path", async () => {
  const crustomizePath = "tests/fixtures/base_variant"
  const flags = {
    render: "handlebars",
    env: "",
    profile: "",
  }
  let results = ""
  const old = console.log
  try {
    console.log = (r) => {
      results = r
    }
    await apply([crustomizePath], flags)
  } finally {
    console.log = old
  }
  expect(results).toEqualIgnoringWhitespace(`
AWSTemplateFormatVersion: 2010-09-09
Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: mybucket
      Tags:
        - Key: FqnName
          Value: !Sub \${AWS::StackName}-bucket
        - Key: Name
          Value: mybucket
        - Key: Environment
          Value: dev
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: ExpireOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 30
            ExpirationInDays: 123
  `)
})

test("handles arrayMerge strategies", async () => {
  const crustomizePath = "tests/fixtures/array_merge/overlay"
  const flags = {
    render: "handlebars",
    env: "",
    profile: "",
  }
  let results = ""
  const old = console.log
  try {
    console.log = (r) => {
      results = r
    }
    await apply([crustomizePath], flags)
  } finally {
    console.log = old
  }
  expect(results).toEqualIgnoringWhitespace(`
Resources:
  Some:
    Type: AWS::Some::Resource
    Properties:
      ArrayOne:
        - one
        - two
        - oneone
        - twotwo
      ArrayTwo:
        - three
        - four
        - threethree
        - fourfour
      Nested:
        SubNested:
          - name: subonesubone
            somthing: else
            ArrayFour:
              - fivefive
              - sixsix
`)
})

test("creates output directory if missing", async () => {
  const crustomizePath = "tests/fixtures/base_variant"
  const outputPath = "tests/tmp_output"
  fs.rmSync(outputPath, { recursive: true, force: true })
  const flags = {
    render: "handlebars",
    env: "",
    profile: "",
    output: outputPath,
  }
  await apply([crustomizePath], flags)
  expect(fs.existsSync(path.join(outputPath, "template.yml"))).toBe(true)
  fs.rmSync(outputPath, { recursive: true, force: true })
})

test("manifest values override flags", async () => {
  const crustomizePath = "tests/fixtures/manifest_defaults"
  const flags: any = {
    render: "handlebars",
    profile: "cli-prof",
  }
  let results = ""
  const old = console.log
  try {
    console.log = (r) => {
      results = r
    }
    await apply([crustomizePath], flags)
  } finally {
    console.log = old
  }
  expect(flags.render).toBe("ejs")
  expect(flags.profile).toBe("testprof")
  expect(results).toContain("ExpirationInDays: 123")
})