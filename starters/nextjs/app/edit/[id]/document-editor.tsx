"use client"

import {useCallback, useMemo} from "react"
import type {Editor} from "scriviamo"
import {ScriviamoEditor} from "scriviamo-react"
import "@/lib/scriviamo"

const Welcome = "# A new document\n\nStart writing. Type / to add a block: a list, a table, a formula, a diagram and more."

/** The editor, saving the document a moment after each change. */
export default function DocumentEditor({id, initial}: {id: string, initial: string | null}) {
  // The editor creates itself in the browser; on the server this renders its empty frame.
  let save = useCallback(async (editor: Editor) => {
    let response = await fetch(`/api/documents/${id}`, {method: "PUT", headers: {"Content-Type": "application/json"}, body: editor.toJSON()})
    if (!response.ok) throw new Error(`Saving failed: ${response.status}`)
  }, [id])
  let autosave = useMemo(() => ({save, warnBeforeLeaving: true}), [save])
  return (
    <ScriviamoEditor
      className="editor-frame"
      value={initial ?? Welcome}
      format={initial ? "json" : "markdown"}
      statusBar
      autosave={autosave}
    />
  )
}
