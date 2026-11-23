# Scriviamo with Angular

An Angular app with Scriviamo, rendered on the server: write documents in the editor, which
saves them as you type, and publish them as pages rendered on the server.

```bash
cd ../../wrappers/angular && npm ci && npm run build && cd -
npm install
npm run dev
```

Then open http://localhost:4200. `npm run build` makes the production server in `dist/`, and
`npm start` runs it, on `PORT` or 4000. Needs Node 20.19 or later.

## What's where

| Path | What it is |
|---|---|
| `src/app/pages/document-list.ts` | The list of documents |
| `src/app/pages/edit-page.ts` | The editor page. The server renders the frame the editor fills; `@defer` loads the editor once the page is up in the browser. |
| `src/app/pages/document-editor.ts` | The editor: `ScriviamoEditorComponent` from `scriviamo-angular`, with the status bar and autosave |
| `src/app/pages/view-page.ts` | The document as a page, rendered on the server |
| `src/app/documents.ts` | The pages' requests to the API. What the server fetched travels with the page, so the browser doesn't fetch it again. |
| `src/server/api.ts` | Listing, loading, saving and rendering documents. Saving loads the JSON into a headless editor with the app's schema, which refuses anything that isn't a document or that has what the app doesn't allow ([Schema validation](../../docs/schema.md)); rendering uses one too: `toHTML()` and `exportCSS()`. |
| `src/server.ts` | The Express server: the API, then every page through Angular's server rendering |
| `src/app/scriviamo.ts` | The add-ons the documents use, imported wherever documents are edited or rendered |
| `src/server/documents.ts` | Storage: JSON files in `data/`. Replace it with your database. |
| `tsconfig.json`, `angular.json` | Point `scriviamo` at this repository's `dist/`, and load its stylesheets, until it comes from npm |

The editor component creates its editor in the browser only: on the server it renders the empty
element the editor fills, and it isn't hydrated, since the editor builds its own content.

## Testing

```bash
npm test
```

builds the app, starts its production server (`dist/server/`) with its documents in a temporary folder, and uses it the
way people and browsers do, in a headless browser through Playwright: the list, saving through
the API (and refusing what the schema doesn't allow), the pages rendered on the server with no
JavaScript, and writing in the editor until autosave has saved it. The tests are in `tests/`.
The first run needs Playwright's browser: `npx playwright install chromium`.

Each release runs these tests before it publishes anything. When a feature reaches this app, add
a test for it to `tests/app.test.mjs`.
