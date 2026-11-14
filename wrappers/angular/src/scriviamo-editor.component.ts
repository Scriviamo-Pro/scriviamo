import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, forwardRef, Input, NgZone, OnChanges, OnDestroy, OnInit, Output, ViewChild} from "@angular/core"
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms"
import type {Editor, Node, ToolbarDisplayModes} from "scriviamo"
import {EditorBinding, ScriviamoFormat, ScriviamoSettings} from "./editorbinding"

/**
 * A Scriviamo editor. Import the add-ons you use before it is created.
 *
 *     <scriviamo-editor [(value)]="doc" format="markdown" style="display: block; height: 500px" />
 *
 * It also works with Angular forms, through ngModel or a form control. value is read when it
 * changes from outside: the editor's own changes come back through valueChange, and passing
 * them back in doesn't reload the document.
 */
@Component({
  selector: "scriviamo-editor",
  standalone: true,
  template: "<div #host class=\"scriviamo-editor-host\"></div>",
  styles: [":host { display: block; } .scriviamo-editor-host { height: 100%; }"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ScriviamoEditorComponent), multi: true}]
})
export class ScriviamoEditorComponent implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {
  /** The document, in format. */
  @Input() value: string | undefined
  @Input() format: ScriviamoFormat = "json"
  @Input() readOnly: boolean | undefined
  @Input() toolbarVisible: boolean | undefined
  @Input() toolbarDisplayMode: ToolbarDisplayModes | undefined
  @Input() showContextualToolbars: boolean | undefined
  @Input() hoverInsertion: boolean | undefined
  @Input() markdownShortcuts: boolean | undefined
  @Input() allowAnnotations: boolean | undefined
  @Input() adaptiveHeight: boolean | undefined
  @Input() fontName: string | undefined
  @Input() fontSize: number | undefined
  /** A locale pack, or an object of localized strings. */
  @Input() locale: string | object | undefined
  @Input() editorClass: string | undefined
  /** Milliseconds to wait after typing stops before reporting a change. */
  @Input() changeDelay: number | undefined
  /** Editor events to listen to, by name. */
  @Input() events: ScriviamoSettings["events"]

  /** The document changed in the editor, for [(value)]. */
  @Output() valueChange = new EventEmitter<string>()
  @Output() selectionChange = new EventEmitter<Node | null>()
  /** The editor was created. */
  @Output() ready = new EventEmitter<Editor>()

  @ViewChild("host", {static: true}) host!: ElementRef<HTMLElement>

  #binding: EditorBinding | null = null
  #formsDisabled = false
  #onFormChange: (value: string) => void = () => {}
  #onFormTouched: () => void = () => {}

  constructor(private zone: NgZone) {}

  /** The editor, once the view exists. */
  get editor(): Editor | null {
    return this.#binding ? this.#binding.editor : null
  }

  #settings(): ScriviamoSettings {
    return {
      value: this.value,
      format: this.format,
      readOnly: this.#formsDisabled ? true : this.readOnly,
      toolbarVisible: this.toolbarVisible,
      toolbarDisplayMode: this.toolbarDisplayMode,
      showContextualToolbars: this.showContextualToolbars,
      hoverInsertion: this.hoverInsertion,
      markdownShortcuts: this.markdownShortcuts,
      allowAnnotations: this.allowAnnotations,
      adaptiveHeight: this.adaptiveHeight,
      fontName: this.fontName,
      fontSize: this.fontSize,
      locale: this.locale,
      editorClass: this.editorClass,
      changeDelay: this.changeDelay,
      events: this.events
    }
  }

  // The editor is created as early as possible, so a template binding such as
  // [editor]="doc.editor" already sees it in the first check. The host is a static query.
  ngOnInit() {
    // The editor's own listeners run outside Angular; only the outputs re-enter it.
    this.zone.runOutsideAngular(() => {
      this.#binding = new EditorBinding(this.host.nativeElement, this.#settings(), {
        change: value => this.zone.run(() => {
          this.value = value
          this.valueChange.emit(value)
          this.#onFormChange(value)
        }),
        selectionChange: node => this.zone.run(() => this.selectionChange.emit(node))
      })
      this.host.nativeElement.addEventListener("focusout", event => {
        // Touched once focus leaves the editor altogether, not when it moves inside it.
        if (!this.host.nativeElement.contains(event.relatedTarget as globalThis.Node | null)) this.zone.run(() => this.#onFormTouched())
      })
    })
    this.ready.emit(this.#binding!.editor)
  }

  ngOnChanges() {
    this.#binding?.update(this.#settings())
  }

  ngOnDestroy() {
    this.#binding?.destroy()
    this.#binding = null
  }

  // Angular forms

  writeValue(value: string | null) {
    this.value = value ?? ""
    this.#binding?.update(this.#settings())
  }

  registerOnChange(callback: (value: string) => void) {
    this.#onFormChange = callback
  }

  registerOnTouched(callback: () => void) {
    this.#onFormTouched = callback
  }

  setDisabledState(disabled: boolean) {
    this.#formsDisabled = disabled
    this.#binding?.update(this.#settings())
  }
}
