import Link from "next/link"
import {notFound} from "next/navigation"
import {Editor} from "@/lib/scriviamo"
import {loadDocument} from "@/lib/documents"

export const dynamic = "force-dynamic"

/** The document as a page, rendered on the server: no editor, and no JavaScript needed. */
export default async function ViewPage({params}: {params: Promise<{id: string}>}) {
  let {id} = await params
  let document = await loadDocument(id)
  if (!document) notFound()
  // A headless editor turns the saved JSON into HTML and the stylesheet it needs.
  let editor = new Editor(null, {content: document.content})
  let css = editor.exportCSS().replace(/(^|\})\s*body\s*\{[^}]*\}/g, "$1").replace(/(^|\})\s*html\s*\{[^}]*\}/g, "$1")
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link className="btn btn-sm btn-link px-0" href="/"><i className="bi bi-arrow-left" /> Documents</Link>
        <Link className="btn btn-sm btn-outline-secondary ms-auto" href={`/edit/${id}`}>Edit</Link>
      </div>
      <style>{css}</style>
      <article className="document" dangerouslySetInnerHTML={{__html: editor.toHTML()}} />
    </>
  )
}
