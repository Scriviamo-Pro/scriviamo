import {Component, inject, input, OnInit, signal} from "@angular/core"
import {DomSanitizer, SafeHtml, Title} from "@angular/platform-browser"
import {RouterLink} from "@angular/router"
import {Documents} from "../documents"

/** The document as a page, rendered on the server: no editor, and no JavaScript needed. */
@Component({
  selector: "app-view-page",
  imports: [RouterLink],
  template: `
    <div class="d-flex align-items-center gap-2 mb-3">
      <a class="btn btn-sm btn-link px-0" routerLink="/"><i class="bi bi-arrow-left"></i> Documents</a>
      <a class="btn btn-sm btn-outline-secondary ms-auto" [routerLink]="['/edit', id()]">Edit</a>
    </div>
    @if (missing()) {
      <p class="text-body-secondary">There's no document here yet.</p>
    } @else if (content(); as html) {
      <article class="document" [innerHTML]="html"></article>
    }
  `
})
export class ViewPage implements OnInit {
  #documents = inject(Documents)
  #sanitizer = inject(DomSanitizer)
  #title = inject(Title)
  /** From the route. */
  id = input.required<string>()
  content = signal<SafeHtml | null>(null)
  missing = signal(false)

  ngOnInit() {
    this.#documents.render(this.id()).subscribe(rendered => {
      if (!rendered) {
        this.missing.set(true)
        return
      }
      this.#title.setTitle(rendered.title)
      // The HTML and stylesheet come from this app's own headless editor, so they're trusted as
      // they are; Angular would otherwise drop the stylesheet and the document's styles.
      this.content.set(this.#sanitizer.bypassSecurityTrustHtml(`<style>${rendered.css}</style>${rendered.html}`))
    })
  }
}
