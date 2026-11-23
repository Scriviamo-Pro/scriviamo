# Starters

Small apps to copy and build on, each with Scriviamo set up the way that framework expects:

| Folder | Framework |
|---|---|
| [nextjs/](nextjs/README.md) | Next.js 16, App Router, React |
| [nuxt/](nuxt/README.md) | Nuxt 4, Vue |
| [angular/](angular/README.md) | Angular 22, with server rendering |

Each one does the same things:

- a list of documents;
- an editor page, using the framework's Scriviamo component, with the status bar and autosave;
- a save endpoint, which checks the document against a schema by loading it into a headless editor;
- a page that shows a document as HTML rendered on the server, with no editor and no
  JavaScript needed (see [Server rendering](../docs/server-rendering.md)).

Documents are JSON files in the app's `data/` folder; swap the small storage module for your
database.

Each starter has its own test suite, in `tests/`, which `npm test` runs against the built app in
a headless browser. Each release runs all three before it publishes anything
(`tools/starter-tests.mjs`), and each new feature a starter shows gets a test there.

## Running one

The starters use this repository's own build, so they need its `dist/` and the framework
wrapper built first:

```bash
cd wrappers/react     # or wrappers/vue for Nuxt, wrappers/angular for Angular
npm ci
npm run build
cd ../../starters/nextjs     # or starters/nuxt, starters/angular
npm install
npm run dev
```

To use a starter on its own, outside this repository, install Scriviamo and the wrapper from npm
(`npm install scriviamo scriviamo-react`, or `scriviamo-vue`, `scriviamo-angular`) in place of the
`file:` dependency, remove the aliases and paths that point at `dist/`, and import the add-ons and
stylesheets from the package: `scriviamo/addons/callouts` and `scriviamo/dist/scriviamo.css`, for
example. See [Getting started](../docs/getting-started.md#installing-from-npm).
