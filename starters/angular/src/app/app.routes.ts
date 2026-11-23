import {Routes} from "@angular/router"
import {DocumentList} from "./pages/document-list"
import {EditPage} from "./pages/edit-page"
import {ViewPage} from "./pages/view-page"

export const routes: Routes = [
  {path: "", component: DocumentList, title: "Documents"},
  {path: "edit/:id", component: EditPage, title: "Edit"},
  {path: "view/:id", component: ViewPage, title: "Document"},
  {path: "**", redirectTo: ""}
]
