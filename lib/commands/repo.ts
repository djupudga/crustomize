import fs from "fs"
import path from "path"
import type { CommandFunction } from "./types"
import { yamlDump, yamlParse } from "yaml-cfn"
import manifestSchema from "../schemas/pkg.json"
import Ajv from "ajv"
import { AjvValidationError } from "../errors"
import { run } from "../run"

export const repo: CommandFunction = async ([cmd, ...rest], flags) => {
  const repo = flags.repo
  if (!repo) {
    throw new Error(
      "Repo URL must be specified with --repo flag " +
      "or set using 'crustomize config set <location> repo <url>' command"
    )
  }

  switch (cmd) {
    case "install":
      return installCmd(rest, repo)
    case "list":
      return listCmd(repo)
    default:
      throw new Error(`Unknown repo command: ${cmd}`)
  }
}

function listCmd(repo: string) {
  // we need to recursively list packages in the repo
  // i.e. go down each folder and build a path
  // example:
  // s3://repo/roaring/lambda/v1 and s3://repo/roaring/api/v2
  // should list:
  // roaring/lambda/v1
  // roaring/api/v2
  if (repo.startsWith("s3://")) {
    let list = ""
    const aws = run.bind(null, "aws")
    const result = aws(["s3", "ls", repo, "--recursive"])
    const lines = result.split("\n")
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length === 4) {
        const key = parts[3]
        const segments = key.split("/")
        if (segments.length > 1) {
          list += segments.slice(0, segments.length).join("/") + "\n"
        }
      }
    }
    console.log(list)
    // const tempFile = "temp_packages.yml"
    // aws(["s3", "cp", `${repo}/packages.txt`, tempFile])
    // const file = fs.readFileSync(tempFile, "utf8").toString()
    // fs.unlinkSync(tempFile)
    // console.log(file)
  } else {
    let list = ""
    function walkDir(currentPath: string, relativePath: string) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true })
      let hasDirectories = false
      for (const entry of entries) {
        if (entry.isDirectory()) {
          hasDirectories = true
          const newRelativePath = relativePath
            ? `${relativePath}/${entry.name}`
            : entry.name
          walkDir(
            path.join(currentPath, entry.name),
            newRelativePath
          )
        } else {
          // it's a file, we can ignore it for listing packages
        }
      }
      if (!hasDirectories && relativePath) {
        // empty directory, consider it a package
        list += relativePath + "\n"
      }
    }
    walkDir(repo, "")
    console.log(list)
    // const file = fs.readFileSync(`${repo}/packages.txt`, "utf8").toString()
    // console.log(file)
  }
}

function installCmd([pkg]: string[], repo: string) {
  if (pkg) {
    let pkgDef: PackageDefinition
    try {
      pkgDef = getPackageDefinition()
    } catch (e) {
      if ((e as Error).message.includes("No pkg.yml file found")) {
        pkgDef = { crustomize: [] }
      } else {
        throw e
      }
      pkgDef.crustomize.push(pkg)
      fs.writeFileSync(
        path.resolve(process.cwd(), "pkg.yml"),
        yamlDump(pkgDef)
      )
    }
  }
  const pkgDef = getPackageDefinition()
  for (const p of pkgDef.crustomize) {
    installPackage(p, repo)
  }
  console.log("All done")
}

function installPackage(pkg: string, repo: string) {
  console.log(`Installing package ${pkg} from repo ${repo}`)

  if (repo.startsWith("s3://")) {
    const aws = run.bind(null, "aws")
    const destDir = `crustomise/base/${pkg}`
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir)
    }
    aws(["s3", "sync", `${repo}/${pkg}`, destDir])
  } else {
    const cp = run.bind(null, "cp")
    const destDir = `crustomise/base/${pkg}`
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    cp(["-r", `${repo}/${pkg}/.`, destDir])
  }

  const destDir = `crustomise/overlays/${pkg}/prod`
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  } else {
    console.log(`Overlay directory already exists at ${destDir}, skipping overlay creation`)
    return
  }
  const sourceFile = `crustomise/base/${pkg}/.meta/crustomize.yml`
  const destFile = `${destDir}/crustomize.yml`
  if (fs.existsSync(destFile)) {
    fs.unlinkSync(sourceFile)
    console.log(`Overlay already exists at ${destFile}, skipping overlay creation`)
  } else {
    const mv = run.bind(null, "mv")
    mv([sourceFile, destFile])
    console.log(`Created overlay at ${destFile}`)
  }
}

type PackageDefinition = {
  crustomize: string[]
}


function getPackageDefinition() {
  const pkgPath = path.resolve(process.cwd(), "pkg.yml")
  if (!fs.existsSync(pkgPath)) {
    throw new Error("No pkg.yml file found in the current directory")
  }
  const file = fs.readFileSync(pkgPath, "utf8").toString()
  const pkgDef = yamlParse(file) as PackageDefinition
  const ajv = new Ajv()
  const validate = ajv.compile(manifestSchema)
  const valid = validate(pkgDef)
  if (!valid) {
    throw new AjvValidationError("pkg.yml - invalid format", validate.errors)
  }
  return pkgDef
}