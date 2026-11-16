import {fileURLToPath} from "node:url"
import {dirname, join} from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
// The repository this starter sits in, whose dist/ holds Scriviamo and its add-ons. Once
// Scriviamo is installed from npm, remove these aliases.
const repository = join(here, "../..")
const scriviamo = join(repository, "dist/scriviamo.js")

/** @type {import("next").NextConfig} */
export default {
  // Lets the app build files from the repository around it.
  outputFileTracingRoot: repository,
  turbopack: {
    root: repository,
    resolveAlias: {scriviamo: "../../dist/scriviamo.js"}
  },
  webpack(config) {
    config.resolve.alias = {...config.resolve.alias, scriviamo$: scriviamo}
    return config
  }
}
