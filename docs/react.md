# React and Next.js

`scriviamo-react` puts the editor in a React app as a component. This page walks through
setting it up, keeping and saving the document, and rendering documents on the server with
Next.js. The [package's README](../wrappers/react/README.md) lists every prop.

## Installing

```bash
npm install scriviamo scriviamo-react bootstrap bootstrap-icons
```

React 18 or later. Load the stylesheets once, such as in your app's root component or layout:
Bootstrap's CSS and Bootstrap Icons, which Scriviamo's interface uses, then Scriviamo's own and
those of the add-ons you use.

```tsx
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.min.css"
import "scriviamo/dist/scriviamo.css"
import "scriviamo/dist/addons/scriviamo.callouts.css"
```

Add-ons register their node types when they're imported. Import them in one module, and import
that module wherever documents are edited or rendered, so every editor knows every node type:

```ts
// lib/scriviamo.ts
import "scriviamo/addons/callouts"
import "scriviamo/addons/math"
export {Editor} from "scriviamo"
```

## An editor

```tsx
import {useState} from "react"
import {ScriviamoEditor} from "scriviamo-react"
import "./lib/scriviamo"

export function NotesPage() {
  const [doc, setDoc] = useState("# Notes\n\nStart writing.")
  return <ScriviamoEditor value={doc} format="markdown" onChange={setDoc} statusBar style={{height: 500}} />
}
```

Give the editor a height, or set `adaptiveHeight` to let it grow with the document.

- `value` and `onChange` keep the document in your state, in `format`: `"json"` (the default,
  which keeps everything), `"html"` or `"markdown"`. Changing `value` from outside replaces the
  document; passing the editor's own changes back in doesn't reload anything.
- Leave `value` out for an editor that keeps its own document, and read it from the editor when
  you need it.
- `changeDelay` reports changes only once typing pauses, for large documents.
- Every other prop is an editor setting, applied as it changes: `readOnly`, `toolbarVisible`,
  `locale` and the others in the [wrappers README](../wrappers/README.md#settings).

## Saving

`autosave` saves the document a moment after each change, and the status bar shows whether it
has:

```tsx
const autosave = useMemo(() => ({
  save: async (editor: Editor) => {
    let response = await fetch(`/api/documents/${id}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: editor.toJSON()})
    if (!response.ok) throw new Error(`Saving failed: ${response.status}`)
  },
  warnBeforeLeaving: true
}), [id])

<ScriviamoEditor value={initial} autosave={autosave} statusBar />
```

Keep the object the same between renders, with `useMemo`, as here. See
[Autosave](undo-search-statistics.md#autosave) for its settings.

## The editor itself

For anything the props don't cover, use the `Editor`: `onReady` gives it, and so does a ref.

```tsx
const ref = useRef<ScriviamoEditorHandle>(null)
<ScriviamoEditor ref={ref} />
// later
ref.current?.editor?.print()
```

`events` listens to the editor's events by name, such as `{linkPressed: event => …}`. See
[The editor](editor.md) for what it offers.

## Next.js

The editor works in the browser, so the component that shows it is a client component
(`"use client"`). On the server it renders only the empty element the editor fills, and the
editor is created once the page is running.

Documents render on the server without the editor's interface: a headless editor, made with
`new Editor(null)`, loads the saved JSON and returns its HTML and the stylesheet it needs, in a
server component or a route handler. With a [schema](schema.md), it also checks a document before saving it, whatever the browser sent:

```tsx
import {Editor} from "@/lib/scriviamo"

export default async function ViewPage({params}) {
  let document = await loadDocument((await params).id)
  let editor = new Editor(null, {content: document.content})
  return (
    <>
      <style>{editor.exportCSS()}</style>
      <article dangerouslySetInnerHTML={{__html: editor.toHTML()}} />
    </>
  )
}
```

See [Server rendering](server-rendering.md) for what a headless editor can do. The
[Next.js starter](../starters/nextjs/README.md) is a complete app with all of this: a list of
documents, an editor page with autosave, a save endpoint, and server-rendered pages.
