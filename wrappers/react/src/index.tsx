import {type CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef} from "react"
import type {Editor, Node} from "scriviamo"
import {EditorBinding, type ScriviamoSettings} from "./editorbinding"

export type {ScriviamoFormat, ScriviamoSettings} from "./editorbinding"

export interface ScriviamoEditorProps extends ScriviamoSettings {
  /** The document changed. value is in format. */
  onChange?: (value: string, editor: Editor) => void
  /** The primary selected node changed. */
  onSelectionChange?: (node: Node | null, editor: Editor) => void
  /** The editor was created. */
  onReady?: (editor: Editor) => void
  /** Classes and style for the element the editor fills. Give it a height, or set adaptiveHeight. */
  className?: string
  style?: CSSProperties
}

/** What a ref to ScriviamoEditor gives: the editor, once it exists. */
export interface ScriviamoEditorHandle {
  readonly editor: Editor | null
}

/**
 * A Scriviamo editor. Import the add-ons you use before rendering it.
 *
 *     <ScriviamoEditor value={doc} onChange={setDoc} style={{height: 500}} />
 *
 * value is read when it changes from outside: the editor's own changes come back through
 * onChange, and passing them back in doesn't reload the document.
 */
export const ScriviamoEditor = forwardRef<ScriviamoEditorHandle, ScriviamoEditorProps>(function ScriviamoEditor(props, ref) {
  const host = useRef<HTMLDivElement>(null)
  const binding = useRef<EditorBinding | null>(null)
  // The latest callbacks, so the editor always calls the current ones.
  const latest = useRef(props)
  latest.current = props

  useEffect(() => {
    let created = new EditorBinding(host.current!, latest.current, {
      change: (value, editor) => latest.current.onChange?.(value, editor),
      selectionChange: (node, editor) => latest.current.onSelectionChange?.(node, editor),
      ready: editor => latest.current.onReady?.(editor)
    })
    binding.current = created
    return () => {
      created.destroy()
      binding.current = null
    }
  }, [])

  // The binding compares with the previous settings and applies only what changed.
  useEffect(() => {
    binding.current?.update(props)
  })

  useImperativeHandle(ref, () => ({
    get editor() {
      return binding.current ? binding.current.editor : null
    }
  }), [])

  return <div ref={host} className={props.className} style={props.style} />
})
