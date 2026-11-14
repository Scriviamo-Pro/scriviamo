import {Editor, Node, ToolbarDisplayModes} from "scriviamo"

/** The document format a wrapper's value is read and written in. */
export type ScriviamoFormat = "json" | "html" | "markdown"

/** Settings every framework wrapper accepts. Missing settings keep the editor's defaults. */
export interface ScriviamoSettings {
  /** The document, in format. Changing it from outside replaces the document. */
  value?: string
  /** The format of value. "json" keeps everything; HTML and Markdown keep what they can express. */
  format?: ScriviamoFormat
  readOnly?: boolean
  toolbarVisible?: boolean
  toolbarDisplayMode?: ToolbarDisplayModes
  showContextualToolbars?: boolean
  hoverInsertion?: boolean
  markdownShortcuts?: boolean
  allowAnnotations?: boolean
  adaptiveHeight?: boolean
  fontName?: string
  fontSize?: number
  /** A locale pack, or an object of localized strings. */
  locale?: string | object
  /** Extra classes for the editor element. */
  editorClass?: string
  /** Milliseconds to wait after typing stops before reporting a change; 0 reports each change. */
  changeDelay?: number
  /** Editor events to listen to, by name, such as {linkPressed: event => ...}. */
  events?: {[name: string]: (event: CustomEvent) => void}
}

/** What a binding reports to its framework wrapper. */
export interface ScriviamoCallbacks {
  /** The document changed in the editor. value is in the binding's format. */
  change?(value: string, editor: Editor): void
  /** The primary selected node changed. */
  selectionChange?(node: Node | null, editor: Editor): void
  /** The editor was created. */
  ready?(editor: Editor): void
}

/**
 * Keeps an editor in step with a framework component's settings: it creates the editor, applies
 * changed settings to it, reports changes, and tears it down. Each framework wrapper is a thin
 * layer over this.
 */
export class EditorBinding {
  readonly editor: Editor
  #settings: ScriviamoSettings
  #callbacks: ScriviamoCallbacks
  /** The value last reported, and the value last loaded from outside, so a wrapper passing either back doesn't reload the document. */
  #value: string | undefined
  #loadedValue: string | undefined
  /** True while a value from outside is loading, whose changes aren't the user's. */
  #loading: boolean = false
  #timer: ReturnType<typeof setTimeout> | null = null
  #listeners: Array<[string, EventListener]> = []
  #onContent: EventListener
  #onSelection: EventListener

  constructor(element: HTMLElement, settings: ScriviamoSettings, callbacks: ScriviamoCallbacks = {}) {
    this.#settings = {...settings}
    this.#callbacks = callbacks
    this.editor = new Editor(element, EditorBinding.#options(settings))
    if (settings.value !== undefined) this.#load(settings.value, this.#format(settings))
    this.#onContent = () => {
      if (!this.#loading) this.#scheduleChange()
    }
    this.#onSelection = event => this.#callbacks.selectionChange?.((event as CustomEvent).detail?.node ?? null, this.editor)
    this.editor.addEventListener("contentChanged", this.#onContent)
    this.editor.addEventListener("selectionChanged", this.#onSelection)
    this.#listen(settings.events)
    callbacks.ready?.(this.editor)
  }

  /** The options a new editor starts with. Content is loaded separately, in the chosen format. */
  static #options(settings: ScriviamoSettings) {
    let options: any = {}
    if (settings.readOnly !== undefined) options.readOnly = settings.readOnly
    if (settings.toolbarVisible !== undefined) options.toolbarVisible = settings.toolbarVisible
    if (settings.toolbarDisplayMode !== undefined) options.toolbarDisplayMode = settings.toolbarDisplayMode
    if (settings.showContextualToolbars !== undefined) options.showContextualToolbars = settings.showContextualToolbars
    if (settings.hoverInsertion !== undefined) options.isHoverInsertionEnabled = settings.hoverInsertion
    if (settings.markdownShortcuts !== undefined) options.markdownShortcuts = settings.markdownShortcuts
    if (settings.allowAnnotations !== undefined) options.allowAnnotations = settings.allowAnnotations
    if (settings.adaptiveHeight !== undefined) options.adaptiveHeight = settings.adaptiveHeight
    if (settings.fontName) options.fontName = settings.fontName
    if (settings.fontSize) options.fontSize = settings.fontSize
    if (settings.locale) options.strings = settings.locale
    if (settings.editorClass) options.class = settings.editorClass
    return options
  }

  #format(settings: ScriviamoSettings): ScriviamoFormat {
    return settings.format == "html" || settings.format == "markdown" ? settings.format : "json"
  }

  /** Applies the settings that changed since previous. A new editor gets them as options instead. */
  #apply(settings: ScriviamoSettings, previous: ScriviamoSettings) {
    let editor = this.editor
    let changed = (name: keyof ScriviamoSettings) => settings[name] !== undefined && settings[name] !== previous[name]
    if (changed("readOnly")) editor.readOnly = !!settings.readOnly
    if (changed("toolbarVisible")) editor.toolbarVisible = !!settings.toolbarVisible
    if (changed("toolbarDisplayMode")) editor.toolbarDisplayMode = settings.toolbarDisplayMode
    if (changed("showContextualToolbars")) editor.showContextualToolbars = !!settings.showContextualToolbars
    if (changed("hoverInsertion")) editor.isHoverInsertionEnabled = !!settings.hoverInsertion
    if (changed("markdownShortcuts")) editor.markdownShortcuts = !!settings.markdownShortcuts
    if (changed("allowAnnotations")) editor.allowAnnotations = !!settings.allowAnnotations
    if (changed("adaptiveHeight")) editor.adaptiveHeight = !!settings.adaptiveHeight
    if (changed("fontName")) editor.fontName = settings.fontName
    if (changed("fontSize")) editor.fontSize = settings.fontSize
    if (changed("editorClass")) editor.class = settings.editorClass
    if (changed("locale")) editor.localize(settings.locale)
  }

