import {DatePipe} from "@angular/common"
import {Component, inject, OnInit, signal} from "@angular/core"
import {Router, RouterLink} from "@angular/router"
import {DocumentSummary, Documents} from "../documents"

@Component({
  selector: "app-document-list",
  imports: [RouterLink, DatePipe],
  template: `
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h1 class="h3 mb-0">Documents</h1>
      <button type="button" class="btn btn-primary" (click)="newDocument()"><i class="bi bi-plus-lg"></i> New document</button>
    </div>
    @if (documents(); as list) {
      @if (list.length == 0) {
        <p class="text-body-secondary">No documents yet. Start one, and it saves itself as you write.</p>
      } @else {
        <ul class="list-group">
          @for (document of list; track document.id) {
            <li class="list-group-item d-flex align-items-center gap-3">
              <span class="flex-grow-1">{{ document.title }}</span>
              <small class="text-body-secondary">{{ document.updated | date: "medium" }}</small>
              <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/edit', document.id]">Edit</a>
              <a class="btn btn-sm btn-outline-primary" [routerLink]="['/view', document.id]">View</a>
            </li>
          }
        </ul>
      }
    }
  `
})
export class DocumentList implements OnInit {
  #documents = inject(Documents)
  #router = inject(Router)
  documents = signal<Array<DocumentSummary> | null>(null)

  ngOnInit() {
    this.#documents.list().subscribe(list => this.documents.set(list))
  }

  /** A new document gets its id here, in the browser, and is saved once there's something in it. */
  newDocument() {
    this.#router.navigate(["/edit", crypto.randomUUID()])
  }
}
