// addons/rawcontent/rawcontentnode.ts
import { CodeBlockNode, Editor, InspectorDefaults, InspectorEditors, InspectorItem, RichText, Strings } from "scriviamo";
var RawcontentStrings = {
  TextRawContentCaption: "Raw HTML",
  TextDefaultRawContent: "",
  TextCopyRawContentTooltip: "Copy Raw Content",
  TextRawContentToolbarTooltip: "Add Raw Content"
};
Strings.register(RawcontentStrings);
var RawContentNode = class extends CodeBlockNode {
  static identifier = "rawcontent";
  static caption = "Raw HTML";
  static icon = "bi bi-filetype-html";
  inspectorSections() {
    let strings = this.strings;
    return [InspectorDefaults.section("content", strings.TextContentInspectorCaption, [InspectorItem.bound("text", strings.TextRawContentCaption, InspectorEditors.multilineText, (target) => target.content.text, (target, value) => target.content = new RichText(String(value || "")))])];
  }
  static keywords = "html embed markup source";
  get placeholderText() {
    return this.strings.TextRawContentCaption;
  }
  build(body) {
    super.build(body);
    let input = body.querySelector(".scv-code-language");
    if (input) {
      input.value = this.strings.TextRawContentCaption;
      input.readOnly = true;
      input.removeAttribute("list");
    }
  }
  toHTML() {
    return this.content.text;
  }
  toMarkdown() {
    return this.content.text;
  }
  toPlainText() {
    return "";
  }
};
Editor.registerNodeType(RawContentNode, 180);
export {
  RawContentNode
};
