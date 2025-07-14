import fs from "fs"

export function cleanUpAwsFiles(path?: string) {
  const cleanupPath = path || "./.crustomize_deploy"
  if (fs.existsSync(cleanupPath) && fs.lstatSync(cleanupPath).isDirectory()) {
    fs.rmdirSync(cleanupPath, { recursive: true })
  }
}
