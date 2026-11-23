// addons/diagrams/diagramnode.ts
import { CodeBlockNode, Editor, InspectorDefaults, InspectorEditors, InspectorItem, RichText, Strings, Utilities } from "scriviamo";
var DiagramsStrings = {
  TextDiagramCaption: "Diagram",
  TextDiagramSourceCaption: "Mermaid",
  TextDiagramRedrawCaption: "Redraw",
  TextDiagramPlaceholder: "A Mermaid diagram, such as: graph LR; A --> B",
  TextDiagramLoadingCaption: "Drawing the diagram\u2026",
  TextDiagramUnavailableMessage: "The diagram renderer couldn't be loaded."
};
Strings.register(DiagramsStrings);
var DiagramRenderer = class _DiagramRenderer {
  /** Where Mermaid's ES module is loaded from. */
  static moduleURL = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
  /** Settings passed to mermaid.initialize. securityLevel "strict" keeps scripts and clicks out of diagrams. */
  static settings = { securityLevel: "strict" };
  /** The Mermaid themes for light and dark pages. A theme in settings takes precedence over both. */
  static themes = { light: "default", dark: "dark" };
  static #mermaid = null;
  static #loading = null;
  static #initializedTheme = "";
  static #counter = 0;
  /** Uses a Mermaid the application loaded itself, instead of loading it from moduleURL. */
  static use(mermaid) {
    _DiagramRenderer.#mermaid = mermaid && typeof mermaid.render == "function" ? mermaid : null;
    _DiagramRenderer.#loading = null;
    _DiagramRenderer.#initializedTheme = "";
  }
  /** Mermaid, once it has loaded; null before then. */
  static get mermaid() {
    if (!_DiagramRenderer.#mermaid) {
      let global = globalThis.mermaid;
      if (global && typeof global.render == "function")
        _DiagramRenderer.#mermaid = global;
    }
    return _DiagramRenderer.#mermaid;
  }
  /** Resolves with Mermaid, loading it the first time. */
  static load() {
    if (_DiagramRenderer.mermaid)
      return Promise.resolve(_DiagramRenderer.mermaid);
    if (!_DiagramRenderer.#loading) {
      let url = _DiagramRenderer.moduleURL;
      _DiagramRenderer.#loading = import(
        /* webpackIgnore: true */
        /* turbopackIgnore: true */
        /* @vite-ignore */
        url
      ).then((module) => {
        let mermaid = module.default || module;
        _DiagramRenderer.#mermaid = mermaid;
        return mermaid;
      }, (error) => {
        _DiagramRenderer.#loading = null;
        throw error;
      });
    }
    return _DiagramRenderer.#loading;
  }
  /** Draws a diagram, resolving with its SVG. dark picks Mermaid's dark theme. */
  static async render(source, dark = false) {
    let mermaid = await _DiagramRenderer.load();
    let theme = String(_DiagramRenderer.settings.theme || (dark ? _DiagramRenderer.themes.dark : _DiagramRenderer.themes.light));
    if (_DiagramRenderer.#initializedTheme != theme && typeof mermaid.initialize == "function") {
      mermaid.initialize({ startOnLoad: false, ..._DiagramRenderer.settings, theme });
      _DiagramRenderer.#initializedTheme = theme;
    }
    let id = `scv-diagram-${++_DiagramRenderer.#counter}`;
    try {
      let result = await mermaid.render(id, source);
      return String(result && typeof result == "object" ? result.svg : result || "");
    } finally {
      if (typeof document != "undefined")
        document.getElementById(`d${id}`)?.remove();
    }
  }
};
var ThemeWatcher = class _ThemeWatcher {
  static #nodes = /* @__PURE__ */ new Set();
  static #observer = null;
  static watch(node) {
    _ThemeWatcher.#nodes.add(node);
    if (_ThemeWatcher.#observer || typeof MutationObserver == "undefined" || typeof document == "undefined")
      return;
    _ThemeWatcher.#observer = new MutationObserver(() => _ThemeWatcher.#changed());
    _ThemeWatcher.#observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bs-theme"], subtree: true });
  }
  static #changed() {
    for (let node of Array.from(_ThemeWatcher.#nodes)) {
      if (!node.isShown)
        _ThemeWatcher.#nodes.delete(node);
      else if (node.drawnForOtherTheme)
        node.redraw();
    }
  }
};
var DiagramNode = class _DiagramNode extends CodeBlockNode {
  static exportStyles(sheet, editor) {
    super.exportStyles(sheet, editor);
    sheet.addRule("figure.diagram", "margin: 1em 0; overflow-x: auto; text-align: center");
    sheet.addRule("figure.diagram svg", "max-width: 100%; height: auto");
  }
  static identifier = "diagram";
  static caption = "Diagram";
  static captionString = "TextDiagramCaption";
  static icon = "bi bi-diagram-3";
  static keywords = "mermaid flowchart chart graph sequence gantt";
  // Higher than code blocks, so <pre><code class="language-mermaid"> becomes a diagram.
  static importPriority = 50;
  static markdownShortcuts = [{ pattern: /^```mermaid$/ }];
  static create(_editor) {
    return new _DiagramNode();
  }
  static importElement(element, importer) {
    let source = null;
    if (element.tagName == "PRE") {
      let code = element.querySelector("code");
      if (/(^|\s)mermaid(\s|$)/.test(element.className || ""))
        source = element.textContent || "";
      else if (code && /(^|\s)language-mermaid(\s|$)/.test(code.className || ""))
        source = code.textContent || "";
    } else if (element.hasAttribute("data-mermaid")) {
      source = element.getAttribute("data-mermaid");
    }
    if (source === null)
      return void 0;
    let node = new _DiagramNode();
    node.content = new RichText(source.replace(/\n$/, ""));
    return importer.attach(node);
  }
  #output = null;
  #timer = null;
  /** The last drawing, and the source it was drawn from, for HTML exports. */
  #drawn = null;
  #generation = 0;
  /** Whether the diagram is on the page. */
  get isShown() {
    return !!this.#output && this.#output.isConnected;
  }
  /** Whether the diagram, as drawn, uses the other theme from the one around it now. */
  get drawnForOtherTheme() {
    return !!this.#output && !!this.#drawn && this.#drawn.dark != this.#isDark(this.#output);
  }
  #isDark(output) {
    let place = this.editor && this.editor.element || output;
    return place.closest("[data-bs-theme]")?.getAttribute("data-bs-theme") == "dark";
  }
  /** The diagram's Mermaid source. */
  get source() {
    return this.content.text;
  }
  set source(value) {
    this.content = new RichText(String(value || ""));
  }
  /** The drawn diagram's SVG, when it has been drawn from the current source; otherwise "". */
  get svg() {
    return this.#drawn && this.#drawn.source == this.source.trim() ? this.#drawn.svg : "";
  }
  get typeName() {
    return this.strings.TextDiagramCaption;
  }
  get placeholderText() {
    return this.strings.TextDiagramPlaceholder;
  }
  inspectorSections() {
    let strings = this.strings;
    let source = InspectorItem.bound("source", strings.TextDiagramSourceCaption, InspectorEditors.multilineText, (target) => target.content.text, (target, value) => target.content = new RichText(String(value || "")));
    let redraw = InspectorItem.actionItem("redraw", "", strings.TextDiagramRedrawCaption, (target) => target.redraw());
    return [InspectorDefaults.section("diagram", strings.TextDiagramCaption, [source, redraw])].concat(InspectorDefaults.node(this));
  }
  build(body) {
    super.build(body);
    body.querySelector(".scv-code")?.classList.add("scv-diagram-source");
    let input = body.querySelector(".scv-code-language");
    if (input) {
      input.value = this.strings.TextDiagramSourceCaption;
      input.readOnly = true;
      input.removeAttribute("list");
    }
    this.#output = Utilities.element("div", "scv-diagram-output", { contenteditable: "false" });
    body.prepend(this.#output);
    body.classList.add("scv-diagram");
    ThemeWatcher.watch(this);
    this.#render();
  }
  textChanged(host) {
    super.textChanged(host);
    if (this.#timer !== null)
      clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.#render();
    }, 400);
  }
  /** Draws the diagram now, resolving once it is shown. */
  redraw() {
    return this.#render();
  }
  async #render() {
    let output = this.#output;
    if (!output)
      return;
    let source = this.source.trim();
    let generation = ++this.#generation;
    output.parentElement?.classList.toggle("scv-diagram-empty", source.length == 0);
    if (source.length == 0) {
      output.replaceChildren();
      return;
    }
    let dark = this.#isDark(output);
    if (this.#drawn && this.#drawn.source == source && this.#drawn.dark == dark) {
      output.innerHTML = this.#drawn.svg;
      output.className = "scv-diagram-output";
      return;
    }
    if (!DiagramRenderer.mermaid && output.childElementCount == 0) {
      output.textContent = this.strings.TextDiagramLoadingCaption;
      output.className = "scv-diagram-output scv-diagram-pending";
    }
    try {
      let svg = await DiagramRenderer.render(source, dark);
      if (generation != this.#generation || this.#output !== output)
        return;
      this.#drawn = { source, svg, dark };
      output.innerHTML = svg;
      output.className = "scv-diagram-output";
    } catch (error) {
      if (generation != this.#generation || this.#output !== output)
        return;
      let loaded = !!DiagramRenderer.mermaid;
      output.textContent = loaded ? String(error?.message || error).trim() : this.strings.TextDiagramUnavailableMessage;
      output.className = "scv-diagram-output scv-diagram-error";
    }
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.language = "";
    return true;
  }
  toJSON() {
    let result = super.toJSON();
    delete result["language"];
    return result;
  }
  toHTML() {
    let source = this.source.trim();
    let style = this.htmlBackgroundCSS();
    let styleAttribute = style.length > 0 ? ` style="${style}"` : "";
    let svg = this.svg;
    if (svg.length > 0)
      return `<figure class="diagram" data-mermaid="${Utilities.escapeAttribute(source)}"${styleAttribute}>${svg}</figure>`;
    return `<pre class="mermaid"${styleAttribute}>${Utilities.escapeText(source)}</pre>`;
  }
  toMarkdown() {
    let source = this.source.trim();
    let longest = 2;
    for (let run of source.match(/`+/g) || [])
      longest = Math.max(longest, run.length);
    let fence = "`".repeat(longest + 1);
    return this.markdownWithBackground(`${fence}mermaid
${source}
${fence}`);
  }
  toPlainText() {
    return this.source;
  }
};
Editor.registerNodeType(DiagramNode, 67);
export {
  DiagramNode,
  DiagramRenderer
};
