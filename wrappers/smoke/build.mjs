// Bundles the wrapper smoke tests into smoke/build/, each with its framework from that wrapper's
// own node_modules. Build the wrappers first, then serve the repository root and open
// /wrappers/smoke/react.html, vue.html, angular.html or element.html: each shows a live editor and inspector,
// and its "Run the smoke test" button (or runSmoke() in the console) runs the checks.
//
//   node smoke/build.mjs           from the wrappers folder
import {build} from "../react/node_modules/esbuild/lib/main.js"
import {join} from "node:path"

const wrappers = new URL("..", import.meta.url).pathname
const common = {bundle: true, format: "esm", target: "es2022", external: ["scriviamo"], logLevel: "warning", define: {"process.env.NODE_ENV": "\"production\""}}

await build({...common, entryPoints: [join(wrappers, "smoke/react-entry.tsx")], outfile: join(wrappers, "smoke/build/react.js"), jsx: "automatic", nodePaths: [join(wrappers, "react/node_modules")]})
await build({...common, entryPoints: [join(wrappers, "smoke/vue-entry.ts")], outfile: join(wrappers, "smoke/build/vue.js"), nodePaths: [join(wrappers, "vue/node_modules")], define: {...common.define, __VUE_OPTIONS_API__: "true", __VUE_PROD_DEVTOOLS__: "false", __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false"}})
await build({...common, entryPoints: [join(wrappers, "smoke/angular-entry.ts")], outfile: join(wrappers, "smoke/build/angular.js"), nodePaths: [join(wrappers, "angular/node_modules")], tsconfig: join(wrappers, "angular/tsconfig.json")})
await build({...common, entryPoints: [join(wrappers, "smoke/element-entry.ts")], outfile: join(wrappers, "smoke/build/element.js")})
console.log("Built the smoke tests")
