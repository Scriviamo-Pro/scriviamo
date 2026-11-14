import {Utilities} from "./internal"

/**
 * CSS rules collected by selector. Adding declarations to a selector that already
 * has a rule merges them into it, and setting a property that is already set
 * replaces its value in place. toString writes one block per selector in the order
 * the selectors were first added, then any at-rules, such as @media, as written.
 */
export class Stylesheet {
  #selectors: Array<string> = []
  #rules: Map<string, Array<[string, string]>> = new Map()
  #atRules: Array<string> = []

  /** Adds the rules in CSS text. Comments are dropped; at-rules are kept as written. */
  addCSS(css: string) {
    let text = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "")
    let index = 0
    while (index < text.length) {
      let open = text.indexOf("{", index)
      if (open < 0) break
      let selector = text.substring(index, open).trim()
      // Find the matching brace, allowing nested blocks in at-rules.
      let depth = 1
      let cursor = open + 1
      while (cursor < text.length && depth > 0) {
        if (text[cursor] == "{") depth++
        if (text[cursor] == "}") depth--
        cursor++
      }
      let body = text.substring(open + 1, cursor - 1)
      if (selector.startsWith("@")) {
        this.#atRules.push(`${selector} {${body}}`)
      } else if (selector.length > 0) {
        this.addRule(selector, body)
      }
      index = cursor
    }
  }

  /** Adds declarations such as "color: red; margin: 0" to the rule for a selector. */
  addRule(selector: string, declarations: string) {
    selector = Stylesheet.#normalize(selector)
    if (selector.length == 0) return
    if (!this.#rules.has(selector)) {
      this.#rules.set(selector, [])
      this.#selectors.push(selector)
    }
    String(declarations || "").split(";").forEach(declaration => {
      let colon = declaration.indexOf(":")
      if (colon <= 0) return
      let name = declaration.substring(0, colon).trim().toLowerCase()
      let value = declaration.substring(colon + 1).trim()
      if (name.length > 0 && value.length > 0) this.setProperty(selector, name, value)
    })
  }

  hasRule(selector: string): boolean {
    return this.#rules.has(Stylesheet.#normalize(selector))
  }

  /** The value of a property in a selector's rule, or "" when it isn't set. */
  propertyValue(selector: string, propertyName: string): string {
    let rule = this.#rules.get(Stylesheet.#normalize(selector))
    let entry = rule ? rule.find(([name]) => name == propertyName.trim().toLowerCase()) : null
    return entry ? entry[1] : ""
  }

  get ruleCount(): number {
    return this.#selectors.length
  }

  selectorAt(index: number): string {
    return this.#selectors[index] || ""
  }

  /** Sets a property in a selector's rule. A property already set keeps its position. */
  setProperty(selector: string, propertyName: string, value: string) {
    selector = Stylesheet.#normalize(selector)
    if (selector.length == 0) return
    if (!this.#rules.has(selector)) {
      this.#rules.set(selector, [])
      this.#selectors.push(selector)
    }
    let rule = this.#rules.get(selector)
    let name = propertyName.trim().toLowerCase()
    let existing = rule.find(entry => entry[0] == name)
    if (existing) {
      existing[1] = value.trim()
    } else {
      rule.push([name, value.trim()])
    }
  }

  /** The rules as CSS, one declaration per line, in the order they were added, followed by at-rules. */
  toString(): string {
    let blocks = this.#selectors.map(selector => `${selector} {\n${this.#rules.get(selector).map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`)
    return blocks.concat(this.#atRules).join("\n")
  }

  /** Collapses whitespace and writes selector lists as "a, b", so equivalent selectors share a rule. */
  static #normalize(selector: string): string {
    return String(selector || "").replace(/\s+/g, " ").split(",").map(part => part.trim()).filter(part => part.length > 0).join(", ")
  }
}

export enum ExportFormats {
  custom = 0,
  html = 1,
  json = 2,
  markdown = 3,
  plainText = 4
}

/**
 * A named document-output format. The built-in ones route HTML, JSON, Markdown and
 * plain text to the editor's own exporters; subclass it and override export to add
 * an application format.
 */
export class Exporter {
  identifier: string
  format: ExportFormats
  fileExtension: string = "txt"
  mimeType: string = "text/plain"

