# Scriviamo for React

React components for the Scriviamo editor: `ScriviamoEditor`.

```tsx
import {useState} from "react"
import {ScriviamoEditor} from "scriviamo-react"

export function NotesPage() {
  const [doc, setDoc] = useState("# Notes\n\nStart writing.")

  return (
    <div style={{display: "flex", gap: 8}}>
      <ScriviamoEditor
        value={doc}
        format="markdown"
        onChange={setDoc}
        style={{flex: 1, height: 500}}
      />
    </div>
  )
}
```

Load Scriviamo's stylesheet, `dist/scriviamo.css`, and those of any add-ons, as you load other CSS.

## ScriviamoEditor

Takes every setting in the [wrappers README](../README.md#settings), plus:

| Prop | Meaning |
|---|---|
| `onChange(value, editor)` | The document changed. `value` is in `format`. |
| `onSelectionChange(node, editor)` | The primary selected node changed |
| `onReady(editor)` | The editor was created |
| `className`, `style` | For the element the editor fills. Give it a height, or set `adaptiveHeight`. |

`value` can be left out for an editor that manages its own document: read it with the editor's
`toJSON()` when you need it.

A ref gives the editor:

```tsx
const ref = useRef<ScriviamoEditorHandle>(null)
// ...
<ScriviamoEditor ref={ref} />
// ...
ref.current?.editor?.print()
```

The editor is created when the component mounts and destroyed when it unmounts. Props are
applied as they change; only `value` changing from outside reloads the document.


## Building

```bash
npm install
npm run build
```

The build writes `dist/index.js` and its declarations. React and Scriviamo stay external, as peer
dependencies.
