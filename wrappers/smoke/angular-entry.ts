import "@angular/compiler"
import {Component, provideZonelessChangeDetection, ViewChild} from "@angular/core"
import {FormControl, ReactiveFormsModule} from "@angular/forms"
import {bootstrapApplication} from "@angular/platform-browser"
import {ScriviamoEditorComponent} from "../angular/dist/fesm2022/scriviamo-angular.mjs"
import {connectRunner, sample} from "./page"

const wait = (ms = 60) => new Promise(r => setTimeout(r, ms))

@Component({
  selector: "smoke-app",
  standalone: true,
  imports: [
    ScriviamoEditorComponent, ReactiveFormsModule,
  ],
  template: `
    <scriviamo-editor #two [(value)]="doc" format="markdown" [readOnly]="locked" (ready)="onReady($event)" style="display: block; height: 300px"></scriviamo-editor>
    <scriviamo-editor #form [formControl]="control" format="markdown" style="display: block; height: 200px"></scriviamo-editor>
  `
})
class SmokeApp {
  doc = "# Hello\n\nWorld"
  locked = false
  readyEditor: any = null
  changes = 0
  control = new FormControl("Form *value*")
  @ViewChild("two") two!: ScriviamoEditorComponent
  @ViewChild("form") form!: ScriviamoEditorComponent
  onReady(editor: any) { this.readyEditor = editor }
}

async function runSmoke() {
  let log: any = {}
  let host = document.createElement("smoke-app")
  document.body.append(host)
  let ref = await bootstrapApplication(SmokeApp, {providers: [provideZonelessChangeDetection()]})
  let app = ref.components[0].instance as SmokeApp
  await wait()
  let editor = app.two.editor
  log.ready = !!editor && app.readyEditor === editor
  log.loaded = editor.nodes().map((n: any) => n.type).join(",")
  let emitted = 0
  app.two.valueChange.subscribe(() => emitted++)
  editor.addNode(new (editor.nodes()[1].constructor as any)("Added"))
  await wait()
  log.twoWay = app.doc.includes("Added") && emitted == 1
  await wait()
  log.echoKeptDocument = editor.nodes().length == 3
  app.doc = "Replaced"
  app.locked = true
  ref.components[0].changeDetectorRef.markForCheck()
  await wait()
  log.noSpuriousChange = emitted == 1
  log.replaced = editor.nodes().map((n: any) => n.text).join("|")
  log.readOnly = editor.readOnly
  let formEditor = app.form.editor
  log.formLoaded = formEditor.nodes().map((n: any) => n.text).join("|")
  formEditor.addNode(new (formEditor.nodes()[0].constructor as any)("More"))
  await wait()
  log.formValue = String(app.control.value).includes("More")
  let inside = app.form.host.nativeElement.querySelector(".scv-document") as HTMLElement
  inside.dispatchEvent(new FocusEvent("focusout", {bubbles: true, relatedTarget: document.body}))
  log.formTouched = app.control.touched
  app.control.setValue("From the form")
  await wait()
  log.formWrite = formEditor.nodes().map((n: any) => n.text).join("|")
  app.control.disable()
  await wait()
  log.formDisabled = formEditor.readOnly
  ref.destroy()
  log.destroyed = host.querySelector(".scv-editor") === null
  host.remove()
  return log
}

/** A live editor and inspector, shown while the page is open. */
@Component({
  selector: "smoke-demo",
  standalone: true,
  imports: [
    ScriviamoEditorComponent,
  ],
  template: `
    <div style="display: flex; gap: 12px">
      <scriviamo-editor #live [(value)]="doc" format="markdown" style="flex: 1; height: 360px"></scriviamo-editor>
    </div>
  `
})
class SmokeDemo {
  doc = sample
}

bootstrapApplication(SmokeDemo, {providers: [provideZonelessChangeDetection()]})
connectRunner(runSmoke)