  /** Applies new settings from the framework component. */
  update(settings: ScriviamoSettings) {
    let previous = this.#settings
    this.#settings = {...settings}
    this.#apply(settings, previous)
    if (settings.events !== previous.events) {
      this.#unlisten()
      this.#listen(settings.events)
    }
    let format = this.#format(settings)
    let formatChanged = format != this.#format(previous)
    let known = settings.value === this.#value || settings.value === this.#loadedValue
    if (settings.value !== undefined && !known) {
      this.#flush()
      this.#load(settings.value, format)
    } else if (formatChanged) {
      this.#value = this.value
    }
  }

  /** The document in the binding's format. */
  get value(): string {
    switch (this.#format(this.#settings)) {
      case "html": return this.editor.toHTML()
      case "markdown": return this.editor.toMarkdown()
    }
    return this.editor.toJSON()
  }

  #load(value: string, format: ScriviamoFormat) {
    let editor = this.editor
    this.#loading = true
    try {
      this.#loadInto(editor, value, format)
    } finally {
      this.#loading = false
    }
    editor.history.reset()
    editor.isChanged = false
    this.#loadedValue = value
    // The editor's export of what was loaded, which may differ from it in small ways.
    this.#value = this.value
  }

  #loadInto(editor: Editor, value: string, format: ScriviamoFormat) {
    if (format == "json") {
      if (value.trim().length == 0) editor.removeAllNodes()
      else editor.fromJSON(value)
    } else if (format == "html") {
      if (value.trim().length == 0) editor.removeAllNodes()
      else editor.fromHTML(value)
    } else {
      if (value.trim().length == 0) editor.removeAllNodes()
      else editor.fromMarkdown(value)
    }
  }

  #scheduleChange() {
    let delay = Math.max(0, this.#settings.changeDelay ?? 0)
    if (this.#timer) clearTimeout(this.#timer)
    this.#timer = null
    if (delay == 0) {
      this.#report()
    } else {
      this.#timer = setTimeout(() => {
        this.#timer = null
        this.#report()
      }, delay)
    }
  }

  #report() {
    let value = this.value
    if (value === this.#value) return
    this.#value = value
    // The document no longer matches what was loaded, so loading that value again must reload it.
    this.#loadedValue = undefined
    this.#callbacks.change?.(value, this.editor)
  }

  /** Reports a change that is waiting for changeDelay. */
  #flush() {
    if (!this.#timer) return
    clearTimeout(this.#timer)
    this.#timer = null
    this.#report()
  }

  #listen(events: ScriviamoSettings["events"]) {
    for (let name of Object.keys(events || {})) {
      let handler = events[name]
      if (typeof handler != "function") continue
      let listener: EventListener = event => handler(event as CustomEvent)
      this.editor.addEventListener(name, listener)
      this.#listeners.push([name, listener])
    }
  }

  #unlisten() {
    for (let [name, listener] of this.#listeners) this.editor.removeEventListener(name, listener)
    this.#listeners = []
  }

  /** Reports any waiting change, then removes the editor. */
  destroy() {
    this.#flush()
    this.#unlisten()
    this.editor.removeEventListener("contentChanged", this.#onContent)
    this.editor.removeEventListener("selectionChanged", this.#onSelection)
    this.editor.destroy()
  }
}
