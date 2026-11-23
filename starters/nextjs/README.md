# Scriviamo with Next.js

A Next.js app (App Router) with Scriviamo: write documents in the editor, which saves them as
you type, and publish them as pages rendered on the server.

```bash
cd ../../wrappers/react && npm ci && npm run build && cd -
npm install
npm run dev
```

Then open http://localhost:3000. Needs Node 20.9 or later.

## What's where

| Path | What it is |
|---|---|
| `app/page.tsx` | The list of documents |
| `app/edit/[id]/document-editor.tsx` | The editor: a client component using `ScriviamoEditor` from `scriviamo-react`, with the status bar and autosave |
| `app/api/documents/[id]/route.ts` | Loading and saving a document. Saving loads the JSON into a headless editor with the app's schema, which refuses anything that isn't a document or that has what the app doesn't allow ([Schema validation](../../docs/schema.md)). |
| `app/view/[id]/page.tsx` | The document as a page, rendered on the server with a headless editor: `toHTML()` and `exportCSS()` |
| `lib/scriviamo.ts` | The add-ons the documents use, imported wherever documents are edited or rendered |
| `lib/documents.ts` | Storage: JSON files in `data/`. Replace it with your database. |
| `next.config.mjs` | Points `scriviamo` at this repository's `dist/`, until it comes from npm |

The editor creates itself in the browser. On the server, the edit page renders only the empty
frame it fills, and the add-ons load in Node without needing a browser.

## Testing

```bash
npm test
```

builds the app, starts its production server with its documents in a temporary folder, and uses it the
way people and browsers do, in a headless browser through Playwright: the list, saving through
the API (and refusing what the schema doesn't allow), the pages rendered on the server with no
JavaScript, and writing in the editor until autosave has saved it. The tests are in `tests/`.
The first run needs Playwright's browser: `npx playwright install chromium`.

Each release runs these tests before it publishes anything. When a feature reaches this app, add
a test for it to `tests/app.test.mjs`.
