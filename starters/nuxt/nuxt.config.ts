import {fileURLToPath} from "node:url"

// The repository this starter sits in, whose dist/ holds Scriviamo and its add-ons. Once
// Scriviamo is installed from npm, remove the alias and the paths that use repository.
const repository = fileURLToPath(new URL("../..", import.meta.url))
const addons = ["callouts", "media", "math", "diagrams"]

export default defineNuxtConfig({
  compatibilityDate: "2026-11-01",
  // Scriviamo's interface uses Bootstrap's CSS and Bootstrap Icons (not Bootstrap's JavaScript),
  // loaded before Scriviamo's own stylesheets.
  css: [
    "bootstrap/dist/css/bootstrap.min.css",
    "bootstrap-icons/font/bootstrap-icons.min.css",
    `${repository}dist/scriviamo.css`,
    ...addons.map(name => `${repository}dist/addons/scriviamo.${name}.css`),
    "~/app.css"
  ],
  alias: {scriviamo: `${repository}dist/scriviamo.js`},
  vite: {server: {fs: {allow: [repository]}}},
  typescript: {
    tsConfig: {compilerOptions: {paths: {scriviamo: [`${repository}dist/types/index.d.ts`]}}}
  },
  app: {head: {title: "Scriviamo with Nuxt", htmlAttrs: {lang: "en", "data-bs-theme": "light"}}}
})
