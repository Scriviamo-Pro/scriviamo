import {InspectorSection, Node, Utilities} from "../internal"

/** A node whose type this editor doesn't know. It keeps its JSON so saving loses nothing. */
export class UnknownNode extends Node {
  static identifier: string = "unknown"
  static caption: string = "Unsupported"
  static icon: string = "bi bi-question-square"
  static insertable: boolean = false

  #data: any = {}

  get type(): string {
    return Utilities.string(this.#data.type, "unknown")
  }

  get typeName(): string {
    return Utilities.format(this.strings.TextUnsupportedContentFormat, {type: this.type})
  }

  protected build(body: HTMLElement) {
    let card = Utilities.element("div", "scv-unknown")
    card.innerHTML = `<i class="bi bi-puzzle"></i> `
    card.append(document.createTextNode(this.typeName))
    body.append(card)
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.#data = JSON.parse(JSON.stringify(data))
    return true
  }

  toJSON(): object {
    let result = JSON.parse(JSON.stringify(this.#data))
    result.nodeId = this.nodeId
    return result
  }

  inspectorSections(): Array<InspectorSection> {
    return []
  }

  get canExportHTML(): boolean {
    return false
  }

  toPlainText(): string {
    return ""
  }
}
