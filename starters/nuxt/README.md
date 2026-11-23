# Scriviamo with Nuxt

A Nuxt app with Scriviamo: write documents in the editor, which saves them as you type, and
publish them as pages rendered on the server.

```bash
cd ../../wrappers/vue && npm ci && npm run build && cd -
npm install
npm run dev
```

Then open http://localhost:3000. Nuxt 4.6 needs Node 22.22 or later (or 24.15 or later).

## What's where

| Path | What it is |
|---|---|
| `app/pages/index.vue` | The list of documents |
| `app/pages/edit/[id].vue` | The editor page; the editor shows inside `<ClientOnly>`, since it works in the browser |
| `app/components/DocumentEditor.vue` | The editor: `ScriviamoEditor` from `scriviamo-vue`, with the status bar and autosave |
| `app/pages/view/[id].vue` | The document as a page, rendered on the server |
| `server/api/documents/` | Listing, loading and saving documents. Saving loads the JSON into a headless editor with the app's schema, which refuses anything that isn't a document or that has what the app doesn't allow ([Schema validation](../../docs/schema.md)). |
| `server/api/render/[id].get.ts` | The document's HTML and stylesheet, from a headless editor: `toHTML()` and `exportCSS()` |
| `server/utils/scriviamo.ts`, `app/scriviamo.ts` | The add-ons the documents use, on the server and in the browser |
| `server/utils/documents.ts` | Storage: JSON files in `data/`. Replace it with your database. |
| `nuxt.config.ts` | Points `scriviamo` at this repository's `dist/`, until it comes from npm, and loads the stylesheets |

`npm run build` makes the production server in `.output/`; `npm start` runs it, on
`--port=…` or 3000.

## Testing

```bash
npm test
```

builds the app, starts its production server (`.output/`) with its documents in a temporary folder, and uses it the
way people and browsers do, in a headless browser through Playwright: the list, saving through
the API (and refusing what the schema doesn't allow), the pages rendered on the server with no
JavaScript, and writing in the editor until autosave has saved it. The tests are in `tests/`.
The first run needs Playwright's browser: `npx playwright install chromium`.

Each release runs these tests before it publishes anything. When a feature reaches this app, add
a test for it to `tests/app.test.mjs`.
