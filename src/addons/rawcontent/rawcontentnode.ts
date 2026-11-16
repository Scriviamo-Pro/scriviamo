import {CodeBlockNode, Editor, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, RichText, Strings} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const RawcontentStrings = {
  TextRawContentCaption: "Raw HTML",
  TextDefaultRawContent: "",
  TextCopyRawContentTooltip: "Copy Raw Content",
  TextRawContentToolbarTooltip: "Add Raw Content"
}

type RawcontentStringsTable = typeof RawcontentStrings

declare module "scriviamo" {
  interface Strings extends RawcontentStringsTable {}
}

Strings.register(RawcontentStrings)

/** HTML written into exported documents as it is. */
export class RawContentNode extends CodeBlockNode {
  static identifier: string = "rawcontent"
  static caption: string = "Raw HTML"
  static icon: string = "bi bi-filetype-html"

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    return [InspectorDefaults.section("content", strings.TextContentInspectorCaption, [InspectorItem.bound("text", strings.TextRawContentCaption, InspectorEditors.multilineText, target => target.content.text, (target, value) => target.content = new RichText(String(value || "")))])]
  }
  static keywords: string = "html embed markup source"

  protected get placeholderText(): string {
    return this.strings.TextRawContentCaption
  }

  protected build(body: HTMLElement) {
    super.build(body)
    let input = body.querySelector(".scv-code-language") as HTMLInputElement
    if (input) {
      input.value = this.strings.TextRawContentCaption
      input.readOnly = true
      input.removeAttribute("list")
    }
  }

  toHTML(): string {
    return this.content.text
  }

  toMarkdown(): string {
    return this.content.text
  }

  toPlainText(): string {
    return ""
  }
}

Editor.registerNodeType(RawContentNode, 180)
