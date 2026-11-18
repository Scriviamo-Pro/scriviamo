// addons/dates/datechips.ts
import { Colors, Editor, HTMLImporter, Popup, RichText, Strings, TextHost, TextHostModes, TextStyle, ToolbarItem, ToolbarItemKinds, Utilities, CodeBlockNode } from "scriviamo";
var DatesStrings = {
  TextInsertDateCaption: "Insert Date",
  TextDateChipCaption: "Date",
  TextDateTodayCaption: "Today",
  TextDateTomorrowCaption: "Tomorrow",
  TextDateRemoveCaption: "Remove"
};
Strings.register(DatesStrings);
var DateChipTag = "date";
var DateChips = class _DateChips {
  /** How dates read, as options for Intl.DateTimeFormat. */
  static format = { year: "numeric", month: "short", day: "numeric" };
  static isValid(date) {
    let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match)
      return false;
    let value = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return value.getUTCFullYear() == Number(match[1]) && value.getUTCMonth() == Number(match[2]) - 1 && value.getUTCDate() == Number(match[3]);
  }
  /** An ISO date for a Date, in local time. */
  static iso(value) {
    let pad = (number) => String(number).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  static today() {
    return _DateChips.iso(/* @__PURE__ */ new Date());
  }
  /** A date as it reads in a language, or the ISO date when it can't be read. */
  static display(date, language) {
    if (!_DateChips.isValid(date))
      return date;
    let [year, month, day] = date.split("-").map(Number);
    try {
      return new Intl.DateTimeFormat(language, { ..._DateChips.format, timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
    } catch {
      return date;
    }
  }
  /** The page's language, for dates in an editor. */
  static language(editor) {
    let page = editor && editor.element ? editor.element.closest("[lang]") : null;
    return page && page.lang ? page.lang : typeof document != "undefined" && document.documentElement.lang || void 0;
  }
  static style(base, id = Utilities.uuid()) {
    let style = base.clone();
    style.suggestionProviderIdentifier = DateChipTag;
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
  /** The dates in one text, in order. */
  static dates(host) {
    let result = [];
    let offset = 0;
    for (let run of host.rich.runs()) {
      let style = run.style;
      if (style.suggestionProviderIdentifier == DateChipTag) {
        let previous = result[result.length - 1];
        if (previous && previous.id == style.suggestionIdentifier && previous.end == offset) {
          previous.end += run.text.length;
          previous.date += run.text;
        } else {
          result.push({ host, start: offset, end: offset + run.text.length, id: style.suggestionIdentifier, date: run.text });
        }
      }
      offset += run.text.length;
    }
    return result;
  }
  static at(host, start, end = start) {
    return _DateChips.dates(host).find((chip) => start == end ? chip.start == start || chip.end == start : chip.start <= start && chip.end >= end) || null;
  }
  static allowedIn(host) {
    return !!host && host.mode != TextHostModes.plain && !(host.node instanceof CodeBlockNode);
  }
  /** Puts a date in place of start through end, or removes the range when date is "". One undo step. */
  static replace(editor, host, start, end, date, id = Utilities.uuid()) {
    if (editor.readOnly || date.length > 0 && !_DateChips.isValid(date))
      return false;
    let rich = host.rich;
    let base = start > 0 || end < rich.length ? rich.styleAt(start < rich.length ? start : start - 1) : new TextStyle();
    base = _DateChips.untagged(base);
    editor.history.breakCoalescing();
    editor.history.checkpoint();
    rich.remove(start, end);
    if (date.length > 0)
      rich.insert(start, date, _DateChips.style(base, id));
    host.render();
    let caret = start + date.length;
    host.select(caret);
    if (date.length > 0)
      editor.setPendingStyle(host, caret, base);
    host.node.textChanged(host);
    host.node.changed();
    editor.history.breakCoalescing();
    editor.updateToolbarState();
    return true;
  }
  /** Changes the date beside the caret, or puts today's date at the caret. */
  static insert(editor) {
    let host = editor.activeHost;
    if (!_DateChips.allowedIn(host) || editor.readOnly)
      return false;
    let selection = host.selection();
    if (!selection)
      return false;
    let chip = _DateChips.at(host, selection.start, selection.end);
    if (chip) {
      _DateChips.edit(editor, chip);
      return true;
    }
    let id = Utilities.uuid();
    _DateChips.replace(editor, host, selection.start, selection.end, _DateChips.today(), id);
    let added = _DateChips.dates(host).find((item) => item.id == id);
    if (added)
      _DateChips.edit(editor, added);
    return true;
  }
  /** Shows the date picker for a date in the text. */
  static edit(editor, chip) {
    if (editor.readOnly || !editor.element)
      return;
    let strings = editor.strings;
    let host = chip.host;
    let popup = new Popup("dropdown-menu show scv-date-popup");
    popup.keepsFocus = false;
    let input = Utilities.element("input", "form-control form-control-sm", { type: "date", "aria-label": strings.TextDateChipCaption });
    input.value = chip.date;
    let quick = Utilities.element("div", "d-flex gap-1 mt-2");
    let current = () => _DateChips.dates(host).find((item) => item.id == chip.id) || null;
    let set = (date) => {
      popup.close();
      let target = current();
      if (target && date != target.date)
        _DateChips.replace(editor, host, target.start, target.end, date, chip.id);
      else if (target)
        host.select(target.end);
    };
    let button = (caption, action, extra = "") => {
      let element = Utilities.element("button", `btn btn-sm btn-outline-secondary ${extra}`, { type: "button" });
      element.textContent = caption;
      element.addEventListener("click", action);
      return element;
    };
    let tomorrow = /* @__PURE__ */ new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    quick.append(button(strings.TextDateTodayCaption, () => set(_DateChips.today())), button(strings.TextDateTomorrowCaption, () => set(_DateChips.iso(tomorrow))), button(strings.TextDateRemoveCaption, () => set(""), "ms-auto"));
    popup.element.append(input, quick);
    input.addEventListener("change", () => {
      if (_DateChips.isValid(input.value))
        set(input.value);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key == "Enter") {
        event.preventDefault();
        if (_DateChips.isValid(input.value))
          set(input.value);
      } else if (event.key == "Escape") {
        event.preventDefault();
        event.stopPropagation();
        popup.close();
        let target = current();
        if (target)
          host.select(target.end);
      }
    });
    let anchor = () => {
      let element = host.element.querySelector(`[data-scv-tag="${DateChipTag}"][data-scv-tag-id="${CSS.escape(chip.id)}"]`);
      return element ? element.getBoundingClientRect() : host.caretRect() || host.element.getBoundingClientRect();
    };
    popup.anchorProvider = anchor;
    popup.show(anchor() || host.element.getBoundingClientRect(), editor.element);
    input.focus();
  }
  /** Draws a date: its ISO text stays as hidden text, and the chip shows it in the reader's language. */
  static render(elements, host) {
    let date = elements.map((element) => element.textContent || "").join("");
    elements.forEach((element) => {
      element.setAttribute("contenteditable", "false");
      element.classList.add("scv-date-chip");
      let source = Utilities.element("span", "scv-chip-source");
      source.append(...Array.from(element.childNodes));
      element.append(source);
      element.title = date;
    });
    let drawn = Utilities.element("span", "scv-widget scv-chip-drawn");
    drawn.innerHTML = '<i class="bi bi-calendar-event" aria-hidden="true"></i>';
    drawn.append(_DateChips.display(date, _DateChips.language(host.node.editor)));
    elements[elements.length - 1].append(drawn);
  }
};
TextHost.registerTagRenderer(DateChipTag, DateChips.render);
RichText.registerTagExport(DateChipTag, {
  html(text) {
    let date = text.trim();
    return `<time class="date-chip" datetime="${Utilities.escapeAttribute(date)}" style="padding:0 5px;border-radius:4px;background:rgba(47,107,255,0.1);white-space:nowrap">${Utilities.escapeText(DateChips.display(date, DateChips.language(null)))}</time>`;
  },
  markdown(text) {
    return DateChips.display(text.trim(), DateChips.language(null));
  }
});
HTMLImporter.registerInlineElement((element, style) => {
  let date = null;
  if (element.tagName == "TIME" && element.classList.contains("date-chip"))
    date = element.getAttribute("datetime");
  else if (element.getAttribute("data-scriviamo-suggestion-provider") == DateChipTag)
    date = element.textContent;
  if (date === null)
    return null;
  date = date.trim().substring(0, 10);
  if (!DateChips.isValid(date))
    return null;
  return { text: date, style: DateChips.style(DateChips.untagged(style)) };
});
var DateChipsExtension = {
  toolbarIdentifiers: ["insertdate"],
  defaultToolbarIdentifiers: ["insertdate"],
  defaultToolbarAfter: "link",
  install(editor) {
    let root = editor.element;
    if (!root)
      return;
    root.addEventListener("click", (event) => {
      let element = event.target instanceof Element ? event.target.closest(".scv-date-chip") : null;
      if (!element || editor.readOnly)
        return;
      let host = TextHost.from(element);
      if (!host || !root.contains(host.element))
        return;
      let chip = DateChips.dates(host).find((item) => item.id == (element.dataset.scvTagId || ""));
      if (!chip)
        return;
      event.preventDefault();
      if (editor.activeHost !== host)
        editor.focusNode(host.node, chip.end, host.index);
      else
        host.select(chip.end);
      DateChips.edit(editor, chip);
    });
    editor.addEventListener("keyPress", (event) => {
      let key = event.detail && event.detail.key;
      if (key != "Backspace" && key != "Delete")
        return;
      let host = editor.activeHost;
      let selection = host ? host.selection() : null;
      if (!host || !selection || selection.start != selection.end || editor.readOnly)
        return;
      let chip = DateChips.dates(host).find((item) => key == "Backspace" ? item.end == selection.start : item.start == selection.start);
      if (!chip)
        return;
      event.preventDefault();
      DateChips.replace(editor, host, chip.start, chip.end, "");
    });
  },
  makeToolbarItem(editor, identifier) {
    if (identifier != "insertdate")
      return null;
    return new ToolbarItem(identifier, editor.strings.TextInsertDateCaption, "bi bi-calendar-event", ToolbarItemKinds.button, editor.strings.TextInsertDateCaption);
  },
  activateToolbarItem(editor, identifier) {
    if (identifier != "insertdate")
      return false;
    DateChips.insert(editor);
    return true;
  },
  updateToolbarState(editor, set) {
    let host = editor.activeHost;
    let selection = host ? host.selection() : null;
    set("insertdate", DateChips.allowedIn(host) && !editor.readOnly, !!host && !!selection && DateChips.at(host, selection.start, selection.end) !== null);
  }
};
Editor.registerExtension(DateChipsExtension);
export {
  DateChipTag,
  DateChips,
  DateChipsExtension
};
