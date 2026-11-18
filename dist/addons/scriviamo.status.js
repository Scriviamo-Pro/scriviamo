// addons/status/statuspills.ts
import { CodeBlockNode, Colors, Editor, HTMLImporter, Popup, RichText, Strings, TextHost, TextHostModes, TextStyle, ToolbarItem, ToolbarItemKinds, Utilities } from "scriviamo";
var StatusStrings = {
  TextInsertStatusCaption: "Insert Status",
  TextStatusRemoveCaption: "Remove Status",
  TextStatusDraft: "Draft",
  TextStatusInProgress: "In Progress",
  TextStatusInReview: "In Review",
  TextStatusApproved: "Approved",
  TextStatusBlocked: "Blocked",
  TextStatusDone: "Done"
};
Strings.register(StatusStrings);
var StatusPillTag = "status";
var StatusPills = class _StatusPills {
  /**
   * The statuses every editor offers, unless set for an editor with StatusPills.setStatuses. By
   * default, the six below in the editor's language.
   */
  static statuses = null;
  static #perEditor = /* @__PURE__ */ new WeakMap();
  /** The statuses an editor offers. */
  static statusesFor(editor) {
    if (editor && _StatusPills.#perEditor.has(editor))
      return _StatusPills.#perEditor.get(editor);
    if (_StatusPills.statuses)
      return _StatusPills.statuses;
    let strings = editor ? editor.strings : null;
    let name = (key) => strings ? strings[key] : StatusStrings[key];
    return [
      { name: name("TextStatusDraft"), color: "#868e96" },
      { name: name("TextStatusInProgress"), color: "#2f6bff" },
      { name: name("TextStatusInReview"), color: "#7950f2" },
      { name: name("TextStatusApproved"), color: "#1fa774" },
      { name: name("TextStatusBlocked"), color: "#e03131" },
      { name: name("TextStatusDone"), color: "#0c8599" }
    ];
  }
  /** Sets the statuses one editor offers. */
  static setStatuses(editor, statuses) {
    _StatusPills.#perEditor.set(editor, statuses.map((status) => ({ name: String(status.name), color: String(status.color) })));
  }
  /** A status's color: the one with its name, ignoring case, or gray. */
  static colorOf(name, editor = null) {
    let key = name.trim().toLowerCase();
    let found = _StatusPills.statusesFor(editor).find((status) => status.name.trim().toLowerCase() == key);
    return found ? found.color : "#868e96";
  }
  /** A pill's CSS: a pale tint of its color behind text in the color itself. */
  static css(color) {
    return `color:${color};background:color-mix(in srgb, ${color} 14%, transparent);border:1px solid color-mix(in srgb, ${color} 35%, transparent)`;
  }
  static style(base, id = Utilities.uuid()) {
    let style = base.clone();
    style.suggestionProviderIdentifier = StatusPillTag;
    style.suggestionIdentifier = id;
    style.code = false;
    style.superscript = false;
    style.subscript = false;
    style.suggestionTextColor = Colors.make(0, 0, 0, 255);
    style.suggestionBackgroundColor = Colors.make(0, 0, 0, 255);
    style.suggestionBorderColor = Colors.make(0, 0, 0, 255);
    return style;
  }
  static untagged(style) {
    let result = style.clone();
    result.suggestionProviderIdentifier = "";
    result.suggestionIdentifier = "";
    result.suggestionTextColor = Colors.clone(TextStyle.defaults.suggestionTextColor);
    result.suggestionBackgroundColor = Colors.clone(TextStyle.defaults.suggestionBackgroundColor);
    result.suggestionBorderColor = Colors.clone(TextStyle.defaults.suggestionBorderColor);
    return result;
  }
  static pills(host) {
    let result = [];
    let offset = 0;
    for (let run of host.rich.runs()) {
      let style = run.style;
      if (style.suggestionProviderIdentifier == StatusPillTag) {
        let previous = result[result.length - 1];
        if (previous && previous.id == style.suggestionIdentifier && previous.end == offset) {
          previous.end += run.text.length;
          previous.name += run.text;
        } else {
          result.push({ host, start: offset, end: offset + run.text.length, id: style.suggestionIdentifier, name: run.text });
        }
      }
      offset += run.text.length;
    }
    return result;
  }
  static at(host, start, end = start) {
    return _StatusPills.pills(host).find((pill) => start == end ? pill.start == start || pill.end == start : pill.start <= start && pill.end >= end) || null;
  }
  static allowedIn(host) {
    return !!host && host.mode != TextHostModes.plain && !(host.node instanceof CodeBlockNode);
  }
  /** Puts a status in place of start through end, or removes the range when name is "". One undo step. */
  static replace(editor, host, start, end, name, id = Utilities.uuid()) {
    if (editor.readOnly)
      return false;
    name = name.replace(/[\n\r\u2028\u2029]+/g, " ").trim();
    let rich = host.rich;
    let base = start > 0 || end < rich.length ? rich.styleAt(start < rich.length ? start : start - 1) : new TextStyle();
    base = _StatusPills.untagged(base);
    editor.history.breakCoalescing();
    editor.history.checkpoint();
    rich.remove(start, end);
    if (name.length > 0)
      rich.insert(start, name, _StatusPills.style(base, id));
    host.render();
    let caret = start + name.length;
    host.select(caret);
    if (name.length > 0)
      editor.setPendingStyle(host, caret, base);
    host.node.textChanged(host);
    host.node.changed();
    editor.history.breakCoalescing();
    editor.updateToolbarState();
    return true;
  }
  /** Changes the status beside the caret, or puts the first status at the caret and offers the rest. */
  static insert(editor) {
    let host = editor.activeHost;
    if (!_StatusPills.allowedIn(host) || editor.readOnly)
      return false;
    let selection = host.selection();
    if (!selection)
      return false;
    let pill = _StatusPills.at(host, selection.start, selection.end);
    if (pill) {
      _StatusPills.choose(editor, pill);
      return true;
    }
    let first = _StatusPills.statusesFor(editor)[0];
    if (!first)
      return false;
    let id = Utilities.uuid();
    _StatusPills.replace(editor, host, selection.start, selection.end, first.name, id);
    let added = _StatusPills.pills(host).find((item) => item.id == id);
    if (added)
      _StatusPills.choose(editor, added);
    return true;
  }
  /** Shows the statuses to change a pill to. */
  static choose(editor, pill) {
    if (editor.readOnly || !editor.element)
      return;
    let host = pill.host;
    let popup = new Popup("dropdown-menu show scv-status-popup");
    let current = () => _StatusPills.pills(host).find((item) => item.id == pill.id) || null;
    let set = (name) => {
      popup.close();
      let target = current();
      if (target && name != target.name)
        _StatusPills.replace(editor, host, target.start, target.end, name, pill.id);
      else if (target)
        host.select(target.end);
    };
    _StatusPills.statusesFor(editor).forEach((status) => {
      let item = Utilities.element("button", `dropdown-item${status.name == pill.name ? " active" : ""}`, { type: "button" });
      let swatch = Utilities.element("span", "scv-status-pill scv-status-pill-sample");
      swatch.setAttribute("style", _StatusPills.css(status.color));
      swatch.textContent = status.name;
      item.append(swatch);
      item.addEventListener("click", () => set(status.name));
      popup.element.append(item);
    });
    popup.element.append(Utilities.element("div", "dropdown-divider"));
    let remove = Utilities.element("button", "dropdown-item", { type: "button" });
    remove.textContent = editor.strings.TextStatusRemoveCaption;
    remove.addEventListener("click", () => set(""));
    popup.element.append(remove);
    let anchor = () => {
      let element = host.element.querySelector(`[data-scv-tag="${StatusPillTag}"][data-scv-tag-id="${CSS.escape(pill.id)}"]`);
      return element ? element.getBoundingClientRect() : host.caretRect() || host.element.getBoundingClientRect();
    };
    popup.anchorProvider = anchor;
    popup.show(anchor() || host.element.getBoundingClientRect(), editor.element);
  }
  /** Draws a status as a pill in its color. */
  static render(elements, host) {
    let name = elements.map((element) => element.textContent || "").join("");
    let color = _StatusPills.colorOf(name, host.node.editor);
    elements.forEach((element) => {
      element.setAttribute("contenteditable", "false");
      element.classList.add("scv-status-tag");
      let source = Utilities.element("span", "scv-chip-source");
      source.append(...Array.from(element.childNodes));
      element.append(source);
    });
    let drawn = Utilities.element("span", "scv-widget scv-status-pill");
    drawn.setAttribute("style", _StatusPills.css(color));
    drawn.textContent = name;
    elements[elements.length - 1].append(drawn);
  }
};
TextHost.registerTagRenderer(StatusPillTag, StatusPills.render);
RichText.registerTagExport(StatusPillTag, {
  html(text) {
    let name = text.trim();
    return `<span class="status-pill" data-status="${Utilities.escapeAttribute(name)}" style="${StatusPills.css(StatusPills.colorOf(name))};padding:0 8px;border-radius:999px;font-size:0.85em;font-weight:600;white-space:nowrap">${Utilities.escapeText(name)}</span>`;
  },
  markdown(text) {
    let name = text.trim();
    return `<span class="status-pill" data-status="${Utilities.escapeAttribute(name)}">${Utilities.escapeText(name)}</span>`;
  }
});
HTMLImporter.registerInlineElement((element, style) => {
  let name = null;
  if (element.classList.contains("status-pill"))
    name = element.getAttribute("data-status") || element.textContent;
  else if (element.getAttribute("data-scriviamo-suggestion-provider") == StatusPillTag)
    name = element.textContent;
  if (name === null)
    return null;
  name = name.replace(/\s+/g, " ").trim();
  if (name.length == 0)
    return null;
  return { text: name, style: StatusPills.style(StatusPills.untagged(style)) };
});
var StatusPillsExtension = {
  toolbarIdentifiers: ["insertstatus"],
  defaultToolbarIdentifiers: ["insertstatus"],
  defaultToolbarAfter: "insertdate",
  install(editor) {
    let root = editor.element;
    if (!root)
      return;
    root.addEventListener("click", (event) => {
      let element = event.target instanceof Element ? event.target.closest(".scv-status-tag") : null;
      if (!element || editor.readOnly)
        return;
      let host = TextHost.from(element);
      if (!host || !root.contains(host.element))
        return;
      let pill = StatusPills.pills(host).find((item) => item.id == (element.dataset.scvTagId || ""));
      if (!pill)
        return;
      event.preventDefault();
      if (editor.activeHost !== host)
        editor.focusNode(host.node, pill.end, host.index);
      else
        host.select(pill.end);
      StatusPills.choose(editor, pill);
    });
    editor.addEventListener("keyPress", (event) => {
      let key = event.detail && event.detail.key;
      if (key != "Backspace" && key != "Delete")
        return;
      let host = editor.activeHost;
      let selection = host ? host.selection() : null;
      if (!host || !selection || selection.start != selection.end || editor.readOnly)
        return;
      let pill = StatusPills.pills(host).find((item) => key == "Backspace" ? item.end == selection.start : item.start == selection.start);
      if (!pill)
        return;
      event.preventDefault();
      StatusPills.replace(editor, host, pill.start, pill.end, "");
    });
  },
  makeToolbarItem(editor, identifier) {
    if (identifier != "insertstatus")
      return null;
    return new ToolbarItem(identifier, editor.strings.TextInsertStatusCaption, "bi bi-tag", ToolbarItemKinds.button, editor.strings.TextInsertStatusCaption);
  },
  activateToolbarItem(editor, identifier) {
    if (identifier != "insertstatus")
      return false;
    StatusPills.insert(editor);
    return true;
  },
  updateToolbarState(editor, set) {
    let host = editor.activeHost;
    let selection = host ? host.selection() : null;
    set("insertstatus", StatusPills.allowedIn(host) && !editor.readOnly, !!host && !!selection && StatusPills.at(host, selection.start, selection.end) !== null);
  }
};
Editor.registerExtension(StatusPillsExtension);
export {
  StatusPillTag,
  StatusPills,
  StatusPillsExtension
};
