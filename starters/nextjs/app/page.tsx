import Link from "next/link"
import {randomUUID} from "node:crypto"
import {listDocuments} from "@/lib/documents"

// The list changes as documents are saved, so it's made for each request.
export const dynamic = "force-dynamic"

export default async function Home() {
  let documents = await listDocuments()
  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0">Documents</h1>
        <Link className="btn btn-primary" href={`/edit/${randomUUID()}`}><i className="bi bi-plus-lg" /> New document</Link>
      </div>
      {documents.length == 0 ? (
        <p className="text-body-secondary">No documents yet. Start one, and it saves itself as you write.</p>
      ) : (
        <ul className="list-group">
          {documents.map(document => (
            <li key={document.id} className="list-group-item d-flex align-items-center gap-3">
              <span className="flex-grow-1">{document.title}</span>
              <small className="text-body-secondary">{new Date(document.updated).toLocaleString()}</small>
              <Link className="btn btn-sm btn-outline-secondary" href={`/edit/${document.id}`}>Edit</Link>
              <Link className="btn btn-sm btn-outline-primary" href={`/view/${document.id}`}>View</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
