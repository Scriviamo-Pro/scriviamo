// Copies the shared bindings into a wrapper package's source, so each package builds on its own.
// Edit the files in shared/, never the copies.
//
//   shared/editorbinding.ts     -> src/
//   shared/inspectorbinding.ts  -> inspector/src/ when the package has one (Angular's secondary
//                                  entry point), otherwise src/
//
//   node ../sync-shared.mjs      from a wrapper package's folder
import {existsSync, readFileSync, writeFileSync} from "node:fs"
import {join} from "node:path"

const here = new URL(".", import.meta.url).pathname
const target = process.cwd()

for (let [file, folder] of [["editorbinding.ts", "src"], ["inspectorbinding.ts", existsSync(join(target, "inspector/src")) ? "inspector/src" : "src"]]) {
  // The inspector binding is only where the inspector add-on is.
  if (!existsSync(join(here, "shared", file))) continue
  let source = readFileSync(join(here, "shared", file), "utf8")
  let banner = `// Copied from wrappers/shared/${file} by sync-shared.mjs. Edit that file, not this one.\n\n`
  writeFileSync(join(target, folder, file), banner + source)
}
