// The documents API, as the pages see it. On the server, these requests go to the app's own API,
// and what they fetch travels with the page, so the browser doesn't fetch it again.
import {HttpClient} from "@angular/common/http"
import {inject, Injectable} from "@angular/core"
import {catchError, Observable, of} from "rxjs"

export interface DocumentSummary {
  id: string
  title: string
  updated: string
}

export interface StoredDocument extends DocumentSummary {
  /** What editor.toJSON() saved. */
  content: string
}

export interface RenderedDocument {
  title: string
  html: string
  css: string
}

@Injectable({providedIn: "root"})
export class Documents {
  #http = inject(HttpClient)

  list(): Observable<Array<DocumentSummary>> {
    return this.#http.get<Array<DocumentSummary>>("/api/documents")
  }

  /** The document, or null for one that hasn't been saved yet. */
  load(id: string): Observable<StoredDocument | null> {
    return this.#http.get<StoredDocument>(`/api/documents/${encodeURIComponent(id)}`).pipe(catchError(() => of(null)))
  }

  /** Its HTML and stylesheet, rendered by a headless editor on the server, or null. */
  render(id: string): Observable<RenderedDocument | null> {
    return this.#http.get<RenderedDocument>(`/api/render/${encodeURIComponent(id)}`).pipe(catchError(() => of(null)))
  }
}
