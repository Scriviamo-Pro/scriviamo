// addons/math/mathnode.ts
import { CodeBlockNode, Colors, Editor, HTMLImporter, InspectorDefaults, InspectorEditors, InspectorItem, MarkdownConverter, Popup, RichText, Strings, TextHost, TextHostModes, TextStyle, ToolbarItem, ToolbarItemKinds, Utilities } from "scriviamo";
var MathStrings = {
  TextMathCaption: "Math",
  TextMathSourceCaption: "LaTeX",
  TextMathPlaceholder: "LaTeX, such as E = mc^2",
  TextMathLoadingCaption: "Loading math\u2026",
  TextMathUnavailableMessage: "The math renderer couldn't be loaded.",
  TextInlineMathCaption: "Inline Math",
  TextInsertInlineMathCaption: "Insert Inline Math",
  TextInlineMathPlaceholder: "LaTeX, such as x^2",
  TextInlineMathHint: "Enter to finish. Leave it empty to remove the formula."
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
  /**
   * The formula as HTML; MathML for exports, which browsers draw without KaTeX's stylesheet. A
   * displayed formula stands on its own line; an inline one sits in the text.
   */
  static render(latex, output = "htmlAndMathml", displayMode = true) {
    return _MathRenderer.katex.renderToString(latex, { displayMode, output, throwOnError: true, strict: "ignore", trust: false });
  }
};
var MathNode = class _MathNode extends CodeBlockNode {
  static exportStyles(sheet, editor) {
    super.exportStyles(sheet, editor);
    sheet.addRule(".math-display", "margin: 1em 0; overflow-x: auto; text-align: center; direction: ltr");
    sheet.addRule(".math-inline", "direction: ltr; unicode-bidi: isolate");
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
var InlineMathTag = "math";
var InlineMath = class _InlineMath {
  /** The style of a formula: the text's style, marked as a formula, with the tag's colors left out. */
  static style(base, id = Utilities.uuid()) {
    let style = base.clone();
    style.suggestionProviderIdentifier = InlineMathTag;
    style.suggestionIdentifier = id;
    style.superscript = false;
    style.subscript = false;
    style.code = false;
    style.suggestionTextColor = Colors.make(0, 0, 0, 255);
    style.suggestionBackgroundColor = Colors.make(0, 0, 0, 255);
    style.suggestionBorderColor = Colors.make(0, 0, 0, 255);
    return style;
  }
  /** The text style without the formula's marking, for text typed after one. */
  static untagged(style) {
    let result = style.clone();
    result.suggestionProviderIdentifier = "";
    result.suggestionIdentifier = "";
    result.suggestionTextColor = Colors.clone(TextStyle.defaults.suggestionTextColor);
    result.suggestionBackgroundColor = Colors.clone(TextStyle.defaults.suggestionBackgroundColor);
    result.suggestionBorderColor = Colors.clone(TextStyle.defaults.suggestionBorderColor);
    return result;
  }
  /** The formulas in one text, in order. */
  static formulas(host) {
    let result = [];
    let offset = 0;
    for (let run of host.rich.runs()) {
      let style = run.style;
      if (style.suggestionProviderIdentifier == InlineMathTag) {
        let previous = result[result.length - 1];
        if (previous && previous.id == style.suggestionIdentifier && previous.end == offset) {
          previous.end += run.text.length;
          previous.latex += run.text;
        } else {
          result.push({ host, start: offset, end: offset + run.text.length, id: style.suggestionIdentifier, latex: run.text });
        }
      }
      offset += run.text.length;
    }
    return result;
  }
  /** The formula the caret is beside or the selection covers, or null. */
  static at(host, start, end = start) {
    return _InlineMath.formulas(host).find((formula) => start == end ? formula.start == start || formula.end == start : formula.start <= start && formula.end >= end) || null;
  }
  /** Whether formulas can go in a text: rich text that isn't code. */
  static allowedIn(host) {
    return !!host && host.mode != TextHostModes.plain && !(host.node instanceof CodeBlockNode);
  }
  /**
   * Puts a formula in place of start through end, or removes the range when latex is empty. One
   * undo step. The caret goes after it, and text typed there isn't part of it.
   */
  static replace(editor, host, start, end, latex, id = Utilities.uuid()) {
    if (editor.readOnly)
      return false;
    latex = latex.replace(/[\n\r\u2028\u2029]+/g, " ").trim();
    let rich = host.rich;
    let base = start > 0 || end < rich.length ? rich.styleAt(start < rich.length ? start : start - 1) : new TextStyle();
    base = _InlineMath.untagged(base);
    editor.history.breakCoalescing();
    editor.history.checkpoint();
    rich.remove(start, end);
    if (latex.length > 0)
      rich.insert(start, latex, _InlineMath.style(base, id));
    host.render();
    let caret = start + latex.length;
    host.select(caret);
    if (latex.length > 0)
      editor.setPendingStyle(host, caret, base);
    host.node.textChanged(host);
    host.node.changed();
    editor.history.breakCoalescing();
    editor.updateToolbarState();
    return true;
  }
  /**
   * Edits the formula beside the caret, or covering the selection; or else starts a new one at the
   * caret, from the selected text if there is any. Shows the formula's source in a popover.
   */
  static insert(editor) {
    let host = editor.activeHost;
    if (!_InlineMath.allowedIn(host) || editor.readOnly)
      return false;
    let selection = host.selection();
    if (!selection)
      return false;
    let formula = _InlineMath.at(host, selection.start, selection.end);
    if (formula) {
      _InlineMath.edit(editor, formula);
      return true;
    }
    let selected = host.rich.text.substring(selection.start, selection.end);
    _InlineMath.edit(editor, { host, start: selection.start, end: selection.end, id: Utilities.uuid(), latex: selected.replace(/^\$+|\$+$/g, "") });
    return true;
  }
  /** Shows the popover that edits a formula's source, with a preview. Enter finishes; Escape cancels. */
  static edit(editor, formula) {
    if (editor.readOnly || !editor.element)
      return;
    let strings = editor.strings;
    let host = formula.host;
    let popup = new Popup("dropdown-menu show scv-inline-math-popup");
    popup.keepsFocus = false;
    let input = Utilities.element("input", "form-control form-control-sm scv-inline-math-input", { type: "text", dir: "ltr", spellcheck: "false", autocomplete: "off", placeholder: strings.TextInlineMathPlaceholder, "aria-label": strings.TextInlineMathCaption });
    input.value = formula.latex;
    let preview = Utilities.element("div", "scv-inline-math-preview", { "aria-hidden": "true" });
    let hint = Utilities.element("div", "scv-inline-math-hint");
    hint.textContent = strings.TextInlineMathHint;
    popup.element.append(input, preview, hint);
    let showPreview = () => {
      let latex = input.value.trim();
      preview.classList.remove("scv-math-error");
      if (latex.length == 0) {
        preview.replaceChildren();
        return;
      }
      if (!MathRenderer.katex) {
        preview.textContent = strings.TextMathLoadingCaption;
        MathRenderer.load().then(showPreview, () => preview.textContent = strings.TextMathUnavailableMessage);
        return;
      }
      try {
        preview.innerHTML = MathRenderer.render(latex, "html", false);
      } catch (error) {
        preview.textContent = String(error?.message || error).replace(/^KaTeX parse error: /, "");
        preview.classList.add("scv-math-error");
      }
    };
    let isNew = !_InlineMath.formulas(host).some((item) => item.id == formula.id);
    let current = () => isNew ? formula : _InlineMath.formulas(host).find((item) => item.id == formula.id) || null;
    let committed = false;
    let commit = () => {
      if (committed)
        return;
      committed = true;
      popup.close();
      let target = current();
      if (target && (isNew || input.value.trim() != formula.latex.trim()))
        _InlineMath.replace(editor, host, target.start, target.end, input.value, formula.id);
      else
        host.select(target ? target.end : formula.end);
    };
    input.addEventListener("input", showPreview);
    input.addEventListener("keydown", (event) => {
      if (event.key == "Enter") {
        event.preventDefault();
        commit();
      } else if (event.key == "Escape") {
        event.preventDefault();
        event.stopPropagation();
        committed = true;
        popup.close();
        let target = current();
        host.select(isNew ? formula.end : target ? target.end : formula.end);
      }
    });
    popup.onClose = () => {
      if (!committed && input.value.trim() != formula.latex.trim() && input.value.trim().length > 0) {
        committed = true;
        let target = current();
        if (target)
          _InlineMath.replace(editor, host, target.start, target.end, input.value, formula.id);
      }
    };
    let anchor = () => {
      let element = host.element.querySelector(`[data-scv-tag="${InlineMathTag}"][data-scv-tag-id="${CSS.escape(formula.id)}"]`);
      if (element)
        return element.getBoundingClientRect();
      return host.caretRect() || host.element.getBoundingClientRect();
    };
    popup.anchorProvider = anchor;
    popup.show(anchor() || host.element.getBoundingClientRect(), editor.element);
    showPreview();
    input.focus();
    input.select();
  }
  /** Draws a formula's elements: its source stays as hidden text, and KaTeX draws it beside. */
  static render(elements, _host) {
    let latex = "";
    elements.forEach((element) => {
      latex += element.textContent || "";
      element.setAttribute("contenteditable", "false");
      element.classList.add("scv-inline-math");
      let source = Utilities.element("span", "scv-inline-math-source");
      source.append(...Array.from(element.childNodes));
      element.append(source);
    });
    let last = elements[elements.length - 1];
    let drawn = Utilities.element("span", "scv-widget scv-inline-math-drawn");
    last.append(drawn);
    elements.forEach((element) => element.title = latex);
    let draw = () => {
      if (!drawn.isConnected && drawn.parentElement === null)
        return;
      drawn.classList.remove("scv-math-error", "scv-math-pending");
      if (!MathRenderer.katex) {
        drawn.textContent = latex;
        drawn.classList.add("scv-math-pending");
        MathRenderer.load().then(draw, () => {
        });
        return;
      }
      try {
        drawn.innerHTML = MathRenderer.render(latex, "htmlAndMathml", false);
      } catch {
        drawn.textContent = latex;
        drawn.classList.add("scv-math-error");
      }
    };
    draw();
  }
};
TextHost.registerTagRenderer(InlineMathTag, InlineMath.render);
RichText.registerTagExport(InlineMathTag, {
  html(text) {
    let latex = text.trim();
    let attribute = Utilities.escapeAttribute(latex);
    if (MathRenderer.katex) {
      try {
        return `<span class="math-inline" data-latex="${attribute}">${MathRenderer.render(latex, "mathml", false)}</span>`;
      } catch {
      }
    }
    return `<span class="math-inline" data-latex="${attribute}">\\(${Utilities.escapeText(latex)}\\)</span>`;
  },
  markdown(text) {
    return `$${text.trim()}$`;
  }
});
HTMLImporter.registerInlineElement((element, style) => {
  let latex = null;
  if (element.hasAttribute("data-latex") && /(^|\s)math-inline(\s|$)/.test(element.className || "")) {
    latex = element.getAttribute("data-latex");
  } else if (element.tagName.toLowerCase() == "math" && element.getAttribute("display") != "block") {
    let annotation = element.querySelector("annotation[encoding='application/x-tex']");
    if (annotation)
      latex = annotation.textContent;
  } else if (element.getAttribute("data-scriviamo-suggestion-provider") == InlineMathTag) {
    latex = element.textContent;
  }
  if (latex === null)
    return null;
  latex = latex.replace(/\s+/g, " ").trim();
  return { text: latex, style: InlineMath.style(InlineMath.untagged(style)) };
});
MarkdownConverter.registerInlineRule((text, stash) => text.replace(/(^|[^\\$\w])\$(?=[^\s$])((?:\\\$|[^$\n])*?[^\s\\$])\$(?![\d$])/g, (_match, before, latex) => before + stash(`<span class="math-inline" data-latex="${Utilities.escapeAttribute(latex)}">${Utilities.escapeText(latex)}</span>`)));
var InlineMathExtension = {
  toolbarIdentifiers: ["inlinemath"],
  defaultToolbarIdentifiers: ["inlinemath"],
  defaultToolbarAfter: "link",
  install(editor) {
    let root = editor.element;
    if (!root)
      return;
    let formulaAt = (target) => target instanceof Element ? target.closest(".scv-inline-math") : null;
    root.addEventListener("click", (event) => {
      let element = formulaAt(event.target);
      if (!element || editor.readOnly)
        return;
      let host = TextHost.from(element);
      if (!host || !root.contains(host.element))
        return;
      let formula = InlineMath.formulas(host).find((item) => item.id == (element.dataset.scvTagId || ""));
      if (!formula)
        return;
      event.preventDefault();
      if (editor.activeHost !== host)
        editor.focusNode(host.node, formula.end, host.index);
      else
        host.select(formula.end);
      InlineMath.edit(editor, formula);
    });
    editor.addEventListener("keyPress", (event) => {
      let key = event.detail && event.detail.key;
      if (key != "Backspace" && key != "Delete")
        return;
      let host = editor.activeHost;
      let selection = host ? host.selection() : null;
      if (!host || !selection || selection.start != selection.end || editor.readOnly)
        return;
      let formula = InlineMath.formulas(host).find((item) => key == "Backspace" ? item.end == selection.start : item.start == selection.start);
      if (!formula)
        return;
      event.preventDefault();
      InlineMath.replace(editor, host, formula.start, formula.end, "");
    });
    let typedDollar = () => {
      if (!editor.markdownShortcuts || editor.readOnly)
        return;
      let host = editor.activeHost;
      if (!InlineMath.allowedIn(host))
        return;
      let selection = host.selection();
      if (!selection || selection.start != selection.end)
        return;
      let rich = host.rich;
      let caret = selection.start;
      let before = rich.text.substring(0, caret);
      let lineStart = Math.max(before.lastIndexOf("\u2029"), before.lastIndexOf("\u2028"), before.lastIndexOf("\n")) + 1;
      let match = before.substring(lineStart).match(/(^|[^\\$\w])\$([^\s$](?:[^$]*[^\s\\$])?)\$$/);
      if (!match)
        return;
      let start = caret - match[2].length - 2;
      for (let index = start; index < caret; index++) {
        let style = rich.styleAt(index);
        if (style.code || style.suggestionProviderIdentifier.length > 0)
          return;
      }
      InlineMath.replace(editor, host, start, caret, match[2]);
    };
    root.addEventListener("beforeinput", (event) => {
      let input = event;
      if (input.inputType == "insertText" && !!input.data && input.data.endsWith("$") && input.defaultPrevented)
        typedDollar();
    });
    root.addEventListener("input", (event) => {
      let input = event;
      if (input.inputType == "insertText" && !!input.data && input.data.endsWith("$"))
        typedDollar();
    });
  },
  makeToolbarItem(editor, identifier) {
    if (identifier != "inlinemath")
      return null;
    let strings = editor.strings;
    return new ToolbarItem(identifier, strings.TextInsertInlineMathCaption, "bi bi-plus-slash-minus", ToolbarItemKinds.button, `${strings.TextInsertInlineMathCaption} (${Editor.isMac ? "\u2318\u21E7E" : "Ctrl+Shift+E"})`);
  },
  activateToolbarItem(editor, identifier) {
    if (identifier != "inlinemath")
      return false;
    InlineMath.insert(editor);
    return true;
  },
  updateToolbarState(editor, set) {
    let host = editor.activeHost;
    let selection = host ? host.selection() : null;
    set("inlinemath", InlineMath.allowedIn(host) && !editor.readOnly, !!host && !!selection && InlineMath.at(host, selection.start, selection.end) !== null);
  },
  handleCommandKey(editor, event) {
    if (!event.shiftKey || event.altKey || event.code != "KeyE")
      return false;
    if (!InlineMath.allowedIn(editor.activeHost) || editor.readOnly)
      return false;
    return InlineMath.insert(editor);
  }
};
Editor.registerExtension(InlineMathExtension);
export {
  InlineMath,
  InlineMathExtension,
  InlineMathTag,
  MathNode,
  MathRenderer
};
