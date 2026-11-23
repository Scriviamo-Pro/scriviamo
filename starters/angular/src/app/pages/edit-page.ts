import {Component, inject, input, OnInit, signal} from "@angular/core"
import {RouterLink} from "@angular/router"
import {Documents} from "../documents"
import {DocumentEditor} from "./document-editor"

@Component({
  selector: "app-edit-page",
  imports: [RouterLink, DocumentEditor],
  template: `
    <div class="d-flex align-items-center gap-2 mb-3">
      <a class="btn btn-sm btn-link px-0" routerLink="/"><i class="bi bi-arrow-left"></i> Documents</a>
      <a class="btn btn-sm btn-outline-primary ms-auto" [routerLink]="['/view', id()]">View</a>
    </div>
    @if (loaded()) {
      <!-- The editor works in the browser, so the server renders only the frame it fills, and
           the editor's code loads once the page is up. -->
      @defer (on immediate) {
        <app-document-editor [id]="id()" [initial]="initial()" />
      } @placeholder {
        <div class="editor-frame border rounded"></div>
      }
    }
  `
})
export class EditPage implements OnInit {
  #documents = inject(Documents)
  /** From the route. */
  id = input.required<string>()
  initial = signal<string | null>(null)
  loaded = signal(false)

  ngOnInit() {
    this.#documents.load(this.id()).subscribe(document => {
      this.initial.set(document ? document.content : null)
      this.loaded.set(true)
    })
  }
}
