import {Editor, HTMLImporter, InspectorDefaults, InspectorItem, InspectorSection, Node, RichText, Strings, Stylesheet, TextHost, TextHostModes, TextNode, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const CalloutsStrings = {
  TextAlertInspectorCaption: "Alert",
  TextInfoCaption: "Info",
  TextSuccessCaption: "Success",
  TextWarningCaption: "Warning",
  TextDangerCaption: "Danger",
  TextAddAlertCaption: "Add Alert",
  TextAlertTypeCaption: "Alert Type"
}

type CalloutsStringsTable = typeof CalloutsStrings

declare module "scriviamo" {
  interface Strings extends CalloutsStringsTable {}
}

Strings.register(CalloutsStrings)

export enum AlertTypes {
  info = 0,
  success = 1,
  warning = 2,
  danger = 3
}

export class AlertNode extends TextNode {
  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    super.exportStyles(sheet, editor)
    // A pale tint of the type's color behind the text and the full color on the bar, as in the editor.
    sheet.addRule(".alert", `padding: 16px; border-inline-start: 4px solid ${Editor.themeCSS(editor, ThemeColors.information)}; background: ${Editor.themeCSS(editor, ThemeColors.information, 220)}`)
    sheet.addRule(".alert-success", `border-inline-start-color: ${Editor.themeCSS(editor, ThemeColors.success)}; background: ${Editor.themeCSS(editor, ThemeColors.success, 220)}`)
    sheet.addRule(".alert-warning", `border-inline-start-color: ${Editor.themeCSS(editor, ThemeColors.warning)}; background: ${Editor.themeCSS(editor, ThemeColors.warning, 220)}`)
    sheet.addRule(".alert-danger", `border-inline-start-color: ${Editor.themeCSS(editor, ThemeColors.danger)}; background: ${Editor.themeCSS(editor, ThemeColors.danger, 220)}`)
  }

  static identifier: string = "alert"
  static caption: string = "Alert"
  static captionString: string = "TextAlertInspectorCaption"
  static icon: string = "bi bi-exclamation-triangle"
  static keywords: string = "callout note tip warning caution info danger success"

  static readonly typeNames: Array<string> = ["info", "success", "warning", "danger"]
  static readonly typeIcons: Array<string> = ["bi bi-info-circle-fill", "bi bi-check-circle-fill", "bi bi-exclamation-triangle-fill", "bi bi-x-octagon-fill"]

  static blockKinds(strings: Strings, _compact: boolean): Array<[string, string, string]> {
    return [["alert:0", strings.TextAlertInspectorCaption, "bi bi-info-circle"]]
  }

  static fromBlockContent(content: RichText, value: number, source: TextNode): Array<Node> {
    content.alertType = value
    let result = super.fromBlockContent(content, value, source) as Array<AlertNode>
    result[0].alertType = value
    return result
  }

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    if (element.tagName != "BLOCKQUOTE" && element.tagName != "ASIDE") return undefined
    let match = (element.className || "").match(/alert-(info|success|warning|danger)/)
    if (!match) return undefined
    let alert = new AlertNode()
    alert.alertType = AlertNode.typeNames.indexOf(match[1])
    alert.content = importer.trimmed(importer.richText(Array.from(element.childNodes)))
    alert.content.alertType = AlertNode.typeNames.indexOf(match[1])
    return importer.attach(alert)
  }

  get blockKind(): string {
    return `alert:${this.alertType}`
  }

  convertBlock(kind: string, value: number): Array<Node> | null {
    if (kind != "alert" || this.alertType == value) return super.convertBlock(kind, value)
    this.alertType = value
    return [this]
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let type = InspectorItem.menu("alerttype", strings.TextTypeCaption, [[strings.TextInfoCaption, AlertTypes.info], [strings.TextSuccessCaption, AlertTypes.success], [strings.TextWarningCaption, AlertTypes.warning], [strings.TextDangerCaption, AlertTypes.danger]], target => target.alertType, (target, value) => target.alertType = value)
    type.setDefaultValue(AlertTypes.info)
    return [InspectorDefaults.section("alert", strings.TextAlertInspectorCaption, [type])].concat(InspectorDefaults.text(this))
  }

  get alertType(): AlertTypes {
    return Utilities.clamp(this.content.alertType, 0, 3)
  }

  set alertType(value: AlertTypes) {
    this.content.alertType = Utilities.clamp(value, 0, 3)
  }

  protected get placeholderText(): string {
    return this.typeCaption(this.alertType)
  }

  typeCaption(value: AlertTypes): string {
    return [this.strings.TextInfoCaption, this.strings.TextSuccessCaption, this.strings.TextWarningCaption, this.strings.TextDangerCaption][value]
  }

  protected build(body: HTMLElement) {
    let alert = Utilities.element("div", `alert alert-${AlertNode.typeNames[this.alertType]} scv-alert mb-0`, {role: "note"})
    body.append(alert)
    let icon = Utilities.element("i", `${AlertNode.typeIcons[this.alertType]} scv-alert-icon`, {contenteditable: "false"})
    alert.append(icon)
    let paragraph = Utilities.element("div", "scv-alert-text")
    alert.append(paragraph)
    let host = this.addHost(new TextHost(this, this.content, paragraph, TextHostModes.inline))
    host.placeholder = this.placeholderText
    this.applyTextAppearance(paragraph)
    host.render()
  }

  actions(): Array<ToolbarItem> {
    let item = new ToolbarItem("alerttype", this.typeCaption(this.alertType), AlertNode.typeIcons[this.alertType], ToolbarItemKinds.menu, this.strings.TextAlertInspectorCaption)
    item.alwaysShowCaption = true
    for (let type = 0; type <= 3; type++) {
      let menuItem = new ToolbarMenuItem(String(type), this.typeCaption(type), AlertNode.typeIcons[type])
      menuItem.checked = type == this.alertType
      item.menuItems.push(menuItem)
    }
    return [item]
  }

  performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean {
    if (item.identifier == "alerttype" && menuItem) {
      this.willChange()
      this.alertType = Number(menuItem.identifier)
      this.refresh()
      this.changed()
      return true
    }
    return false
  }

  createFollowingNode(): TextNode {
    return new TextNode()
  }

  toHTML(): string {
    return `<aside class="alert alert-${AlertNode.typeNames[this.alertType]}" style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}${this.htmlLineHeightCSS()}">${this.content.htmlText()}</aside>`
  }

  toMarkdown(): string {
    let lines = this.content.markdownText().replace(/\r/g, "").split("\n")
    lines.unshift(["[!NOTE]", "[!TIP]", "[!WARNING]", "[!CAUTION]"][this.alertType])
    return this.markdownWithBackground(lines.map(line => `> ${line}`).join("\n"))
  }
}

Editor.registerNodeType(AlertNode, 50)
