// examples/examplenode/examplenode.ts
import { Colors, Editor, InspectorEditors, InspectorItem, InspectorSection, Strings, TextNode, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities } from "scriviamo";
var ExampleStrings = {
  TextExampleCaption: "Example",
  TextExampleDefaultTitle: "Example custom node",
  TextExampleAccentCaption: "Accent",
  TextExampleAccentColorCaption: "Accent Color",
  TextExampleAccentTooltip: "Choose Accent Color",
  TextExampleBlueCaption: "Blue",
  TextExampleGreenCaption: "Green",
  TextExampleOrangeCaption: "Orange",
  TextExamplePurpleCaption: "Purple",
  TextExampleEmphasizeCaption: "Emphasize",
  TextExampleEmphasizeTooltip: "Toggle Emphasis",
  TextExampleRemoveEmphasisCaption: "Remove Emphasis",
  TextExampleEmphasizedCaption: "Emphasized",
  TextExampleUseNextAccentCaption: "Use Next Accent Color",
  TextExampleTitleCaption: "Title"
};
Strings.register(ExampleStrings);
var AccentWidth = 6;
var ExampleNode = class _ExampleNode extends TextNode {
  static identifier = "example";
  static caption = "Example";
  static icon = "bi bi-layout-sidebar";
  static keywords = "custom sample accent";
  /** Asides with an accent bar are this type's, so it reads them before other types. */
  static importPriority = 100;
  /** The accent colors the toolbar and context menu offer: blue, green, orange and purple. */
  static accents = [Colors.make(37, 99, 235), Colors.make(22, 163, 74), Colors.make(234, 88, 12), Colors.make(147, 51, 234)];
  static create(editor) {
    let result = new _ExampleNode();
    result.editor = editor;
    return result;
  }
  /** An aside whose left border is the accent bar, as toHTML writes it. */
  static importElement(element, importer) {
    if (element.tagName != "ASIDE")
      return void 0;
    let accent = element.style.borderLeftColor || element.style.getPropertyValue("border-left-color");
    if (!accent && !element.style.borderLeft)
      return void 0;
    let node = new _ExampleNode();
    node.content = importer.trimmed(importer.richText(Array.from(element.childNodes)));
    let color = accent ? Colors.fromCSS(accent) : null;
    if (color)
      node.accentColor = color;
    let width = parseFloat(element.style.width);
    let height = parseFloat(element.style.height);
    if (width > 0)
      node.width = width;
    if (height > 0)
      node.height = height;
    let weight = element.style.fontWeight.trim().toLowerCase();
    node.#emphasized = weight == "bold" || weight == "bolder" || Number(weight) >= 600;
    return importer.attach(node);
  }
  #accentColor = Colors.clone(_ExampleNode.accents[0]);
  #emphasized = false;
  constructor(title = "", accentColor = null) {
    super(title.trim());
    this.fontSize = 15;
    this.borderTopLeftRadius = 10;
    this.borderTopRightRadius = 10;
    this.borderBottomRightRadius = 10;
    this.borderBottomLeftRadius = 10;
    if (accentColor)
      this.#accentColor = Colors.clone(accentColor);
  }
  get typeName() {
    return this.strings.TextExampleCaption;
  }
  get canResize() {
    return true;
  }
  /** The text, or the default title for a new node. */
  get title() {
    return this.content.length > 0 ? this.content.text : this.strings.TextExampleDefaultTitle;
  }
  set title(value) {
    let title = String(value || "").trim();
    if (title.length == 0)
      title = this.strings.TextExampleDefaultTitle;
    if (title == this.content.text)
      return;
    this.text = title;
    this.#applyEmphasis();
  }
  get accentColor() {
    return Colors.clone(this.#accentColor);
  }
  set accentColor(value) {
    if (!value || Colors.equals(value, this.#accentColor))
      return;
    this.#accentColor = Colors.clone(value);
    if (this.element)
      this.refresh();
  }
  /** Emphasized text is bold. */
  get isEmphasized() {
    return this.#emphasized;
  }
  set isEmphasized(value) {
    if (value == this.#emphasized)
      return;
    this.#emphasized = value;
    this.#applyEmphasis();
    if (this.element)
      this.refresh();
  }
  #applyEmphasis() {
    if (this.content.length > 0)
      this.content.applyStyle(0, this.content.length, (style) => style.bold = this.#emphasized);
  }
  /** The accent closest to accentColor. */
  get #accentIndex() {
    let distance = (color) => Math.abs(color.red - this.#accentColor.red) + Math.abs(color.green - this.#accentColor.green) + Math.abs(color.blue - this.#accentColor.blue);
    let best = 0;
    _ExampleNode.accents.forEach((color, index) => {
      if (distance(color) < distance(_ExampleNode.accents[best]))
        best = index;
    });
    return best;
  }
  #accentCaptions() {
    let strings = this.strings;
    return [strings.TextExampleBlueCaption, strings.TextExampleGreenCaption, strings.TextExampleOrangeCaption, strings.TextExamplePurpleCaption];
  }
  /** Changes made from the node's own commands, as one undo step. */
  #change(apply) {
    this.willChange();
    apply();
    this.changed();
  }
  // Drawing
  get placeholderText() {
    return this.strings.TextExampleDefaultTitle;
  }
  build(body) {
    body.style.background = "var(--scv-surface, rgba(127, 127, 127, 0.08))";
    body.style.borderLeft = `${AccentWidth}px solid ${Colors.toCSS(this.#accentColor)}`;
    body.style.padding = "16px";
    body.style.minHeight = "96px";
    body.style.boxSizing = "border-box";
    body.setAttribute("role", "note");
    super.build(body);
    let paragraph = body.querySelector("p");
    if (paragraph)
      paragraph.style.margin = "0";
  }
  // Commands
  actions() {
    let strings = this.strings;
    let emphasize = new ToolbarItem("example-emphasize", strings.TextExampleEmphasizeCaption, "bi bi-star", ToolbarItemKinds.toggle, strings.TextExampleEmphasizeTooltip);
    emphasize.active = this.#emphasized;
    let accent = new ToolbarItem("example-accent", strings.TextExampleAccentCaption, "bi bi-palette", ToolbarItemKinds.menu, strings.TextExampleAccentTooltip);
    this.#accentCaptions().forEach((caption, index) => {
      let item = new ToolbarMenuItem(String(index), caption, "bi bi-circle-fill");
      item.captionStyle = `color: ${Colors.toCSS(_ExampleNode.accents[index])}`;
      item.checked = index == this.#accentIndex;
      accent.menuItems.push(item);
    });
    return [emphasize, accent];
  }
  performAction(item, menuItem) {
    if (item.identifier == "example-emphasize") {
      this.#change(() => this.isEmphasized = !this.#emphasized);
      return true;
    }
    if (item.identifier == "example-accent" && menuItem) {
      let color = _ExampleNode.accents[Number(menuItem.identifier)];
      if (color)
        this.#change(() => this.accentColor = color);
      return true;
    }
    return false;
  }
  contextMenuItems() {
    let strings = this.strings;
    return [
      new ToolbarMenuItem("example-emphasize", this.#emphasized ? strings.TextExampleRemoveEmphasisCaption : strings.TextExampleEmphasizeCaption, "bi bi-star"),
      new ToolbarMenuItem("example-next-accent", strings.TextExampleUseNextAccentCaption, "bi bi-palette")
    ];
  }
  performContextMenuItem(item) {
    if (item.identifier == "example-emphasize") {
      this.#change(() => this.isEmphasized = !this.#emphasized);
      return true;
    }
    if (item.identifier == "example-next-accent") {
      this.#change(() => this.accentColor = _ExampleNode.accents[(this.#accentIndex + 1) % _ExampleNode.accents.length]);
      return true;
    }
    return false;
  }
  /** E toggles emphasis while the node is selected but its text isn't being edited. */
  handleKeyDown(event, host) {
    if (host || event.metaKey || event.ctrlKey || event.altKey || event.key.toLowerCase() != "e")
      return super.handleKeyDown(event, host);
    event.preventDefault();
    this.#change(() => this.isEmphasized = !this.#emphasized);
    return true;
  }
  inspectorSections() {
    let strings = this.strings;
    let result = super.inspectorSections().map((section) => {
      if (section.identifier != "content")
        return section;
      let content = new InspectorSection(section.identifier, section.caption);
      let title = InspectorItem.bound("title", strings.TextExampleTitleCaption, InspectorEditors.multilineText, (target) => target.title, (target, value) => target.title = value);
      title.setDefaultValue(strings.TextExampleDefaultTitle);
      content.add(title);
      section.items().forEach((item) => {
        if (item.identifier != "text")
          content.add(item);
      });
      return content;
    });
    let example = new InspectorSection("example", strings.TextExampleCaption);
    let accent = InspectorItem.bound("accentcolor", strings.TextExampleAccentColorCaption, InspectorEditors.color, (target) => target.accentColor, (target, value) => {
      if (value)
        target.accentColor = value;
    });
    accent.setDefaultValue(_ExampleNode.accents[0]);
    example.add(accent);
    let emphasized = InspectorItem.bound("emphasized", strings.TextExampleEmphasizedCaption, InspectorEditors.toggle, (target) => target.isEmphasized, (target, value) => target.isEmphasized = value === true);
    emphasized.setDefaultValue(false);
    example.add(emphasized);
    result.push(example);
    return result;
  }
  // Persistence and export
  toJSON() {
    let result = super.toJSON();
    result["emphasized"] = this.#emphasized;
    result["accentRed"] = this.#accentColor.red;
    result["accentGreen"] = this.#accentColor.green;
    result["accentBlue"] = this.#accentColor.blue;
    result["accentAlpha"] = this.#accentColor.alpha;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    if (!("content" in data) && typeof data.title == "string")
      this.text = data.title;
    this.#emphasized = Utilities.boolean(data.emphasized, this.#emphasized);
    let accent = this.#accentColor;
    this.#accentColor = Colors.make(Utilities.integer(data.accentRed, accent.red), Utilities.integer(data.accentGreen, accent.green), Utilities.integer(data.accentBlue, accent.blue), Utilities.integer(data.accentAlpha, accent.alpha));
    return true;
  }
  toHTML() {
    let size = (this.width > 0 ? `width:${this.width}px;` : "") + (this.height > 0 ? `height:${this.height}px;` : "");
    let surface = Editor.themeCSS(this.editor, ThemeColors.surface);
    let weight = this.#emphasized ? "font-weight:700;" : "";
    return `<aside style="${this.htmlBackgroundCSS()}${size}${this.htmlTextAlignmentCSS()}background-color:${surface};border-left:${AccentWidth}px solid ${Colors.toCSS(this.#accentColor)};padding:16px;${weight}">${this.content.htmlText()}</aside>`;
  }
  toMarkdown() {
    return this.markdownWithBackground(`> ${this.content.markdownText()}`);
  }
  toPlainText() {
    return this.title;
  }
};
Editor.registerNodeType(ExampleNode, 1010);
export {
  ExampleNode
};
