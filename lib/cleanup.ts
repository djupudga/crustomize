import fs from "fs"

export function cleanUpAwsFiles() {
  if (
    fs.existsSync("./.crustomize_deploy") && 
    fs.lstatSync("./.crustomize_deploy").isDirectory()
  ) {
    fs.rmdirSync("./.crustomize_deploy", { recursive: true })
  }
}