  constructor(identifier: string, format: ExportFormats = ExportFormats.custom) {
    this.identifier = identifier.trim()
    this.format = format
    switch (format) {
      case ExportFormats.html:
        this.fileExtension = "html"
        this.mimeType = "text/html"
        break
      case ExportFormats.json:
        this.fileExtension = "json"
        this.mimeType = "application/json"
        break
      case ExportFormats.markdown:
        this.fileExtension = "md"
        this.mimeType = "text/markdown"
        break
    }
  }

  export(editor: any): string {
    if (!editor) return ""
    switch (this.format) {
      case ExportFormats.html: return editor.toHTML(true)
      case ExportFormats.json: return editor.toJSON()
      case ExportFormats.markdown: return editor.toMarkdown()
      case ExportFormats.plainText: return editor.toPlainText()
    }
    return ""
  }

  /** Offers the export to the user as a download named fileName plus the extension. */
  exportToFile(editor: any, fileName: string = "document"): boolean {
    let text = this.export(editor)
    if (typeof document == "undefined") return false
    let blob = new Blob([text], {type: `${this.mimeType};charset=utf-8`})
    let url = URL.createObjectURL(blob)
    let link = document.createElement("a")
    link.href = url
    link.download = this.fileExtension.length > 0 ? `${fileName}.${this.fileExtension}` : fileName
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  }
}

/**
 * The export formats an editor offers, keyed by identifier without regard to case.
 * Each editor starts with "html", "json", "markdown" and "text". Adding an exporter
 * with an existing identifier replaces it.
 */
export class Exporters {
  #owner: any
  #items: Array<Exporter> = []

  constructor(owner: any) {
    this.#owner = owner
  }

  get owner(): any {
    return this.#owner
  }

  #indexOfIdentifier(identifier: string): number {
    let key = String(identifier || "").trim().toLowerCase()
    return this.#items.findIndex(item => item.identifier.toLowerCase() == key)
  }

  add(item: Exporter) {
    if (!item) return
    let existing = this.#indexOfIdentifier(item.identifier)
    if (existing >= 0) {
      this.#items[existing] = item
    } else {
      this.#items.push(item)
    }
  }

  addAt(index: number, item: Exporter) {
    if (!item) return
    let existing = this.#indexOfIdentifier(item.identifier)
    if (existing >= 0) this.#items.splice(existing, 1)
    this.#items.splice(Utilities.clamp(index, 0, this.#items.length), 0, item)
  }

  indexOf(item: Exporter): number {
    return this.#items.indexOf(item)
  }

  item(identifier: string): Exporter | null {
    let index = this.#indexOfIdentifier(identifier)
    return index < 0 ? null : this.#items[index]
  }

  itemAt(index: number): Exporter | null {
    return this.#items[index] || null
  }

  items(): Array<Exporter> {
    return this.#items.slice()
  }

  get lastIndex(): number {
    return this.#items.length - 1
  }

  remove(item: Exporter | string) {
    this.removeAt(typeof item == "string" ? this.#indexOfIdentifier(item) : this.#items.indexOf(item))
  }

  removeAt(index: number) {
    if (index >= 0 && index < this.#items.length) this.#items.splice(index, 1)
  }

  removeAll() {
    this.#items = []
  }
}

export enum NotificationTypes {
  info = 0,
  success = 1,
  warning = 2,
  danger = 3
}

/**
 * A short message shown over the editor. It disappears when clicked, or after
 * duration seconds; a duration of zero keeps it until it is clicked.
 */
export class Notification {
  message: string
  type: NotificationTypes
  title: string
  duration: number = 15
  /** @internal The element showing it, while it is shown. */
  element: HTMLElement | null = null

  constructor(message: string, type: NotificationTypes = NotificationTypes.info, title: string = "") {
    this.message = message
    this.type = type
    this.title = title
  }

  /** The Bootstrap color name for the type. */
  get indicator(): string {
    return ["info", "success", "warning", "danger"][this.type] || "info"
  }

  static typeFor(indicator: string): NotificationTypes {
    let index = ["info", "success", "warning", "danger"].indexOf(indicator)
    return index < 0 ? NotificationTypes.info : index
  }
}
