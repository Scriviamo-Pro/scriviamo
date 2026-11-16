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
| `app/api/documents/[id]/route.ts` | Loading and saving a document. Saving checks the JSON is a document by loading it into a headless editor. |
| `app/view/[id]/page.tsx` | The document as a page, rendered on the server with a headless editor: `toHTML()` and `exportCSS()` |
| `lib/scriviamo.ts` | The add-ons the documents use, imported wherever documents are edited or rendered |
| `lib/documents.ts` | Storage: JSON files in `data/`. Replace it with your database. |
| `next.config.mjs` | Points `scriviamo` at this repository's `dist/`, until it comes from npm |

The editor creates itself in the browser. On the server, the edit page renders only the empty
frame it fills, and the add-ons load in Node without needing a browser.
