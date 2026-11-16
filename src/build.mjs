// Builds the base package and every add-on as ES modules.
//
//   dist/scriviamo.js (.min.js, .css, .min.css)             the base package
//   dist/addons/scriviamo.<name>.js (.min.js, .css, .min.css)  each add-on
//   dist/examples/scriviamo.example.<name>.js                 each example node type, for the demo
//   dist/types/                                                           declarations
//
// Add-ons import the base package as "scriviamo" and leave it out of their
// bundle, so a page loads the base once and any number of add-ons on top of it.
//
//   node build.mjs              everything
//   node build.mjs base         the base package only
//   node build.mjs forms media  only the named add-ons
import {execFileSync} from "node:child_process"
import {copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync} from "node:fs"
import {join} from "node:path"
import * as esbuild from "esbuild"

const root = new URL(".", import.meta.url).pathname
const dist = join(root, "../dist")
const PackageName = "scriviamo"
const only = process.argv.slice(2)
const wanted = name => only.length == 0 || only.includes(name)

/**
 * An add-on is a folder in addons/ holding one TypeScript entry module and, optionally, its
 * stylesheet. Examples in examples/ have the same shape.
 */
function addons(parent = "addons") {
  return readdirSync(join(root, parent), {withFileTypes: true}).filter(entry => entry.isDirectory()).map(entry => {
    let folder = join(root, parent, entry.name)
    let entries = readdirSync(folder).filter(file => file.endsWith(".ts"))
    if (entries.length != 1) throw new Error(`The ${entry.name} ${parent == "addons" ? "add-on" : "example"} must have exactly one entry module, not ${entries.length}.`)
    return {name: entry.name, entry: join(folder, entries[0]), css: join(folder, `scriviamo.${entry.name}.css`)}
  })
}

async function bundle(entry, outfile, external) {
  let options = {entryPoints: [entry], bundle: true, format: "esm", target: "es2022", external, logLevel: "warning"}
  await esbuild.build({...options, outfile})
  await esbuild.build({...options, outfile: outfile.replace(/\.js$/, ".min.js"), minify: true})
}

async function stylesheet(source, outfile) {
  copyFileSync(source, outfile)
  await esbuild.build({entryPoints: [source], outfile: outfile.replace(/\.css$/, ".min.css"), minify: true, logLevel: "warning"})
}

// Checks every module, then writes the declarations.
rmSync(join(dist, "types"), {recursive: true, force: true})
execFileSync(join(root, "node_modules/.bin/tsc"), ["-p", root], {stdio: "inherit"})

// Node reads the bundles as ES modules, such as for rendering documents on a server.
mkdirSync(dist, {recursive: true})
writeFileSync(join(dist, "package.json"), `${JSON.stringify({type: "module"}, null, 2)}\n`)

if (wanted("base")) {
  await bundle(join(root, "index.ts"), join(dist, "scriviamo.js"), [])
  await stylesheet(join(root, "scriviamo.css"), join(dist, "scriviamo.css"))
  console.log("Built base")
}

mkdirSync(join(dist, "addons"), {recursive: true})
for (let addon of addons()) {
  if (!wanted(addon.name)) continue
  let output = join(dist, "addons", `scriviamo.${addon.name}`)
  await bundle(addon.entry, `${output}.js`, [PackageName])
  if (existsSync(addon.css)) await stylesheet(addon.css, `${output}.css`)
  console.log(`Built ${addon.name}`)
}

mkdirSync(join(dist, "examples"), {recursive: true})
for (let example of addons("examples")) {
  if (!wanted(example.name)) continue
  let output = join(dist, "examples", `scriviamo.example.${example.name}`)
  await bundle(example.entry, `${output}.js`, [PackageName])
  if (existsSync(example.css)) await stylesheet(example.css, `${output}.css`)
  console.log(`Built example ${example.name}`)
}

