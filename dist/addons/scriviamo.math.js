// addons/math/mathnode.ts
import { CodeBlockNode, Editor, InspectorDefaults, InspectorEditors, InspectorItem, RichText, Strings, Utilities } from "scriviamo";
var MathStrings = {
  TextMathCaption: "Math",
  TextMathSourceCaption: "LaTeX",
  TextMathPlaceholder: "LaTeX, such as E = mc^2",
  TextMathLoadingCaption: "Loading math\u2026",
  TextMathUnavailableMessage: "The math renderer couldn't be loaded."
};
Strings.register(MathStrings);
var MathRenderer = class _MathRenderer {
  /** Where KaTeX's ES module and stylesheet are loaded from. */
  static moduleURL = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.mjs";
  static stylesheetURL = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
  static #katex = null;
  static #loading = null;
  /** Uses a KaTeX the application loaded itself, instead of loading it from moduleURL. */
  static use(katex) {
    _MathRenderer.#katex = katex && typeof katex.renderToString == "function" ? katex : null;
    _MathRenderer.#loading = null;
  }
  /** KaTeX, once it has loaded; null before then. */
  static get katex() {
    if (!_MathRenderer.#katex) {
      let global = globalThis.katex;
      if (global && typeof global.renderToString == "function")
        _MathRenderer.#katex = global;
    }
    return _MathRenderer.#katex;
  }
  /** Resolves with KaTeX, loading it and its stylesheet the first time. */
  static load() {
    if (_MathRenderer.katex)
      return Promise.resolve(_MathRenderer.katex);
    if (!_MathRenderer.#loading) {
      if (typeof document != "undefined" && _MathRenderer.stylesheetURL && !document.querySelector("link[data-scv-katex]")) {
        document.head.append(Utilities.element("link", "", { rel: "stylesheet", href: _MathRenderer.stylesheetURL, "data-scv-katex": "true", crossorigin: "anonymous" }));
      }
      let url = _MathRenderer.moduleURL;
      _MathRenderer.#loading = import(
        /* webpackIgnore: true */
        /* turbopackIgnore: true */
        /* @vite-ignore */
        url
      ).then((module) => {
        let katex = module.default || module;
        _MathRenderer.#katex = katex;
        return katex;
      }, (error) => {
        _MathRenderer.#loading = null;
        throw error;
      });
    }
    return _MathRenderer.#loading;
  }
  /** The formula as HTML; MathML for exports, which browsers draw without KaTeX's stylesheet. */
  static render(latex, output = "htmlAndMathml") {
    return _MathRenderer.katex.renderToString(latex, { displayMode: true, output, throwOnError: true, strict: "ignore", trust: false });
  }
};
var MathNode = class _MathNode extends CodeBlockNode {
  static exportStyles(sheet, editor) {
    super.exportStyles(sheet, editor);
    sheet.addRule(".math-display", "margin: 1em 0; overflow-x: auto; text-align: center");
    sheet.addRule(".math-display math", "font-size: 1.15em");
  }
  static identifier = "math";
  static caption = "Math";
  static icon = "bi bi-plus-slash-minus";
  static keywords = "equation formula latex tex katex mathematics";
  // Higher than code blocks, so <pre><code class="language-math"> becomes a formula.
  static importPriority = 50;
  static markdownShortcuts = [{ pattern: /^\$\$$/ }];
  static create(_editor) {
    return new _MathNode();
  }
  static importElement(element, importer) {
    let latex = null;
    if (element.tagName == "PRE") {
      let code = element.querySelector("code") || element;
      if (/(^|\s)language-(math|latex|tex)(\s|$)/.test(code.className || ""))
        latex = code.textContent || "";
    } else if (element.hasAttribute("data-latex") && /(^|\s)math-display(\s|$)/.test(element.className || "")) {
      latex = element.getAttribute("data-latex");
    } else if (element.tagName.toLowerCase() == "math" && element.getAttribute("display") == "block") {
      let annotation = element.querySelector("annotation[encoding='application/x-tex']");
      if (annotation)
        latex = annotation.textContent;
    }
    if (latex === null)
      return void 0;
    let node = new _MathNode();
    node.content = new RichText(latex.trim());
    return importer.attach(node);
  }
  #output = null;
  #timer = null;
  /** The formula's LaTeX source. */
  get latex() {
    return this.content.text;
  }
  set latex(value) {
    this.content = new RichText(String(value || ""));
  }
  get typeName() {
    return this.strings.TextMathCaption;
  }
  get placeholderText() {
    return this.strings.TextMathPlaceholder;
  }
  inspectorSections() {
    let strings = this.strings;
    let source = InspectorItem.bound("latex", strings.TextMathSourceCaption, InspectorEditors.multilineText, (target) => target.content.text, (target, value) => target.content = new RichText(String(value || "")));
    return [InspectorDefaults.section("math", strings.TextMathCaption, [source])].concat(InspectorDefaults.node(this));
  }
  build(body) {
    super.build(body);
    let frame = body.querySelector(".scv-code");
    frame?.classList.add("scv-math-source");
    let input = body.querySelector(".scv-code-language");
    if (input) {
      input.value = this.strings.TextMathSourceCaption;
      input.readOnly = true;
      input.removeAttribute("list");
    }
    this.#output = Utilities.element("div", "scv-math-output", { contenteditable: "false" });
    body.prepend(this.#output);
    body.classList.add("scv-math");
    this.#render();
  }
  textChanged(host) {
    super.textChanged(host);
    if (this.#timer !== null)
      clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.#render();
    }, 200);
  }
  #render() {
    let output = this.#output;
    if (!output)
      return;
    let latex = this.latex.trim();
    output.parentElement?.classList.toggle("scv-math-empty", latex.length == 0);
    if (latex.length == 0) {
      output.replaceChildren();
      return;
    }
    if (!MathRenderer.katex) {
      output.textContent = this.strings.TextMathLoadingCaption;
      output.className = "scv-math-output scv-math-pending";
      MathRenderer.load().then(() => {
        if (this.#output === output)
          this.#render();
      }, () => {
        if (this.#output !== output)
          return;
        output.textContent = this.strings.TextMathUnavailableMessage;
        output.className = "scv-math-output scv-math-error";
      });
      return;
    }
    try {
      output.innerHTML = MathRenderer.render(latex);
      output.className = "scv-math-output";
    } catch (error) {
      output.textContent = String(error?.message || error).replace(/^KaTeX parse error: /, "");
      output.className = "scv-math-output scv-math-error";
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
    let latex = this.latex.trim();
    let attribute = Utilities.escapeAttribute(latex);
    let style = this.htmlBackgroundCSS();
    let styleAttribute = style.length > 0 ? ` style="${style}"` : "";
    if (MathRenderer.katex) {
      try {
        return `<div class="math-display" data-latex="${attribute}"${styleAttribute}>${MathRenderer.render(latex, "mathml")}</div>`;
      } catch {
      }
    }
    return `<div class="math-display" data-latex="${attribute}"${styleAttribute}>\\[${Utilities.escapeText(latex)}\\]</div>`;
  }
  toMarkdown() {
    return this.markdownWithBackground(`$$
${this.latex.trim()}
$$`);
  }
  toPlainText() {
    return this.latex;
  }
};
Editor.registerNodeType(MathNode, 65);
export {
  MathNode,
  MathRenderer
};
