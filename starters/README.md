# Starters

Small apps to copy and build on, each with Scriviamo set up the way that framework expects:

| Folder | Framework |
|---|---|
| [nextjs/](nextjs/README.md) | Next.js 16, App Router, React |
| [nuxt/](nuxt/README.md) | Nuxt 4, Vue |

Each one does the same things:

- a list of documents;
- an editor page, using the framework's Scriviamo component, with the status bar and autosave;
- a save endpoint, which checks the document by loading it into a headless editor;
- a page that shows a document as HTML rendered on the server, with no editor and no
  JavaScript needed (see [Server rendering](../docs/server-rendering.md)).

Documents are JSON files in the app's `data/` folder; swap the small storage module for your
database.

## Running one

The starters use this repository's own build, so they need its `dist/` and the framework
wrapper built first:

```bash
cd wrappers/react     # or wrappers/vue for Nuxt
npm ci
npm run build
cd ../../starters/nextjs     # or starters/nuxt
npm install
npm run dev
```

Once Scriviamo and its wrappers are installed from npm, replace the `file:` dependency on the
wrapper with its version, add `scriviamo` itself, and remove the aliases that point at `dist/`.
