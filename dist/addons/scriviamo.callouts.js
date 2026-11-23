// addons/callouts/calloutnodes.ts
import { Editor, InspectorDefaults, InspectorItem, Strings, TextHost, TextHostModes, TextNode, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities } from "scriviamo";
var CalloutsStrings = {
  TextAlertInspectorCaption: "Alert",
  TextInfoCaption: "Info",
  TextSuccessCaption: "Success",
  TextWarningCaption: "Warning",
  TextDangerCaption: "Danger",
  TextAddAlertCaption: "Add Alert",
  TextAlertTypeCaption: "Alert Type"
};
Strings.register(CalloutsStrings);
var AlertTypes = /* @__PURE__ */ ((AlertTypes2) => {
  AlertTypes2[AlertTypes2["info"] = 0] = "info";
  AlertTypes2[AlertTypes2["success"] = 1] = "success";
  AlertTypes2[AlertTypes2["warning"] = 2] = "warning";
  AlertTypes2[AlertTypes2["danger"] = 3] = "danger";
  return AlertTypes2;
})(AlertTypes || {});
var AlertNode = class _AlertNode extends TextNode {
  static exportStyles(sheet, editor) {
    super.exportStyles(sheet, editor);
    sheet.addRule(".alert", `padding: 16px; border-inline-start: 4px solid ${Editor.themeCSS(editor, ThemeColors.information)}; background: ${Editor.themeCSS(editor, ThemeColors.information, 220)}`);
    sheet.addRule(".alert-success", `border-inline-start-color: ${Editor.themeCSS(editor, ThemeColors.success)}; background: ${Editor.themeCSS(editor, ThemeColors.success, 220)}`);
    sheet.addRule(".alert-warning", `border-inline-start-color: ${Editor.themeCSS(editor, ThemeColors.warning)}; background: ${Editor.themeCSS(editor, ThemeColors.warning, 220)}`);
    sheet.addRule(".alert-danger", `border-inline-start-color: ${Editor.themeCSS(editor, ThemeColors.danger)}; background: ${Editor.themeCSS(editor, ThemeColors.danger, 220)}`);
  }
  static identifier = "alert";
  static caption = "Alert";
  static captionString = "TextAlertInspectorCaption";
  static icon = "bi bi-exclamation-triangle";
  static keywords = "callout note tip warning caution info danger success";
  static typeNames = ["info", "success", "warning", "danger"];
  static typeIcons = ["bi bi-info-circle-fill", "bi bi-check-circle-fill", "bi bi-exclamation-triangle-fill", "bi bi-x-octagon-fill"];
  static blockKinds(strings, _compact) {
    return [["alert:0", strings.TextAlertInspectorCaption, "bi bi-info-circle"]];
  }
  static fromBlockContent(content, value, source) {
    content.alertType = value;
    let result = super.fromBlockContent(content, value, source);
    result[0].alertType = value;
    return result;
  }
  static importElement(element, importer) {
    if (element.tagName != "BLOCKQUOTE" && element.tagName != "ASIDE")
      return void 0;
    let match = (element.className || "").match(/alert-(info|success|warning|danger)/);
    if (!match)
      return void 0;
    let alert = new _AlertNode();
    alert.alertType = _AlertNode.typeNames.indexOf(match[1]);
    alert.content = importer.trimmed(importer.richText(Array.from(element.childNodes)));
    alert.content.alertType = _AlertNode.typeNames.indexOf(match[1]);
    return importer.attach(alert);
  }
  get blockKind() {
    return `alert:${this.alertType}`;
  }
  convertBlock(kind, value) {
    if (kind != "alert" || this.alertType == value)
      return super.convertBlock(kind, value);
    this.alertType = value;
    return [this];
  }
  inspectorSections() {
    let strings = this.strings;
    let type = InspectorItem.menu("alerttype", strings.TextTypeCaption, [[strings.TextInfoCaption, 0 /* info */], [strings.TextSuccessCaption, 1 /* success */], [strings.TextWarningCaption, 2 /* warning */], [strings.TextDangerCaption, 3 /* danger */]], (target) => target.alertType, (target, value) => target.alertType = value);
    type.setDefaultValue(0 /* info */);
    return [InspectorDefaults.section("alert", strings.TextAlertInspectorCaption, [type])].concat(InspectorDefaults.text(this));
  }
  get alertType() {
    return Utilities.clamp(this.content.alertType, 0, 3);
  }
  set alertType(value) {
    this.content.alertType = Utilities.clamp(value, 0, 3);
  }
  get placeholderText() {
    return this.typeCaption(this.alertType);
  }
  typeCaption(value) {
    return [this.strings.TextInfoCaption, this.strings.TextSuccessCaption, this.strings.TextWarningCaption, this.strings.TextDangerCaption][value];
  }
  build(body) {
    let alert = Utilities.element("div", `alert alert-${_AlertNode.typeNames[this.alertType]} scv-alert mb-0`, { role: "note" });
    body.append(alert);
    let icon = Utilities.element("i", `${_AlertNode.typeIcons[this.alertType]} scv-alert-icon`, { contenteditable: "false" });
    alert.append(icon);
    let paragraph = Utilities.element("div", "scv-alert-text");
    alert.append(paragraph);
    let host = this.addHost(new TextHost(this, this.content, paragraph, TextHostModes.inline));
    host.placeholder = this.placeholderText;
    this.applyTextAppearance(paragraph);
    host.render();
  }
  actions() {
    let item = new ToolbarItem("alerttype", this.typeCaption(this.alertType), _AlertNode.typeIcons[this.alertType], ToolbarItemKinds.menu, this.strings.TextAlertInspectorCaption);
    item.alwaysShowCaption = true;
    for (let type = 0; type <= 3; type++) {
      let menuItem = new ToolbarMenuItem(String(type), this.typeCaption(type), _AlertNode.typeIcons[type]);
      menuItem.checked = type == this.alertType;
      item.menuItems.push(menuItem);
    }
    return [item];
  }
  performAction(item, menuItem) {
    if (item.identifier == "alerttype" && menuItem) {
      this.willChange();
      this.alertType = Number(menuItem.identifier);
      this.refresh();
      this.changed();
      return true;
    }
    return false;
  }
  createFollowingNode() {
    return new TextNode();
  }
  toHTML() {
    return `<aside class="alert alert-${_AlertNode.typeNames[this.alertType]}" style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}${this.htmlLineHeightCSS()}">${this.content.htmlText()}</aside>`;
  }
  toMarkdown() {
    let lines = this.content.markdownText().replace(/\r/g, "").split("\n");
    lines.unshift(["[!NOTE]", "[!TIP]", "[!WARNING]", "[!CAUTION]"][this.alertType]);
    return this.markdownWithBackground(lines.map((line) => `> ${line}`).join("\n"));
  }
};
Editor.registerNodeType(AlertNode, 50);
export {
  AlertNode,
  AlertTypes
};
