import { test, expect } from "bun:test"
import { apply } from "../lib/commands/apply"

test("crustomize a path", async() => {
  const crustomizePath = "tests/fixtures/base_variant"
  const flags = {
    render: "handlebars",
    env: "",
    profile: "",
  }
  let results = ""
  const old = console.log
  try {
    console.log = (r) => { results = r }
    await apply(crustomizePath, flags)
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
        - Key: Name
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

