import Link from "next/link"
import {notFound} from "next/navigation"
import {loadDocument, validId} from "@/lib/documents"
import DocumentEditor from "./document-editor"

export const dynamic = "force-dynamic"

export default async function EditPage({params}: {params: Promise<{id: string}>}) {
  let {id} = await params
  if (!validId(id)) notFound()
  let document = await loadDocument(id)
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link className="btn btn-sm btn-link px-0" href="/"><i className="bi bi-arrow-left" /> Documents</Link>
        <Link className="btn btn-sm btn-outline-primary ms-auto" href={`/view/${id}`}>View</Link>
      </div>
      <DocumentEditor id={id} initial={document ? document.content : null} />
    </>
  )
}
