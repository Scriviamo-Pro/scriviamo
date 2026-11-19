// core.ts
var CurrentDocumentVersion = 4;
var DefaultFontSize = 16;
var Alignments = /* @__PURE__ */ ((Alignments2) => {
  Alignments2[Alignments2["automatic"] = 0] = "automatic";
  Alignments2[Alignments2["leading"] = 1] = "leading";
  Alignments2[Alignments2["middle"] = 2] = "middle";
  Alignments2[Alignments2["trailing"] = 3] = "trailing";
  return Alignments2;
})(Alignments || {});
var Directions = /* @__PURE__ */ ((Directions2) => {
  Directions2[Directions2["automatic"] = 0] = "automatic";
  Directions2[Directions2["leftToRight"] = 1] = "leftToRight";
  Directions2[Directions2["rightToLeft"] = 2] = "rightToLeft";
  return Directions2;
})(Directions || {});
var ToolbarDisplayModes = /* @__PURE__ */ ((ToolbarDisplayModes2) => {
  ToolbarDisplayModes2[ToolbarDisplayModes2["iconOnly"] = 0] = "iconOnly";
  ToolbarDisplayModes2[ToolbarDisplayModes2["iconAndText"] = 1] = "iconAndText";
  ToolbarDisplayModes2[ToolbarDisplayModes2["textOnly"] = 2] = "textOnly";
  return ToolbarDisplayModes2;
})(ToolbarDisplayModes || {});
var ParagraphBreak = "\n";
var NormalLineHeightRatio = 1.2;
var LineBreak = "\u2028";
var ThemeColors = /* @__PURE__ */ ((ThemeColors2) => {
  ThemeColors2[ThemeColors2["background"] = 0] = "background";
  ThemeColors2[ThemeColors2["primary"] = 1] = "primary";
  ThemeColors2[ThemeColors2["selection"] = 2] = "selection";
  ThemeColors2[ThemeColors2["textSelection"] = 3] = "textSelection";
  ThemeColors2[ThemeColors2["information"] = 4] = "information";
  ThemeColors2[ThemeColors2["success"] = 5] = "success";
  ThemeColors2[ThemeColors2["warning"] = 6] = "warning";
  ThemeColors2[ThemeColors2["danger"] = 7] = "danger";
  ThemeColors2[ThemeColors2["text"] = 8] = "text";
  ThemeColors2[ThemeColors2["textMuted"] = 9] = "textMuted";
  ThemeColors2[ThemeColors2["link"] = 10] = "link";
  ThemeColors2[ThemeColors2["border"] = 11] = "border";
  ThemeColors2[ThemeColors2["borderStrong"] = 12] = "borderStrong";
  ThemeColors2[ThemeColors2["surface"] = 13] = "surface";
  ThemeColors2[ThemeColors2["dark"] = 14] = "dark";
  ThemeColors2[ThemeColors2["light"] = 15] = "light";
  ThemeColors2[ThemeColors2["highlight"] = 16] = "highlight";
  return ThemeColors2;
})(ThemeColors || {});
var Colors = class _Colors {
  /** Opaque black, the default color value. */
  static get empty() {
    return { red: 0, green: 0, blue: 0, alpha: 0 };
  }
  static make(red, green, blue, alpha = 0) {
    return { red, green, blue, alpha };
  }
  static clone(value) {
    if (!value)
      return _Colors.empty;
    return { red: value.red, green: value.green, blue: value.blue, alpha: value.alpha };
  }
  static equals(a, b) {
    if (!a || !b)
      return a === b;
    return a.red == b.red && a.green == b.green && a.blue == b.blue && a.alpha == b.alpha;
  }
  static isEmpty(value) {
    return !value || _Colors.equals(value, _Colors.empty);
  }
  static fromJSON(data, fallback) {
    if (!data || typeof data != "object")
      return _Colors.clone(fallback);
    return {
      red: _Colors.channel(data.red, fallback.red),
      green: _Colors.channel(data.green, fallback.green),
      blue: _Colors.channel(data.blue, fallback.blue),
      alpha: _Colors.channel(data.alpha, fallback.alpha)
    };
  }
  static toJSON(value) {
    value = value || _Colors.empty;
    return { red: value.red, green: value.green, blue: value.blue, alpha: value.alpha };
  }
  static channel(value, fallback) {
    let result = Number(value);
    if (!isFinite(result))
      return fallback;
    return Math.max(0, Math.min(255, Math.round(result)));
  }
  /** CSS rgba() color string, such as rgba(12,34,56,0.5). Converts the document alpha scale to CSS opacity. */
  static toCSS(value) {
    if (!value)
      return "transparent";
    let opacity = (1 - value.alpha / 255).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    return `rgba(${value.red},${value.green},${value.blue},${opacity})`;
  }
  static toHex(value) {
    if (!value)
      return "#000000";
    let hex = (n) => n.toString(16).padStart(2, "0");
    return `#${hex(value.red)}${hex(value.green)}${hex(value.blue)}`;
  }
  /**
   * Parses a CSS color: #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba() or a name,
   * also when it is part of a shorthand value such as "1px solid #ccc". Returns
   * null when there is no color.
   */
  static fromCSS(value) {
    if (!value)
      return null;
    value = value.trim().toLowerCase();
    let important = value.indexOf("!important");
    if (important >= 0)
      value = value.substring(0, important).trim();
    if (value == "" || value == "initial" || value == "inherit" || value == "currentcolor")
      return null;
    if (value == "transparent")
      return _Colors.make(0, 0, 0, 255);
    let functional = value.search(/rgba?\(/);
    if (functional > 0) {
      let closing = value.indexOf(")", functional);
      if (closing >= 0)
        value = value.substring(functional, closing + 1);
    }
    let hash = value.indexOf("#");
    if (hash >= 0) {
      let hex = (value.substring(hash + 1).match(/^[0-9a-f]*/) || [""])[0];
      if (hex.length == 3 || hex.length == 4)
        hex = hex.split("").map((c) => c + c).join("");
      if (hex.length == 6 || hex.length == 8) {
        let alpha = hex.length == 8 ? 255 - parseInt(hex.substring(6, 8), 16) : 0;
        return _Colors.make(parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16), alpha);
      }
    }
    if (value.startsWith("rgb(") || value.startsWith("rgba(")) {
      let closing = value.indexOf(")");
      if (closing > 0) {
        let components = value.substring(value.indexOf("(") + 1, closing).split(/[\s,\/]+/).filter((part) => part.length > 0);
        if (components.length >= 3) {
          let channel = (part) => {
            let number = parseFloat(part);
            if (!isFinite(number))
              return 0;
            if (part.endsWith("%"))
              return Math.round(Math.max(0, Math.min(100, number)) * 2.55);
            return Math.round(Math.max(0, Math.min(255, number)));
          };
          let alpha = 0;
          if (components.length >= 4) {
            let opacity = parseFloat(components[3]);
            if (!isFinite(opacity))
              opacity = 1;
            if (components[3].endsWith("%"))
              opacity = opacity / 100;
            alpha = Math.round((1 - Math.max(0, Math.min(1, opacity))) * 255);
          }
          return _Colors.make(channel(components[0]), channel(components[1]), channel(components[2]), alpha);
        }
      }
    }
    let named = {
      black: "#000000",
      white: "#ffffff",
      red: "#ff0000",
      green: "#008000",
      blue: "#0000ff",
      yellow: "#ffff00",
      orange: "#ffa500",
      purple: "#800080",
      gray: "#808080",
      grey: "#808080"
    };
    if (named[value])
      return _Colors.fromCSS(named[value]);
    let tokens = value.split(/\s+/);
    if (tokens.length > 1) {
      for (let index = tokens.length - 1; index >= 0; index--) {
        let color = tokens[index].length > 0 ? _Colors.fromCSS(tokens[index]) : null;
        if (color)
          return color;
      }
    }
    return null;
  }
};
var Utilities = class _Utilities {
  /** The pixel size of base64 PNG, GIF or JPEG data, read from its header, or null. */
  static imageDataSize(base64) {
    try {
      let clean = base64.substring(0, 262144).replace(/[^A-Za-z0-9+/]/g, "");
      let bytes = atob(clean.substring(0, clean.length - clean.length % 4));
      let byte = (index) => bytes.charCodeAt(index);
      if (bytes.startsWith("\x89PNG"))
        return { width: (byte(16) << 24 | byte(17) << 16 | byte(18) << 8 | byte(19)) >>> 0, height: (byte(20) << 24 | byte(21) << 16 | byte(22) << 8 | byte(23)) >>> 0 };
      if (bytes.startsWith("GIF8"))
        return { width: byte(6) | byte(7) << 8, height: byte(8) | byte(9) << 8 };
      if (byte(0) == 255 && byte(1) == 216) {
        let offset = 2;
        while (offset + 9 < bytes.length) {
          if (byte(offset) != 255)
            return null;
          let marker = byte(offset + 1);
          let length = byte(offset + 2) << 8 | byte(offset + 3);
          if (marker >= 192 && marker <= 207 && marker != 196 && marker != 200 && marker != 204) {
            return { width: byte(offset + 7) << 8 | byte(offset + 8), height: byte(offset + 5) << 8 | byte(offset + 6) };
          }
          offset += 2 + length;
        }
      }
    } catch {
    }
    return null;
  }
  /** True when text's first strong character is written right to left, as in Hebrew or Arabic. */
  static isRightToLeftText(value) {
    let match = (value || "").match(/[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]|\p{L}/u);
    return !!match && /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(match[0]);
  }
  /** True for a language tag such as he-IL or ar_SA whose language is written right to left. */
  static isRightToLeftLanguage(tag) {
    let language = (tag || "").trim().toLowerCase().split(/[-_]/)[0];
    return ["ar", "arc", "ckb", "dv", "fa", "ha", "he", "iw", "khw", "ks", "ku", "nqo", "ps", "sd", "syr", "ug", "ur", "yi"].indexOf(language) >= 0;
  }
  static uuid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
      return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      let r = Math.random() * 16 | 0;
      return (c == "x" ? r : r & 3 | 8).toString(16);
    });
  }
  static escapeText(value) {
    return (value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static escapeAttribute(value) {
    return _Utilities.escapeText(value).replace(/"/g, "&quot;");
  }
  static number(value, fallback) {
    let result = Number(value);
    return isFinite(result) && value !== null && value !== "" && value !== void 0 ? result : fallback;
  }
  static integer(value, fallback) {
    return Math.trunc(_Utilities.number(value, fallback));
  }
  static boolean(value, fallback) {
    if (value === void 0 || value === null)
      return fallback;
    return value === true || value === "true" || value === 1;
  }
  static string(value, fallback = "") {
    if (value === void 0 || value === null)
      return fallback;
    return String(value);
  }
  static clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }
  /** Builds a CSS font-family list from a document font name. */
  static fontFamilyCSS(fontName) {
    if (!fontName || fontName.toLowerCase() == "system")
      return `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
    if (fontName.toLowerCase() == "smallsystem")
      return `system-ui, sans-serif`;
    let fallback = _Utilities.webFontFallbacks.get(fontName.toLowerCase());
    return `'${fontName.replace(/'/g, "\\'")}'${fallback ? `, ${fallback}` : ""}`;
  }
  /** Each registered web font's fallback, by its family in lowercase; WebFonts keeps it. */
  static webFontFallbacks = /* @__PURE__ */ new Map();
  /** Converts a heading's text into a URL fragment. */
  static slug(value) {
    return (value || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");
  }
  /** Detects the MIME type of base64-encoded picture data from its leading bytes. */
  static pictureMimeType(base64) {
    if (!base64)
      return "image/png";
    if (base64.startsWith("/9j/"))
      return "image/jpeg";
    if (base64.startsWith("iVBOR"))
      return "image/png";
    if (base64.startsWith("R0lG"))
      return "image/gif";
    if (base64.startsWith("UklGR"))
      return "image/webp";
    if (base64.startsWith("PHN2Zy") || base64.startsWith("PD94bW"))
      return "image/svg+xml";
    if (base64.startsWith("Qk"))
      return "image/bmp";
    if (base64.startsWith("AAAA"))
      return "image/heic";
    return "image/png";
  }
  static element(tag, classes = "", attributes) {
    let result = document.createElement(tag);
    if (classes.length > 0)
      classes.split(" ").forEach((name) => {
        if (name.length > 0)
          result.classList.add(name);
      });
    if (attributes)
      Object.keys(attributes).forEach((name) => result.setAttribute(name, attributes[name]));
    return result;
  }
  /** Replaces %token% placeholders in a localized format string. */
  static format(value, tokens) {
    let result = value;
    Object.keys(tokens).forEach((name) => {
      result = result.split(`%${name}%`).join(String(tokens[name]));
    });
    return result;
  }
};
var CodePoints = class {
  /** Number of code points in the string, the character count used by the JSON format. */
  static count(value) {
    let result = 0;
    for (let index = 0; index < value.length; index++) {
      let code = value.charCodeAt(index);
      if (code >= 55296 && code <= 56319 && index + 1 < value.length) {
        let next = value.charCodeAt(index + 1);
        if (next >= 56320 && next <= 57343)
          index++;
      }
      result++;
    }
    return result;
  }
  /** Returns the UTF-16 width (1 or 2) of the character starting at index. */
  static widthAt(value, index) {
    let code = value.charCodeAt(index);
    if (code >= 55296 && code <= 56319 && index + 1 < value.length) {
      let next = value.charCodeAt(index + 1);
      if (next >= 56320 && next <= 57343)
        return 2;
    }
    return 1;
  }
};

// textstyle.ts
var FontOptions = class _FontOptions {
  #fontNames = [];
  #sizes = [];
  allowBold = true;
  allowItalic = true;
  allowUnderline = true;
  allowStrikethrough = true;
  allowCode = true;
  allowHighlight = true;
  allowKeyboard = true;
  allowSuperscript = true;
  allowSubscript = true;
  /** Adds Custom… to the size menu, for typing any size from 1 to 1000. */
  allowCustomFontSize = true;
  static defaultFontNames = ["System", "Arial", "Georgia", "Helvetica", "Times New Roman", "Trebuchet MS", "Verdana", "Courier New"];
  static defaultSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
  constructor(includeSystemFonts = true, includeDefaultSizes = true) {
    if (includeSystemFonts)
      this.#fontNames = _FontOptions.defaultFontNames.slice();
    if (includeDefaultSizes)
      this.#sizes = _FontOptions.defaultSizes.slice();
  }
  fontNames() {
    return this.#fontNames.slice();
  }
  sizes() {
    return this.#sizes.slice();
  }
  fontNameAt(index) {
    return this.#fontNames[index] || "";
  }
  sizeAt(index) {
    return this.#sizes[index] || 0;
  }
  get lastFontNameIndex() {
    return this.#fontNames.length - 1;
  }
  get lastSizeIndex() {
    return this.#sizes.length - 1;
  }
  indexOfFontName(value) {
    return this.#fontNames.findIndex((name) => name.toLowerCase() == String(value).toLowerCase());
  }
  indexOfSize(value) {
    return this.#sizes.findIndex((size) => Math.abs(size - value) < 1e-3);
  }
  addFontName(value) {
    value = String(value || "").trim();
    if (value.length > 0 && this.indexOfFontName(value) < 0)
      this.#fontNames.push(value);
  }
  addFontNameAt(index, value) {
    value = String(value || "").trim();
    if (value.length == 0 || this.indexOfFontName(value) >= 0)
      return;
    this.#fontNames.splice(Utilities.clamp(index, 0, this.#fontNames.length), 0, value);
  }
  addSize(value) {
    if (value > 0 && this.indexOfSize(value) < 0)
      this.#sizes.push(value);
  }
  addSizeAt(index, value) {
    if (!(value > 0) || this.indexOfSize(value) >= 0)
      return;
    this.#sizes.splice(Utilities.clamp(index, 0, this.#sizes.length), 0, value);
  }
  removeFontName(value) {
    this.removeFontNameAt(this.indexOfFontName(value));
  }
  removeFontNameAt(index) {
    if (index >= 0 && index < this.#fontNames.length)
      this.#fontNames.splice(index, 1);
  }
  removeAllFontNames() {
    this.#fontNames = [];
  }
  removeSize(value) {
    this.removeSizeAt(this.indexOfSize(value));
  }
  removeSizeAt(index) {
    if (index >= 0 && index < this.#sizes.length)
      this.#sizes.splice(index, 1);
  }
  removeAllSizes() {
    this.#sizes = [];
  }
  /** Replaces the font names. */
  setFontNames(values) {
    this.#fontNames = [];
    values.forEach((value) => this.addFontName(value));
  }
  /** Replaces the sizes. Zero, which stands for Default, is ignored. */
  setSizes(values) {
    this.#sizes = [];
    values.forEach((value) => this.addSize(Number(value)));
  }
  /** Whether a character format is available, by its property name such as "bold". */
  allows(name) {
    let key = `allow${name.charAt(0).toUpperCase()}${name.substring(1)}`;
    return this[key] !== false;
  }
};
var TextStyle = class _TextStyle {
  backgroundColor = Colors.empty;
  bold = false;
  code = false;
  fontName = "";
  fontSize = 0;
  hasBackgroundColor = false;
  hasLinkColor = false;
  highlight = false;
  italic = false;
  keyboard = false;
  linkColor = Colors.make(0, 102, 204);
  linkTarget = "";
  linkTitle = "";
  linkURL = "";
  strikethrough = false;
  subscript = false;
  superscript = false;
  suggestionBackgroundColor = Colors.make(219, 234, 254);
  suggestionBorderColor = Colors.make(147, 197, 253);
  suggestionIdentifier = "";
  suggestionProviderIdentifier = "";
  suggestionTextColor = Colors.make(30, 64, 175);
  textColor = Colors.empty;
  underline = false;
  /**
   * A tracked change: "insert" for text suggested as added, "delete" for text suggested as removed,
   * or "" for neither. The track changes add-on makes and resolves them; any editor shows them.
   */
  change = "";
  /** The tracked change's identifier, shared by the text one edit added or removed. */
  changeID = "";
  /** Who suggested the change. */
  changeAuthor = "";
  /** When the change was suggested, as an ISO date and time. */
  changeTime = "";
  static #booleanNames = ["bold", "code", "hasBackgroundColor", "hasLinkColor", "highlight", "italic", "keyboard", "strikethrough", "subscript", "superscript", "underline"];
  static #stringNames = ["change", "changeAuthor", "changeID", "changeTime", "fontName", "linkTarget", "linkTitle", "linkURL", "suggestionIdentifier", "suggestionProviderIdentifier"];
  static #colorNames = ["backgroundColor", "linkColor", "suggestionBackgroundColor", "suggestionBorderColor", "suggestionTextColor", "textColor"];
  static #defaults = null;
  static get defaults() {
    if (!_TextStyle.#defaults)
      _TextStyle.#defaults = new _TextStyle();
    return _TextStyle.#defaults;
  }
  static fromJSON(data) {
    let result = new _TextStyle();
    result.applyJSON(data);
    return result;
  }
  /** Applies the names present in data, keeping current values for missing names. */
  applyJSON(data) {
    if (!data || typeof data != "object")
      return;
    _TextStyle.#booleanNames.forEach((name) => {
      if (name in data)
        this[name] = Utilities.boolean(data[name], this[name]);
    });
    _TextStyle.#stringNames.forEach((name) => {
      if (name in data)
        this[name] = Utilities.string(data[name], this[name]);
    });
    _TextStyle.#colorNames.forEach((name) => {
      if (name in data)
        this[name] = Colors.fromJSON(data[name], this[name]);
    });
    if ("fontSize" in data)
      this.fontSize = Utilities.number(data.fontSize, this.fontSize);
  }
  clone() {
    let result = new _TextStyle();
    _TextStyle.#booleanNames.forEach((name) => result[name] = this[name]);
    _TextStyle.#stringNames.forEach((name) => result[name] = this[name]);
    _TextStyle.#colorNames.forEach((name) => result[name] = Colors.clone(this[name]));
    result.fontSize = this.fontSize;
    return result;
  }
  equals(other) {
    if (!other)
      return false;
    if (other === this)
      return true;
    for (let name of _TextStyle.#booleanNames)
      if (this[name] !== other[name])
        return false;
    for (let name of _TextStyle.#stringNames)
      if (this[name] !== other[name])
        return false;
    for (let name of _TextStyle.#colorNames)
      if (!Colors.equals(this[name], other[name]))
        return false;
    return this.fontSize === other.fontSize;
  }
  isDefault() {
    return this.equals(_TextStyle.defaults);
  }
  /** Every attribute. */
  toJSON() {
    let result = {};
    _TextStyle.#colorNames.forEach((name) => result[name] = Colors.toJSON(this[name]));
    _TextStyle.#booleanNames.forEach((name) => result[name] = this[name]);
    _TextStyle.#stringNames.forEach((name) => result[name] = this[name]);
    result["fontSize"] = this.fontSize;
    return result;
  }
  /** Only the attributes that differ from a new TextStyle, as written into a style table. */
  toCompactJSON() {
    let defaults = _TextStyle.defaults;
    let result = {};
    _TextStyle.#colorNames.forEach((name) => {
      if (!Colors.equals(this[name], defaults[name]))
        result[name] = Colors.toJSON(this[name]);
    });
    _TextStyle.#booleanNames.forEach((name) => {
      if (this[name] !== defaults[name])
        result[name] = this[name];
    });
    _TextStyle.#stringNames.forEach((name) => {
      if (this[name] !== defaults[name])
        result[name] = this[name];
    });
    if (this.fontSize !== defaults.fontSize)
      result["fontSize"] = this.fontSize;
    return result;
  }
  /** Stable key used to group runs and build style tables. */
  key() {
    return JSON.stringify(this.toCompactJSON());
  }
  /** True when the inline formats that change the element (code, kbd, sup, sub, mark) match. */
  sameInlineFormat(other) {
    return this.code == other.code && this.keyboard == other.keyboard && this.superscript == other.superscript && this.subscript == other.subscript && this.highlight == other.highlight;
  }
  /** CSS used while editing. Default colors are left out so the theme applies. */
  editorCSS() {
    let declarations = [];
    if (this.fontName.length > 0)
      declarations.push(`font-family:${Utilities.fontFamilyCSS(this.fontName)}`);
    if (this.fontSize > 0)
      declarations.push(`font-size:${this.fontSize}px`);
    if (this.bold)
      declarations.push("font-weight:bold");
    if (this.italic)
      declarations.push("font-style:italic");
    if (this.linkURL.length > 0 && this.hasLinkColor) {
      declarations.push(`color:${Colors.toCSS(this.linkColor)}`);
    } else if (!Colors.isEmpty(this.textColor)) {
      declarations.push(`color:${Colors.toCSS(this.textColor)}`);
    }
    if (this.hasBackgroundColor)
      declarations.push(`background-color:${Colors.toCSS(this.backgroundColor)}`);
    if (this.suggestionProviderIdentifier.length > 0) {
      declarations.push(`color:${Colors.toCSS(this.suggestionTextColor)}`);
      declarations.push(`background-color:${Colors.toCSS(this.suggestionBackgroundColor)}`);
      declarations.push(`border:1px solid ${Colors.toCSS(this.suggestionBorderColor)}`);
      declarations.push("border-radius:4px");
      declarations.push("padding:1px 3px");
    }
    let decorations = [];
    if (this.underline || this.change == "insert")
      decorations.push("underline");
    if (this.strikethrough || this.change == "delete")
      decorations.push("line-through");
    if (decorations.length > 0)
      declarations.push(`text-decoration:${decorations.join(" ")}`);
    declarations.push(...this.changeCSS());
    return declarations.join(";");
  }
  /** How a tracked change looks: added text green and underlined, removed text red and struck through. */
  changeCSS() {
    if (this.change == "insert")
      return ["text-decoration-color:#1fa774", "background-color:rgba(31,167,116,0.14)"];
    if (this.change == "delete")
      return ["text-decoration-color:#e03131", "color:#c92a2a", "background-color:rgba(224,49,49,0.10)"];
    return [];
  }
  /** CSS written into exported HTML. */
  htmlCSS() {
    let declarations = [];
    if (this.fontName.toLowerCase() == "system") {
      declarations.push("font-family:sans-serif");
    } else if (this.fontName.length > 0) {
      declarations.push(`font-family:${Utilities.fontFamilyCSS(this.fontName).replace(/"/g, "'")}`);
    }
    if (this.fontSize > 0)
      declarations.push(`font-size:${this.fontSize}px`);
    if (this.bold)
      declarations.push("font-weight:bold");
    if (this.italic)
      declarations.push("font-style:italic");
    let effectiveColor = this.linkURL.length > 0 && this.hasLinkColor ? this.linkColor : this.textColor;
    if (!Colors.isEmpty(effectiveColor))
      declarations.push(`color:${Colors.toCSS(effectiveColor)}`);
    if (this.hasBackgroundColor)
      declarations.push(`background-color:${Colors.toCSS(this.backgroundColor)}`);
    if (this.suggestionProviderIdentifier.length > 0) {
      declarations.push(`color:${Colors.toCSS(this.suggestionTextColor)}`);
      declarations.push(`background-color:${Colors.toCSS(this.suggestionBackgroundColor)}`);
      declarations.push(`border:1px solid ${Colors.toCSS(this.suggestionBorderColor)}`);
      declarations.push("border-radius:4px");
      declarations.push("padding:1px 3px");
    }
    let decorations = [];
    if (this.underline)
      decorations.push("underline");
    if (this.strikethrough)
      decorations.push("line-through");
    if (decorations.length > 0)
      declarations.push(`text-decoration:${decorations.join(" ")}`);
    return declarations.join(";");
  }
};

// fonts.ts
var WebFont = class {
  family;
  faces;
  fallback;
  embed;
  #loaded = [];
  constructor(family, faces, fallback, embed) {
    this.family = family;
    this.faces = faces;
    this.fallback = fallback;
    this.embed = embed;
  }
  /** The font as a CSS font-family value, with its fallback. */
  get css() {
    return Utilities.fontFamilyCSS(this.family);
  }
  /** The faces whose files Word and OpenDocument can store: TrueType and OpenType. */
  get desktopFaces() {
    return this.faces.filter((face) => /^(truetype|opentype)$/.test(WebFonts.format(face)));
  }
  /** Adds the font to a page's fonts, without loading it until text uses it. */
  addTo(target) {
    let FontFaceClass = target.defaultView?.FontFace;
    if (!FontFaceClass || !target.fonts)
      return;
    this.faces.forEach((face) => {
      try {
        let font = new FontFaceClass(this.family, `url(${JSON.stringify(WebFonts.absoluteURL(face.url))}) format(${JSON.stringify(WebFonts.format(face))})`, {
          weight: String(face.weight ?? 400),
          style: face.style || "normal",
          display: "swap",
          ...face.unicodeRange ? { unicodeRange: face.unicodeRange } : {}
        });
        target.fonts.add(font);
        if (target == globalThis.document)
          this.#loaded.push(font);
      } catch {
      }
    });
  }
  /** Removes the font from the page it was added to. */
  removeFromPage() {
    let fonts = globalThis.document?.fonts;
    this.#loaded.forEach((font) => fonts?.delete(font));
    this.#loaded = [];
  }
  /** Loads every face in the page, and resolves whether they all loaded. */
  async load() {
    let results = await Promise.all(this.#loaded.map((font) => font.load().then(() => true, () => false)));
    return results.every((result) => result);
  }
};
var WebFonts = class _WebFonts {
  static #fonts = /* @__PURE__ */ new Map();
  static #bytes = /* @__PURE__ */ new Map();
  /**
   * Registers a font. faces is a file's address, a face, or several, one for each weight and
   * style. Registering a family again replaces it.
   */
  static register(family, faces, options = {}) {
    family = String(family || "").trim();
    if (family.length == 0)
      throw new Error("A web font needs a family name.");
    let list = (Array.isArray(faces) ? faces : [faces]).map((face) => typeof face == "string" ? { url: face } : { ...face }).filter((face) => face.url);
    if (list.length == 0)
      throw new Error(`The font "${family}" needs at least one file.`);
    _WebFonts.remove(family);
    let font = new WebFont(family, list, String(options.fallback || "").trim(), options.embed !== false);
    _WebFonts.#fonts.set(family.toLowerCase(), font);
    Utilities.webFontFallbacks.set(family.toLowerCase(), font.fallback);
    if (options.addToMenu !== false && !FontOptions.defaultFontNames.some((name) => name.toLowerCase() == family.toLowerCase()))
      FontOptions.defaultFontNames.push(family);
    if (typeof document != "undefined")
      font.addTo(document);
    return font;
  }
  /** Removes a registered font from the registry, the page and the Font menu of editors made after this. */
  static remove(family) {
    let key = String(family || "").toLowerCase();
    let font = _WebFonts.#fonts.get(key);
    if (!font)
      return;
    font.removeFromPage();
    _WebFonts.#fonts.delete(key);
    Utilities.webFontFallbacks.delete(key);
    let index = FontOptions.defaultFontNames.findIndex((name) => name.toLowerCase() == key);
    if (index >= 0)
      FontOptions.defaultFontNames.splice(index, 1);
  }
  /** A registered font by its family name, ignoring case, or null. */
  static item(family) {
    return _WebFonts.#fonts.get(String(family || "").toLowerCase()) || null;
  }
  /** Every registered font, in the order registered. */
  static all() {
    return Array.from(_WebFonts.#fonts.values());
  }
  /** The registered fonts a document uses: the editor's font, and any block's or text's. */
  static used(editor) {
    if (_WebFonts.#fonts.size == 0)
      return [];
    let names = /* @__PURE__ */ new Set([String(editor.fontName || "").toLowerCase()]);
    let collect = (value) => {
      if (Array.isArray(value)) {
        value.forEach(collect);
      } else if (value && typeof value == "object") {
        for (let key in value) {
          if (key == "fontName" && typeof value[key] == "string")
            names.add(value[key].toLowerCase());
          else
            collect(value[key]);
        }
      }
    };
    collect(editor.toJSONObject());
    return _WebFonts.all().filter((font) => names.has(font.family.toLowerCase()));
  }
  /** Loads a registered font's files in the page, and resolves whether they all loaded. */
  static async load(family) {
    let font = _WebFonts.item(family);
    return font ? font.load() : false;
  }
  /** @font-face rules for fonts. url gives each file's address in the result; by default its absolute address. */
  static fontFaceCSS(fonts, url = (face) => _WebFonts.absoluteURL(face.url)) {
    return fonts.flatMap((font) => font.faces.map((face) => {
      let declarations = [
        `font-family: ${JSON.stringify(font.family)}`,
        `src: url(${JSON.stringify(url(face, font))}) format(${JSON.stringify(_WebFonts.format(face))})`,
        `font-weight: ${face.weight ?? 400}`,
        `font-style: ${face.style || "normal"}`,
        `font-display: swap`
      ];
      if (face.unicodeRange)
        declarations.push(`unicode-range: ${face.unicodeRange}`);
      return `@font-face { ${declarations.join("; ")} }`;
    })).join("\n");
  }
  /** The font a CSS font-family value names first, or "" for the system font and generic families. */
  static familyName(css) {
    let first = String(css || "").split(",")[0].trim().replace(/^["']|["']$/g, "").trim();
    if (/^(system|system-ui|-apple-system|blinkmacsystemfont|serif|sans-serif|monospace|cursive|fantasy|ui-[a-z-]+|inherit|initial|unset)$/i.test(first))
      return "";
    return first;
  }
  /** A face's format: its own, or read from its address. */
  static format(face) {
    if (face.format)
      return face.format.toLowerCase();
    let extension = (face.url.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i) || ["", ""])[1].toLowerCase();
    return { ttf: "truetype", otf: "opentype", woff: "woff", woff2: "woff2" }[extension] || "woff2";
  }
  /** A face's file extension, from its format. */
  static extension(face) {
    return { truetype: "ttf", opentype: "otf", woff: "woff", woff2: "woff2" }[_WebFonts.format(face)] || "woff2";
  }
  /** A face's media type, as EPUB and OpenDocument packages list it. */
  static mediaType(face) {
    return { truetype: "font/ttf", opentype: "font/otf", woff: "font/woff", woff2: "font/woff2" }[_WebFonts.format(face)] || "font/woff2";
  }
  /** Whether a face is bold: its weight, or the start of its range, is 600 or more. */
  static isBold(face) {
    let weight = String(face.weight ?? 400).trim().toLowerCase();
    if (weight == "bold" || weight == "bolder")
      return true;
    return (parseFloat(weight) || 400) >= 600;
  }
  /** Whether a face is italic or oblique. */
  static isItalic(face) {
    return /italic|oblique/i.test(face.style || "");
  }
  /** An address as an absolute one, against the page's. */
  static absoluteURL(url) {
    try {
      return typeof document != "undefined" ? new URL(url, document.baseURI).href : url;
    } catch {
      return url;
    }
  }
  /** A face's file, fetched once and kept. Rejects when it can't be fetched. */
  static bytes(face) {
    let url = _WebFonts.absoluteURL(face.url);
    if (!_WebFonts.#bytes.has(url)) {
      let request = fetch(url).then((response) => {
        if (!response.ok)
          throw new Error(`${url}: ${response.status}`);
        return response.arrayBuffer();
      }).then((buffer) => new Uint8Array(buffer));
      request.catch(() => _WebFonts.#bytes.delete(url));
      _WebFonts.#bytes.set(url, request);
    }
    return _WebFonts.#bytes.get(url);
  }
  /** Loads the fonts a page's text uses, such as a printing frame's, and resolves when they're ready, or after timeout milliseconds. */
  static async settle(target, timeout = 3e3) {
    let fonts = target.fonts;
    if (!fonts)
      return;
    let loads = [];
    fonts.forEach((font) => {
      if (font.status == "unloaded")
        loads.push(font.load().catch(() => null));
    });
    await Promise.race([Promise.all(loads).then(() => fonts.ready), new Promise((resolve) => setTimeout(resolve, timeout))]);
  }
};

// richtext.ts
var BackgroundFills = /* @__PURE__ */ ((BackgroundFills2) => {
  BackgroundFills2[BackgroundFills2["actualSize"] = 0] = "actualSize";
  BackgroundFills2[BackgroundFills2["stretch"] = 1] = "stretch";
  BackgroundFills2[BackgroundFills2["fit"] = 2] = "fit";
  BackgroundFills2[BackgroundFills2["fill"] = 3] = "fill";
  return BackgroundFills2;
})(BackgroundFills || {});
var BackgroundRepeats = /* @__PURE__ */ ((BackgroundRepeats2) => {
  BackgroundRepeats2[BackgroundRepeats2["noRepeat"] = 0] = "noRepeat";
  BackgroundRepeats2[BackgroundRepeats2["repeatX"] = 1] = "repeatX";
  BackgroundRepeats2[BackgroundRepeats2["repeatY"] = 2] = "repeatY";
  BackgroundRepeats2[BackgroundRepeats2["repeat"] = 3] = "repeat";
  return BackgroundRepeats2;
})(BackgroundRepeats || {});
var BackgroundImage = class _BackgroundImage {
  /** A data: URI or an http(s) URL. Empty when there is no image. */
  source = "";
  fill = 3 /* fill */;
  repeat = 0 /* noRepeat */;
  static fromJSON(data) {
    let result = new _BackgroundImage();
    if (typeof data == "string") {
      result.source = data;
    } else if (data && typeof data == "object") {
      result.source = Utilities.string(data.source);
      result.fill = Utilities.clamp(Utilities.integer(data.fill, 3 /* fill */), 0, 3);
      result.repeat = Utilities.clamp(Utilities.integer(data.repeat, 0 /* noRepeat */), 0, 3);
    }
    return result;
  }
  toJSON() {
    let result = { source: this.source };
    if (this.fill != 3 /* fill */)
      result["fill"] = this.fill;
    if (this.repeat != 0 /* noRepeat */)
      result["repeat"] = this.repeat;
    return result;
  }
  clone() {
    return _BackgroundImage.fromJSON(this.toJSON());
  }
  get isEmpty() {
    return this.source.length == 0;
  }
  clear() {
    this.source = "";
    this.fill = 3 /* fill */;
    this.repeat = 0 /* noRepeat */;
  }
  toCSS() {
    if (this.isEmpty)
      return "";
    let size = "auto";
    switch (this.fill) {
      case 1 /* stretch */:
        size = "100% 100%";
        break;
      case 2 /* fit */:
        size = "contain";
        break;
      case 3 /* fill */:
        size = "cover";
        break;
    }
    let repeat = "no-repeat";
    switch (this.repeat) {
      case 1 /* repeatX */:
        repeat = "repeat-x";
        break;
      case 2 /* repeatY */:
        repeat = "repeat-y";
        break;
      case 3 /* repeat */:
        repeat = "repeat";
        break;
    }
    return `background-image:url('${this.source.replace(/'/g, "%27").replace(/"/g, "%22")}');background-size:${size};background-repeat:${repeat};background-position:center`;
  }
  /** Reads background-image, background-size and background-repeat from a style into an image. */
  static applyCSS(image, style) {
    if (!image || !style)
      return;
    let source = style.backgroundImage.trim();
    let match = source.match(/^url\(\s*(['"]?)(.*)\1\s*\)$/i);
    if (match)
      image.source = match[2];
    switch (style.backgroundSize.trim().toLowerCase().replace(/\s+/g, "")) {
      case "cover":
        image.fill = 3 /* fill */;
        break;
      case "contain":
        image.fill = 2 /* fit */;
        break;
      case "100%100%":
        image.fill = 1 /* stretch */;
        break;
      case "auto":
        image.fill = 0 /* actualSize */;
        break;
    }
    switch (style.backgroundRepeat.trim().toLowerCase()) {
      case "repeat-x":
        image.repeat = 1 /* repeatX */;
        break;
      case "repeat-y":
        image.repeat = 2 /* repeatY */;
        break;
      case "repeat":
        image.repeat = 3 /* repeat */;
        break;
      case "no-repeat":
        image.repeat = 0 /* noRepeat */;
        break;
    }
  }
};
var RichText = class _RichText {
  text = "";
  styles = [];
  alertType = 0;
  headingLevel = 0;
  textAlignment = 0 /* automatic */;
  listType = 0;
  verticalAlignment = 0;
  hasCellBackgroundColor = false;
  cellBackgroundColor = Colors.empty;
  cellBorderTop = _RichText.defaultBorder();
  cellBorderRight = _RichText.defaultBorder();
  cellBorderBottom = _RichText.defaultBorder();
  cellBorderLeft = _RichText.defaultBorder();
  columnSpan = 1;
  rowSpan = 1;
  backgroundImage = new BackgroundImage();
  listLevels = [];
  listChecked = [];
  /** Nodes embedded in this text's container, such as the blocks inside a table cell or a column. */
  nodes = [];
  constructor(text = "", style) {
    this.text = text;
    for (let index = 0; index < text.length; index++)
      this.styles.push(style ? style.clone() : new TextStyle());
  }
  static defaultBorder() {
    return { visible: false, size: 1, color: Colors.empty };
  }
  get length() {
    return this.text.length;
  }
  /** Restores a snapshot. nodeFactory builds embedded nodes from their JSON. */
  static fromJSON(data, nodeFactory) {
    let result = new _RichText();
    if (!data || typeof data != "object")
      return result;
    result.text = Utilities.string(data.text);
    result.alertType = Utilities.integer(data.alertType, 0);
    result.headingLevel = Utilities.integer(data.headingLevel, 0);
    result.listType = Utilities.integer(data.listType, 0);
    result.verticalAlignment = Utilities.integer(data.verticalAlignment, 0);
    result.textAlignment = 0 /* automatic */;
    if ("textAlignment" in data) {
      let value = Utilities.integer(data.textAlignment, 0);
      if (value >= 0 && value <= 3)
        result.textAlignment = value;
    } else {
      switch (Utilities.integer(data.horizontalAlignment, 0)) {
        case 1:
          result.textAlignment = 2 /* middle */;
          break;
        case 2:
          result.textAlignment = 3 /* trailing */;
          break;
      }
    }
    result.hasCellBackgroundColor = Utilities.boolean(data.hasCellBackgroundColor, false);
    result.cellBackgroundColor = Colors.fromJSON(data.cellBackgroundColor, Colors.empty);
    let sides = ["Top", "Right", "Bottom", "Left"];
    sides.forEach((side) => {
      result[`cellBorder${side}`] = {
        visible: Utilities.boolean(data[`cellBorder${side}Visible`], false),
        size: Math.max(0, Utilities.number(data[`cellBorder${side}Size`], 1)),
        color: Colors.fromJSON(data[`cellBorder${side}Color`], Colors.empty)
      };
    });
    result.columnSpan = Math.max(1, Utilities.integer(data.columnSpan, 1));
    result.rowSpan = Math.max(1, Utilities.integer(data.rowSpan, 1));
    if (data.backgroundImage)
      result.backgroundImage = BackgroundImage.fromJSON(data.backgroundImage);
    let characterStyles = [];
    let characterCount = CodePoints.count(result.text);
    if (Array.isArray(data.styleRuns)) {
      let prototypes = [];
      if (Array.isArray(data.styleTable))
        data.styleTable.forEach((item) => prototypes.push(TextStyle.fromJSON(item)));
      let runs = data.styleRuns;
      for (let runIndex = 0; runIndex + 1 < runs.length && characterStyles.length < characterCount; runIndex += 2) {
        let runLength = Math.min(Utilities.integer(runs[runIndex], 0), characterCount - characterStyles.length);
        let styleIndex = Utilities.integer(runs[runIndex + 1], -1);
        let prototype = styleIndex >= 0 && styleIndex < prototypes.length ? prototypes[styleIndex] : new TextStyle();
        for (let unit = 0; unit < runLength; unit++)
          characterStyles.push(prototype.clone());
      }
    } else if (Array.isArray(data.styles)) {
      data.styles.forEach((item) => characterStyles.push(TextStyle.fromJSON(item)));
    }
    while (characterStyles.length < characterCount)
      characterStyles.push(new TextStyle());
    result.styles = [];
    let character = 0;
    for (let index = 0; index < result.text.length; index++) {
      let style = characterStyles[character] || new TextStyle();
      result.styles.push(style);
      if (CodePoints.widthAt(result.text, index) == 2) {
        result.styles.push(style.clone());
        index++;
      }
      character++;
    }
    if (Array.isArray(data.listLevels))
      result.listLevels = data.listLevels.map((value) => Math.max(0, Utilities.integer(value, 0)));
    if (Array.isArray(data.listChecked))
      result.listChecked = data.listChecked.map((value) => Utilities.boolean(value, false));
    if (Array.isArray(data.nodes) && nodeFactory) {
      data.nodes.forEach((item) => {
        let node = nodeFactory(item);
        if (node)
          result.nodes.push(node);
      });
    }
    return result;
  }
  toJSON() {
    let result = {};
    if (this.text.length > 0)
      result["text"] = this.text;
    if (this.alertType != 0)
      result["alertType"] = this.alertType;
    if (this.headingLevel != 0)
      result["headingLevel"] = this.headingLevel;
    if (this.textAlignment != 0 /* automatic */)
      result["textAlignment"] = this.textAlignment;
    if (this.listType != 0)
      result["listType"] = this.listType;
    if (this.verticalAlignment != 0)
      result["verticalAlignment"] = this.verticalAlignment;
    if (this.hasCellBackgroundColor)
      result["hasCellBackgroundColor"] = true;
    if (!Colors.isEmpty(this.cellBackgroundColor))
      result["cellBackgroundColor"] = Colors.toJSON(this.cellBackgroundColor);
    let sides = ["Top", "Right", "Bottom", "Left"];
    sides.forEach((side) => {
      let border = this[`cellBorder${side}`];
      if (border.visible)
        result[`cellBorder${side}Visible`] = true;
      if (border.size != 1)
        result[`cellBorder${side}Size`] = border.size;
      if (!Colors.isEmpty(border.color))
        result[`cellBorder${side}Color`] = Colors.toJSON(border.color);
    });
    if (this.columnSpan > 1)
      result["columnSpan"] = this.columnSpan;
    if (this.rowSpan > 1)
      result["rowSpan"] = this.rowSpan;
    if (!this.backgroundImage.isEmpty)
      result["backgroundImage"] = this.backgroundImage.toJSON();
    let table = [];
    let tableKeys = [];
    let runs = [];
    let runKey = null;
    let runLength = 0;
    let runIndex = -1;
    for (let index = 0; index < this.text.length; index++) {
      let style = this.styles[index] || TextStyle.defaults;
      let width = CodePoints.widthAt(this.text, index);
      let key = style.key();
      if (runKey !== null && key == runKey) {
        runLength++;
      } else {
        if (runKey !== null)
          runs.push(runLength, runIndex);
        runIndex = tableKeys.indexOf(key);
        if (runIndex < 0) {
          table.push(style);
          tableKeys.push(key);
          runIndex = table.length - 1;
        }
        runKey = key;
        runLength = 1;
      }
      index += width - 1;
    }
    if (runKey !== null)
      runs.push(runLength, runIndex);
    if (!(table.length == 0 || table.length == 1 && table[0].isDefault())) {
      result["styleTable"] = table.map((style) => style.toCompactJSON());
      result["styleRuns"] = runs;
    }
    if (this.listLevels.length > 0)
      result["listLevels"] = this.listLevels.slice();
    if (this.listChecked.indexOf(true) >= 0)
      result["listChecked"] = this.listChecked.slice();
    if (this.nodes.length > 0)
      result["nodes"] = this.nodes.map((node) => node.toJSON());
    return result;
  }
  /** Copies the text, styles and container state. Embedded nodes are not copied. */
  clone() {
    let result = new _RichText();
    result.copyStateFrom(this);
    result.text = this.text;
    result.styles = this.styles.map((style) => style.clone());
    result.listLevels = this.listLevels.slice();
    result.listChecked = this.listChecked.slice();
    return result;
  }
  /** Copies container state (alignment, cell appearance, spans) but not the text. */
  copyStateFrom(other) {
    this.alertType = other.alertType;
    this.headingLevel = other.headingLevel;
    this.textAlignment = other.textAlignment;
    this.listType = other.listType;
    this.verticalAlignment = other.verticalAlignment;
    this.hasCellBackgroundColor = other.hasCellBackgroundColor;
    this.cellBackgroundColor = Colors.clone(other.cellBackgroundColor);
    let sides = ["Top", "Right", "Bottom", "Left"];
    sides.forEach((side) => {
      let border = other[`cellBorder${side}`];
      this[`cellBorder${side}`] = { visible: border.visible, size: border.size, color: Colors.clone(border.color) };
    });
    this.columnSpan = other.columnSpan;
    this.rowSpan = other.rowSpan;
    this.backgroundImage = other.backgroundImage.clone();
  }
  styleAt(index) {
    if (this.styles.length == 0)
      return new TextStyle();
    index = Utilities.clamp(index, 0, this.styles.length - 1);
    return this.styles[index];
  }
  /** The style typing at the offset would receive: the previous character's, without link or tag. */
  insertionStyleAt(offset) {
    if (this.text.length == 0)
      return new TextStyle();
    let style = this.styleAt(offset > 0 ? offset - 1 : 0).clone();
    return style;
  }
  /** Returns the text and styles from start through end (exclusive). */
  slice(start, end = this.text.length) {
    start = Utilities.clamp(start, 0, this.text.length);
    end = Utilities.clamp(end, start, this.text.length);
    let result = new _RichText();
    result.text = this.text.substring(start, end);
    result.styles = this.styles.slice(start, end).map((style) => style.clone());
    return result;
  }
  insert(offset, value, style) {
    offset = Utilities.clamp(offset, 0, this.text.length);
    if (value instanceof _RichText) {
      this.text = this.text.substring(0, offset) + value.text + this.text.substring(offset);
      this.styles.splice(offset, 0, ...value.styles.map((item) => item.clone()));
      return;
    }
    if (value.length == 0)
      return;
    let insertStyle = style || this.insertionStyleAt(offset);
    let added = [];
    for (let index = 0; index < value.length; index++)
      added.push(insertStyle.clone());
    this.text = this.text.substring(0, offset) + value + this.text.substring(offset);
    this.styles.splice(offset, 0, ...added);
  }
  remove(start, end) {
    start = Utilities.clamp(start, 0, this.text.length);
    end = Utilities.clamp(end, start, this.text.length);
    if (end == start)
      return;
    this.text = this.text.substring(0, start) + this.text.substring(end);
    this.styles.splice(start, end - start);
  }
  append(other) {
    this.insert(this.text.length, other);
  }
  /** Calls change for the style of each character from start through end (exclusive). */
  applyStyle(start, end, change) {
    start = Utilities.clamp(start, 0, this.text.length);
    end = Utilities.clamp(end, start, this.text.length);
    for (let index = start; index < end; index++) {
      if (this.text[index] == ParagraphBreak)
        continue;
      change(this.styles[index]);
    }
  }
  /** True when test returns true for every non-break character in the range. */
  everyStyle(start, end, test) {
    let checked = 0;
    for (let index = start; index < end; index++) {
      if (this.text[index] == ParagraphBreak || this.text[index] == LineBreak)
        continue;
      checked++;
      if (!test(this.styleAt(index)))
        return false;
    }
    return checked > 0;
  }
  /** Groups consecutive characters with equal styles. */
  runs(start = 0, end = this.text.length, matches) {
    start = Utilities.clamp(start, 0, this.text.length);
    end = Utilities.clamp(end, start, this.text.length);
    let compare = matches || ((a, b) => a.equals(b));
    let result = [];
    let current = null;
    for (let index = start; index < end; index++) {
      let style = this.styleAt(index);
      if (current && compare(current.style, style)) {
        current.length++;
      } else {
        current = { start: index, length: 1, text: "", style };
        result.push(current);
      }
    }
    result.forEach((run) => run.text = this.text.substring(run.start, run.start + run.length));
    return result;
  }
  /** Character offsets where each paragraph (list item, code line) starts and ends. */
  paragraphs() {
    let result = [];
    let start = 0;
    for (let index = 0; index < this.text.length; index++) {
      if (this.text[index] == ParagraphBreak) {
        result.push({ start, end: index });
        start = index + 1;
      }
    }
    result.push({ start, end: this.text.length });
    return result;
  }
  paragraphIndexAt(offset) {
    let result = 0;
    for (let index = 0; index < offset && index < this.text.length; index++) {
      if (this.text[index] == ParagraphBreak)
        result++;
    }
    return result;
  }
  /** Exported HTML for the range. Paragraph and line breaks become br elements. */
  htmlText(start = 0, end = this.text.length) {
    let result = "";
    let pieces = this.runs(start, end);
    pieces.forEach((run) => {
      let segments = run.text.split(/\r\n|[\n\r\u2028]/);
      segments.forEach((segment, index) => {
        if (index > 0)
          result += "<br>";
        result += _RichText.htmlRun(segment, run.style);
      });
    });
    return result;
  }
  /** How tags from one suggestion provider are exported, set by an add-on with registerTagExport. */
  static #tagExports = {};
  /**
   * Exports one provider's tags differently from the default span, such as footnote references
   * as links to their notes. Each function receives the tag's text, its suggestion identifier
   * and its style, and returns HTML or Markdown.
   */
  static registerTagExport(provider, exporter) {
    if (exporter)
      _RichText.#tagExports[provider] = exporter;
    else
      delete _RichText.#tagExports[provider];
  }
  static tagExport(provider) {
    return provider.length > 0 ? _RichText.#tagExports[provider] || null : null;
  }
  static htmlRun(value, style) {
    if (value.length == 0)
      return "";
    let custom = _RichText.tagExport(style.suggestionProviderIdentifier);
    if (custom && custom.html)
      return custom.html(value, style.suggestionIdentifier, style);
    let content = Utilities.escapeText(value);
    let suggestionAttributes = "";
    if (style.suggestionProviderIdentifier.length > 0)
      suggestionAttributes = ` data-scriviamo-suggestion-provider="${Utilities.escapeAttribute(style.suggestionProviderIdentifier)}" data-scriviamo-suggestion-id="${Utilities.escapeAttribute(style.suggestionIdentifier)}"`;
    if (style.code)
      content = `<code>${content}</code>`;
    if (style.keyboard)
      content = `<kbd>${content}</kbd>`;
    if (style.superscript)
      content = `<sup>${content}</sup>`;
    if (style.subscript)
      content = `<sub>${content}</sub>`;
    if (style.highlight)
      content = `<mark>${content}</mark>`;
    let css = style.htmlCSS();
    if (css.length > 0 || suggestionAttributes.length > 0)
      content = `<span${suggestionAttributes}${css.length > 0 ? ` style="${Utilities.escapeAttribute(css)}"` : ""}>${content}</span>`;
    if (style.linkURL.length > 0) {
      let title = style.linkTitle.length > 0 ? ` title="${Utilities.escapeAttribute(style.linkTitle)}"` : "";
      let target = style.linkTarget.length > 0 ? ` target="${Utilities.escapeAttribute(style.linkTarget)}"` : "";
      content = `<a href="${Utilities.escapeAttribute(style.linkURL)}"${title}${target}>${content}</a>`;
    }
    return _RichText.changeHTML(content, style);
  }
  /** A tracked change as an <ins> or <del> element around content, which imports back as the change. */
  static changeHTML(content, style) {
    if (style.change != "insert" && style.change != "delete")
      return content;
    let tag = style.change == "insert" ? "ins" : "del";
    let time = style.changeTime.length > 0 ? ` datetime="${Utilities.escapeAttribute(style.changeTime)}"` : "";
    return `<${tag} data-scriviamo-change="${Utilities.escapeAttribute(style.changeID)}" data-scriviamo-author="${Utilities.escapeAttribute(style.changeAuthor)}"${time}>${content}</${tag}>`;
  }
  /** Markdown for the range. */
  markdownText(start = 0, end = this.text.length, ignoreBold = false) {
    let result = "";
    let markdownMatches = (a, b) => {
      return (ignoreBold || a.bold == b.bold) && a.italic == b.italic && a.underline == b.underline && a.strikethrough == b.strikethrough && a.sameInlineFormat(b) && a.linkURL == b.linkURL && a.linkTitle == b.linkTitle && a.linkTarget == b.linkTarget && a.suggestionProviderIdentifier == b.suggestionProviderIdentifier && a.suggestionIdentifier == b.suggestionIdentifier && a.change == b.change && a.changeID == b.changeID;
    };
    this.runs(start, end, markdownMatches).forEach((run) => {
      let style = run.style;
      let raw = run.text;
      let custom = _RichText.tagExport(style.suggestionProviderIdentifier);
      if (custom && custom.markdown) {
        result += custom.markdown(raw, style.suggestionIdentifier, style);
        return;
      }
      let content = _RichText.markdownEscape(raw).replace(/\u2028/g, "  \n");
      if (style.code)
        content = _RichText.markdownCodeSpan(raw);
      if (style.keyboard)
        content = `<kbd>${content}</kbd>`;
      if (style.superscript)
        content = `<sup>${content}</sup>`;
      if (style.subscript)
        content = `<sub>${content}</sub>`;
      if (style.highlight)
        content = `<mark>${content}</mark>`;
      if (style.underline)
        content = `<u>${content}</u>`;
      if (style.strikethrough)
        content = `~~${content}~~`;
      if (style.italic)
        content = `_${content}_`;
      if (style.bold && !ignoreBold)
        content = `**${content}**`;
      if (style.suggestionProviderIdentifier.length > 0) {
        let css = `color:${Colors.toCSS(style.suggestionTextColor)};background-color:${Colors.toCSS(style.suggestionBackgroundColor)};border:1px solid ${Colors.toCSS(style.suggestionBorderColor)}`;
        content = `<span data-scriviamo-suggestion-provider="${Utilities.escapeAttribute(style.suggestionProviderIdentifier)}" data-scriviamo-suggestion-id="${Utilities.escapeAttribute(style.suggestionIdentifier)}" style="${Utilities.escapeAttribute(css)}">${content}</span>`;
      }
      if (style.linkURL.length > 0) {
        if (style.linkTarget.length > 0) {
          let title = style.linkTitle.length > 0 ? ` title="${Utilities.escapeAttribute(style.linkTitle)}"` : "";
          content = `<a href="${Utilities.escapeAttribute(style.linkURL)}" target="${Utilities.escapeAttribute(style.linkTarget)}"${title}>${content}</a>`;
        } else {
          let title = style.linkTitle.length > 0 ? ` "${style.linkTitle.replace(/"/g, '\\"')}"` : "";
          content = `[${content}](${style.linkURL.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29")}${title})`;
        }
      }
      result += _RichText.changeHTML(content, style);
    });
    return result;
  }
  static markdownEscape(value) {
    return value.replace(/([\\`*_\[\]<>~|])/g, "\\$1").replace(/^(\s*)([#>+-])/gm, "$1\\$2").replace(/^(\s*\d+)\./gm, "$1\\.");
  }
  static markdownCodeSpan(value) {
    let longest = 0;
    let matches = value.match(/`+/g);
    if (matches)
      matches.forEach((item) => longest = Math.max(longest, item.length));
    let fence = "`".repeat(longest + 1);
    let padding = value.startsWith("`") || value.endsWith("`") ? " " : "";
    return `${fence}${padding}${value}${padding}${fence}`;
  }
};

// texthost.ts
var TextHostModes = /* @__PURE__ */ ((TextHostModes2) => {
  TextHostModes2[TextHostModes2["inline"] = 0] = "inline";
  TextHostModes2[TextHostModes2["multiline"] = 1] = "multiline";
  TextHostModes2[TextHostModes2["list"] = 2] = "list";
  TextHostModes2[TextHostModes2["plain"] = 3] = "plain";
  return TextHostModes2;
})(TextHostModes || {});
var TextHost = class _TextHost {
  node;
  rich;
  element;
  mode;
  placeholder = "";
  /** Position of this host among its node's hosts. Used to restore selections. */
  index = 0;
  #renderedStyles = [];
  /** How an add-on draws one provider's tags in the editor; see registerTagRenderer. */
  static #tagRenderers = {};
  /**
   * Draws one provider's tags differently from text, such as a formula drawn from its source. The
   * renderer receives each tag's elements after the text is drawn: usually one span, or several
   * when formatting splits the tag. It may add elements with the class "scv-widget", which aren't
   * part of the text. A tag made contenteditable="false" is one unit for the caret.
   */
  static registerTagRenderer(provider, renderer) {
    if (renderer)
      _TextHost.#tagRenderers[provider] = renderer;
    else
      delete _TextHost.#tagRenderers[provider];
  }
  #renderTags() {
    let providers = Object.keys(_TextHost.#tagRenderers);
    if (providers.length == 0)
      return;
    let spans = Array.from(this.element.querySelectorAll("span[data-scv-tag]"));
    let groups = [];
    spans.forEach((span) => {
      let provider = span.dataset.scvTag || "";
      if (!_TextHost.#tagRenderers[provider])
        return;
      let group = groups[groups.length - 1];
      let last = group ? group[group.length - 1] : null;
      let outer = (element) => element.parentElement && element.parentElement.tagName == "A" ? element.parentElement : element;
      if (last && last.dataset.scvTag == provider && (last.dataset.scvTagId || "") == (span.dataset.scvTagId || "") && outer(last).nextSibling === outer(span))
        group.push(span);
      else
        groups.push([span]);
    });
    groups.forEach((group) => {
      let renderer = _TextHost.#tagRenderers[group[0].dataset.scvTag || ""];
      try {
        renderer(group, this);
      } catch (error) {
        console.error(error);
      }
    });
  }
  constructor(node, rich, element, mode = 0 /* inline */) {
    this.node = node;
    this.rich = rich;
    this.element = element;
    this.mode = mode;
    element.classList.add("scv-text");
    element.setAttribute("spellcheck", mode == 3 /* plain */ ? "false" : "true");
    element.scvHost = this;
  }
  static from(target, root) {
    let current = target;
    while (current && current !== root) {
      if (current.scvHost)
        return current.scvHost;
      current = current.parentNode;
    }
    return null;
  }
  set editable(value) {
    this.element.contentEditable = value ? "true" : "false";
  }
  get editable() {
    return this.element.isContentEditable;
  }
  // Rendering
  render() {
    let element = this.element;
    element.textContent = "";
    this.#renderedStyles = [];
    if (this.mode == 3 /* plain */) {
      element.append(document.createTextNode(this.rich.text));
      if (this.rich.text.length == 0 || this.rich.text.endsWith(ParagraphBreak))
        element.append(document.createElement("br"));
    } else if (this.mode == 2 /* list */) {
      let paragraphs = this.rich.paragraphs();
      paragraphs.forEach((paragraph, itemIndex) => {
        let item = document.createElement("li");
        item.dataset.level = String(this.rich.listLevels[itemIndex] || 0);
        if (this.rich.listType == 2) {
          let checked = this.rich.listChecked[itemIndex] === true;
          item.dataset.checked = checked ? "true" : "false";
          let widget = Utilities.element("span", "scv-widget scv-check", { contenteditable: "false" });
          let box = Utilities.element("input", "form-check-input", { type: "checkbox", tabindex: "-1" });
          box.checked = checked;
          let label = this.rich.text.substring(paragraph.start, paragraph.end).replace(/[\u2028\u2029\n]+/g, " ").trim();
          box.setAttribute("aria-label", label.length > 0 ? label.substring(0, 120) : this.node.strings.TextChecklistCaption);
          widget.append(box);
          item.append(widget);
        }
        this.#appendRuns(item, paragraph.start, paragraph.end);
        element.append(item);
      });
      this.refreshMarkers();
    } else {
      this.#appendRuns(element, 0, this.rich.text.length);
    }
    this.#renderTags();
    this.updateEmptyState();
  }
  #appendRuns(target, start, end) {
    let runs = this.rich.runs(start, end);
    runs.forEach((run) => {
      let parts = run.text.split(/([\n\u2028])/);
      parts.forEach((part) => {
        if (part == ParagraphBreak) {
          let br = document.createElement("br");
          br.dataset.p = "1";
          target.append(br);
        } else if (part == LineBreak) {
          target.append(document.createElement("br"));
        } else if (part.length > 0) {
          target.append(this.#runElement(part, run.style));
        }
      });
    });
    let last = end > start ? this.rich.text[end - 1] : "";
    if (end == start || last == LineBreak || last == ParagraphBreak)
      target.append(document.createElement("br"));
  }
  #runElement(text, style) {
    let styleIndex = this.#renderedStyles.indexOf(style);
    if (styleIndex < 0) {
      this.#renderedStyles.push(style);
      styleIndex = this.#renderedStyles.length - 1;
    }
    let span = document.createElement("span");
    span.dataset.s = String(styleIndex);
    let css = style.editorCSS();
    if (css.length > 0)
      span.setAttribute("style", css);
    if (style.suggestionProviderIdentifier.length > 0) {
      span.dataset.scvTag = style.suggestionProviderIdentifier;
      if (style.suggestionIdentifier.length > 0)
        span.dataset.scvTagId = style.suggestionIdentifier;
    }
    let inner = span;
    let wrap = (tag) => {
      let element = document.createElement(tag);
      inner.append(element);
      inner = element;
    };
    if (style.highlight)
      wrap("mark");
    if (style.subscript)
      wrap("sub");
    if (style.superscript)
      wrap("sup");
    if (style.keyboard)
      wrap("kbd");
    if (style.code)
      wrap("code");
    inner.append(document.createTextNode(text));
    if (style.linkURL.length > 0) {
      let link = document.createElement("a");
      link.href = style.linkURL;
      if (style.linkTitle.length > 0)
        link.title = style.linkTitle;
      link.append(span);
      return link;
    }
    return span;
  }
  /** Updates ordered and bulleted list markers after items were added, removed or re-leveled. */
  refreshMarkers() {
    if (this.mode != 2 /* list */)
      return;
    let counters = [];
    let bullets = ["\u2022", "\u25E6", "\u25AA"];
    Array.from(this.element.children).forEach((child) => {
      if (child.tagName != "LI")
        return;
      let level = Utilities.integer(child.dataset.level, 0);
      child.style.setProperty("--scv-level", String(level));
      while (counters.length <= level)
        counters.push(0);
      counters[level]++;
      counters.length = level + 1;
      if (this.rich.listType == 1) {
        let number = counters[level];
        let marker = String(number);
        if (level % 3 == 1)
          marker = _TextHost.alphabetic(number);
        if (level % 3 == 2)
          marker = _TextHost.roman(number);
        child.dataset.marker = `${marker}.`;
      } else if (this.rich.listType == 0) {
        child.dataset.marker = bullets[level % bullets.length];
      } else {
        delete child.dataset.marker;
      }
    });
  }
  static alphabetic(value) {
    let result = "";
    while (value > 0) {
      value--;
      result = String.fromCharCode(97 + value % 26) + result;
      value = Math.floor(value / 26);
    }
    return result;
  }
  static roman(value) {
    let numerals = [[1e3, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
    let result = "";
    numerals.forEach(([amount, numeral]) => {
      while (value >= amount) {
        result += numeral;
        value -= amount;
      }
    });
    return result;
  }
  updateEmptyState() {
    let empty = this.rich.text.length == 0;
    this.element.classList.toggle("scv-empty", empty);
    if (this.placeholder.length > 0) {
      this.element.dataset.placeholder = this.placeholder;
    } else {
      delete this.element.dataset.placeholder;
    }
  }
  // Reading the DOM
  /** Reads the edited DOM into the RichText. Returns true when the text or styles changed. */
  sync() {
    let segments = this.#segments(this.element, false);
    let text = "";
    let styles = [];
    segments.forEach((segment) => {
      text += segment.text;
      for (let index = 0; index < segment.text.length; index++) {
        styles.push(segment.style ? segment.style.clone() : new TextStyle());
      }
    });
    let changed = text != this.rich.text || styles.length != this.rich.styles.length || styles.some((style, index) => !style.equals(this.rich.styles[index]));
    if (this.mode == 2 /* list */) {
      let items = Array.from(this.element.children).filter((child) => child.tagName == "LI");
      let levels = items.map((item) => Utilities.integer(item.dataset.level, 0));
      let checked = items.map((item) => item.dataset.checked == "true");
      let itemCount = text.split(ParagraphBreak).length;
      while (levels.length < itemCount)
        levels.push(levels.length > 0 ? levels[levels.length - 1] : 0);
      while (checked.length < itemCount)
        checked.push(false);
      levels.length = itemCount;
      checked.length = itemCount;
      let previousItems = this.rich.text.split(ParagraphBreak);
      let itemTexts = text.split(ParagraphBreak);
      if (this.rich.listType == 2 && itemTexts.length == previousItems.length + 1) {
        let split = 0;
        while (split < previousItems.length && previousItems[split] == itemTexts[split])
          split++;
        if (split < previousItems.length) {
          let state = this.rich.listChecked[split] === true;
          checked[split] = itemTexts[split].length == 0 ? false : state;
          checked[split + 1] = itemTexts[split].length == 0 ? state : false;
        } else {
          checked[split] = false;
        }
        items.forEach((item, index) => {
          item.dataset.checked = checked[index] ? "true" : "false";
          let box = item.querySelector(".scv-check input");
          if (box)
            box.checked = checked[index];
        });
      }
      if (levels.join(",") != this.rich.listLevels.join(",") || checked.join(",") != this.rich.listChecked.join(","))
        changed = true;
      this.rich.listLevels = levels;
      this.rich.listChecked = this.rich.listType == 2 ? checked : [];
    }
    if (this.mode == 3 /* plain */)
      styles = styles.map(() => new TextStyle());
    this.rich.text = text;
    this.rich.styles = styles;
    if (this.mode == 2 /* list */ && Array.from(this.element.childNodes).some((child) => !(child instanceof HTMLElement && child.tagName == "LI"))) {
      let selection = this.selection();
      this.render();
      if (selection)
        this.select(selection.start, selection.end);
    } else if (this.mode == 2 /* list */) {
      this.refreshMarkers();
    }
    this.updateEmptyState();
    return changed;
  }
  #segments(root, measuring) {
    let result = [];
    let styleFor = (node) => this.#styleFor(node);
    let plain = this.mode == 3 /* plain */;
    let breakCharacter = this.mode == 0 /* inline */ ? LineBreak : ParagraphBreak;
    let walk = (parent, scopeStart) => {
      parent.childNodes.forEach((child) => {
        if (child.nodeType == 3) {
          let value = (child.nodeValue || "").replace(/\r\n?/g, "\n").replace(/ /g, " ");
          if (!plain)
            value = value.replace(/\n/g, breakCharacter);
          if (value.length > 0)
            result.push({ node: child, text: value, style: plain ? null : styleFor(child), isBreak: false });
          return;
        }
        if (!(child instanceof HTMLElement))
          return;
        if (child.classList.contains("scv-widget"))
          return;
        if (child.tagName == "BR") {
          let character = plain ? ParagraphBreak : child.dataset.p == "1" ? ParagraphBreak : this.mode == 1 /* multiline */ ? ParagraphBreak : LineBreak;
          if (this.mode == 2 /* list */)
            character = LineBreak;
          result.push({ node: child, text: character, style: plain ? null : styleFor(child.parentNode), isBreak: true });
          return;
        }
        let isBlock = /^(DIV|P|LI|H[1-6]|BLOCKQUOTE|PRE)$/.test(child.tagName);
        if (isBlock && result.length > scopeStart && !result[result.length - 1].isBreak) {
          result.push({ node: child, text: plain ? ParagraphBreak : breakCharacter, style: plain ? null : styleFor(child), isBreak: true });
        }
        walk(child, scopeStart);
      });
    };
    let dropPlaceholder = (scopeStart) => {
      if (measuring || result.length <= scopeStart)
        return;
      let last = result[result.length - 1];
      if (last.isBreak && last.node instanceof HTMLElement && last.node.tagName == "BR")
        result.pop();
    };
    if (this.mode == 2 /* list */) {
      let itemIndex = 0;
      root.childNodes.forEach((child) => {
        if (child instanceof HTMLElement && child.tagName == "LI") {
          if (itemIndex > 0)
            result.push({ node: child, text: ParagraphBreak, style: null, isBreak: false });
          let scopeStart = result.length;
          walk(child, scopeStart);
          dropPlaceholder(scopeStart);
          itemIndex++;
        } else if (child.nodeType == 3 || child instanceof HTMLElement) {
          let holder = document.createElement("div");
          holder.append(child.cloneNode(true));
          let before = result.length;
          walk(holder, before);
          for (let index = before; index < result.length; index++)
            result[index].node = child;
        }
      });
    } else {
      walk(root, 0);
      dropPlaceholder(0);
    }
    return result;
  }
  #styleFor(node) {
    let current = node;
    let semantic = new TextStyle();
    let hasSemantic = false;
    while (current && current !== this.element) {
      if (current instanceof HTMLElement) {
        if (current.dataset.s !== void 0) {
          let rendered = this.#renderedStyles[Utilities.integer(current.dataset.s, -1)];
          if (rendered) {
            if (!hasSemantic)
              return rendered;
            let combined = rendered.clone();
            _TextHost.mergeSemantic(combined, semantic);
            return combined;
          }
        }
        if (_TextHost.applyElementStyle(current, semantic))
          hasSemantic = true;
      }
      current = current.parentNode;
    }
    return semantic;
  }
  static mergeSemantic(target, source) {
    let names = ["bold", "italic", "underline", "strikethrough", "code", "keyboard", "highlight", "superscript", "subscript"];
    names.forEach((name) => {
      if (source[name])
        target[name] = true;
    });
    if (source.linkURL.length > 0 && target.linkURL.length == 0)
      target.linkURL = source.linkURL;
    if (source.suggestionProviderIdentifier.length > 0 && target.suggestionProviderIdentifier.length == 0) {
      target.suggestionProviderIdentifier = source.suggestionProviderIdentifier;
      target.suggestionIdentifier = source.suggestionIdentifier;
      target.suggestionTextColor = Colors.clone(source.suggestionTextColor);
      target.suggestionBackgroundColor = Colors.clone(source.suggestionBackgroundColor);
      target.suggestionBorderColor = Colors.clone(source.suggestionBorderColor);
    }
  }
  /** Adds the formatting an HTML element implies to style. Returns true when it added any. */
  static applyElementStyle(element, style) {
    let applied = false;
    let provider = element.getAttribute("data-scriviamo-suggestion-provider");
    let isTag = !!provider && provider.length > 0;
    if (isTag && style.suggestionProviderIdentifier.length == 0) {
      style.suggestionProviderIdentifier = provider;
      style.suggestionIdentifier = element.getAttribute("data-scriviamo-suggestion-id") || "";
      let tagCSS = element.style;
      let textColor = tagCSS && tagCSS.color ? Colors.fromCSS(tagCSS.color) : null;
      let backgroundColor = tagCSS && tagCSS.backgroundColor ? Colors.fromCSS(tagCSS.backgroundColor) : null;
      let borderColor = tagCSS && tagCSS.borderTopColor ? Colors.fromCSS(tagCSS.borderTopColor) : null;
      if (textColor)
        style.suggestionTextColor = textColor;
      if (backgroundColor)
        style.suggestionBackgroundColor = backgroundColor;
      if (borderColor)
        style.suggestionBorderColor = borderColor;
      applied = true;
    }
    switch (element.tagName) {
      case "B":
      case "STRONG":
        style.bold = true;
        applied = true;
        break;
      case "I":
      case "EM":
      case "CITE":
      case "DFN":
      case "VAR":
        style.italic = true;
        applied = true;
        break;
      case "U":
        style.underline = true;
        applied = true;
        break;
      case "S":
      case "STRIKE":
        style.strikethrough = true;
        applied = true;
        break;
      case "INS":
      case "DEL":
        if (element.hasAttribute("data-scriviamo-change")) {
          style.change = element.tagName == "INS" ? "insert" : "delete";
          style.changeID = element.getAttribute("data-scriviamo-change") || "";
          style.changeAuthor = element.getAttribute("data-scriviamo-author") || "";
          style.changeTime = element.getAttribute("datetime") || "";
        } else if (element.tagName == "INS") {
          style.underline = true;
        } else {
          style.strikethrough = true;
        }
        applied = true;
        break;
      case "CODE":
      case "TT":
      case "SAMP":
        style.code = true;
        applied = true;
        break;
      case "KBD":
        style.keyboard = true;
        applied = true;
        break;
      case "MARK":
        style.highlight = true;
        applied = true;
        break;
      case "SUP":
        style.superscript = true;
        applied = true;
        break;
      case "SUB":
        style.subscript = true;
        applied = true;
        break;
      case "A": {
        let href = element.getAttribute("href") || "";
        if (href.length > 0 && style.linkURL.length == 0) {
          style.linkURL = href;
          style.linkTitle = element.getAttribute("title") || "";
          style.linkTarget = element.getAttribute("target") || "";
          applied = true;
        }
        break;
      }
    }
    let css = element.style;
    if (!css)
      return applied;
    let weight = css.fontWeight;
    if (weight == "bold" || weight == "bolder" || Number(weight) >= 600) {
      style.bold = true;
      applied = true;
    }
    if (css.fontStyle == "italic" || css.fontStyle == "oblique") {
      style.italic = true;
      applied = true;
    }
    let decoration = `${css.textDecoration} ${css.textDecorationLine}`;
    if (decoration.indexOf("underline") >= 0) {
      style.underline = true;
      applied = true;
    }
    if (decoration.indexOf("line-through") >= 0) {
      style.strikethrough = true;
      applied = true;
    }
    if (css.verticalAlign == "super") {
      style.superscript = true;
      applied = true;
    }
    if (css.verticalAlign == "sub") {
      style.subscript = true;
      applied = true;
    }
    if (css.color && Colors.isEmpty(style.textColor) && !isTag) {
      let color = Colors.fromCSS(css.color);
      if (color && color.alpha < 255) {
        style.textColor = color;
        applied = true;
      }
    }
    if (css.backgroundColor && !style.hasBackgroundColor && !isTag) {
      let color = Colors.fromCSS(css.backgroundColor);
      if (color && color.alpha < 255) {
        style.hasBackgroundColor = true;
        style.backgroundColor = color;
        applied = true;
      }
    }
    if (css.fontSize && style.fontSize == 0) {
      let size = parseFloat(css.fontSize);
      if (css.fontSize.endsWith("px") && size > 0) {
        style.fontSize = size;
        applied = true;
      }
      if (css.fontSize.endsWith("pt") && size > 0) {
        style.fontSize = Math.round(size * 4 / 3);
        applied = true;
      }
    }
    if (css.fontFamily && style.fontName.length == 0) {
      let family = css.fontFamily.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
      if (family.length > 0 && !/^(system-ui|sans-serif|serif|-apple-system|inherit|initial)$/i.test(family)) {
        style.fontName = family;
        applied = true;
      }
    }
    return applied;
  }
  // Selections
  /** The selection inside this host as model offsets, or null when it is elsewhere. */
  selection() {
    let selection = window.getSelection();
    if (!selection || selection.rangeCount == 0)
      return null;
    let range = selection.getRangeAt(0);
    if (!this.element.contains(range.startContainer) || !this.element.contains(range.endContainer))
      return null;
    let start = this.offsetOf(range.startContainer, range.startOffset);
    let end = range.collapsed ? start : this.offsetOf(range.endContainer, range.endOffset);
    return { start: Math.min(start, end), end: Math.max(start, end) };
  }
  /** Converts a DOM position inside the element to a model offset. */
  offsetOf(container, offset) {
    let range = document.createRange();
    range.setStart(this.element, 0);
    try {
      range.setEnd(container, offset);
    } catch {
      return this.rich.text.length;
    }
    let fragment = range.cloneContents();
    let segments = this.#segments(fragment, true);
    let total = 0;
    segments.forEach((segment) => total += segment.text.length);
    return Math.min(total, this.rich.text.length);
  }
  /** Converts a model offset to a DOM position inside the element. */
  positionOf(offset) {
    let segments = this.#segments(this.element, true);
    let position = 0;
    for (let index = 0; index < segments.length; index++) {
      let segment = segments[index];
      let length = segment.text.length;
      if (!segment.isBreak && segment.node.nodeType == 3) {
        if (offset <= position + length) {
          let unit = this.#unitOf(segment.node);
          if (unit) {
            let parent = unit.parentNode;
            let childIndex = Array.prototype.indexOf.call(parent.childNodes, unit);
            return { node: parent, offset: offset == position ? childIndex : childIndex + 1 };
          }
          return { node: segment.node, offset: offset - position };
        }
      } else if (segment.node instanceof HTMLElement && segment.node.tagName == "LI") {
        if (offset == position + length)
          return this.#startOf(segment.node);
      } else if (offset == position + length || offset == position) {
        let element = segment.node;
        let parent = element.parentNode;
        let childIndex = Array.prototype.indexOf.call(parent.childNodes, element);
        if (offset == position)
          return { node: parent, offset: childIndex };
        let next = segments[index + 1];
        if (next && !next.isBreak && next.node.nodeType == 3 && next.node.parentNode)
          return { node: next.node, offset: 0 };
        return { node: parent, offset: childIndex + 1 };
      }
      position += length;
    }
    if (this.mode == 2 /* list */) {
      let items = this.element.querySelectorAll(":scope > li");
      let lastItem = items[items.length - 1];
      if (lastItem)
        return this.#endOf(lastItem);
    }
    return this.#endOf(this.element);
  }
  #startOf(element) {
    let walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let first = walker.nextNode();
    if (first && !(first.parentElement && first.parentElement.closest(".scv-widget"))) {
      let unit = this.#unitOf(first);
      if (unit)
        return { node: unit.parentNode, offset: Array.prototype.indexOf.call(unit.parentNode.childNodes, unit) };
      return { node: first, offset: 0 };
    }
    let widgets = element.querySelectorAll(":scope > .scv-widget").length;
    return { node: element, offset: widgets };
  }
  #endOf(element) {
    let walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let last = null;
    let current = walker.nextNode();
    while (current) {
      if (!(current.parentElement && current.parentElement.closest(".scv-widget")))
        last = current;
      current = walker.nextNode();
    }
    let lastChild = element.lastChild;
    if (lastChild instanceof HTMLElement && lastChild.tagName == "BR") {
      return { node: element, offset: element.childNodes.length - 1 };
    }
    if (last) {
      let unit = this.#unitOf(last);
      if (unit)
        return { node: unit.parentNode, offset: Array.prototype.indexOf.call(unit.parentNode.childNodes, unit) + 1 };
      return { node: last, offset: (last.nodeValue || "").length };
    }
    return { node: element, offset: element.childNodes.length };
  }
  /** The element around a text node that is one unit for the caret, such as a drawn tag, or null. */
  #unitOf(node) {
    let unit = node.parentElement ? node.parentElement.closest('[contenteditable="false"]') : null;
    return unit && unit !== this.element && this.element.contains(unit) ? unit : null;
  }
  select(start, end = start) {
    start = Utilities.clamp(start, 0, this.rich.text.length);
    end = Utilities.clamp(end, 0, this.rich.text.length);
    if (this.node.editor)
      this.node.editor.hostActivated(this);
    if (document.activeElement !== this.element)
      this.element.focus({ preventScroll: true });
    let selection = window.getSelection();
    if (!selection)
      return;
    let startPosition = this.positionOf(start);
    let endPosition = end == start ? startPosition : this.positionOf(end);
    let range = document.createRange();
    try {
      range.setStart(startPosition.node, startPosition.offset);
      range.setEnd(endPosition.node, endPosition.offset);
    } catch {
      range.selectNodeContents(this.element);
      range.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }
  focus(atEnd = false) {
    this.select(atEnd ? this.rich.text.length : 0);
  }
  /** Bounds of the caret, used to decide whether arrow keys leave the host. */
  caretRect() {
    let selection = window.getSelection();
    if (!selection || selection.rangeCount == 0)
      return null;
    let range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);
    let rects = range.getClientRects();
    if (rects.length > 0)
      return rects[0];
    let marker = document.createElement("span");
    marker.textContent = "\u200B";
    range.insertNode(marker);
    let rect = marker.getBoundingClientRect();
    let parent = marker.parentNode;
    marker.remove();
    if (parent)
      parent.normalize();
    return rect;
  }
  isCaretOnFirstLine() {
    let caret = this.caretRect();
    if (!caret)
      return true;
    let first = this.#lineRect(true);
    return !first || caret.top < first.top + Math.max(4, first.height / 2);
  }
  isCaretOnLastLine() {
    let caret = this.caretRect();
    if (!caret)
      return true;
    let last = this.#lineRect(false);
    return !last || caret.bottom > last.bottom - Math.max(4, last.height / 2);
  }
  #lineRect(first) {
    let range = document.createRange();
    range.selectNodeContents(this.element);
    let rects = Array.from(range.getClientRects()).filter((rect) => rect.height > 0);
    if (rects.length == 0)
      return this.element.getBoundingClientRect();
    return first ? rects[0] : rects[rects.length - 1];
  }
};

// suggestions.ts
var Suggestions;
((Suggestions3) => {
  class Request {
    identifier;
    trigger;
    query;
    startPosition;
    length;
    constructor(identifier, trigger, query, startPosition, length) {
      this.identifier = identifier;
      this.trigger = trigger;
      this.query = query;
      this.startPosition = Math.max(0, startPosition);
      this.length = Math.max(0, length);
    }
  }
  Suggestions3.Request = Request;
  class Suggestion {
    caption;
    insertText;
    filterText;
    identifier;
    /** An icon class, such as "bi bi-person", or an image URL. */
    icon = "";
    /** Secondary text shown after the caption. */
    detail = "";
    /** Application-defined data. */
    tag = null;
    constructor(caption, insertText = "", identifier = "") {
      this.caption = caption;
      this.insertText = insertText.length > 0 ? insertText : caption;
      this.filterText = caption;
      this.identifier = identifier.length > 0 ? identifier : this.insertText;
    }
    /** Fills a popup row and returns true, or returns false to use the standard row. */
    render(element, selected) {
      void 0, selected;
      return false;
    }
  }
  Suggestions3.Suggestion = Suggestion;
  class Provider {
    identifier;
    trigger;
    /** Default colors of committed tags. */
    textColor = Colors.make(30, 64, 175);
    backgroundColor = Colors.make(219, 234, 254);
    borderColor = Colors.make(147, 197, 253);
    #suggestions = [];
    constructor(identifier = "default", trigger = "") {
      this.identifier = identifier.trim().length > 0 ? identifier.trim() : "default";
      this.trigger = trigger.trim();
    }
    /**
     * Adds a choice. With a string, the popup shows caption (or value) and inserting
     * it types the trigger followed by value, so add("ada", "Ada Lovelace") inserts "@ada".
     */
    add(value, caption = "") {
      if (value instanceof Suggestion) {
        if (this.#suggestions.some((item) => item.insertText.toLowerCase() == value.insertText.toLowerCase()))
          return;
        this.#suggestions.push(value);
        return;
      }
      let text = String(value || "").trim();
      if (this.trigger.length > 0 && text.startsWith(this.trigger))
        text = text.substring(this.trigger.length);
      if (text.length == 0)
        return;
      if (caption.trim().length == 0)
        caption = text;
      let suggestion = new Suggestion(caption, this.trigger + text, text);
      suggestion.filterText = text;
      this.add(suggestion);
    }
    get lastIndex() {
      return this.#suggestions.length - 1;
    }
    /** The position of a suggestion, or of the first with the caption, ignoring case. */
    indexOf(suggestion) {
      if (suggestion instanceof Suggestion)
        return this.#suggestions.indexOf(suggestion);
      let caption = String(suggestion || "").trim().toLowerCase();
      if (caption.length == 0)
        return -1;
      return this.#suggestions.findIndex((item) => item.caption.trim().toLowerCase() == caption);
    }
    lookup(caption) {
      let index = this.indexOf(caption);
      return index < 0 ? null : this.#suggestions[index];
    }
    items() {
      return this.#suggestions.slice();
    }
    removeAt(index) {
      if (index >= 0 && index < this.#suggestions.length)
        this.#suggestions.splice(index, 1);
    }
    removeAll() {
      this.#suggestions = [];
    }
    /** A request when the text before the caret ends with the trigger and a query with no spaces. */
    match(textBeforeCaret, caretPosition, host) {
      if (textBeforeCaret.length == 0 || this.trigger.length == 0)
        return null;
      let segmentStart = textBeforeCaret.length;
      while (segmentStart > 0 && !Provider.isSpace(textBeforeCaret[segmentStart - 1]))
        segmentStart--;
      let triggerIndex = textBeforeCaret.lastIndexOf(this.trigger);
      if (triggerIndex < segmentStart)
        return null;
      let query = textBeforeCaret.substring(triggerIndex + this.trigger.length);
      return new Request(this.trigger, this.trigger, query, triggerIndex, Math.max(0, caretPosition - triggerIndex));
    }
    /** Choices for a request: those whose filter text starts with the query. */
    suggestions(request, maximumResults = 6) {
      let result = [];
      if (!request || request.trigger != this.trigger || maximumResults <= 0)
        return result;
      let query = request.query.toLowerCase();
      for (let suggestion of this.#suggestions) {
        let filterText = suggestion.filterText.length > 0 ? suggestion.filterText : suggestion.caption;
        if (filterText.toLowerCase().startsWith(query))
          result.push(suggestion);
        if (result.length >= maximumResults)
          break;
      }
      return result;
    }
    /** Replaces the request's range with the suggestion as a tag, and returns the caret position after it. */
    commitSuggestion(host, request, suggestion, currentStyle) {
      if (!host || !request || !suggestion || suggestion.insertText.length == 0)
        return -1;
      let style = currentStyle ? currentStyle.clone() : new TextStyle();
      style.suggestionProviderIdentifier = this.identifier;
      style.suggestionIdentifier = suggestion.identifier;
      style.suggestionTextColor = Colors.clone(this.textColor);
      style.suggestionBackgroundColor = Colors.clone(this.backgroundColor);
      style.suggestionBorderColor = Colors.clone(this.borderColor);
      host.rich.remove(request.startPosition, request.startPosition + request.length);
      host.rich.insert(request.startPosition, suggestion.insertText, style);
      return request.startPosition + suggestion.insertText.length;
    }
    static isSpace(character) {
      return character == " " || character == "	" || character == "\n" || character == "\r" || character == "\u2028" || character == "\xA0";
    }
  }
  Suggestions3.Provider = Provider;
  class EmojiProvider extends Provider {
    static #names = [];
    static #emoji = [];
    static #keywords = [];
    constructor() {
      super("emoji", ":");
    }
    static #ensureTable() {
      if (EmojiProvider.#names.length > 0)
        return;
      let entries = [
        "smile \u{1F604} happy",
        "grin \u{1F601} happy",
        "joy \u{1F602} lol haha lmao laugh tears",
        "rofl \u{1F923} lol lmao laugh rolling",
        "smiley \u{1F603} happy",
        "sweat_smile \u{1F605}",
        "laughing \u{1F606} lol haha laugh satisfied",
        "wink \u{1F609}",
        "blush \u{1F60A}",
        "yum \u{1F60B}",
        "sunglasses \u{1F60E} cool",
        "heart_eyes \u{1F60D} love",
        "kissing_heart \u{1F618} love kiss",
        "slightly_smiling_face \u{1F642} happy",
        "upside_down_face \u{1F643}",
        "hugs \u{1F917} hug",
        "star_struck \u{1F929}",
        "thinking \u{1F914} hmm think",
        "raised_eyebrow \u{1F928}",
        "neutral_face \u{1F610}",
        "expressionless \u{1F611}",
        "no_mouth \u{1F636}",
        "roll_eyes \u{1F644}",
        "smirk \u{1F60F}",
        "persevere \u{1F623}",
        "disappointed_relieved \u{1F625}",
        "open_mouth \u{1F62E} wow surprised",
        "zipper_mouth_face \u{1F910}",
        "hushed \u{1F62F}",
        "sleepy \u{1F62A}",
        "tired_face \u{1F62B}",
        "sleeping \u{1F634}",
        "relieved \u{1F60C}",
        "stuck_out_tongue \u{1F61B}",
        "stuck_out_tongue_winking_eye \u{1F61C}",
        "drooling_face \u{1F924}",
        "unamused \u{1F612}",
        "sweat \u{1F613}",
        "pensive \u{1F614} sad",
        "confused \u{1F615}",
        "astonished \u{1F632} wow surprised",
        "slightly_frowning_face \u{1F641}",
        "confounded \u{1F616}",
        "disappointed \u{1F61E} sad",
        "worried \u{1F61F}",
        "triumph \u{1F624}",
        "cry \u{1F622} sad tear",
        "sob \u{1F62D} sad cry",
        "frowning \u{1F626}",
        "anguished \u{1F627}",
        "fearful \u{1F628}",
        "weary \u{1F629}",
        "exploding_head \u{1F92F} mind blown omg",
        "grimacing \u{1F62C}",
        "cold_sweat \u{1F630}",
        "scream \u{1F631} omg shocked",
        "flushed \u{1F633}",
        "zany_face \u{1F92A}",
        "dizzy_face \u{1F635}",
        "rage \u{1F621} angry mad",
        "angry \u{1F620} mad",
        "mask \u{1F637}",
        "face_with_thermometer \u{1F912}",
        "nauseated_face \u{1F922}",
        "sneezing_face \u{1F927}",
        "innocent \u{1F607}",
        "cowboy_hat_face \u{1F920}",
        "partying_face \u{1F973} party celebrate",
        "pleading_face \u{1F97A}",
        "nerd_face \u{1F913}",
        "monocle_face \u{1F9D0}",
        "shushing_face \u{1F92B}",
        "skull \u{1F480}",
        "ghost \u{1F47B}",
        "alien \u{1F47D}",
        "robot \u{1F916}",
        "poop \u{1F4A9}",
        "clown_face \u{1F921}",
        "see_no_evil \u{1F648}",
        "hear_no_evil \u{1F649}",
        "speak_no_evil \u{1F64A}",
        "wave \u{1F44B} hello hi bye",
        "raised_hand \u270B",
        "ok_hand \u{1F44C} ok perfect",
        "v \u270C\uFE0F",
        "crossed_fingers \u{1F91E}",
        "love_you_gesture \u{1F91F}",
        "metal \u{1F918}",
        "call_me_hand \u{1F919}",
        "point_left \u{1F448}",
        "point_right \u{1F449}",
        "point_up \u261D\uFE0F",
        "point_down \u{1F447}",
        "thumbsup \u{1F44D} yes ok like approve",
        "+1 \u{1F44D} yes ok like approve",
        "thumbsdown \u{1F44E} no dislike",
        "-1 \u{1F44E} no dislike",
        "fist \u270A",
        "punch \u{1F44A}",
        "clap \u{1F44F} applause bravo",
        "raised_hands \u{1F64C}",
        "open_hands \u{1F450}",
        "handshake \u{1F91D}",
        "pray \u{1F64F} thanks please",
        "writing_hand \u270D\uFE0F",
        "muscle \u{1F4AA} strong flex",
        "eyes \u{1F440} look see",
        "brain \u{1F9E0}",
        "heart \u2764\uFE0F love",
        "orange_heart \u{1F9E1}",
        "yellow_heart \u{1F49B}",
        "green_heart \u{1F49A}",
        "blue_heart \u{1F499}",
        "purple_heart \u{1F49C}",
        "black_heart \u{1F5A4}",
        "broken_heart \u{1F494}",
        "sparkling_heart \u{1F496}",
        "two_hearts \u{1F495}",
        "100 \u{1F4AF} perfect hundred",
        "boom \u{1F4A5}",
        "collision \u{1F4A5}",
        "fire \u{1F525} hot lit",
        "sparkles \u2728",
        "star \u2B50",
        "star2 \u{1F31F}",
        "zap \u26A1",
        "sunny \u2600\uFE0F",
        "cloud \u2601\uFE0F",
        "umbrella \u2614",
        "snowflake \u2744\uFE0F",
        "rainbow \u{1F308}",
        "ocean \u{1F30A}",
        "earth_americas \u{1F30E}",
        "rocket \u{1F680} launch ship",
        "airplane \u2708\uFE0F",
        "car \u{1F697}",
        "bike \u{1F6B2}",
        "house \u{1F3E0}",
        "office \u{1F3E2}",
        "tada \u{1F389} party celebrate congrats hooray",
        "confetti_ball \u{1F38A} party celebrate",
        "balloon \u{1F388}",
        "gift \u{1F381}",
        "trophy \u{1F3C6}",
        "medal \u{1F3C5}",
        "soccer \u26BD",
        "basketball \u{1F3C0}",
        "dart \u{1F3AF}",
        "video_game \u{1F3AE}",
        "musical_note \u{1F3B5}",
        "headphones \u{1F3A7}",
        "art \u{1F3A8}",
        "camera \u{1F4F7}",
        "movie_camera \u{1F3A5}",
        "tv \u{1F4FA}",
        "computer \u{1F4BB}",
        "keyboard \u2328\uFE0F",
        "iphone \u{1F4F1}",
        "phone \u260E\uFE0F",
        "bulb \u{1F4A1} idea",
        "battery \u{1F50B}",
        "electric_plug \u{1F50C}",
        "mag \u{1F50D}",
        "lock \u{1F512}",
        "unlock \u{1F513}",
        "key \u{1F511}",
        "hammer \u{1F528}",
        "wrench \u{1F527}",
        "gear \u2699\uFE0F",
        "link \u{1F517}",
        "paperclip \u{1F4CE}",
        "pushpin \u{1F4CC}",
        "scissors \u2702\uFE0F",
        "pencil2 \u270F\uFE0F",
        "memo \u{1F4DD}",
        "book \u{1F4D6}",
        "books \u{1F4DA}",
        "bookmark \u{1F516}",
        "calendar \u{1F4C5}",
        "date \u{1F4C5}",
        "clipboard \u{1F4CB}",
        "file_folder \u{1F4C1}",
        "chart_with_upwards_trend \u{1F4C8}",
        "chart_with_downwards_trend \u{1F4C9}",
        "bar_chart \u{1F4CA}",
        "email \u{1F4E7}",
        "envelope \u2709\uFE0F",
        "inbox_tray \u{1F4E5}",
        "outbox_tray \u{1F4E4}",
        "package \u{1F4E6}",
        "bell \u{1F514}",
        "loudspeaker \u{1F4E2}",
        "speech_balloon \u{1F4AC}",
        "thought_balloon \u{1F4AD}",
        "hourglass \u231B",
        "alarm_clock \u23F0",
        "stopwatch \u23F1\uFE0F",
        "moneybag \u{1F4B0}",
        "dollar \u{1F4B5}",
        "credit_card \u{1F4B3}",
        "gem \u{1F48E}",
        "coffee \u2615 cafe morning",
        "tea \u{1F375}",
        "beer \u{1F37A} cheers drink",
        "wine_glass \u{1F377} cheers drink",
        "pizza \u{1F355}",
        "hamburger \u{1F354}",
        "cake \u{1F370}",
        "apple \u{1F34E}",
        "avocado \u{1F951}",
        "seedling \u{1F331}",
        "evergreen_tree \u{1F332}",
        "cactus \u{1F335}",
        "four_leaf_clover \u{1F340}",
        "rose \u{1F339}",
        "sunflower \u{1F33B}",
        "cherry_blossom \u{1F338}",
        "dog \u{1F436}",
        "cat \u{1F431}",
        "unicorn \u{1F984}",
        "bug \u{1F41B}",
        "bee \u{1F41D}",
        "turtle \u{1F422}",
        "snake \u{1F40D}",
        "octopus \u{1F419}",
        "whale \u{1F433}",
        "penguin \u{1F427}",
        "white_check_mark \u2705 done yes check",
        "heavy_check_mark \u2714\uFE0F done check",
        "ballot_box_with_check \u2611\uFE0F",
        "x \u274C no wrong cancel",
        "negative_squared_cross_mark \u274E",
        "warning \u26A0\uFE0F caution",
        "no_entry \u26D4",
        "no_entry_sign \u{1F6AB}",
        "question \u2753",
        "exclamation \u2757",
        "bangbang \u203C\uFE0F",
        "information_source \u2139\uFE0F",
        "arrow_right \u27A1\uFE0F",
        "arrow_left \u2B05\uFE0F",
        "arrow_up \u2B06\uFE0F",
        "arrow_down \u2B07\uFE0F",
        "arrows_counterclockwise \u{1F504}",
        "recycle \u267B\uFE0F",
        "red_circle \u{1F534}",
        "green_circle \u{1F7E2}",
        "yellow_circle \u{1F7E1}",
        "large_blue_circle \u{1F535}",
        "white_circle \u26AA",
        "black_circle \u26AB",
        "triangular_flag_on_post \u{1F6A9}",
        "checkered_flag \u{1F3C1}",
        "construction \u{1F6A7}",
        "rotating_light \u{1F6A8}",
        "new \u{1F195}",
        "free \u{1F193}",
        "cool \u{1F192}",
        "ok \u{1F197}",
        "sos \u{1F198}",
        "copyright \xA9\uFE0F",
        "registered \xAE\uFE0F",
        "tm \u2122\uFE0F",
        "shrug \u{1F937} dunno whatever",
        "facepalm \u{1F926} doh"
      ];
      entries.forEach((entry) => {
        let fields = entry.split(" ");
        EmojiProvider.#names.push(fields[0]);
        EmojiProvider.#emoji.push(fields[1]);
        EmojiProvider.#keywords.push(` ${fields.slice(2).join(" ")} `);
      });
    }
    static #isNameCharacter(character) {
      return /^[A-Za-z0-9_+\-]$/.test(character);
    }
    /**
     * A request when the text before the caret is a colon that starts a word,
     * followed by at least two shortcode characters, so times such as 10:30 and
     * labels such as "Note:" don't open the popup.
     */
    match(textBeforeCaret, caretPosition, host) {
      let nameStart = textBeforeCaret.length;
      while (nameStart > 0 && EmojiProvider.#isNameCharacter(textBeforeCaret[nameStart - 1]))
        nameStart--;
      if (nameStart == 0 || textBeforeCaret[nameStart - 1] != this.trigger)
        return null;
      let colonIndex = nameStart - 1;
      if (colonIndex > 0) {
        let before = textBeforeCaret[colonIndex - 1];
        if (!Provider.isSpace(before) && before != "(")
          return null;
      }
      let query = textBeforeCaret.substring(nameStart);
      if (query.length < 2)
        return null;
      return new Request(this.trigger, this.trigger, query, colonIndex, Math.max(0, caretPosition - colonIndex));
    }
    /** Shortcodes that start with the query, then those with a keyword that does, then those containing it. */
    suggestions(request, maximumResults = 6) {
      let result = [];
      if (!request || request.trigger != this.trigger || maximumResults <= 0)
        return result;
      EmojiProvider.#ensureTable();
      let query = request.query.toLowerCase();
      let names = EmojiProvider.#names;
      let listed = /* @__PURE__ */ new Set();
      for (let pass = 0; pass < 3; pass++) {
        for (let index = 0; index < names.length; index++) {
          if (listed.has(index))
            continue;
          let name = names[index];
          let matches = pass == 0 ? name.startsWith(query) : pass == 1 ? EmojiProvider.#keywords[index].indexOf(` ${query}`) >= 0 : name.indexOf(query) >= 0;
          if (!matches)
            continue;
          listed.add(index);
          let emoji = EmojiProvider.#emoji[index];
          let suggestion = new Suggestion(`${emoji}  :${name}:`, emoji, name);
          suggestion.filterText = name;
          result.push(suggestion);
          if (result.length >= maximumResults)
            return result;
        }
      }
      return result;
    }
    /** The emoji is ordinary text in the current style, not a tag. */
    commitSuggestion(host, request, suggestion, currentStyle) {
      if (!host || !request || !suggestion || suggestion.insertText.length == 0)
        return -1;
      let style = currentStyle ? currentStyle.clone() : new TextStyle();
      style.suggestionProviderIdentifier = "";
      style.suggestionIdentifier = "";
      host.rich.remove(request.startPosition, request.startPosition + request.length);
      host.rich.insert(request.startPosition, suggestion.insertText, style);
      return request.startPosition + suggestion.insertText.length;
    }
  }
  Suggestions3.EmojiProvider = EmojiProvider;
})(Suggestions || (Suggestions = {}));
var SuggestionProviders = class {
  #owner;
  #items = [];
  constructor(owner) {
    this.#owner = owner;
  }
  get owner() {
    return this.#owner;
  }
  #indexOfIdentifier(identifier) {
    identifier = String(identifier || "").trim();
    return this.#items.findIndex((item) => item.identifier == identifier);
  }
  /** Adds a provider to the end, replacing one with the same identifier in place. */
  add(item) {
    if (!item)
      return;
    let existing = this.#indexOfIdentifier(item.identifier);
    if (existing >= 0) {
      this.#items[existing] = item;
    } else {
      this.#items.push(item);
    }
  }
  /** Inserts a provider at a position, removing one with the same identifier first. */
  addAt(index, item) {
    if (!item)
      return;
    let existing = this.#indexOfIdentifier(item.identifier);
    if (existing >= 0)
      this.#items.splice(existing, 1);
    this.#items.splice(Utilities.clamp(index, 0, this.#items.length), 0, item);
  }
  indexOf(item) {
    return this.#items.indexOf(item);
  }
  item(identifier) {
    let index = this.#indexOfIdentifier(identifier);
    return index < 0 ? null : this.#items[index];
  }
  itemAt(index) {
    return this.#items[index] || null;
  }
  items() {
    return this.#items.slice();
  }
  get lastIndex() {
    return this.#items.length - 1;
  }
  remove(item) {
    this.removeAt(typeof item == "string" ? this.#indexOfIdentifier(item) : this.#items.indexOf(item));
  }
  removeAt(index) {
    if (index >= 0 && index < this.#items.length)
      this.#items.splice(index, 1);
  }
  removeAll() {
    this.#items = [];
  }
};

// strings.ts
var Strings = class _Strings {
  TextUndoCaption = "Undo";
  TextRedoCaption = "Redo";
  TextBoldCaption = "Bold";
  TextItalicCaption = "Italic";
  TextUnderlineCaption = "Underline";
  TextStrikethroughCaption = "Strikethrough";
  TextInlineCodeCaption = "Inline Code";
  TextKeyboardCaption = "Keyboard Key";
  TextHighlightCaption = "Highlight";
  TextSuperscriptCaption = "Superscript";
  TextSubscriptCaption = "Subscript";
  TextClearFormattingCaption = "Clear Formatting";
  TextHyperlinkCaption = "Link";
  TextHyperlinkDialogPrompt = "Address";
  TextLinkTitleCaption = "Title";
  TextLinkTargetCaption = "Open in new window";
  TextRemoveLinkCaption = "Remove Link";
  TextTextColorCaption = "Text Color";
  TextBackgroundColorCaption = "Text Background";
  TextCustomColorCaption = "Custom\u2026";
  TextDefault = "Default";
  TextAutomatic = "Automatic";
  TextFontCaption = "Font";
  TextFontSizeMenuCaption = "Size";
  TextAlignmentCaption = "Alignment";
  TextStartAlignmentCaption = "Align Start";
  TextCenterAlignmentCaption = "Align Center";
  TextEndAlignmentCaption = "Align End";
  TextJustifyAlignmentCaption = "Justify";
  TextInsertCaption = "Insert";
  TextInsertTooltip = "Insert content";
  TextInsertNodeSearchHint = "Search blocks";
  TextBlockTypeCaption = "Block Type";
  TextTextCaption = "Text";
  TextHeadingCaption = "Heading";
  TextHeadingLevelCaption = "Heading %level%";
  TextQuoteCaption = "Quote";
  TextDividerCaption = "Divider";
  TextLineThicknessCaption = "Thickness";
  TextLineColorCaption = "Color";
  TextCitationCaption = "Citation";
  TextDefaultQuote = "Quote";
  TextListInspectorCaption = "List";
  TextBulletedListCaption = "Bulleted List";
  TextNumberedListCaption = "Numbered List";
  TextChecklistCaption = "Checklist";
  TextIndentCaption = "Indent";
  TextOutdentCaption = "Outdent";
  TextCodeInspectorCaption = "Code";
  TextLanguageCaption = "Language";
  TextCopyCodeTooltip = "Copy";
  TextImageCaption = "Image";
  TextImageURLDialogTitle = "Image";
  TextImageURLDialogPrompt = "Image address";
  TextChooseLocalFileCaption = "Choose File\u2026";
  TextEnterURLCaption = "Enter Address\u2026";
  TextCaptionCaption = "Caption";
  TextFitCaption = "Fit";
  TextFillCaption = "Fill";
  TextStretchCaption = "Stretch";
  TextActualSizeCaption = "Actual Size";
  TextImageOpenErrorMessage = "The image could not be opened.";
  TextUploadingCaption = "Uploading\u2026";
  TextUploadFailedMessage = "The file couldn't be uploaded.";
  TextTableCaption = "Table";
  TextTableSizeCaptionFormat = "%rows% \xD7 %columns%";
  TextDefaultTableHeadingFormat = "Heading %number%";
  TextDefaultTableCellText = "Cell";
  TextAddRowCaption = "Add Row";
  TextAddColumnCaption = "Add Column";
  TextInsertRowAboveCaption = "Insert Row Above";
  TextInsertRowBelowCaption = "Insert Row Below";
  TextInsertColumnBeforeCaption = "Insert Column Before";
  TextInsertColumnAfterCaption = "Insert Column After";
  TextRemoveRowCaption = "Delete Row";
  TextRemoveColumnCaption = "Delete Column";
  TextMergeCellsCaption = "Merge Cells";
  TextSplitCellCaption = "Split Cell";
  TextHeaderCaption = "Header Row";
  TextFooterCaption = "Footer Row";
  TextUnsupportedContentFormat = "Unsupported content: %type%";
  TextMoveUpCaption = "Move Up";
  TextMoveDownCaption = "Move Down";
  TextDuplicateNodeCaption = "Duplicate";
  TextRemoveNodeTooltip = "Delete";
  TextDragHandleTooltip = "Drag to move, click for options";
  TextTurnIntoCaption = "Turn Into";
  TextDefaultTextCaption = "Type / for blocks";
  TextDefaultListItemCaption = "List item";
  TextFindHint = "Find";
  TextReplaceHint = "Replace";
  TextReplaceCaption = "Replace";
  TextFindCaption = "Find";
  TextInlineFormatsCaption = "Inline Formats";
  TextDeleteCaption = "Delete";
  TextRemoveCaption = "Remove";
  TextReplaceAllCaption = "Replace All";
  TextFindNextCaption = "Next";
  TextFindPreviousCaption = "Previous";
  TextMatchCaseCaption = "Match Case";
  TextWholeWordCaption = "Whole Word";
  TextRegularExpressionCaption = "Regular Expression";
  TextMatchCountFormat = "%count% matches";
  TextMatchPositionFormat = "%index% of %count%";
  TextNoMatchesCaption = "No matches";
  TextSearchCaption = "Find and Replace";
  TextPrintCaption = "Print";
  TextOKCaption = "OK";
  TextCancelCaption = "Cancel";
  TextDoneCaption = "Done";
  TextWordsCountFormat = "%count% words";
  TextCharactersCountFormat = "%count% characters";
  TextOneWordCaption = "1 word";
  TextOneCharacterCaption = "1 character";
  TextSelectedWordsFormat = "%selected% of %count% words";
  TextSelectedCharactersFormat = "%selected% of %count% characters";
  TextReadingTimeFormat = "%count% min read";
  TextSavedCaption = "Saved";
  TextSavingCaption = "Saving\u2026";
  TextUnsavedCaption = "Unsaved changes";
  TextSaveFailedCaption = "Couldn't save";
  TextTryAgainCaption = "Try again";
  TextStatusBarCaption = "Document status";
  TextAddCaption = "Add";
  TextPropertiesCaption = "Properties\u2026";
  TextResetCaption = "Reset";
  TextPropertiesTabCaption = "Properties";
  TextDocumentInspectorCaption = "Document";
  TextContentInspectorCaption = "Content";
  TextAppearanceInspectorCaption = "Appearance";
  TextBordersInspectorCaption = "Borders";
  TextCornersInspectorCaption = "Corners";
  TextDimensionsInspectorCaption = "Dimensions";
  TextBackgroundImageCaption = "Background Image";
  TextTypographyInspectorCaption = "Typography";
  TextDirectionInspectorCaption = "Direction";
  TextLeftToRightDirectionCaption = "Left to Right";
  TextRightToLeftDirectionCaption = "Right to Left";
  TextLineHeightInspectorCaption = "Line Height";
  TextLineSpacingInspectorCaption = "Line Spacing";
  TextTopVisibleCaption = "Top";
  TextTopSizeCaption = "Top Width";
  TextTopColorCaption = "Top Color";
  TextRightVisibleCaption = "Right";
  TextRightSizeCaption = "Right Width";
  TextRightColorCaption = "Right Color";
  TextBottomVisibleCaption = "Bottom";
  TextBottomSizeCaption = "Bottom Width";
  TextBottomColorCaption = "Bottom Color";
  TextLeftVisibleCaption = "Left";
  TextLeftSizeCaption = "Left Width";
  TextLeftColorCaption = "Left Color";
  TextTopLeftRadiusCaption = "Top Left";
  TextTopRightRadiusCaption = "Top Right";
  TextBottomRightRadiusCaption = "Bottom Right";
  TextBottomLeftRadiusCaption = "Bottom Left";
  TextWidthInspectorCaption = "Width";
  TextHeightInspectorCaption = "Height";
  TextLocalFileCaption = "File";
  TextURLCaption = "Address";
  TextRepeatCaption = "Repeat";
  TextNoRepeatCaption = "Don't Repeat";
  TextRepeatHorizontallyCaption = "Horizontally";
  TextRepeatVerticallyCaption = "Vertically";
  TextRepeatBothCaption = "Both";
  TextRemoveImageCaption = "Remove Image";
  TextTextAlignmentInspectorCaption = "Text Alignment";
  TextSizeCaption = "Size";
  TextLevelCaption = "Level";
  TextTypeCaption = "Type";
  TextTabWidthInspectorCaption = "Tab Width";
  TextActiveCellCaption = "Selected Cell";
  TextVerticalAlignmentCaption = "Vertical Alignment";
  TextTopAlignmentCaption = "Top";
  TextMiddleAlignmentCaption = "Middle";
  TextBottomAlignmentCaption = "Bottom";
  TextUseBackgroundColorCaption = "Fill";
  TextFillColorCaption = "Fill Color";
  TextDocumentBackgroundCaption = "Background";
  TextCellBordersInspectorCaption = "Cell Borders";
  TextNoSelectionCaption = "No Selection";
  TextMultipleNodesFormat = "%count% blocks";
  TextMoveNodeCaption = "Move";
  TextMoveNodeTooltip = "Drag to move, click for options";
  TextBackgroundToolbarCaption = "Background";
  TextNodeBackgroundImageCaption = "Background Image";
  TextChooseImageMenuCaption = "Choose Image\u2026";
  TextEnterImageSourceMenuCaption = "Enter Image Address\u2026";
  TextWidthCaptionFormat = "W %value%";
  TextHeightCaptionFormat = "H %value%";
  TextSetNodeWidthTooltip = "Width";
  TextSetNodeHeightTooltip = "Height";
  TextCommandSearchCaption = "Search";
  TextCommandSearchHint = "Search tools and commands";
  TextCommandSearchTooltip = "Search tools and commands";
  TextNoMatchingCommandsCaption = "No matching tools";
  TextCutMenuCaption = "Cut";
  TextCopyMenuCaption = "Copy";
  TextPasteMenuCaption = "Paste";
  TextSelectAllMenuCaption = "Select All";
  TextUndoMenuCaption = "Undo";
  TextRedoMenuCaption = "Redo";
  TextAddHyperlinkMenuCaption = "Add Hyperlink\u2026";
  TextEditHyperlinkMenuCaption = "Edit Hyperlink\u2026";
  TextRemoveHyperlinkMenuCaption = "Remove Hyperlink";
  TextAddCommentCaption = "Add Comment";
  TextAddCommentTooltip = "Comment on the Selection";
  TextDefaultAuthorCaption = "Author";
  TextCommentHint = "Add a comment";
  TextCommentPositionFormat = "%index% of %count%";
  TextCommentsCaption = "Comments";
  TextDeleteCommentThreadCaption = "Delete";
  TextNewCommentCaption = "New Comment";
  TextNextCommentTooltip = "Next Comment";
  TextPreviousCommentTooltip = "Previous Comment";
  TextReopenCaption = "Reopen";
  TextReplyHint = "Reply";
  TextResolveCaption = "Resolve";
  TextResolvedCaption = "Resolved";
  TextNewCommentThreadCaption = "New";
  TextNewCommentThreadTooltip = "Start Another Discussion Here";
  TextOpenStatusCaption = "Open";
  TextPrintDocumentTooltip = "Print Document";
  TextLineHeightMenuCaption = "Line Height";
  TextLineSpacingMenuCaption = "Line Spacing";
  TextLineHeightTooltipFormat = "Line height: %value%";
  TextLineSpacingTooltipFormat = "Line spacing: %value%";
  TextCustomizeToolbarMenuCaption = "Customize Toolbar\u2026";
  TextCustomizeToolbarInstructions = "Drag your favorite items into the toolbar\u2026";
  TextCustomizeDefaultSetInstructions = "\u2026or drag the default set into the toolbar.";
  TextFlexibleSpaceCaption = "Flexible Space";
  TextSeparatorCaption = "Separator";
  TextContextToolsCaption = "Selection Tools";
  TextApplicationToolsCaption = "Application Tools";
  TextToolbarToolsCaption = "Toolbar";
  TextKeyboardKeyCaption = "Keyboard Key";
  TextToolbarShowCaption = "Show";
  TextIconAndTextCaption = "Icon and Text";
  TextIconOnlyCaption = "Icon Only";
  TextTextOnlyCaption = "Text Only";
  TextCustomFontSizeMenuCaption = "Custom\u2026";
  TextCustomFontSizeFieldTooltip = "Enter a font size from 1 to 1000";
  TextSuggestionsCaption = "Suggestions";
  // Collaboration
  constructor() {
    if (_Strings.#locale)
      this.#assign(_Strings.#locale);
  }
  static #builtInNames = null;
  static #registered = /* @__PURE__ */ new Set();
  static #locale = null;
  /**
   * Adds interface text, normally an add-on's, as {name: text}. Each name must start with
   * "Text". A name that already has text keeps it, so an add-on cannot change the base
   * package's text or another add-on's.
   */
  static register(defaults) {
    if (!_Strings.#builtInNames) {
      let locale = _Strings.#locale;
      _Strings.#locale = null;
      _Strings.#builtInNames = new Set(Object.keys(new _Strings()));
      _Strings.#locale = locale;
    }
    for (let name of Object.keys(defaults)) {
      if (!name.startsWith("Text") || name == "Text" || typeof defaults[name] != "string")
        continue;
      if (_Strings.#builtInNames.has(name) || _Strings.#registered.has(name))
        continue;
      _Strings.#registered.add(name);
      Object.defineProperty(_Strings.prototype, name, { value: defaults[name], writable: true, enumerable: true, configurable: true });
    }
  }
  /** The names of the text add-ons have registered. */
  static get registeredNames() {
    return Array.from(_Strings.#registered);
  }
  /**
   * Sets the application's locale: a locale pack, an object of strings, or a list of either, such
   * as the base package's pack and its add-ons' for one language, used by every
   * Strings object created afterwards, including each new editor's. An editor's own locale
   * pack still wins. Pass null to go back to the built-in text. Returns the number of values
   * that apply to text known now, or 0 for a pack that is rejected.
   */
  static useLocale(pack) {
    _Strings.#shared = null;
    if (pack === null) {
      _Strings.#locale = null;
      return 0;
    }
    let values = _Strings.#values(pack);
    if (!values)
      return 0;
    _Strings.#locale = null;
    let known = new _Strings();
    _Strings.#locale = values;
    return Object.keys(values).filter((name) => typeof known[name] == "string").length;
  }
  static #shared = null;
  static get shared() {
    if (!_Strings.#shared)
      _Strings.#shared = new _Strings();
    return _Strings.#shared;
  }
  // Accepted from locale packs so a pack written for any edition applies in full. Text that
  // belongs to an add-on's blocks, such as the form fields', is registered by that add-on.
  TextAccessibilityHintInspectorCaption = "Hint";
  TextAccessibilityInspectorCaption = "Accessibility";
  TextAccessibilityRoleInspectorCaption = "Role";
  TextAddHeadingCaption = "Add Heading";
  TextAddTableCaption = "Add Table";
  TextAlignmentInspectorDescription = "Positions the node within its container. Visible only when the node is narrower than the container. Automatic follows the container, then the document.";
  TextBackgroundColorTooltip = "Text Background Color";
  TextBackgroundImageDialogPrompt = "Enter an image URL, data URI, or BASE64 value:";
  TextCellBackgroundColorCaption = "Cell Background Color";
  TextCellBackgroundImageCaption = "Cell Background Image";
  TextChangeImageCaption = "Change Image";
  TextCheckSpellingMenuCaption = "Check Spelling";
  TextChooseBackgroundImageDialogTitle = "Choose a Background Image";
  TextChooseCellBackgroundColorDialogTitle = "Choose Cell Background Color";
  TextChooseCellBackgroundImageDialogTitle = "Choose a Cell Background Image";
  TextChooseColorCaption = "Choose Color\u2026";
  TextChooseImageDialogTitle = "Choose an Image";
  TextChooseTextBackgroundColorDialogTitle = "Choose Text Background Color";
  TextChooseTextColorDialogTitle = "Choose Text Color";
  TextCodeToolbarTooltip = "Add Code Block";
  TextCorrectSpellingAutomaticallyMenuCaption = "Correct Spelling Automatically";
  TextDefaultImageCaption = "Image Caption";
  TextDividerToolbarTooltip = "Add Divider";
  TextDuplicateNodeTooltip = "Duplicate Node";
  TextEmojiAndSymbolsMenuCaption = "Emoji & Symbols\u2026";
  TextExternalIDCaption = "External ID";
  TextFontFamilyMenuCaption = "Font Family";
  TextFontSearchHint = "Search fonts";
  TextFontSearchTooltip = "Search available fonts";
  TextIgnoreSpellingMenuCaption = "Ignore Spelling";
  TextImageDownloadErrorMessage = "The image could not be downloaded.";
  TextImageFillModeCaption = "Image Fill Mode";
  TextImageRequestErrorMessage = "The image request could not be started.";
  TextImageToolbarTooltip = "Add Image";
  TextInsertNodeSearchTooltip = "Search registered node types";
  TextLanguageInspectorCaption = "Language";
  TextLearnSpellingMenuCaption = "Learn Spelling";
  TextLineHeightInspectorDescription = "Text line-height multiplier.";
  TextLineSpacingInspectorDescription = "Additional spacing between text lines.";
  TextLinkTitleHint = "Optional link title";
  TextListToolbarTooltip = "Add List";
  TextListTypeCaption = "List Type";
  TextMatchCaseTooltip = "Match Case";
  TextNoHighlightCaption = "No Highlight";
  TextNoMatchingFontsCaption = "No matching fonts";
  TextNoMatchingNodeTypesCaption = "No matching node types";
  TextNodeHeightFieldTooltip = "Enter a height from 1 to 10000";
  TextNodeWidthFieldTooltip = "Enter a width from 1 to 10000";
  TextOneMatchCaption = "1 match";
  TextOrderedCaption = "Ordered";
  TextPlainTextCaption = "Plain Text";
  TextPreviewCaption = "Preview";
  TextQuoteToolbarTooltip = "Add Quote";
  TextRegExTooltip = "Regular Expression";
  TextRemoveColorCaption = "Remove Color";
  TextRemoveFormattingTooltip = "Remove Formatting";
  TextRemoveSelectedNodeTooltip = "Remove Selected Node";
  TextRemoveSourceCaption = "Remove Source";
  TextSelectCaption = "Select\u2026";
  TextSourceCaption = "Source";
  TextSpellingMenuCaption = "Spelling";
  TextStrikethroughTooltip = "Strikethrough";
  TextTableCellCaption = "Table Cell";
  TextTargetCaption = "Target";
  TextTextAlignmentInspectorDescription = "Aligns the text inside this node. Automatic is left-aligned and does not follow the node or document alignment.";
  TextTextToolbarTooltip = "Add Text";
  TextToggleFooterRowCaption = "Toggle Footer Row";
  TextToggleHeaderRowCaption = "Toggle Header Row";
  TextUnmergeCellsCaption = "Unmerge Cells";
  TextUnorderedCaption = "Unordered";
  TextUnsupportedDownloadedImageMessage = "The downloaded resource is not a supported image.";
  TextWholeWordTooltip = "Whole Word";
  /**
   * Applies a locale pack. Accepts the locale pack format, an object of strings, a list of
   * either, or JSON text of any of these. Returns the number of values applied.
   */
  apply(pack) {
    let values = _Strings.#values(pack);
    return values ? this.#assign(values) : 0;
  }
  /**
   * Sets text by name. Text for a name that isn't known yet is kept for the add-on that
   * registers it later, but only known names are counted.
   */
  #assign(values) {
    let count = 0;
    for (let name of Object.keys(values)) {
      if (typeof this[name] == "string")
        count++;
      this[name] = values[name];
    }
    return count;
  }
  /** The text in a locale pack, an object of strings, or JSON text of either, or null when it is rejected. */
  static #values(pack) {
    let data = pack;
    if (typeof pack == "string") {
      if (pack.length == 0 || pack.length > _Strings.#maximumPackLength)
        return null;
      try {
        data = JSON.parse(pack);
      } catch {
        return null;
      }
    }
    if (Array.isArray(data)) {
      let merged = {};
      for (let item of data) {
        let values2 = item && typeof item == "object" ? _Strings.#values(item) : null;
        if (!values2)
          return null;
        Object.assign(merged, values2);
      }
      return merged;
    }
    if (!data || typeof data != "object")
      return null;
    let values = {};
    if ("strings" in data || "language" in data) {
      if (!_Strings.isValidLanguageTag(Utilities.string(data.language)))
        return null;
      let sections = data.strings;
      if (!sections || typeof sections != "object" || Array.isArray(sections))
        return null;
      for (let section of Object.keys(sections)) {
        let entries = sections[section];
        if (section.trim().length == 0 || section.length > 128)
          return null;
        if (!entries || typeof entries != "object")
          continue;
        if (Array.isArray(entries))
          return null;
        for (let name of Object.keys(entries)) {
          if (name == "Text" || !name.startsWith("Text"))
            continue;
          if (name.length > 128 || typeof entries[name] != "string" || entries[name].length > 65536)
            return null;
          let type = section.trim().split(".").pop().toLowerCase();
          if (type == "editor" || type == "inspector")
            values[name] = entries[name];
        }
      }
    } else {
      for (let name of Object.keys(data)) {
        if (name.startsWith("Text") && name != "Text" && typeof data[name] == "string")
          values[name] = data[name];
      }
    }
    return values;
  }
  static #maximumPackLength = 1048576;
  /** True for an empty tag or letters, digits and single hyphens, such as fr-CA; underscores count as hyphens. */
  static isValidLanguageTag(value) {
    value = value.trim().replace(/_/g, "-");
    if (value.length == 0)
      return true;
    return value.length <= 64 && /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/.test(value);
  }
};

// toolbaritem.ts
var ToolbarItemKinds = /* @__PURE__ */ ((ToolbarItemKinds2) => {
  ToolbarItemKinds2[ToolbarItemKinds2["button"] = 0] = "button";
  ToolbarItemKinds2[ToolbarItemKinds2["toggle"] = 1] = "toggle";
  ToolbarItemKinds2[ToolbarItemKinds2["menu"] = 2] = "menu";
  ToolbarItemKinds2[ToolbarItemKinds2["separator"] = 3] = "separator";
  ToolbarItemKinds2[ToolbarItemKinds2["flexibleSpace"] = 4] = "flexibleSpace";
  ToolbarItemKinds2[ToolbarItemKinds2["color"] = 5] = "color";
  return ToolbarItemKinds2;
})(ToolbarItemKinds || {});
var ToolbarMenuItem = class _ToolbarMenuItem {
  identifier;
  caption;
  icon;
  checked = false;
  enabled = true;
  isSeparator = false;
  /** Optional CSS applied to the caption, such as a font family for a font menu. */
  captionStyle = "";
  /** Value delivered with the menu item; defaults to the identifier. */
  value = null;
  /** Items shown in a submenu. A menu item with children opens them instead of being chosen. */
  children = [];
  constructor(identifier, caption = "", icon = "") {
    this.identifier = identifier;
    this.caption = caption;
    this.icon = icon;
  }
  get hasChildren() {
    return this.children.length > 0;
  }
  /** A menu item that opens a submenu of children. */
  static submenu(identifier, caption, icon, children) {
    let result = new _ToolbarMenuItem(identifier, caption, icon);
    result.children = children;
    result.enabled = children.some((child) => !child.isSeparator && child.enabled);
    return result;
  }
  static separator() {
    let result = new _ToolbarMenuItem("-");
    result.isSeparator = true;
    return result;
  }
};
var ToolbarItem = class _ToolbarItem extends EventTarget {
  identifier;
  caption;
  tooltip;
  /** A Bootstrap Icons or Font Awesome class list, such as "bi bi-type-bold". */
  icon;
  kind;
  menuItems = [];
  /** Shows the caption in the button even in icon-only mode. Used by menus such as Font. */
  alwaysShowCaption = false;
  /** Arbitrary application data. */
  tag = null;
  /**
   * For a menu that picks its value from a popup of its own, such as the table size grid: makes
   * the popup, which calls choose with a menu item carrying the value when the user picks one.
   */
  makePopup = null;
  #enabled = true;
  #active = false;
  #visible = true;
  #element = null;
  constructor(identifier, caption, icon = "", kind = 0 /* button */, tooltip = "") {
    super();
    this.identifier = identifier;
    this.caption = caption;
    this.icon = icon;
    this.kind = kind;
    this.tooltip = tooltip.length > 0 ? tooltip : caption;
  }
  static separator() {
    return new _ToolbarItem(`separator-${Utilities.uuid()}`, "", "", 3 /* separator */);
  }
  static flexibleSpace() {
    return new _ToolbarItem("flexiblespace", "", "", 4 /* flexibleSpace */);
  }
  get element() {
    return this.#element;
  }
  set element(value) {
    this.#element = value;
    this.#applyState();
  }
  get enabled() {
    return this.#enabled;
  }
  set enabled(value) {
    if (this.#enabled == value)
      return;
    this.#enabled = value;
    this.#applyState();
  }
  get active() {
    return this.#active;
  }
  set active(value) {
    if (this.#active == value)
      return;
    this.#active = value;
    this.#applyState();
  }
  get visible() {
    return this.#visible;
  }
  set visible(value) {
    if (this.#visible == value)
      return;
    this.#visible = value;
    this.#applyState();
  }
  /** Updates the tooltip of the item's button. */
  setTooltip(value) {
    this.tooltip = value;
    if (!this.#element)
      return;
    let button = this.#element.matches("button") ? this.#element : this.#element.querySelector("button");
    if (button) {
      button.setAttribute("title", value);
      button.setAttribute("aria-label", value);
    }
  }
  /** Updates the caption shown on a menu button, such as the current font name. */
  setDisplayCaption(value) {
    if (!this.#element)
      return;
    let label = this.#element.querySelector(".scv-toolbar-caption");
    if (label)
      label.textContent = value;
  }
  #applyState() {
    let element = this.#element;
    if (!element)
      return;
    let button = element.matches("button") ? element : element.querySelector("button");
    if (button) {
      button.disabled = !this.#enabled;
      button.classList.toggle("active", this.#active);
      button.setAttribute("aria-pressed", this.#active ? "true" : "false");
    }
    element.classList.toggle("d-none", !this.#visible);
  }
};
var ToolbarItems = class extends EventTarget {
  #items = [];
  add(item) {
    this.#items.push(item);
    this.dispatchEvent(new Event("changed"));
  }
  /** Replaces every item at once, with one changed event. */
  setItems(items) {
    this.#items = items.slice();
    this.dispatchEvent(new Event("changed"));
  }
  addAt(index, item) {
    index = Utilities.clamp(index, 0, this.#items.length);
    this.#items.splice(index, 0, item);
    this.dispatchEvent(new Event("changed"));
  }
  indexOf(item) {
    if (typeof item == "string")
      return this.#items.findIndex((candidate) => candidate.identifier == item);
    return this.#items.indexOf(item);
  }
  item(identifier) {
    return this.#items.find((candidate) => candidate.identifier == identifier) || null;
  }
  itemAt(index) {
    return this.#items[index] || null;
  }
  items() {
    return this.#items.slice();
  }
  get lastIndex() {
    return this.#items.length - 1;
  }
  remove(item) {
    let index = this.indexOf(item);
    if (index >= 0)
      this.removeAt(index);
  }
  removeAt(index) {
    if (index < 0 || index >= this.#items.length)
      return;
    this.#items.splice(index, 1);
    this.dispatchEvent(new Event("changed"));
  }
  removeAll() {
    this.#items = [];
    this.dispatchEvent(new Event("changed"));
  }
};

// node.ts
var Node3 = class _Node {
  /**
   * The files this node type makes nodes from when they are dropped or pasted into
   * the editor: MIME types, which may end in "/*", extensions such as ".csv", or "*" for any file.
   */
  static droppedFileTypes = [];
  /** Decides between node types that accept the same file: the highest wins. */
  static droppedFileImportPriority = 0;
  /** Makes a node from a dropped or pasted file, or returns null to decline it. */
  static importDroppedFile(_file, _editor) {
    return null;
  }
  static identifier = "content";
  static caption = "Content";
  static icon = "bi bi-square";
  static keywords = "";
  static insertable = true;
  static create(_editor) {
    return new this();
  }
  /** Makes nodes from an imported HTML element, or returns undefined to leave the element to other types. */
  static importElement(_element, _importer) {
    return void 0;
  }
  static markdownShortcuts = [];
  /** The entries this type adds to the block type menus: [identifier, caption, icon]. */
  static blockKinds(_strings, _compact) {
    return [];
  }
  nodeId = Utilities.uuid();
  editor = null;
  /** The container node that holds this node, or null at the document root. */
  parent = null;
  lineHeight = 1;
  lineSpacing = 0;
  /** Supplies this node's text suggestions ahead of the editor's providers. Not saved with the document. */
  suggestionProvider = null;
  /** Replaces the editor's font choices and available formats while this node is formatted. Not saved with the document. */
  fontOptions = null;
  alignment = 0 /* automatic */;
  direction = 0 /* automatic */;
  borderTop = _Node.defaultBorder();
  borderRight = _Node.defaultBorder();
  borderBottom = _Node.defaultBorder();
  borderLeft = _Node.defaultBorder();
  borderTopLeftRadius = 0;
  borderTopRightRadius = 0;
  borderBottomRightRadius = 0;
  borderBottomLeftRadius = 0;
  backgroundImage = new BackgroundImage();
  /** Explicit width in points, or 0 to follow the natural width. Only used when canResize is true. */
  width = 0;
  /** Explicit height in points, or 0 to follow the natural height. */
  height = 0;
  #locked = false;
  /**
   * Part of the document's fixed structure: saved with the node, and locked while the locking
   * add-on protects the document. Without that add-on, it's kept but has no effect.
   */
  fixed = false;
  /**
   * Locked nodes can't be edited, moved or deleted. Not saved. While collaborating, a
   * node is also locked when another user holds the lock on it, on a node containing
   * it, or on a node it contains.
   */
  get locked() {
    return this.#locked || !!this.editor && this.editor.isLockedByCollaborator(this);
  }
  set locked(value) {
    this.#locked = value;
  }
  /** The rendered wrapper, while the node is in an editor. */
  element = null;
  /** The rendered content inside the wrapper. */
  body = null;
  #hosts = [];
  static defaultBorder() {
    return { visible: false, size: 1, color: Colors.empty };
  }
  get type() {
    return this.constructor.identifier;
  }
  get typeName() {
    return this.constructor.caption;
  }
  get strings() {
    return this.editor ? this.editor.strings : Strings.shared;
  }
  /** True when users can drag the node's resize handle. */
  get canResize() {
    return false;
  }
  /** True when the node toolbar offers Width and Height. */
  get toolbarCanResize() {
    return this.canResize;
  }
  /** False for nodes whose height follows their width, so the toolbar offers Width alone. */
  get toolbarResizesHeight() {
    return true;
  }
  /** The size the node toolbar shows: the explicit size, or the drawn size when it follows its content. */
  toolbarSize() {
    let rect = this.body ? this.body.getBoundingClientRect() : null;
    return { width: this.width > 0 ? this.width : rect ? rect.width : 0, height: this.height > 0 ? this.height : rect ? rect.height : 0 };
  }
  /** Sets a dimension from the node toolbar. Zero returns it to the natural size. */
  setToolbarSize(dimension, value) {
    if (dimension == "width")
      this.width = Math.max(0, value);
    if (dimension == "height")
      this.height = Math.max(0, value);
  }
  /** True when the node can be narrower than its container, so it can be aligned within it. */
  get canAlignBlock() {
    return this.canResize;
  }
  /** The inspector's sections for this node. Override to add or change sections; call super to keep the built-in ones. */
  inspectorSections() {
    return InspectorDefaults.sections(this);
  }
  /** True when the inspector's items depend on which of the node's hosts has the caret, such as a table's active cell. */
  get inspectorFollowsCaret() {
    return false;
  }
  /** Handles an action item that has no action of its own. Return true when handled. */
  inspectorAction(_item) {
    return false;
  }
  /** True for nodes whose main content is a paragraph of text that can be split, merged and converted. */
  get isTextual() {
    return false;
  }
  /** Editable text regions, in order. Set while the node builds. */
  hosts() {
    return this.#hosts;
  }
  get primaryHost() {
    return this.#hosts[0] || null;
  }
  /** Lists of child nodes this node contains. */
  childLists() {
    return [];
  }
  /** True when the child nodes are document-level blocks, which get the insertion gutter and drop targets. */
  get holdsBlocks() {
    return false;
  }
  /** Shows content that is hidden, such as a collapsed section's children, when a descendant is selected. */
  revealContent() {
  }
  /** Where a node inserted while host has the caret goes, or null to insert it after this node. */
  insertionPoint(_host) {
    return null;
  }
  /** Called when one of the node's hosts gets the caret. */
  noteCaretHost(_host) {
  }
  /** Called after the user inserts a new node of this type, to ask for its content. */
  inserted() {
  }
  /** True for nodes that show the document's headings, which are refreshed when headings change. */
  get followsHeadings() {
    return false;
  }
  /** Reads type-specific styles from the element the node was imported from. */
  readImportedStyle(_style) {
  }
  /** The block kind the toolbar shows, such as "text" or "heading:2". */
  get blockKind() {
    return this.type;
  }
  /** Every descendant, depth first. */
  descendants() {
    let result = [];
    this.childLists().forEach((list) => list.forEach((child) => {
      result.push(child);
      result.push(...child.descendants());
    }));
    return result;
  }
  /** The node's position: its list and the index in it. */
  location() {
    if (!this.editor)
      return null;
    let list = this.editor.listContaining(this);
    if (!list)
      return null;
    return { list, index: list.indexOf(this) };
  }
  addHost(host) {
    host.index = this.#hosts.length;
    this.#hosts.push(host);
    host.editable = this.editor ? this.editor.isEditingNode(this) : false;
    return host;
  }
  /** Builds the node's DOM. The editor calls this; use refresh to rebuild an attached node. */
  render() {
    this.#hosts = [];
    let wrapper = Utilities.element("div", `scv-node scv-node-${this.type}`);
    wrapper.dataset.nodeId = this.nodeId;
    wrapper.dataset.type = this.type;
    let body = Utilities.element("div", "scv-node-body");
    wrapper.append(body);
    this.element = wrapper;
    this.body = body;
    this.build(body);
    this.applyAppearance(wrapper, body);
    return wrapper;
  }
  /** Rebuilds the node in place, keeping the selection in its text when possible. */
  refresh() {
    if (this.editor) {
      this.editor.refreshNode(this);
    } else if (this.element) {
      let old = this.element;
      old.replaceWith(this.render());
    }
  }
  /** Creates the node's content inside body. */
  build(_body) {
  }
  /** Applies the common Node appearance: borders, corners, background image, size, alignment and direction. */
  applyAppearance(wrapper, body) {
    let style = body.style;
    let sides = [["Top", this.borderTop], ["Right", this.borderRight], ["Bottom", this.borderBottom], ["Left", this.borderLeft]];
    let hasBorder = false;
    sides.forEach(([side, border]) => {
      if (border.visible && border.size > 0) {
        style[`border${side}`] = `${border.size}px solid ${Colors.isEmpty(border.color) ? "var(--bs-border-color)" : Colors.toCSS(border.color)}`;
        hasBorder = true;
      }
    });
    if (this.hasCornerRadius) {
      style.borderRadius = `${this.borderTopLeftRadius}px ${this.borderTopRightRadius}px ${this.borderBottomRightRadius}px ${this.borderBottomLeftRadius}px`;
      style.overflow = "hidden";
    }
    if (!this.backgroundImage.isEmpty)
      body.setAttribute("style", body.getAttribute("style") + ";" + this.backgroundImage.toCSS());
    if (hasBorder || !this.backgroundImage.isEmpty)
      body.classList.add("scv-decorated");
    if (this.direction == 2 /* rightToLeft */)
      wrapper.dir = "rtl";
    if (this.direction == 1 /* leftToRight */)
      wrapper.dir = "ltr";
    if (this.lineHeight != 1 || this.lineSpacing != 0) {
      body.style.lineHeight = this.lineSpacing == 0 ? String(this.lineHeight * 1.5) : `calc(${this.lineHeight * 1.5}em + ${this.lineSpacing}px)`;
    }
    if (this.canResize && this.width > 0)
      body.style.width = `${this.width}px`;
    if (this.canResize && this.height > 0)
      body.style.height = `${this.height}px`;
    let alignment = this.resolvedAlignment();
    wrapper.classList.toggle("scv-align-center", alignment == 2 /* middle */);
    wrapper.classList.toggle("scv-align-end", alignment == 3 /* trailing */);
  }
  get hasCornerRadius() {
    return this.borderTopLeftRadius > 0 || this.borderTopRightRadius > 0 || this.borderBottomRightRadius > 0 || this.borderBottomLeftRadius > 0;
  }
  /** The block alignment, resolving Automatic to the editor's alignment. */
  resolvedAlignment() {
    if (this.alignment != 0 /* automatic */)
      return this.alignment;
    return this.editor ? this.editor.alignment : 1 /* leading */;
  }
  /** Called after a host read edited text from the DOM. */
  textChanged(_host) {
  }
  /** Tells the editor the node's content or persistent properties changed. */
  changed() {
    if (this.editor)
      this.editor.nodeChanged(this);
  }
  /** Records an undo step before the node changes itself, such as from a toolbar action. */
  willChange() {
    if (this.editor)
      this.editor.history.checkpoint();
  }
  // Contextual toolbar
  /** Node-specific items for the contextual toolbar. */
  actions() {
    return [];
  }
  /** Handles one of the items returned by actions. Returns true when handled. */
  performAction(_item, _menuItem) {
    return false;
  }
  /**
   * Extra entries for the editor's context menu, after the clipboard commands and
   * the node's actions. Build them each time, so they reflect the node's state.
   */
  contextMenuItems() {
    return [];
  }
  /** Handles one of the entries returned by contextMenuItems. Returns true when handled. */
  performContextMenuItem(_item) {
    return false;
  }
  /** Handles a key press while one of the node's hosts has focus. Return true to stop the editor's handling. */
  handleKeyDown(_event, _host) {
    return false;
  }
  /** Handles a click in the node. Return true to stop the editor's handling. */
  handleClick(_event) {
    return false;
  }
  // Persistence
  toJSON() {
    let result = { nodeId: this.nodeId, type: this.type };
    if (this.lineHeight != 1)
      result["lineHeight"] = this.lineHeight;
    if (this.lineSpacing != 0)
      result["lineSpacing"] = this.lineSpacing;
    if (this.alignment != 0 /* automatic */)
      result["alignment"] = this.alignment;
    if (this.direction != 0 /* automatic */)
      result["direction"] = this.direction;
    let sides = [["Top", this.borderTop], ["Right", this.borderRight], ["Bottom", this.borderBottom], ["Left", this.borderLeft]];
    sides.forEach(([side, border]) => {
      if (border.visible)
        result[`border${side}Visible`] = true;
      if (border.size != 1)
        result[`border${side}Size`] = border.size;
      if (!Colors.isEmpty(border.color))
        result[`border${side}Color`] = Colors.toJSON(border.color);
    });
    if (this.borderTopLeftRadius != 0)
      result["borderTopLeftRadius"] = this.borderTopLeftRadius;
    if (this.borderTopRightRadius != 0)
      result["borderTopRightRadius"] = this.borderTopRightRadius;
    if (this.borderBottomRightRadius != 0)
      result["borderBottomRightRadius"] = this.borderBottomRightRadius;
    if (this.borderBottomLeftRadius != 0)
      result["borderBottomLeftRadius"] = this.borderBottomLeftRadius;
    if (!this.backgroundImage.isEmpty)
      result["backgroundImage"] = this.backgroundImage.toJSON();
    if (this.width > 0)
      result["width"] = this.width;
    if (this.height > 0)
      result["height"] = this.height;
    if (this.fixed)
      result["fixed"] = true;
    return result;
  }
  /** Restores the node. Missing names restore their defaults. Returns false when data can't be used. */
  fromJSON(data) {
    if (!data || typeof data != "object")
      return false;
    let identifier = Utilities.string(data.nodeId).trim();
    if (identifier.length > 0)
      this.nodeId = identifier;
    this.lineHeight = Utilities.number(data.lineHeight, 1);
    this.lineSpacing = Utilities.number(data.lineSpacing, 0);
    let alignment = Utilities.integer(data.alignment, 0);
    this.alignment = alignment >= 0 && alignment <= 3 ? alignment : 0 /* automatic */;
    let direction = Utilities.integer(data.direction, 0);
    this.direction = direction >= 0 && direction <= 2 ? direction : 0 /* automatic */;
    let sides = ["Top", "Right", "Bottom", "Left"];
    sides.forEach((side) => {
      this[`border${side}`] = {
        visible: Utilities.boolean(data[`border${side}Visible`], false),
        size: Math.max(0, Utilities.number(data[`border${side}Size`], 1)),
        color: Colors.fromJSON(data[`border${side}Color`], Colors.empty)
      };
    });
    this.borderTopLeftRadius = Math.max(0, Utilities.number(data.borderTopLeftRadius, 0));
    this.borderTopRightRadius = Math.max(0, Utilities.number(data.borderTopRightRadius, 0));
    this.borderBottomRightRadius = Math.max(0, Utilities.number(data.borderBottomRightRadius, 0));
    this.borderBottomLeftRadius = Math.max(0, Utilities.number(data.borderBottomLeftRadius, 0));
    this.backgroundImage = data.backgroundImage ? BackgroundImage.fromJSON(data.backgroundImage) : new BackgroundImage();
    this.width = Math.max(0, Utilities.number(data.width, 0));
    this.height = Math.max(0, Utilities.number(data.height, 0));
    this.fixed = Utilities.boolean(data.fixed, false);
    return true;
  }
  /** Copies the common Node properties to another node, such as when converting a paragraph into a heading. */
  copyAppearanceTo(other) {
    let data = _Node.prototype.toJSON.call(this);
    delete data["nodeId"];
    delete data["type"];
    _Node.prototype.fromJSON.call(other, Object.assign({ nodeId: other.nodeId }, data));
  }
  // Export
  toHTML() {
    return "";
  }
  toMarkdown() {
    return this.toHTML();
  }
  /** The node's own text before it is drawn, such as in a headless editor, where it has no text hosts. */
  undrawnTexts() {
    return [];
  }
  /** The node's own texts, drawn or not, without those of nodes inside it. */
  texts() {
    return this.hosts().length > 0 ? this.hosts().map((host) => host.rich) : this.undrawnTexts();
  }
  toPlainText() {
    let parts = [];
    this.texts().forEach((rich) => {
      if (rich.text.length > 0)
        parts.push(rich.text.replace(/\u2028/g, "\n"));
    });
    this.childLists().forEach((list) => list.forEach((child) => {
      let value = child.toPlainText();
      if (value.length > 0)
        parts.push(value);
    }));
    return parts.join("\n");
  }
  /** Whether the node writes anything into exported HTML. */
  get canExportHTML() {
    return true;
  }
  /** Common CSS for exported HTML: background image, borders, corners, direction and block alignment. */
  htmlBackgroundCSS() {
    let result = "";
    if (!this.backgroundImage.isEmpty)
      result += this.backgroundImage.toCSS() + ";";
    let sides = [["top", this.borderTop], ["right", this.borderRight], ["bottom", this.borderBottom], ["left", this.borderLeft]];
    sides.forEach(([side, border]) => {
      if (border.visible && border.size > 0)
        result += `border-${side}:${border.size}px solid ${Colors.toCSS(border.color)};`;
    });
    if (this.hasCornerRadius) {
      let corners = [this.borderTopLeftRadius, this.borderTopRightRadius, this.borderBottomRightRadius, this.borderBottomLeftRadius];
      result += corners.every((value) => value == corners[0]) ? `border-radius:${corners[0]}px;` : `border-radius:${corners.join("px ")}px;`;
    }
    if (this.direction == 2 /* rightToLeft */)
      result += "direction:rtl;unicode-bidi:isolate;";
    if (this.direction == 1 /* leftToRight */)
      result += "direction:ltr;unicode-bidi:isolate;";
    let alignment = this.resolvedAlignment();
    if (alignment == 2 /* middle */) {
      result += "margin-left:auto;margin-right:auto;";
    } else if (alignment == 3 /* trailing */) {
      result += "margin-inline-start:auto;margin-inline-end:0;";
    }
    return result;
  }
  htmlLineHeightCSS() {
    if (this.lineHeight == 1 && this.lineSpacing == 0)
      return "";
    let height = Number((this.lineHeight * NormalLineHeightRatio).toFixed(4));
    if (this.lineSpacing == 0)
      return `line-height:${height};`;
    return `line-height:calc(${height}em + ${this.lineSpacing}px);`;
  }
  /** Wraps Markdown in an HTML element when the node has a background or border Markdown can't express. */
  markdownWithBackground(markdown) {
    let css = this.htmlBackgroundCSS().replace(/margin-[a-z-]+:[^;]+;/g, "");
    if (css.length == 0)
      return markdown;
    return `<div style="${Utilities.escapeAttribute(css)}">

${markdown}

</div>`;
  }
};

// nodes/textnode.ts
var TextNode2 = class _TextNode extends Node3 {
  /** Adds this node type's rules to the HTML export stylesheet. Called once per type in the document. */
  static exportStyles(sheet, _editor) {
    sheet.addRule("p", "white-space: pre-wrap; overflow-wrap: anywhere");
  }
  static identifier = "text";
  static caption = "Text";
  static icon = "bi bi-text-paragraph";
  static keywords = "paragraph body plain";
  static create(editor) {
    let result = new this();
    result.editor = editor;
    return result;
  }
  content = new RichText();
  fontName = "";
  fontSize = 0;
  bold = false;
  italic = false;
  underline = false;
  textAlignment = 0 /* automatic */;
  constructor(text = "") {
    super();
    this.content = new RichText(text);
  }
  get isTextual() {
    return true;
  }
  static blockKinds(strings, _compact) {
    return [["text", strings.TextTextCaption, "bi bi-text-paragraph"]];
  }
  /** Makes a block of this type from another text block's plain content, when converting blocks. */
  static fromBlockContent(content, _value, source) {
    let result = new this();
    result.content = content;
    source.copyAppearanceTo(result);
    result.textAlignment = source.textAlignment;
    return [result];
  }
  /**
   * True for ordinary text blocks, which can be converted to other block types, split
   * to insert content, and joined with neighboring text. False for blocks whose text
   * is a caption for other content, such as a collapsible section's summary.
   */
  get isTextBlock() {
    return true;
  }
  /** True when Delete at the end joins the following text into this block, and this block into the one before. */
  get joinsForward() {
    return this.isTextBlock;
  }
  /** True when Backspace at the start turns the block into a paragraph before joining it to the one before. */
  get becomesTextOnBackspace() {
    return this.constructor !== _TextNode;
  }
  /** True when the text keeps line feeds as paragraphs, such as list items or code, instead of turning them into line breaks. */
  get keepsParagraphs() {
    return false;
  }
  /** Whether the inspector offers the block's text and its typography. */
  get inspectorShowsText() {
    return true;
  }
  get inspectorShowsTypography() {
    return true;
  }
  /** Adjusts content that replaces this block's text from the inspector, which has paragraphs paragraphs. */
  prepareReplacementContent(_replacement, _paragraphs) {
  }
  /** Text from another block that is being joined onto the end of this one, adjusted to this block's kind. */
  joinedContent(addition) {
    return addition;
  }
  /** The content without this block type's own styling, for converting it into another type. */
  undrawnTexts() {
    return [this.content];
  }
  plainContent() {
    let content = this.content.clone();
    content.headingLevel = 0;
    content.alertType = 0;
    content.listType = 0;
    content.listLevels = [];
    content.listChecked = [];
    return content;
  }
  /**
   * Converts this block for setBlockType when the block handles the conversion itself,
   * or returns null to make a block of the requested type from its plain content.
   * Choosing a block's own type turns it back into a paragraph.
   */
  convertBlock(kind, _value) {
    if (kind == this.type && kind != "text")
      return _TextNode.fromBlockContent(this.plainContent(), 0, this);
    return null;
  }
  inspectorSections() {
    return InspectorDefaults.text(this);
  }
  get text() {
    return this.content.text;
  }
  set text(value) {
    this.content.text = value;
    this.content.styles = [];
    for (let index = 0; index < value.length; index++)
      this.content.styles.push(this.baseStyle());
    if (this.primaryHost)
      this.primaryHost.render();
  }
  /** The element that holds the editable text. */
  get tagName() {
    return "p";
  }
  get hostMode() {
    return 0 /* inline */;
  }
  /** Placeholder shown while the text is empty. */
  get placeholderText() {
    return this.strings.TextDefaultTextCaption;
  }
  /** The style new text receives when the paragraph is empty. */
  baseStyle() {
    return new TextStyle();
  }
  build(body) {
    let element = document.createElement(this.tagName);
    body.append(element);
    let host = this.addHost(new TextHost(this, this.content, element, this.hostMode));
    host.placeholder = this.placeholderText;
    this.applyTextAppearance(element);
    host.render();
  }
  applyTextAppearance(element) {
    if (this.fontName.length > 0)
      element.style.fontFamily = Utilities.fontFamilyCSS(this.fontName);
    if (this.fontSize > 0)
      element.style.fontSize = `${this.fontSize}px`;
    if (this.bold)
      element.style.fontWeight = "bold";
    if (this.italic)
      element.style.fontStyle = "italic";
    if (this.underline)
      element.style.textDecoration = "underline";
    element.style.textAlign = _TextNode.cssAlignment(this.resolvedTextAlignment());
  }
  resolvedTextAlignment() {
    if (this.textAlignment != 0 /* automatic */)
      return this.textAlignment;
    return this.editor ? this.editor.textAlignment : 1 /* leading */;
  }
  static cssAlignment(value) {
    switch (value) {
      case 2 /* middle */:
        return "center";
      case 3 /* trailing */:
        return "end";
    }
    return "start";
  }
  /** Creates the node that Enter splits off the end of this one. Paragraphs follow most blocks. */
  createFollowingNode() {
    return new _TextNode();
  }
  toJSON() {
    let result = super.toJSON();
    if (this.bold)
      result["bold"] = true;
    if (this.fontName.length > 0)
      result["fontName"] = this.fontName;
    if (this.fontSize != 0)
      result["fontSize"] = this.fontSize;
    if (this.italic)
      result["italic"] = true;
    if (this.textAlignment != 0 /* automatic */)
      result["textAlignment"] = this.textAlignment;
    if (this.underline)
      result["underline"] = true;
    result["content"] = this.content.toJSON();
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.bold = Utilities.boolean(data.bold, false);
    this.fontName = Utilities.string(data.fontName);
    this.fontSize = Utilities.number(data.fontSize, 0);
    this.italic = Utilities.boolean(data.italic, false);
    this.underline = Utilities.boolean(data.underline, false);
    let alignment = Utilities.integer(data.textAlignment, 0);
    this.textAlignment = alignment >= 0 && alignment <= 3 ? alignment : 0 /* automatic */;
    this.content = RichText.fromJSON(data.content, (item) => this.editor ? this.editor.nodeFromJSON(item) : null);
    return true;
  }
  htmlTextAlignmentCSS() {
    return `text-align:${_TextNode.cssAlignment(this.resolvedTextAlignment())};`;
  }
  toHTML() {
    return `<p style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}${this.htmlLineHeightCSS()}">${this.content.htmlText()}</p>`;
  }
  toMarkdown() {
    return this.markdownWithBackground(this.content.markdownText());
  }
};
var HeadingLevels = /* @__PURE__ */ ((HeadingLevels2) => {
  HeadingLevels2[HeadingLevels2["heading1"] = 1] = "heading1";
  HeadingLevels2[HeadingLevels2["heading2"] = 2] = "heading2";
  HeadingLevels2[HeadingLevels2["heading3"] = 3] = "heading3";
  HeadingLevels2[HeadingLevels2["heading4"] = 4] = "heading4";
  HeadingLevels2[HeadingLevels2["heading5"] = 5] = "heading5";
  HeadingLevels2[HeadingLevels2["heading6"] = 6] = "heading6";
  return HeadingLevels2;
})(HeadingLevels || {});
var HeadingNode = class _HeadingNode extends TextNode2 {
  static exportStyles(sheet, editor) {
    super.exportStyles(sheet, editor);
    sheet.addRule("h1, h2, h3, h4, h5, h6", `display: block; width: 100%; max-width: 100%; padding: 16px; color: ${Editor2.themeCSS(editor, 8 /* text */)}; font-weight: 700; overflow-wrap: anywhere; line-height: 1.25`);
  }
  static identifier = "heading";
  static caption = "Heading";
  static icon = "bi bi-type-h1";
  static keywords = "title h1 h2 h3 h4 h5 h6 section";
  static create(editor) {
    let result = new _HeadingNode("", 2 /* heading2 */);
    result.editor = editor;
    return result;
  }
  constructor(text = "", level = 2 /* heading2 */) {
    super(text);
    this.content.headingLevel = 0;
    this.level = level;
  }
  static markdownShortcuts = [{ pattern: /^(#{1,6}) /, value: (match) => match[1].length }];
  static blockKinds(strings, compact) {
    let levels = compact ? [1, 2, 3] : [1, 2, 3, 4, 5, 6];
    return levels.map((level) => [`heading:${level}`, Utilities.format(strings.TextHeadingLevelCaption, { level }), `bi bi-type-h${level}`]);
  }
  static fromBlockContent(content, value, source) {
    let heading = new _HeadingNode("", 2 /* heading2 */);
    heading.content = content;
    heading.content.headingLevel = 0;
    heading.level = value || 2;
    source.copyAppearanceTo(heading);
    heading.textAlignment = source.textAlignment;
    return [heading];
  }
  static importElement(element, importer) {
    if (!/^H[1-6]$/.test(element.tagName))
      return void 0;
    let level = Number(element.tagName.substring(1));
    let heading = new _HeadingNode("", level);
    heading.content = importer.trimmed(importer.richText(Array.from(element.childNodes)));
    heading.content.headingLevel = 0;
    heading.level = level;
    heading.content.styles.forEach((style) => {
      style.bold = true;
      style.fontSize = _HeadingNode.fontSizeForLevel(heading.level);
    });
    importer.readAlignment(element, heading);
    return importer.attach(heading);
  }
  get blockKind() {
    return `heading:${this.level}`;
  }
  convertBlock(kind, value) {
    if (kind != "heading" || this.level == value)
      return super.convertBlock(kind, value);
    this.level = value;
    return [this];
  }
  plainContent() {
    let content = super.plainContent();
    let size = _HeadingNode.fontSizeForLevel(this.level);
    content.styles.forEach((style) => {
      if (style.fontSize == size)
        style.fontSize = 0;
      style.bold = false;
    });
    return content;
  }
  joinedContent(addition) {
    addition.styles.forEach((style) => {
      style.bold = true;
      style.fontSize = _HeadingNode.fontSizeForLevel(this.level);
    });
    return addition;
  }
  inspectorSections() {
    let strings = this.strings;
    let level = InspectorItem2.menu("level", strings.TextLevelCaption, [1, 2, 3, 4, 5, 6].map((value) => [Utilities.format(strings.TextHeadingLevelCaption, { level: value }), value]), (target) => target.level, (target, value) => target.level = value);
    level.setDefaultValue(2 /* heading2 */);
    return [InspectorDefaults.section("heading", strings.TextHeadingCaption, [level])].concat(InspectorDefaults.text(this));
  }
  static fontSizeForLevel(level) {
    return [32, 32, 28, 24, 20, 18, 16][Utilities.clamp(level, 1, 6)];
  }
  get level() {
    return Utilities.clamp(this.content.headingLevel || 2, 1, 6);
  }
  set level(value) {
    value = Utilities.clamp(Math.trunc(value), 1, 6);
    if (this.content.headingLevel == value)
      return;
    this.content.headingLevel = value;
    this.fontSize = _HeadingNode.fontSizeForLevel(value);
    this.bold = true;
    this.content.styles.forEach((style) => {
      style.fontSize = this.fontSize;
      style.bold = true;
    });
  }
  /** The fragment identifier a table of contents links to. */
  get anchor() {
    if (!this.editor)
      return Utilities.slug(this.text);
    return this.editor.anchorFor(this);
  }
  baseStyle() {
    let result = new TextStyle();
    result.bold = true;
    result.fontSize = _HeadingNode.fontSizeForLevel(this.level);
    return result;
  }
  get tagName() {
    return `h${this.level}`;
  }
  get placeholderText() {
    return Utilities.format(this.strings.TextHeadingLevelCaption, { level: this.level });
  }
  textChanged(_host) {
    let size = _HeadingNode.fontSizeForLevel(this.level);
    this.content.styles.forEach((style) => {
      if (style.fontSize == 0) {
        style.fontSize = size;
        style.bold = true;
      }
    });
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    let level = this.content.headingLevel;
    this.content.headingLevel = level >= 1 && level <= 6 ? level : 2;
    if (this.fontSize == 0)
      this.fontSize = _HeadingNode.fontSizeForLevel(this.content.headingLevel);
    this.bold = true;
    return true;
  }
  actions() {
    let item = new ToolbarItem("headinglevel", `H${this.level}`, "", 2 /* menu */, this.strings.TextHeadingCaption);
    item.alwaysShowCaption = true;
    for (let level = 1; level <= 6; level++) {
      let menuItem = new ToolbarMenuItem(String(level), Utilities.format(this.strings.TextHeadingLevelCaption, { level }), `bi bi-type-h${level}`);
      menuItem.checked = level == this.level;
      item.menuItems.push(menuItem);
    }
    return [item];
  }
  performAction(item, menuItem) {
    if (item.identifier == "headinglevel" && menuItem) {
      this.willChange();
      this.level = Number(menuItem.identifier);
      this.refresh();
      this.changed();
      return true;
    }
    return false;
  }
  toHTML() {
    let tag = `h${this.level}`;
    let anchor = this.anchor;
    let id = anchor.length > 0 ? ` id="${Utilities.escapeAttribute(anchor)}"` : "";
    return `<${tag}${id} style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}${this.htmlLineHeightCSS()}">${this.content.htmlText()}</${tag}>`;
  }
  toMarkdown() {
    return this.markdownWithBackground(`${"#".repeat(this.level)} ${this.content.markdownText(0, this.content.length, true)}`);
  }
};

// nodes/codeblocknode.ts
var CodeBlockNode = class _CodeBlockNode extends TextNode2 {
  static exportStyles(sheet, editor) {
    super.exportStyles(sheet, editor);
    sheet.addRule("pre", `margin-left: 0; margin-right: 0; padding: 16px; overflow-x: auto; border-radius: 8px; background: ${Editor2.themeCSS(editor, 14 /* dark */)}; color: ${Editor2.themeCSS(editor, 15 /* light */)}; white-space: pre`);
    sheet.addRule("pre code", "font-family: Menlo, Courier, monospace; font-size: 14px");
  }
  static identifier = "codeblock";
  static caption = "Code";
  static icon = "bi bi-code-square";
  static keywords = "source program snippet pre monospace";
  static languages = ["", "bash", "c", "cpp", "csharp", "css", "go", "html", "java", "javascript", "json", "kotlin", "markdown", "php", "python", "ruby", "rust", "sql", "swift", "typescript", "xml", "yaml"];
  static markdownShortcuts = [{ pattern: /^```$/ }];
  static blockKinds(strings, _compact) {
    return [["codeblock", strings.TextCodeInspectorCaption, "bi bi-code-square"]];
  }
  static fromBlockContent(_content, _value, source) {
    let code = new this();
    code.content = new RichText(source.content.text.replace(/\u2028/g, "\n"));
    source.copyAppearanceTo(code);
    return [code];
  }
  static importElement(element, importer) {
    if (element.tagName != "PRE")
      return void 0;
    let code = element.querySelector("code");
    let source = code || element;
    let match = (source.className || "").match(/language-([\w+#-]+)/);
    let node = new _CodeBlockNode();
    node.content = new RichText((source.textContent || "").replace(/\n$/, ""));
    node.language = match ? match[1] : "";
    return importer.attach(node);
  }
  language = "";
  tabWidth = 2;
  get keepsParagraphs() {
    return true;
  }
  get inspectorShowsTypography() {
    return false;
  }
  plainContent() {
    return new RichText(this.content.text.replace(/\n/g, LineBreak));
  }
  joinedContent(addition) {
    return new RichText(addition.text.replace(/\u2028/g, "\n"));
  }
  inspectorSections() {
    let strings = this.strings;
    let language = new InspectorItem2("language", strings.TextLanguageCaption, "language", 1 /* text */);
    let tabWidth = InspectorItem2.number("tabwidth", strings.TextTabWidthInspectorCaption, (target) => target.tabWidth, (target, value) => target.tabWidth = Math.max(1, Math.round(value)), 1, 16, 1);
    tabWidth.setDefaultValue(2);
    return [InspectorDefaults.section("code", strings.TextCodeInspectorCaption, [language, tabWidth])].concat(InspectorDefaults.text(this));
  }
  get hostMode() {
    return 3 /* plain */;
  }
  get placeholderText() {
    return this.strings.TextCodeInspectorCaption;
  }
  build(body) {
    let frame = Utilities.element("div", "scv-code");
    body.append(frame);
    let header = Utilities.element("div", "scv-code-header", { contenteditable: "false" });
    frame.append(header);
    let language = Utilities.element("input", "scv-code-language form-control form-control-sm", { type: "text", list: "scv-code-languages", placeholder: this.strings.TextLanguageCaption, "aria-label": this.strings.TextLanguageCaption });
    language.value = this.language;
    language.readOnly = this.editor ? this.editor.readOnly : false;
    language.addEventListener("change", () => {
      this.willChange();
      this.language = language.value.trim();
      this.changed();
    });
    header.append(language);
    if (!document.getElementById("scv-code-languages")) {
      let list = Utilities.element("datalist", "", { id: "scv-code-languages" });
      _CodeBlockNode.languages.forEach((name) => {
        if (name.length > 0)
          list.append(new Option(name));
      });
      document.body.append(list);
    }
    let copy = Utilities.element("button", "btn btn-sm btn-link scv-code-copy", { type: "button", title: this.strings.TextCopyCodeTooltip });
    copy.innerHTML = `<i class="bi bi-clipboard"></i>`;
    copy.addEventListener("click", () => {
      navigator.clipboard?.writeText(this.content.text);
      copy.innerHTML = `<i class="bi bi-clipboard-check"></i>`;
      setTimeout(() => copy.innerHTML = `<i class="bi bi-clipboard"></i>`, 1200);
    });
    header.append(copy);
    let pre = Utilities.element("pre", "scv-code-body");
    pre.tabIndex = 0;
    pre.setAttribute("role", "region");
    pre.setAttribute("aria-label", this.typeName);
    frame.append(pre);
    let code = document.createElement("code");
    pre.append(code);
    let host = this.addHost(new TextHost(this, this.content, code, 3 /* plain */));
    host.placeholder = this.placeholderText;
    host.render();
  }
  handleKeyDown(event, host) {
    if (!host || host !== this.primaryHost)
      return false;
    let selection = host.selection();
    if (!selection)
      return false;
    let text = this.content.text;
    if (event.key == "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      let paragraph = new TextNode2();
      this.editor.insertNodesAfter(this, [paragraph]);
      this.editor.focusNode(paragraph, 0);
      return true;
    }
    if (event.key == "Enter" && !event.altKey) {
      event.preventDefault();
      this.willChange();
      let lineStart = text.lastIndexOf("\n", selection.start - 1) + 1;
      let indentation = text.substring(lineStart, selection.start).match(/^[ \t]*/)[0];
      this.content.remove(selection.start, selection.end);
      this.content.insert(selection.start, "\n" + indentation, new TextStyle());
      host.render();
      host.select(selection.start + 1 + indentation.length);
      this.changed();
      return true;
    }
    if (event.key == "Tab" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.willChange();
      let spaces = " ".repeat(Math.max(1, this.tabWidth));
      let lineStart = text.lastIndexOf("\n", selection.start - 1) + 1;
      if (selection.start == selection.end && !event.shiftKey) {
        this.content.insert(selection.start, spaces, new TextStyle());
        host.render();
        host.select(selection.start + spaces.length);
      } else {
        let lines = text.substring(lineStart, selection.end).split("\n");
        let firstDelta = 0;
        let totalDelta = 0;
        let changedLines = lines.map((line, index) => {
          let delta = 0;
          let result = line;
          if (event.shiftKey) {
            let leading = line.match(/^ */)[0].length;
            let removed = Math.min(leading, spaces.length);
            result = line.substring(removed);
            delta = -removed;
          } else {
            result = spaces + line;
            delta = spaces.length;
          }
          if (index == 0)
            firstDelta = delta;
          totalDelta += delta;
          return result;
        });
        this.content.remove(lineStart, selection.end);
        this.content.insert(lineStart, changedLines.join("\n"), new TextStyle());
        host.render();
        host.select(Math.max(lineStart, selection.start + firstDelta), selection.end + totalDelta);
      }
      this.changed();
      return true;
    }
    return false;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.language = Utilities.string(data.language);
    this.tabWidth = Math.max(1, Utilities.integer(data.tabWidth, 2));
    this.content.styles = this.content.styles.map(() => new TextStyle());
    return true;
  }
  toJSON() {
    let result = super.toJSON();
    if (this.language.length > 0)
      result["language"] = this.language;
    if (this.tabWidth != 2)
      result["tabWidth"] = this.tabWidth;
    return result;
  }
  toHTML() {
    let classAttribute = this.language.length > 0 ? ` class="language-${Utilities.escapeAttribute(this.language)}"` : "";
    return `<pre style="${this.htmlBackgroundCSS()}"><code${classAttribute}>${Utilities.escapeText(this.content.text)}</code></pre>`;
  }
  toMarkdown() {
    let longest = 2;
    let matches = this.content.text.match(/`+/g);
    if (matches)
      matches.forEach((item) => longest = Math.max(longest, item.length));
    let fence = "`".repeat(longest + 1);
    let text = this.content.text;
    let closing = text.endsWith("\n") ? "" : "\n";
    return this.markdownWithBackground(`${fence}${this.language.replace(/`/g, "").trim()}
${text}${closing}${fence}`);
  }
  toPlainText() {
    return this.content.text;
  }
};

// nodes/listnode.ts
var ListTypes = /* @__PURE__ */ ((ListTypes2) => {
  ListTypes2[ListTypes2["unordered"] = 0] = "unordered";
  ListTypes2[ListTypes2["ordered"] = 1] = "ordered";
  ListTypes2[ListTypes2["checklist"] = 2] = "checklist";
  return ListTypes2;
})(ListTypes || {});
var ListNode = class _ListNode extends TextNode2 {
  static exportStyles(sheet, editor) {
    super.exportStyles(sheet, editor);
    sheet.addRule("ul.checklist", "list-style: none; padding-inline-start: 1.25em");
    sheet.addRule("ul.checklist input", "margin-inline-end: 6px");
  }
  static identifier = "list";
  static caption = "List";
  static icon = "bi bi-list-ul";
  static keywords = "bullet bulleted numbered ordered checklist todo task";
  static maximumLevel = 8;
  static markdownShortcuts = [
    { pattern: /^[-*+] /, value: () => 0 /* unordered */ },
    { pattern: /^\d+[.)] /, value: () => 1 /* ordered */ },
    { pattern: /^\[[ xX]?\] /, value: () => 2 /* checklist */, finish: (node, match) => {
      if (!(node instanceof _ListNode) || !/^\[[xX]\]/.test(match[0]))
        return;
      node.content.listChecked = [true];
      node.refresh();
      node.primaryHost?.select(0);
    } }
  ];
  static blockKinds(strings, _compact) {
    return [
      ["list:0", strings.TextBulletedListCaption, "bi bi-list-ul"],
      ["list:1", strings.TextNumberedListCaption, "bi bi-list-ol"],
      ["list:2", strings.TextChecklistCaption, "bi bi-ui-checks"]
    ];
  }
  static fromBlockContent(content, value, source) {
    let list = new _ListNode("", value);
    list.content = content;
    list.content.text = list.content.text.replace(/\n/g, LineBreak);
    list.content.listType = value;
    list.content.listLevels = [0];
    source.copyAppearanceTo(list);
    return [list];
  }
  static importElement(element, importer) {
    if (element.tagName != "UL" && element.tagName != "OL")
      return void 0;
    let checklist = element.classList.contains("checklist") || element.classList.contains("contains-task-list") || !!element.querySelector(":scope > li > input[type=checkbox]");
    let type = checklist ? 2 /* checklist */ : element.tagName == "OL" ? 1 /* ordered */ : 0 /* unordered */;
    let node = new _ListNode("", type);
    let content = new RichText();
    content.listType = type;
    let levels = [];
    let checked = [];
    let addItems = (list, level) => {
      Array.from(list.children).forEach((child) => {
        if (child.tagName != "LI")
          return;
        let item = child;
        let box = item.querySelector(":scope > input[type=checkbox], :scope > p > input[type=checkbox]");
        let nested = Array.from(item.children).filter((grandchild) => grandchild.tagName == "UL" || grandchild.tagName == "OL");
        let inlineNodes = Array.from(item.childNodes).filter((grandchild) => nested.indexOf(grandchild) < 0 && grandchild !== box);
        let rich = importer.trimmed(importer.richText(inlineNodes));
        if (levels.length > 0)
          content.insert(content.length, ParagraphBreak);
        content.append(rich);
        levels.push(level);
        checked.push(box ? box.checked || box.hasAttribute("checked") : false);
        nested.forEach((sublist) => addItems(sublist, level + 1));
      });
    };
    addItems(element, 0);
    if (levels.length == 0)
      levels.push(0);
    content.listLevels = levels;
    content.listChecked = type == 2 /* checklist */ ? checked : [];
    node.content = content;
    return importer.attach(node);
  }
  static create(editor) {
    let result = new _ListNode("", 0 /* unordered */);
    result.editor = editor;
    return result;
  }
  constructor(text = "", type = 0 /* unordered */) {
    super(text);
    this.content.listType = type;
    let count = text.split(ParagraphBreak).length;
    this.content.listLevels = new Array(count).fill(0);
  }
  get blockKind() {
    return `list:${this.listType}`;
  }
  get joinsForward() {
    return false;
  }
  get becomesTextOnBackspace() {
    return false;
  }
  get keepsParagraphs() {
    return true;
  }
  prepareReplacementContent(replacement, paragraphs) {
    while (replacement.listLevels.length < paragraphs)
      replacement.listLevels.push(0);
    replacement.listLevels.length = paragraphs;
  }
  /** Changes the list's type, or splits it into one block per item for any other kind; a list's own type turns it into paragraphs. */
  convertBlock(kind, value) {
    if (kind == "list" && this.listType != value) {
      this.listType = value;
      this.content.listLevels.length = Math.min(this.content.listLevels.length, this.itemCount);
      return [this];
    }
    let result = [];
    this.content.paragraphs().forEach((paragraph) => {
      let item = new TextNode2();
      item.content = this.content.slice(paragraph.start, paragraph.end);
      if (kind == "list" || !this.editor)
        result.push(item);
      else
        result.push(...this.editor.convertTextBlock(item, kind, value));
    });
    return result;
  }
  inspectorSections() {
    let strings = this.strings;
    let type = InspectorItem2.menu("listtype", strings.TextTypeCaption, [[strings.TextBulletedListCaption, 0 /* unordered */], [strings.TextNumberedListCaption, 1 /* ordered */], [strings.TextChecklistCaption, 2 /* checklist */]], (target) => target.listType, (target, value) => target.listType = value);
    type.setDefaultValue(0 /* unordered */);
    return [InspectorDefaults.section("list", strings.TextListInspectorCaption, [type])].concat(InspectorDefaults.text(this));
  }
  get listType() {
    return Utilities.clamp(this.content.listType, 0, 2);
  }
  set listType(value) {
    this.content.listType = Utilities.clamp(value, 0, 2);
    if (value != 2 /* checklist */)
      this.content.listChecked = [];
  }
  get itemCount() {
    return this.content.text.split(ParagraphBreak).length;
  }
  levelAt(item) {
    return this.content.listLevels[item] || 0;
  }
  get tagName() {
    return this.listType == 1 /* ordered */ ? "ol" : "ul";
  }
  get hostMode() {
    return 2 /* list */;
  }
  get placeholderText() {
    return this.strings.TextDefaultListItemCaption;
  }
  build(body) {
    super.build(body);
    let host = this.primaryHost;
    host.element.classList.add("scv-list", `scv-list-${["unordered", "ordered", "checklist"][this.listType]}`);
  }
  #normalizeItems() {
    let count = this.itemCount;
    let levels = this.content.listLevels;
    while (levels.length < count)
      levels.push(levels.length > 0 ? levels[levels.length - 1] : 0);
    levels.length = count;
    if (this.listType == 2 /* checklist */) {
      let checked = this.content.listChecked;
      while (checked.length < count)
        checked.push(false);
      checked.length = count;
    }
  }
  #rerender(start, end = start) {
    let host = this.primaryHost;
    if (!host)
      return;
    host.render();
    host.select(start, end);
    this.changed();
  }
  handleKeyDown(event, host) {
    if (!host || host !== this.primaryHost || !this.editor)
      return false;
    let selection = host.selection();
    if (!selection)
      return false;
    if (event.key == "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      this.willChange();
      this.#normalizeItems();
      if (selection.end > selection.start)
        this.#removeRange(selection.start, selection.end);
      let start = selection.start;
      let item = this.content.paragraphIndexAt(start);
      let paragraph = this.content.paragraphs()[item];
      if (paragraph.start == paragraph.end) {
        if (this.levelAt(item) > 0) {
          this.content.listLevels[item]--;
          this.#rerender(start);
        } else {
          this.#exitAt(item);
        }
        return true;
      }
      let style = this.content.insertionStyleAt(start);
      this.content.insert(start, ParagraphBreak, style);
      this.content.listLevels.splice(item + 1, 0, this.levelAt(item));
      if (this.listType == 2 /* checklist */)
        this.content.listChecked.splice(start == paragraph.start ? item : item + 1, 0, false);
      this.#rerender(start + 1);
      return true;
    }
    if (event.key == "Tab" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.willChange();
      this.#normalizeItems();
      this.#changeLevels(selection, event.shiftKey ? -1 : 1);
      return true;
    }
    if (event.key == "Backspace" && selection.start == selection.end && !event.altKey && !event.metaKey) {
      let item = this.content.paragraphIndexAt(selection.start);
      let paragraph = this.content.paragraphs()[item];
      if (selection.start != paragraph.start)
        return false;
      event.preventDefault();
      this.willChange();
      this.#normalizeItems();
      if (this.levelAt(item) > 0) {
        this.content.listLevels[item]--;
        this.#rerender(selection.start);
      } else if (item > 0) {
        let previousEmpty = this.content.paragraphs()[item - 1].start == paragraph.start - 1;
        this.content.remove(selection.start - 1, selection.start);
        this.content.listLevels.splice(item, 1);
        if (this.listType == 2 /* checklist */)
          this.content.listChecked.splice(previousEmpty ? item - 1 : item, 1);
        this.#rerender(selection.start - 1);
      } else {
        this.#exitAt(0);
      }
      return true;
    }
    return false;
  }
  #removeRange(start, end) {
    let firstItem = this.content.paragraphIndexAt(start);
    let lastItem = this.content.paragraphIndexAt(end);
    let atItemStart = this.content.paragraphs()[firstItem].start == start;
    this.content.remove(start, end);
    if (lastItem > firstItem) {
      this.content.listLevels.splice(firstItem + 1, lastItem - firstItem);
      if (this.listType == 2 /* checklist */)
        this.content.listChecked.splice(atItemStart ? firstItem : firstItem + 1, lastItem - firstItem);
    }
  }
  #changeLevels(selection, delta) {
    let first = this.content.paragraphIndexAt(selection.start);
    let last = this.content.paragraphIndexAt(selection.end);
    for (let item = first; item <= last; item++) {
      let maximum = item == 0 ? 0 : Math.min(_ListNode.maximumLevel, this.levelAt(item - 1) + 1);
      this.content.listLevels[item] = Utilities.clamp(this.levelAt(item) + delta, 0, Math.max(maximum, delta < 0 ? 0 : this.levelAt(item)));
    }
    this.#rerender(selection.start, selection.end);
  }
  /** Indents (1) or outdents (-1) the items in the current selection. */
  changeLevel(delta) {
    let host = this.primaryHost;
    if (!host)
      return;
    let selection = host.selection() || { start: 0, end: 0 };
    this.willChange();
    this.#normalizeItems();
    this.#changeLevels(selection, delta);
  }
  /**
   * Turns item into a paragraph: the items before it stay in this list, the
   * paragraph follows, and the items after it move to a new list.
   */
  #exitAt(item) {
    let editor = this.editor;
    let paragraphs = this.content.paragraphs();
    let current = paragraphs[item];
    let paragraph = new TextNode2();
    paragraph.content = this.content.slice(current.start, current.end);
    let after = null;
    if (item < paragraphs.length - 1) {
      after = new _ListNode("", this.listType);
      after.content = this.content.slice(paragraphs[item + 1].start);
      after.content.listType = this.listType;
      after.content.listLevels = this.content.listLevels.slice(item + 1);
      let minimum = Math.min(...after.content.listLevels);
      after.content.listLevels = after.content.listLevels.map((level) => level - minimum);
      if (this.listType == 2 /* checklist */)
        after.content.listChecked = this.content.listChecked.slice(item + 1);
    }
    let replacements = [];
    if (item > 0) {
      this.content.remove(paragraphs[item - 1].end, this.content.length);
      this.content.listLevels.length = item;
      if (this.listType == 2 /* checklist */)
        this.content.listChecked.length = item;
      replacements.push(this);
    }
    replacements.push(paragraph);
    if (after)
      replacements.push(after);
    editor.replaceNode(this, replacements);
    editor.focusNode(paragraph, 0);
  }
  /** Whether a checklist item is checked. */
  isChecked(item) {
    return this.listType == 2 /* checklist */ && !!this.content.listChecked[item];
  }
  /** Checks or unchecks a checklist item, as one undo step. Returns whether it changed. */
  setChecked(item, checked) {
    if (this.listType != 2 /* checklist */ || item < 0 || item >= this.itemCount || this.isChecked(item) == checked)
      return false;
    if (this.editor) {
      this.editor.history.breakCoalescing();
      this.editor.history.checkpoint();
    }
    this.willChange();
    this.#normalizeItems();
    this.content.listChecked[item] = checked;
    let host = this.primaryHost;
    if (host && host.element)
      host.render();
    this.changed();
    if (this.editor)
      this.editor.history.breakCoalescing();
    return true;
  }
  handleClick(event) {
    let target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.closest(".scv-check"))
      return false;
    let item = target.closest("li");
    let host = this.primaryHost;
    if (!item || !host)
      return false;
    if (this.editor && this.editor.readOnly) {
      event.preventDefault();
      return true;
    }
    let index = Array.from(host.element.children).indexOf(item);
    this.willChange();
    this.#normalizeItems();
    this.content.listChecked[index] = target.checked;
    item.dataset.checked = target.checked ? "true" : "false";
    this.changed();
    return true;
  }
  actions() {
    let strings = this.strings;
    let type = new ToolbarItem("listtype", strings.TextListInspectorCaption, ["bi bi-list-ul", "bi bi-list-ol", "bi bi-ui-checks"][this.listType], 2 /* menu */);
    let captions = [strings.TextBulletedListCaption, strings.TextNumberedListCaption, strings.TextChecklistCaption];
    let icons = ["bi bi-list-ul", "bi bi-list-ol", "bi bi-ui-checks"];
    for (let value = 0; value <= 2; value++) {
      let menuItem = new ToolbarMenuItem(String(value), captions[value], icons[value]);
      menuItem.checked = value == this.listType;
      type.menuItems.push(menuItem);
    }
    return [
      type,
      new ToolbarItem("outdent", strings.TextOutdentCaption, "bi bi-text-indent-right"),
      new ToolbarItem("indent", strings.TextIndentCaption, "bi bi-text-indent-left")
    ];
  }
  performAction(item, menuItem) {
    switch (item.identifier) {
      case "listtype":
        if (!menuItem)
          return false;
        this.willChange();
        this.listType = Number(menuItem.identifier);
        this.#normalizeItems();
        this.refresh();
        this.changed();
        return true;
      case "indent":
        this.changeLevel(1);
        return true;
      case "outdent":
        this.changeLevel(-1);
        return true;
    }
    return false;
  }
  toHTML() {
    let tag = this.listType == 1 /* ordered */ ? "ol" : "ul";
    let classAttribute = this.listType == 2 /* checklist */ ? ` class="checklist"` : "";
    let result = `<${tag}${classAttribute} style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}">`;
    let currentLevel = 0;
    this.content.paragraphs().forEach((paragraph, item) => {
      let level = Math.max(0, this.levelAt(item));
      if (item == 0) {
        result += "<li>";
      } else if (level > currentLevel) {
        while (currentLevel < level) {
          result += `<${tag}${classAttribute}><li>`;
          currentLevel++;
        }
      } else {
        result += "</li>";
        while (currentLevel > level) {
          result += `</${tag}></li>`;
          currentLevel--;
        }
        result += "<li>";
      }
      if (this.listType == 2 /* checklist */)
        result += `<input type="checkbox" disabled${this.content.listChecked[item] ? " checked" : ""}> `;
      result += this.content.htmlText(paragraph.start, paragraph.end);
    });
    result += "</li>";
    while (currentLevel > 0) {
      result += `</${tag}></li>`;
      currentLevel--;
    }
    return result + `</${tag}>`;
  }
  toMarkdown() {
    let lines = [];
    let counters = [];
    this.content.paragraphs().forEach((paragraph, item) => {
      let level = Math.max(0, this.levelAt(item));
      while (counters.length <= level)
        counters.push(0);
      counters[level]++;
      counters.length = level + 1;
      let indentation = "  ".repeat(level);
      let marker = this.listType == 1 /* ordered */ ? `${counters[level]}. ` : "- ";
      if (this.listType == 2 /* checklist */)
        marker = this.content.listChecked[item] ? "- [x] " : "- [ ] ";
      let content = this.content.markdownText(paragraph.start, paragraph.end).replace(/\n/g, `
${indentation}  `);
      lines.push(indentation + marker + content);
    });
    return this.markdownWithBackground(lines.join("\n"));
  }
  /** The items' text, one per line, without markers. */
  toPlainText() {
    return this.content.text.replace(/\u2028/g, "\n");
  }
};
var ListExtension = {
  toolbarIdentifiers: ["list:0", "list:1", "list:2", "outdent", "indent"],
  defaultToolbarIdentifiers: ["list:0", "list:1", "list:2", "outdent", "indent"],
  defaultToolbarAfter: "linespacing",
  makeToolbarItem(editor, identifier) {
    let strings = editor.strings;
    switch (identifier) {
      case "list:0":
        return new ToolbarItem(identifier, strings.TextBulletedListCaption, "bi bi-list-ul", 1 /* toggle */);
      case "list:1":
        return new ToolbarItem(identifier, strings.TextNumberedListCaption, "bi bi-list-ol", 1 /* toggle */);
      case "list:2":
        return new ToolbarItem(identifier, strings.TextChecklistCaption, "bi bi-ui-checks", 1 /* toggle */);
      case "outdent":
        return new ToolbarItem(identifier, strings.TextOutdentCaption, "bi bi-text-indent-right");
      case "indent":
        return new ToolbarItem(identifier, strings.TextIndentCaption, "bi bi-text-indent-left");
    }
    return null;
  },
  activateToolbarItem(editor, identifier) {
    if (identifier.startsWith("list:")) {
      editor.setBlockType("list", Number(identifier.substring(5)));
      return true;
    }
    if (identifier == "indent" || identifier == "outdent") {
      let node = editor.activeHost ? editor.activeHost.node : editor.selectedNode;
      if (node instanceof ListNode)
        node.changeLevel(identifier == "indent" ? 1 : -1);
      return true;
    }
    return false;
  },
  updateToolbarState(editor, set) {
    let node = editor.activeHost ? editor.activeHost.node : editor.selectedNode;
    let textNode = node instanceof TextNode2 && node.isTextBlock;
    [0, 1, 2].forEach((type) => set(`list:${type}`, !editor.readOnly && textNode, node instanceof ListNode && node.listType == type));
    set("indent", !editor.readOnly && node instanceof ListNode);
    set("outdent", !editor.readOnly && node instanceof ListNode);
  },
  handleCommandKey(editor, event) {
    if (!editor.nodeTypes.item("list"))
      return false;
    let types = { Digit7: 1 /* ordered */, Digit8: 0 /* unordered */, Digit9: 2 /* checklist */ };
    if (event.shiftKey && event.code in types) {
      editor.setBlockType("list", types[event.code]);
      return true;
    }
    let key = event.key.toLowerCase();
    if (key == "]" || key == "[") {
      let node = editor.activeHost ? editor.activeHost.node : editor.selectedNode;
      if (node instanceof ListNode) {
        node.changeLevel(key == "]" ? 1 : -1);
        return true;
      }
    }
    return false;
  }
};

// nodes/quotenode.ts
var QuoteNode = class _QuoteNode extends TextNode2 {
  static exportStyles(sheet, editor) {
    super.exportStyles(sheet, editor);
    sheet.addRule("blockquote.quote", `margin: 0; padding: 16px; padding-inline-start: 20px; border-inline-start: 4px solid ${Editor2.themeCSS(editor, 11 /* border */)}`);
    sheet.addRule("blockquote.quote footer", `margin-top: 6px; color: ${Editor2.themeCSS(editor, 9 /* textMuted */)}; font-size: 0.85em; font-style: italic`);
  }
  static identifier = "quote";
  static caption = "Quote";
  static icon = "bi bi-quote";
  static keywords = "blockquote citation";
  static markdownShortcuts = [{ pattern: /^> / }];
  static blockKinds(strings, _compact) {
    return [["quote", strings.TextQuoteCaption, "bi bi-quote"]];
  }
  static importElement(element, importer) {
    if (element.tagName != "BLOCKQUOTE")
      return void 0;
    if (/alert-(info|success|warning|danger)/.test(element.className || "") && importer.hasType("alert"))
      return void 0;
    let quote = new _QuoteNode();
    let footer = element.querySelector(":scope > footer");
    if (footer) {
      quote.citation = (footer.textContent || "").trim();
      footer.remove();
    }
    let blocks = Array.from(element.children).filter((child) => /^(P|DIV)$/.test(child.tagName));
    let content = new RichText();
    if (blocks.length > 0 && blocks.length == element.children.length) {
      blocks.forEach((block, index) => {
        if (index > 0)
          content.insert(content.length, LineBreak);
        content.append(importer.trimmed(importer.richText(Array.from(block.childNodes))));
      });
    } else {
      content = importer.trimmed(importer.richText(Array.from(element.childNodes)));
    }
    quote.content = content;
    return importer.attach(quote);
  }
  inspectorSections() {
    let strings = this.strings;
    return [InspectorDefaults.section("quote", strings.TextQuoteCaption, [new InspectorItem2("citation", strings.TextCitationCaption, "citation", 1 /* text */)])].concat(InspectorDefaults.text(this));
  }
  citation = "";
  #citationText = new RichText();
  get placeholderText() {
    return this.strings.TextDefaultQuote;
  }
  build(body) {
    let quote = Utilities.element("blockquote", "scv-quote");
    body.append(quote);
    let paragraph = Utilities.element("div", "scv-quote-text");
    quote.append(paragraph);
    let host = this.addHost(new TextHost(this, this.content, paragraph, 0 /* inline */));
    host.placeholder = this.placeholderText;
    this.applyTextAppearance(paragraph);
    host.render();
    let footer = Utilities.element("footer", "scv-quote-citation");
    quote.append(footer);
    this.#citationText = new RichText(this.citation);
    let citationHost = this.addHost(new TextHost(this, this.#citationText, footer, 3 /* plain */));
    citationHost.placeholder = this.strings.TextCitationCaption;
    citationHost.render();
  }
  textChanged(host) {
    if (host.rich === this.#citationText)
      this.citation = this.#citationText.text.replace(/\n/g, " ");
  }
  toJSON() {
    let result = super.toJSON();
    if (this.citation.length > 0)
      result["citation"] = this.citation;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.citation = Utilities.string(data.citation);
    return true;
  }
  toHTML() {
    let result = `<blockquote class="quote" style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}${this.htmlLineHeightCSS()}">${this.content.htmlText()}`;
    if (this.citation.trim().length > 0)
      result += `<footer><cite>${Utilities.escapeText(this.citation.trim())}</cite></footer>`;
    return result + "</blockquote>";
  }
  toMarkdown() {
    let lines = this.content.markdownText().replace(/\r/g, "").split("\n");
    if (this.citation.trim().length > 0)
      lines.push(`\u2014 ${this.citation.trim()}`);
    return this.markdownWithBackground(lines.map((line) => `> ${line}`).join("\n"));
  }
  toPlainText() {
    let result = this.content.text.replace(/\u2028/g, "\n");
    if (this.citation.trim().length > 0)
      result += `
\u2014 ${this.citation.trim()}`;
    return result;
  }
};

// nodes/dividernode.ts
var DividerNode = class _DividerNode extends Node3 {
  static exportStyles(sheet, _editor) {
    sheet.addRule("hr", "border: none");
  }
  static identifier = "divider";
  static caption = "Divider";
  static icon = "bi bi-hr";
  static keywords = "rule line separator hr";
  static markdownShortcuts = [{ pattern: /^---$/, insertsBlock: true }];
  static importElement(element, importer) {
    return element.tagName == "HR" ? importer.attach(new _DividerNode()) : void 0;
  }
  readImportedStyle(style) {
    let height = style.height.trim().toLowerCase();
    if (height.length > 0) {
      let thickness = height.indexOf("%") < 0 ? parseFloat(height) : 0;
      if (thickness > 0)
        this.lineThickness = thickness;
      let color = Colors.fromCSS(style.backgroundColor) || Colors.fromCSS(style.color);
      if (color)
        this.lineColor = Colors.equals(color, Colors.fromCSS(_DividerNode.defaultLineCSS)) ? Colors.empty : color;
    } else if (this.borderTop.visible) {
      this.lineThickness = this.borderTop.size;
      this.lineColor = Colors.clone(this.borderTop.color);
      this.borderTop = Node3.defaultBorder();
    }
  }
  inspectorSections() {
    let strings = this.strings;
    let thickness = InspectorItem2.number("linethickness", strings.TextLineThicknessCaption, (target) => target.lineThickness, (target, value) => target.lineThickness = value, 0, 100, 1);
    thickness.setDefaultValue(1);
    let color = new InspectorItem2("linecolor", strings.TextLineColorCaption, "lineColor", 6 /* color */);
    color.setDefaultValue(Colors.empty);
    return [InspectorDefaults.section("divider", strings.TextDividerCaption, [thickness, color])].concat(InspectorDefaults.node(this, { appearance: false }));
  }
  lineThickness = 1;
  /** The line color. The empty color uses the theme's border color. */
  lineColor = Colors.empty;
  build(body) {
    let line = Utilities.element("div", "scv-divider", { role: "separator" });
    line.style.height = `${Math.max(1, this.lineThickness)}px`;
    if (!Colors.isEmpty(this.lineColor))
      line.style.backgroundColor = Colors.toCSS(this.lineColor);
    body.append(line);
  }
  actions() {
    let item = new ToolbarItem("thickness", `${this.lineThickness}px`, "bi bi-border-width", 2 /* menu */);
    item.alwaysShowCaption = true;
    [1, 2, 3, 4, 6, 8].forEach((value) => {
      let menuItem = new ToolbarMenuItem(String(value), `${value}px`);
      menuItem.checked = value == this.lineThickness;
      item.menuItems.push(menuItem);
    });
    let color = new ToolbarItem("linecolor", this.strings.TextTextColorCaption, "bi bi-palette", 5 /* color */);
    return [item, color];
  }
  performAction(item, menuItem) {
    if (item.identifier == "thickness" && menuItem) {
      this.willChange();
      this.lineThickness = Number(menuItem.identifier);
    } else if (item.identifier == "linecolor" && menuItem) {
      this.willChange();
      this.lineColor = menuItem.value ? Colors.clone(menuItem.value) : Colors.empty;
    } else {
      return false;
    }
    this.refresh();
    this.changed();
    return true;
  }
  toJSON() {
    let result = super.toJSON();
    if (this.lineThickness != 1)
      result["lineThickness"] = this.lineThickness;
    if (!Colors.isEmpty(this.lineColor))
      result["lineColor"] = Colors.toJSON(this.lineColor);
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.lineThickness = Math.max(0, Utilities.number(data.lineThickness, 1));
    this.lineColor = Colors.fromJSON(data.lineColor, Colors.empty);
    return true;
  }
  /** The line color exported for a divider without its own color. */
  static defaultLineCSS = "#d0d7de";
  toHTML() {
    let color = Colors.isEmpty(this.lineColor) ? _DividerNode.defaultLineCSS : Colors.toCSS(this.lineColor);
    return `<hr style="border:none;height:${this.lineThickness}px;background-color:${color};${this.htmlBackgroundCSS()}">`;
  }
  toMarkdown() {
    if (this.lineThickness == 1 && Colors.isEmpty(this.lineColor) && this.backgroundImage.isEmpty && !(this.borderTop.visible || this.borderRight.visible || this.borderBottom.visible || this.borderLeft.visible))
      return "---";
    return this.toHTML();
  }
  toPlainText() {
    return "---";
  }
};

// nodes/tablenode.ts
var VerticalAlignments = /* @__PURE__ */ ((VerticalAlignments2) => {
  VerticalAlignments2[VerticalAlignments2["top"] = 0] = "top";
  VerticalAlignments2[VerticalAlignments2["middle"] = 1] = "middle";
  VerticalAlignments2[VerticalAlignments2["bottom"] = 2] = "bottom";
  return VerticalAlignments2;
})(VerticalAlignments || {});
var TableNode = class _TableNode extends Node3 {
  static exportStyles(sheet, editor) {
    sheet.addRule("table", "width: 100%; border-collapse: collapse; table-layout: fixed");
    sheet.addRule("th, td", "padding: 10px; vertical-align: top; overflow-wrap: anywhere");
    sheet.addRule("th", `background: ${Editor2.themeCSS(editor, 13 /* surface */)}; font-weight: 700`);
  }
  static identifier = "table";
  static caption = "Table";
  static icon = "bi bi-table";
  static keywords = "grid spreadsheet rows columns cells";
  static create(editor) {
    return _TableNode.withSize(editor, 3, 3);
  }
  /** A new table with a header row, as the Insert menu and the table tool make them. */
  static withSize(editor, rows, columns) {
    rows = Math.max(1, Math.floor(rows));
    columns = Math.max(1, Math.floor(columns));
    let result = new _TableNode(rows, columns);
    result.editor = editor;
    result.hasHeader = rows > 1;
    for (let column = 0; column < columns; column++) {
      let heading = result.hasHeader;
      result.cell(0, column).insert(0, heading ? Utilities.format(editor.strings.TextDefaultTableHeadingFormat, { number: column + 1 }) : editor.strings.TextDefaultTableCellText, heading ? _TableNode.headerStyle() : new TextStyle());
    }
    for (let index = columns; index < result.cells.length; index++)
      result.cells[index].insert(0, editor.strings.TextDefaultTableCellText, new TextStyle());
    return result;
  }
  static headerStyle() {
    let result = new TextStyle();
    result.bold = true;
    return result;
  }
  rows = 1;
  columns = 1;
  cells = [];
  hasHeader = false;
  hasFooter = false;
  /** The flat index of the cell that last had the caret. */
  activeCell = 0;
  textAlignment = 0 /* automatic */;
  /** Host index → cell index, for the cells drawn in the last render. */
  hostCells = [];
  constructor(rows = 3, columns = 3) {
    super();
    this.rows = Math.max(1, rows);
    this.columns = Math.max(1, columns);
    this.ensureCells();
  }
  childLists() {
    return this.cells.map((cell) => cell.nodes);
  }
  ensureCells() {
    let count = this.rows * this.columns;
    while (this.cells.length < count)
      this.cells.push(new RichText());
    this.cells.length = count;
  }
  undrawnTexts() {
    return this.cells.slice();
  }
  cell(row, column) {
    return this.cells[row * this.columns + column];
  }
  /** For each cell, the index of the cell whose span covers it, or its own index. */
  coverage() {
    let result = this.cells.map((_cell, index) => index);
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {
        let index = row * this.columns + column;
        if (result[index] != index)
          continue;
        let cell = this.cells[index];
        let rowSpan = Math.min(cell.rowSpan, this.rows - row);
        let columnSpan = Math.min(cell.columnSpan, this.columns - column);
        for (let r = row; r < row + rowSpan; r++) {
          for (let c = column; c < column + columnSpan; c++) {
            let covered = r * this.columns + c;
            if (covered != index)
              result[covered] = index;
          }
        }
      }
    }
    return result;
  }
  /** The cell index of a host, or of the cell with the caret. */
  cellIndexOf(host) {
    if (!host || host.node !== this)
      return this.activeCell;
    let index = this.hostCells[host.index];
    return index === void 0 ? this.activeCell : index;
  }
  insertionPoint(host) {
    let cell = this.cells[this.cellIndexOf(host)];
    return cell ? { list: cell.nodes, index: cell.nodes.length } : null;
  }
  get inspectorFollowsCaret() {
    return true;
  }
  noteCaretHost(host) {
    this.activeCell = this.cellIndexOf(host);
  }
  inspectorSections() {
    let strings = this.strings;
    let header = new InspectorItem2("hasheader", strings.TextHeaderCaption, "hasHeader", 4 /* toggle */);
    let footer = new InspectorItem2("hasfooter", strings.TextFooterCaption, "hasFooter", 4 /* toggle */);
    header.setDefaultValue(false);
    footer.setDefaultValue(false);
    let alignment = InspectorItem2.menu("textalignment", strings.TextTextAlignmentInspectorCaption, InspectorDefaults.alignmentChoices(strings, true), (target) => target.textAlignment, (target, value) => target.textAlignment = value);
    alignment.setDefaultValue(0 /* automatic */);
    return [InspectorDefaults.section("table", strings.TextTableCaption, [header, footer, alignment])].concat(InspectorDefaults.cellSections(this, strings.TextActiveCellCaption), InspectorDefaults.node(this));
  }
  currentCellIndex() {
    if (this.editor) {
      let host = this.editor.activeHost;
      if (host && host.node === this)
        return this.cellIndexOf(host);
    }
    return Utilities.clamp(this.activeCell, 0, this.cells.length - 1);
  }
  build(body) {
    this.ensureCells();
    this.hostCells = [];
    let table = Utilities.element("table", "scv-table");
    table.style.textAlign = TextNode2.cssAlignment(this.resolvedTextAlignment());
    let coverage = this.coverage();
    let sections = [];
    let bodyStart = this.hasHeader ? 1 : 0;
    let bodyEnd = this.rows - (this.hasFooter && this.rows > bodyStart ? 1 : 0);
    if (this.hasHeader)
      sections.push(["thead", 0, 1]);
    if (bodyEnd > bodyStart)
      sections.push(["tbody", bodyStart, bodyEnd]);
    if (this.hasFooter && this.rows > bodyStart)
      sections.push(["tfoot", this.rows - 1, this.rows]);
    sections.forEach(([tag, start, end]) => {
      let section = document.createElement(tag);
      for (let row = start; row < end; row++) {
        let tableRow = document.createElement("tr");
        for (let column = 0; column < this.columns; column++) {
          let index = row * this.columns + column;
          if (coverage[index] != index)
            continue;
          let cell = this.cells[index];
          let element = document.createElement(tag == "thead" ? "th" : "td");
          element.dataset.cell = String(index);
          let rowSpan = Math.min(cell.rowSpan, this.rows - row);
          let columnSpan = Math.min(cell.columnSpan, this.columns - column);
          if (rowSpan > 1)
            element.rowSpan = rowSpan;
          if (columnSpan > 1)
            element.colSpan = columnSpan;
          this.applyCellAppearance(element, cell);
          this.buildCell(element, cell, index);
          tableRow.append(element);
        }
        section.append(tableRow);
      }
      table.append(section);
    });
    body.append(table);
  }
  buildCell(element, cell, index) {
    let text = Utilities.element("div", "scv-cell-text");
    element.append(text);
    let host = this.addHost(new TextHost(this, cell, text, 1 /* multiline */));
    this.hostCells[host.index] = index;
    host.render();
    let children = Utilities.element("div", "scv-cell-children scv-children");
    element.append(children);
    if (this.editor)
      this.editor.mountChildren(cell.nodes, children, this);
  }
  resolvedTextAlignment() {
    if (this.textAlignment != 0 /* automatic */)
      return this.textAlignment;
    return this.editor ? this.editor.textAlignment : 1 /* leading */;
  }
  applyCellAppearance(element, cell) {
    if (cell.textAlignment != 0 /* automatic */)
      element.style.textAlign = TextNode2.cssAlignment(cell.textAlignment);
    element.style.verticalAlign = ["top", "middle", "bottom"][Utilities.clamp(cell.verticalAlignment, 0, 2)];
    if (cell.hasCellBackgroundColor)
      element.style.backgroundColor = Colors.toCSS(cell.cellBackgroundColor);
    let sides = [["Top", cell.cellBorderTop], ["Right", cell.cellBorderRight], ["Bottom", cell.cellBorderBottom], ["Left", cell.cellBorderLeft]];
    sides.forEach(([side, border]) => {
      if (border.visible && border.size > 0) {
        element.style[`border${side}`] = `${border.size}px solid ${Colors.isEmpty(border.color) ? "var(--bs-border-color)" : Colors.toCSS(border.color)}`;
        element.classList.add("scv-cell-bordered");
      }
    });
    if (!cell.backgroundImage.isEmpty)
      element.setAttribute("style", (element.getAttribute("style") || "") + ";" + cell.backgroundImage.toCSS());
  }
  /** Moves the caret to a cell. */
  focusCell(index, atEnd = false) {
    let hostIndex = this.hostCells.indexOf(index);
    let host = this.hosts()[hostIndex];
    if (host)
      host.focus(atEnd);
    this.activeCell = index;
  }
  handleKeyDown(event, host) {
    if (!host || host.node !== this)
      return false;
    let cellIndex = this.cellIndexOf(host);
    this.activeCell = cellIndex;
    if (event.key == "Tab" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      let hostIndex = host.index + (event.shiftKey ? -1 : 1);
      if (hostIndex >= this.hosts().length && !event.shiftKey) {
        if (this.editor && this.editor.readOnly)
          return true;
        this.insertRow(this.rows);
        this.focusCell((this.rows - 1) * this.columns);
        return true;
      }
      let next = this.hosts()[Utilities.clamp(hostIndex, 0, this.hosts().length - 1)];
      if (next)
        next.select(0, next.rich.length);
      return true;
    }
    if ((event.key == "ArrowUp" || event.key == "ArrowDown") && !event.shiftKey && !event.altKey && !event.metaKey && !event.ctrlKey) {
      let up = event.key == "ArrowUp";
      if (up ? !host.isCaretOnFirstLine() : !host.isCaretOnLastLine())
        return false;
      let row = Math.floor(cellIndex / this.columns);
      let column = cellIndex % this.columns;
      let anchor = this.cells[cellIndex];
      let targetRow = up ? row - 1 : row + anchor.rowSpan;
      if (targetRow < 0 || targetRow >= this.rows)
        return false;
      event.preventDefault();
      let target = this.coverage()[targetRow * this.columns + column];
      this.focusCell(target, up);
      return true;
    }
    return false;
  }
  // Structure
  /**
   * A new cell with a template cell's text style, alignment, fill and borders.
   * Links and suggestion tags are not copied.
   */
  #cellLike(value, template, bold) {
    let result = new RichText();
    let style = template && template.styles.length > 0 ? template.styles[0].clone() : new TextStyle();
    style.linkURL = "";
    style.linkTitle = "";
    style.linkTarget = "";
    style.hasLinkColor = false;
    style.suggestionIdentifier = "";
    style.suggestionProviderIdentifier = "";
    if (bold)
      style.bold = true;
    if (template) {
      result.copyStateFrom(template);
      result.rowSpan = 1;
      result.columnSpan = 1;
    }
    result.insert(0, value, style);
    return result;
  }
  /** Adds a row before row at. Its cells take their formatting from the body row above it. */
  insertRow(at) {
    at = Utilities.clamp(at, 0, this.rows);
    this.willChange();
    let coverage = this.coverage();
    let templateRow = at - 1;
    let usesTemplate = templateRow >= 0 && !(this.hasHeader && templateRow == 0);
    let added = [];
    for (let column = 0; column < this.columns; column++) {
      let template = usesTemplate ? this.cells[coverage[templateRow * this.columns + column]] : null;
      added.push(this.#cellLike(this.strings.TextDefaultTableCellText, template, false));
    }
    if (at > 0 && at < this.rows) {
      for (let column = 0; column < this.columns; column++) {
        let above = coverage[at * this.columns + column];
        let anchorRow = Math.floor(above / this.columns);
        if (above != at * this.columns + column && anchorRow < at) {
          let anchor = this.cells[above];
          if (above % this.columns == column)
            anchor.rowSpan++;
        }
      }
    }
    this.cells.splice(at * this.columns, 0, ...added);
    this.rows++;
    this.refresh();
    this.changed();
  }
  removeRow(row) {
    if (this.rows <= 1)
      return;
    row = Utilities.clamp(row, 0, this.rows - 1);
    this.willChange();
    let coverage = this.coverage();
    for (let column = 0; column < this.columns; column++) {
      let index = row * this.columns + column;
      let anchorIndex = coverage[index];
      let anchor = this.cells[anchorIndex];
      if (anchorIndex % this.columns != column)
        continue;
      if (anchorIndex == index && anchor.rowSpan > 1 && row + 1 < this.rows) {
        let below = this.cells[index + this.columns];
        below.copyStateFrom(anchor);
        below.text = anchor.text;
        below.styles = anchor.styles;
        below.nodes = anchor.nodes;
        below.rowSpan = anchor.rowSpan - 1;
      } else if (anchorIndex != index && Math.floor(anchorIndex / this.columns) < row) {
        anchor.rowSpan = Math.max(1, anchor.rowSpan - 1);
      }
    }
    this.cells.splice(row * this.columns, this.columns);
    this.rows--;
    this.activeCell = Utilities.clamp(this.activeCell, 0, this.cells.length - 1);
    this.refresh();
    this.changed();
  }
  insertColumn(at) {
    at = Utilities.clamp(at, 0, this.columns);
    this.willChange();
    let coverage = this.coverage();
    let result = [];
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column <= this.columns; column++) {
        if (column == at) {
          let header = this.hasHeader && row == 0;
          let neighbour = at > 0 ? coverage[row * this.columns + at - 1] : this.columns > 0 ? coverage[row * this.columns] : -1;
          let template = neighbour >= 0 ? this.cells[neighbour] : null;
          let value = header ? Utilities.format(this.strings.TextDefaultTableHeadingFormat, { number: at + 1 }) : this.strings.TextDefaultTableCellText;
          result.push(this.#cellLike(value, template, header));
        }
        if (column < this.columns)
          result.push(this.cells[row * this.columns + column]);
      }
      if (at > 0 && at < this.columns) {
        let left = coverage[row * this.columns + at];
        if (left != row * this.columns + at && Math.floor(left / this.columns) == row && left % this.columns < at)
          this.cells[left].columnSpan++;
      }
    }
    this.cells = result;
    this.columns++;
    this.refresh();
    this.changed();
  }
  removeColumn(column) {
    if (this.columns <= 1)
      return;
    column = Utilities.clamp(column, 0, this.columns - 1);
    this.willChange();
    let coverage = this.coverage();
    for (let row = 0; row < this.rows; row++) {
      let index = row * this.columns + column;
      let anchorIndex = coverage[index];
      let anchor = this.cells[anchorIndex];
      if (Math.floor(anchorIndex / this.columns) != row)
        continue;
      if (anchorIndex == index && anchor.columnSpan > 1 && column + 1 < this.columns) {
        let right = this.cells[index + 1];
        right.copyStateFrom(anchor);
        right.text = anchor.text;
        right.styles = anchor.styles;
        right.nodes = anchor.nodes;
        right.columnSpan = anchor.columnSpan - 1;
      } else if (anchorIndex != index && anchorIndex % this.columns < column) {
        anchor.columnSpan = Math.max(1, anchor.columnSpan - 1);
      }
    }
    let result = [];
    this.cells.forEach((cell, index) => {
      if (index % this.columns != column)
        result.push(cell);
    });
    this.cells = result;
    this.columns--;
    this.activeCell = Utilities.clamp(this.activeCell, 0, this.cells.length - 1);
    this.refresh();
    this.changed();
  }
  /** Merges a cell with the cell to its right or below, moving that cell's content into it. */
  mergeCell(index, down) {
    let coverage = this.coverage();
    let cell = this.cells[index];
    let row = Math.floor(index / this.columns);
    let column = index % this.columns;
    let targetRow = down ? row + cell.rowSpan : row;
    let targetColumn = down ? column : column + cell.columnSpan;
    if (targetRow >= this.rows || targetColumn >= this.columns)
      return;
    let target = this.cells[targetRow * this.columns + targetColumn];
    let targetIndex = targetRow * this.columns + targetColumn;
    if (coverage[targetIndex] != targetIndex)
      return;
    if (down ? target.columnSpan != cell.columnSpan : target.rowSpan != cell.rowSpan)
      return;
    this.willChange();
    _TableNode.#appendCellContent(cell, target);
    if (down) {
      cell.rowSpan += target.rowSpan;
    } else {
      cell.columnSpan += target.columnSpan;
    }
    let replacement = new RichText();
    this.cells[targetIndex] = replacement;
    this.refresh();
    this.changed();
  }
  /** Merged text follows the target's, separated by a space that takes the target's last style without its link. */
  static #appendCellContent(target, source) {
    if (source.text.length > 0) {
      if (target.text.length > 0) {
        let separator = target.styles.length > 0 ? target.styles[target.styles.length - 1].clone() : new TextStyle();
        separator.linkURL = "";
        separator.linkTitle = "";
        separator.linkTarget = "";
        target.insert(target.length, " ", separator);
      }
      target.append(source);
    }
    target.nodes.push(...source.nodes);
    source.nodes = [];
  }
  /**
   * Merges the rectangle of cells starting at row and column into its top-left cell.
   * The other cells' content follows in reading order. Returns false when the
   * rectangle is outside the table or cuts through a merged cell.
   */
  mergeCells(row, column, rowCount, columnCount) {
    if (rowCount < 1 || columnCount < 1 || row < 0 || column < 0 || row + rowCount > this.rows || column + columnCount > this.columns)
      return false;
    if (rowCount == 1 && columnCount == 1)
      return false;
    let coverage = this.coverage();
    let inside = (index) => {
      let r = Math.floor(index / this.columns);
      let c = index % this.columns;
      return r >= row && r < row + rowCount && c >= column && c < column + columnCount;
    };
    for (let r = row; r < row + rowCount; r++) {
      for (let c = column; c < column + columnCount; c++) {
        let owner = coverage[r * this.columns + c];
        if (!inside(owner))
          return false;
        let cell = this.cells[owner];
        if (!inside(owner + (cell.rowSpan - 1) * this.columns + cell.columnSpan - 1) || owner % this.columns + cell.columnSpan > column + columnCount)
          return false;
      }
    }
    this.willChange();
    let mergedIndex = row * this.columns + column;
    let merged = this.cells[mergedIndex];
    for (let r = row; r < row + rowCount; r++) {
      for (let c = column; c < column + columnCount; c++) {
        let index = r * this.columns + c;
        if (index == mergedIndex || coverage[index] != index)
          continue;
        _TableNode.#appendCellContent(merged, this.cells[index]);
        this.cells[index] = new RichText();
      }
    }
    merged.rowSpan = rowCount;
    merged.columnSpan = columnCount;
    this.activeCell = mergedIndex;
    this.refresh();
    this.changed();
    return true;
  }
  splitCell(index) {
    let cell = this.cells[index];
    if (cell.rowSpan == 1 && cell.columnSpan == 1)
      return;
    this.willChange();
    cell.rowSpan = 1;
    cell.columnSpan = 1;
    this.refresh();
    this.changed();
  }
  actions() {
    let strings = this.strings;
    let index = this.currentCellIndex();
    let cell = this.cells[index] || new RichText();
    let row = new ToolbarItem("row", strings.TextAddRowCaption, "bi bi-distribute-vertical", 2 /* menu */);
    row.menuItems.push(new ToolbarMenuItem("above", strings.TextInsertRowAboveCaption, "bi bi-arrow-bar-up"));
    row.menuItems.push(new ToolbarMenuItem("below", strings.TextInsertRowBelowCaption, "bi bi-arrow-bar-down"));
    row.menuItems.push(ToolbarMenuItem.separator());
    let removeRow = new ToolbarMenuItem("remove", strings.TextRemoveRowCaption, "bi bi-trash");
    removeRow.enabled = this.rows > 1;
    row.menuItems.push(removeRow);
    let column = new ToolbarItem("column", strings.TextAddColumnCaption, "bi bi-distribute-horizontal", 2 /* menu */);
    column.menuItems.push(new ToolbarMenuItem("before", strings.TextInsertColumnBeforeCaption, "bi bi-arrow-bar-left"));
    column.menuItems.push(new ToolbarMenuItem("after", strings.TextInsertColumnAfterCaption, "bi bi-arrow-bar-right"));
    column.menuItems.push(ToolbarMenuItem.separator());
    let removeColumn = new ToolbarMenuItem("remove", strings.TextRemoveColumnCaption, "bi bi-trash");
    removeColumn.enabled = this.columns > 1;
    column.menuItems.push(removeColumn);
    let merge = new ToolbarItem("merge", strings.TextMergeCellsCaption, "bi bi-union", 2 /* menu */);
    merge.menuItems.push(new ToolbarMenuItem("right", `${strings.TextMergeCellsCaption} \u2192`, "bi bi-arrow-right"));
    merge.menuItems.push(new ToolbarMenuItem("down", `${strings.TextMergeCellsCaption} \u2193`, "bi bi-arrow-down"));
    let split = new ToolbarMenuItem("split", strings.TextSplitCellCaption, "bi bi-layout-split");
    split.enabled = cell.rowSpan > 1 || cell.columnSpan > 1;
    merge.menuItems.push(split);
    let header = new ToolbarItem("header", strings.TextHeaderCaption, "bi bi-layout-text-window", 1 /* toggle */);
    header.active = this.hasHeader;
    let footer = new ToolbarItem("footer", strings.TextFooterCaption, "bi bi-layout-text-window-reverse", 1 /* toggle */);
    footer.active = this.hasFooter;
    let fill = new ToolbarItem("cellcolor", strings.TextBackgroundColorCaption, "bi bi-paint-bucket", 5 /* color */);
    return [row, column, merge, header, footer, fill];
  }
  performAction(item, menuItem) {
    let index = this.currentCellIndex();
    let row = Math.floor(index / this.columns);
    let column = index % this.columns;
    let cell = this.cells[index];
    switch (item.identifier) {
      case "row":
        if (!menuItem)
          return false;
        if (menuItem.identifier == "above")
          this.insertRow(row);
        if (menuItem.identifier == "below")
          this.insertRow(row + cell.rowSpan);
        if (menuItem.identifier == "remove")
          this.removeRow(row);
        return true;
      case "column":
        if (!menuItem)
          return false;
        if (menuItem.identifier == "before")
          this.insertColumn(column);
        if (menuItem.identifier == "after")
          this.insertColumn(column + cell.columnSpan);
        if (menuItem.identifier == "remove")
          this.removeColumn(column);
        return true;
      case "merge":
        if (!menuItem)
          return false;
        if (menuItem.identifier == "right")
          this.mergeCell(index, false);
        if (menuItem.identifier == "down")
          this.mergeCell(index, true);
        if (menuItem.identifier == "split")
          this.splitCell(index);
        return true;
      case "header":
        this.willChange();
        this.hasHeader = !this.hasHeader;
        this.refresh();
        this.changed();
        return true;
      case "footer":
        this.willChange();
        this.hasFooter = !this.hasFooter;
        this.refresh();
        this.changed();
        return true;
      case "cellcolor":
        if (!menuItem)
          return false;
        this.willChange();
        cell.hasCellBackgroundColor = menuItem.value != null;
        if (menuItem.value)
          cell.cellBackgroundColor = Colors.clone(menuItem.value);
        this.refresh();
        this.changed();
        return true;
    }
    return false;
  }
  // Persistence
  toJSON() {
    this.ensureCells();
    let result = super.toJSON();
    if (this.activeCell != 0)
      result["activeCell"] = this.activeCell;
    result["columns"] = this.columns;
    if (this.hasFooter)
      result["hasFooter"] = true;
    if (this.hasHeader)
      result["hasHeader"] = true;
    result["rows"] = this.rows;
    if (this.textAlignment != 0 /* automatic */)
      result["textAlignment"] = this.textAlignment;
    result["cells"] = this.cells.map((cell) => cell.toJSON());
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.rows = Math.max(1, Utilities.integer(data.rows, 1));
    this.columns = Math.max(1, Utilities.integer(data.columns, 1));
    this.hasHeader = Utilities.boolean(data.hasHeader, false);
    this.hasFooter = Utilities.boolean(data.hasFooter, false);
    this.activeCell = Math.max(0, Utilities.integer(data.activeCell, 0));
    let alignment = Utilities.integer(data.textAlignment, 0);
    this.textAlignment = alignment >= 0 && alignment <= 3 ? alignment : 0 /* automatic */;
    this.cells = [];
    if (Array.isArray(data.cells)) {
      data.cells.forEach((item) => this.cells.push(RichText.fromJSON(item, (child) => this.editor ? this.editor.nodeFromJSON(child) : null)));
    }
    this.ensureCells();
    this.activeCell = Utilities.clamp(this.activeCell, 0, this.cells.length - 1);
    return true;
  }
  // Export
  cellHTMLStyle(cell) {
    let result = "";
    if (cell.textAlignment != 0 /* automatic */)
      result += `text-align:${TextNode2.cssAlignment(cell.textAlignment)};`;
    result += `vertical-align:${["top", "middle", "bottom"][Utilities.clamp(cell.verticalAlignment, 0, 2)]};`;
    if (cell.hasCellBackgroundColor)
      result += `background-color:${Colors.toCSS(cell.cellBackgroundColor)};`;
    let sides = [["top", cell.cellBorderTop], ["right", cell.cellBorderRight], ["bottom", cell.cellBorderBottom], ["left", cell.cellBorderLeft]];
    sides.forEach(([side, border]) => {
      if (border.visible && border.size > 0)
        result += `border-${side}:${border.size}px solid ${Colors.toCSS(border.color)};`;
    });
    if (!cell.backgroundImage.isEmpty)
      result += cell.backgroundImage.toCSS() + ";";
    return result;
  }
  cellContentHTML(cell) {
    let result = cell.htmlText();
    cell.nodes.forEach((child) => {
      if (child.canExportHTML)
        result += child.toHTML();
    });
    return result;
  }
  #rowHTML(row, coverage, tag) {
    let result = "<tr>";
    for (let column = 0; column < this.columns; column++) {
      let index = row * this.columns + column;
      if (coverage[index] != index)
        continue;
      let cell = this.cells[index];
      let spans = "";
      let rowSpan = Math.min(cell.rowSpan, this.rows - row);
      let columnSpan = Math.min(cell.columnSpan, this.columns - column);
      if (rowSpan > 1)
        spans += ` rowspan="${rowSpan}"`;
      if (columnSpan > 1)
        spans += ` colspan="${columnSpan}"`;
      result += `<${tag}${spans} style="${Utilities.escapeAttribute(this.cellHTMLStyle(cell))}">${this.cellContentHTML(cell)}</${tag}>`;
    }
    return result + "</tr>";
  }
  toHTML() {
    this.ensureCells();
    let coverage = this.coverage();
    let alignment = `text-align:${TextNode2.cssAlignment(this.resolvedTextAlignment())};`;
    let result = `<table style="${this.htmlBackgroundCSS()}${alignment}">`;
    let bodyStart = this.hasHeader ? 1 : 0;
    let bodyEnd = this.rows - (this.hasFooter ? 1 : 0);
    if (this.hasHeader)
      result += `<thead>${this.#rowHTML(0, coverage, "th")}</thead>`;
    result += "<tbody>";
    for (let row = bodyStart; row < bodyEnd; row++)
      result += this.#rowHTML(row, coverage, "td");
    result += "</tbody>";
    if (this.hasFooter && this.rows > bodyStart)
      result += `<tfoot>${this.#rowHTML(this.rows - 1, coverage, "td")}</tfoot>`;
    return result + "</table>";
  }
  #cellMarkdown(row, column) {
    let cell = this.cell(row, column);
    return cell.markdownText().replace(/\|/g, "\\|").replace(/\n/g, "<br>").trim() || " ";
  }
  toMarkdown() {
    this.ensureCells();
    let lines = [];
    let header = [];
    for (let column = 0; column < this.columns; column++)
      header.push(this.hasHeader ? this.#cellMarkdown(0, column) : " ");
    lines.push(`| ${header.join(" | ")} |`);
    lines.push(`| ${new Array(this.columns).fill("---").join(" | ")} |`);
    for (let row = this.hasHeader ? 1 : 0; row < this.rows; row++) {
      let cells = [];
      for (let column = 0; column < this.columns; column++)
        cells.push(this.#cellMarkdown(row, column));
      lines.push(`| ${cells.join(" | ")} |`);
    }
    return this.markdownWithBackground(lines.join("\n"));
  }
  toPlainText() {
    let lines = [];
    for (let row = 0; row < this.rows; row++) {
      let cells = [];
      for (let column = 0; column < this.columns; column++)
        cells.push(this.cell(row, column).text.replace(/[\n\u2028]/g, " "));
      lines.push(cells.join("	"));
    }
    return lines.join("\n");
  }
};

// nodes/imagenode.ts
var ImageFillModes = /* @__PURE__ */ ((ImageFillModes2) => {
  ImageFillModes2[ImageFillModes2["fit"] = 0] = "fit";
  ImageFillModes2[ImageFillModes2["fill"] = 1] = "fill";
  ImageFillModes2[ImageFillModes2["stretch"] = 2] = "stretch";
  return ImageFillModes2;
})(ImageFillModes || {});
var ImageNode = class _ImageNode extends Node3 {
  static exportStyles(sheet, editor) {
    sheet.addRule("figure", "max-width: 100%; text-align: center");
    sheet.addRule("figure img", "display: block; max-width: 100%; margin: 0 auto");
    sheet.addRule("figcaption", `margin-top: 8px; text-align: center; color: ${Editor2.themeCSS(editor, 9 /* textMuted */)}; font-size: 14px; overflow-wrap: anywhere`);
  }
  static identifier = "image";
  static caption = "Image";
  static icon = "bi bi-image";
  static keywords = "picture photo figure illustration graphic";
  static droppedFileTypes = ["image/*"];
  static importDroppedFile(file, _editor) {
    let node = new _ImageNode();
    Promise.resolve().then(() => node.loadFile(file));
    return node;
  }
  /** Largest width given to a newly loaded picture. */
  static maximumInitialWidth = 640;
  captionText = new RichText();
  displayWidth = 0;
  displayHeight = 0;
  fillMode = 0 /* fit */;
  /** Base64-encoded picture file, without a data URI prefix. */
  imageData = "";
  sourceURL = "";
  get toolbarCanResize() {
    return this.hasImage;
  }
  toolbarSize() {
    let image = this.element ? this.element.querySelector("img") : null;
    let width = this.displayWidth > 0 ? this.displayWidth : image ? image.getBoundingClientRect().width : 0;
    let height = this.displayHeight > 0 ? this.displayHeight : image ? image.getBoundingClientRect().height : 0;
    return { width, height };
  }
  setToolbarSize(dimension, value) {
    let size = this.toolbarSize();
    if (dimension == "width") {
      this.displayWidth = value;
      this.displayHeight = value > 0 && size.width > 0 ? Math.round(size.height * value / size.width) : 0;
    } else {
      this.displayHeight = value;
      this.displayWidth = value > 0 && size.height > 0 ? Math.round(size.width * value / size.height) : 0;
    }
  }
  get canAlignBlock() {
    return true;
  }
  get caption() {
    return this.captionText.text;
  }
  set caption(value) {
    this.captionText = new RichText(value);
  }
  /** The address the picture is shown from: a data URI for embedded pictures, otherwise sourceURL. */
  get source() {
    if (this.imageData.length > 0)
      return `data:${Utilities.pictureMimeType(this.imageData)};base64,${this.imageData}`;
    return this.sourceURL;
  }
  get hasImage() {
    return this.source.length > 0;
  }
  /** The upload in progress: a preview of the file, and how to cancel it. */
  #upload = null;
  /** True while a picture is uploading through the editor's fileUploader. */
  get isUploading() {
    return this.#upload !== null;
  }
  build(body) {
    let figure = Utilities.element("figure", "scv-image");
    body.append(figure);
    if (this.#upload) {
      let upload = this.#upload;
      let frame2 = Utilities.element("div", "scv-image-frame scv-image-uploading", { contenteditable: "false", "aria-busy": "true" });
      if (this.displayWidth > 0)
        frame2.style.width = `${this.displayWidth}px`;
      frame2.append(Utilities.element("img", "", { src: upload.preview, alt: "", draggable: "false" }));
      let overlay = Utilities.element("div", "scv-image-upload");
      let label = Utilities.element("span", "scv-image-upload-label");
      label.textContent = this.strings.TextUploadingCaption;
      let progress = Utilities.element("div", "progress", { role: "progressbar", "aria-label": this.strings.TextUploadingCaption, "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" });
      upload.bar = Utilities.element("div", "progress-bar progress-bar-striped progress-bar-animated");
      upload.bar.style.width = "100%";
      progress.append(upload.bar);
      let cancel = Utilities.element("button", "btn btn-sm btn-light", { type: "button" });
      cancel.textContent = this.strings.TextCancelCaption;
      cancel.addEventListener("click", (event) => {
        event.stopPropagation();
        upload.controller.abort();
      });
      overlay.append(label, progress, cancel);
      frame2.append(overlay);
      figure.append(frame2);
      return;
    }
    if (!this.hasImage) {
      let placeholder = Utilities.element("div", "scv-image-placeholder", { contenteditable: "false" });
      placeholder.innerHTML = `<i class="bi bi-image"></i>`;
      let buttons = Utilities.element("div", "scv-image-buttons");
      let choose = Utilities.element("button", "btn btn-sm btn-primary", { type: "button" });
      choose.textContent = this.strings.TextChooseLocalFileCaption;
      choose.addEventListener("click", (event) => {
        event.stopPropagation();
        this.chooseFile();
      });
      let address = Utilities.element("button", "btn btn-sm btn-outline-secondary", { type: "button" });
      address.textContent = this.strings.TextEnterURLCaption;
      address.addEventListener("click", (event) => {
        event.stopPropagation();
        this.enterURL();
      });
      buttons.append(choose, address);
      placeholder.append(buttons);
      if (this.editor && this.editor.readOnly)
        buttons.classList.add("d-none");
      figure.append(placeholder);
      return;
    }
    let frame = Utilities.element("div", "scv-image-frame", { contenteditable: "false" });
    if (this.displayWidth > 0)
      frame.style.width = `${this.displayWidth}px`;
    let image = Utilities.element("img", "", { src: this.source, alt: this.caption, draggable: "false" });
    image.style.objectFit = ["contain", "cover", "fill"][this.fillMode] || "contain";
    if (this.displayWidth > 0 && this.displayHeight > 0)
      image.style.aspectRatio = `${this.displayWidth} / ${this.displayHeight}`;
    image.addEventListener("load", () => {
      if (this.displayWidth == 0 && image.naturalWidth > 0) {
        let width = Math.min(image.naturalWidth, _ImageNode.maximumInitialWidth);
        this.displayWidth = width;
        this.displayHeight = Math.round(image.naturalHeight * width / image.naturalWidth);
        frame.style.width = `${this.displayWidth}px`;
        image.style.aspectRatio = `${this.displayWidth} / ${this.displayHeight}`;
      }
    });
    frame.append(image);
    let handle = Utilities.element("span", "scv-resize-handle", { title: "" });
    handle.addEventListener("pointerdown", (event) => this.#beginResize(event, frame, image));
    frame.append(handle);
    figure.append(frame);
    let caption = Utilities.element("figcaption", "scv-image-caption");
    if (this.displayWidth > 0)
      caption.style.maxWidth = `${Math.max(this.displayWidth, 120)}px`;
    figure.append(caption);
    let host = this.addHost(new TextHost(this, this.captionText, caption, 0 /* inline */));
    host.placeholder = this.strings.TextCaptionCaption;
    host.render();
  }
  #beginResize(event, frame, image) {
    if (!this.editor || this.editor.readOnly || this.locked)
      return;
    event.preventDefault();
    event.stopPropagation();
    let startX = event.clientX;
    let startWidth = frame.getBoundingClientRect().width;
    let ratio = this.displayWidth > 0 && this.displayHeight > 0 ? this.displayHeight / this.displayWidth : image.naturalWidth > 0 ? image.naturalHeight / image.naturalWidth : 0.75;
    let rightToLeft = getComputedStyle(frame).direction == "rtl";
    let maximum = this.element && this.element.parentElement ? this.element.parentElement.clientWidth : 2e3;
    let width = startWidth;
    let handle = event.target;
    handle.setPointerCapture(event.pointerId);
    let move = (moveEvent) => {
      let delta = (moveEvent.clientX - startX) * (rightToLeft ? -1 : 1);
      width = Math.round(Utilities.clamp(startWidth + delta, 32, maximum));
      frame.style.width = `${width}px`;
    };
    let up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      if (Math.round(width) == Math.round(startWidth))
        return;
      this.willChange();
      this.displayWidth = width;
      this.displayHeight = Math.round(width * ratio);
      this.refresh();
      this.changed();
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  }
  /** Asks for a picture file and embeds it. */
  inserted() {
    if (!this.hasImage)
      this.chooseFile();
  }
  inspectorSections() {
    let strings = this.strings;
    let file = InspectorItem2.bound("localfile", strings.TextLocalFileCaption, 8 /* file */, (target) => target.imageData.length > 0 ? "data" : "", (target, value) => {
      if (typeof value == "string" && value.startsWith("data:")) {
        target.imageData = value.substring(value.indexOf(",") + 1);
        target.sourceURL = "";
        target.displayWidth = 0;
        target.displayHeight = 0;
      }
    });
    file.fileFilter = "image/*";
    let url = InspectorItem2.bound("url", strings.TextURLCaption, 1 /* text */, (target) => target.sourceURL, (target, value) => {
      target.sourceURL = String(value || "").trim();
      if (target.sourceURL.length > 0)
        target.imageData = "";
      target.displayWidth = 0;
      target.displayHeight = 0;
    });
    url.updatesLive = false;
    let fill = InspectorItem2.menu("fillmode", strings.TextFillCaption, [[strings.TextFitCaption, 0 /* fit */], [strings.TextFillCaption, 1 /* fill */], [strings.TextStretchCaption, 2 /* stretch */]], (target) => target.fillMode, (target, value) => target.fillMode = value);
    let width = InspectorItem2.number("displaywidth", strings.TextWidthInspectorCaption, (target) => target.displayWidth, (target, value) => {
      let ratio = target.displayWidth > 0 ? target.displayHeight / target.displayWidth : 0;
      target.displayWidth = Math.max(0, Math.round(value));
      if (ratio > 0)
        target.displayHeight = Math.round(target.displayWidth * ratio);
    }, 0, 1e4, 1);
    width.zeroCaption = strings.TextAutomatic;
    let caption = InspectorItem2.bound("caption", strings.TextTextCaption, 2 /* multilineText */, (target) => target.caption, (target, value) => {
      let style = target.captionText.length > 0 ? target.captionText.styleAt(0) : new TextStyle();
      if (target.caption != value)
        target.captionText = new RichText(String(value || "").replace(/\n/g, LineBreak), style);
    });
    caption.setDefaultValue(void 0);
    return [
      InspectorDefaults.section("image", strings.TextImageCaption, [file, url, fill, width]),
      InspectorDefaults.section("caption", strings.TextCaptionCaption, [caption, ...InspectorDefaults.lineItems(strings)])
    ].concat(InspectorDefaults.node(this, { appearance: false, backgroundImage: false }));
  }
  chooseFile() {
    let input = Utilities.element("input", "", { type: "file", accept: "image/*" });
    input.addEventListener("change", () => {
      if (input.files && input.files.length > 0)
        this.loadFile(input.files[0]);
    });
    input.click();
  }
  /**
   * Adds a picture file, such as one chosen, dropped or pasted. With the editor's fileUploader,
   * it is uploaded and shown from its address; otherwise it is embedded in the document.
   */
  loadFile(file) {
    if (this.editor && this.editor.fileUploader)
      return this.#uploadFile(file, this.editor);
    return new Promise((resolve) => {
      let reader = new FileReader();
      reader.addEventListener("load", () => {
        let value = String(reader.result || "");
        let comma = value.indexOf(",");
        if (comma < 0) {
          resolve(false);
          return;
        }
        this.willChange();
        this.imageData = value.substring(comma + 1);
        this.sourceURL = "";
        this.displayWidth = 0;
        this.displayHeight = 0;
        this.refresh();
        this.changed();
        resolve(true);
      });
      reader.addEventListener("error", () => {
        if (this.editor)
          this.editor.showMessage(this.strings.TextImageOpenErrorMessage, "danger");
        resolve(false);
      });
      reader.readAsDataURL(file);
    });
  }
  async #uploadFile(file, editor) {
    if (this.#upload)
      this.#upload.controller.abort();
    let upload = { preview: URL.createObjectURL(file), controller: new AbortController(), bar: null };
    this.#upload = upload;
    this.refresh();
    let finish = () => {
      if (this.#upload !== upload)
        return false;
      this.#upload = null;
      URL.revokeObjectURL(upload.preview);
      return true;
    };
    let address;
    try {
      address = await editor.storeFile(file, "image", this, (fraction) => {
        if (!upload.bar)
          return;
        upload.bar.classList.remove("progress-bar-striped", "progress-bar-animated");
        upload.bar.style.width = `${Math.round(fraction * 100)}%`;
        upload.bar.parentElement?.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
      }, upload.controller.signal);
    } catch (error) {
      if (!finish())
        return false;
      this.refresh();
      let cancelled = upload.controller.signal.aborted || error instanceof DOMException && error.name == "AbortError";
      if (!cancelled)
        editor.showMessage(this.strings.TextUploadFailedMessage, "danger");
      return false;
    }
    if (!finish())
      return false;
    if (address.toLowerCase().startsWith("data:")) {
      let comma = address.indexOf(",");
      this.willChange();
      this.imageData = comma >= 0 ? address.substring(comma + 1) : "";
      this.sourceURL = "";
      this.displayWidth = 0;
      this.displayHeight = 0;
      this.refresh();
      this.changed();
    } else {
      this.setURL(address);
    }
    return true;
  }
  /** Asks for a picture address. */
  async enterURL() {
    if (!this.editor)
      return;
    let values = await this.editor.prompt(this.strings.TextImageURLDialogTitle, [{ name: "url", label: this.strings.TextImageURLDialogPrompt, value: this.sourceURL, type: "url" }]);
    if (!values)
      return;
    this.setURL(values.url.trim());
  }
  setURL(url) {
    this.willChange();
    this.sourceURL = url;
    this.imageData = "";
    this.displayWidth = 0;
    this.displayHeight = 0;
    this.refresh();
    this.changed();
  }
  actions() {
    let strings = this.strings;
    let replace = new ToolbarItem("replace", strings.TextImageCaption, "bi bi-arrow-repeat", 2 /* menu */);
    replace.menuItems.push(new ToolbarMenuItem("file", strings.TextChooseLocalFileCaption, "bi bi-folder2-open"));
    replace.menuItems.push(new ToolbarMenuItem("url", strings.TextEnterURLCaption, "bi bi-link-45deg"));
    let fill = new ToolbarItem("fillmode", [strings.TextFitCaption, strings.TextFillCaption, strings.TextStretchCaption][this.fillMode], "bi bi-aspect-ratio", 2 /* menu */);
    [strings.TextFitCaption, strings.TextFillCaption, strings.TextStretchCaption].forEach((caption, index) => {
      let menuItem = new ToolbarMenuItem(String(index), caption);
      menuItem.checked = index == this.fillMode;
      fill.menuItems.push(menuItem);
    });
    let actual = new ToolbarItem("actualsize", strings.TextActualSizeCaption, "bi bi-arrows-angle-expand");
    actual.enabled = this.hasImage;
    return [replace, fill, actual];
  }
  performAction(item, menuItem) {
    switch (item.identifier) {
      case "replace":
        if (menuItem && menuItem.identifier == "file")
          this.chooseFile();
        if (menuItem && menuItem.identifier == "url")
          this.enterURL();
        return true;
      case "fillmode":
        if (!menuItem)
          return false;
        this.willChange();
        this.fillMode = Number(menuItem.identifier);
        this.refresh();
        this.changed();
        return true;
      case "actualsize": {
        let image = this.element ? this.element.querySelector("img") : null;
        if (!image || image.naturalWidth == 0)
          return true;
        this.willChange();
        this.displayWidth = image.naturalWidth;
        this.displayHeight = image.naturalHeight;
        this.refresh();
        this.changed();
        return true;
      }
    }
    return false;
  }
  toJSON() {
    let result = super.toJSON();
    if (this.caption.length > 0)
      result["caption"] = this.caption;
    if (this.displayHeight != 0)
      result["displayHeight"] = this.displayHeight;
    if (this.displayWidth != 0)
      result["displayWidth"] = this.displayWidth;
    if (this.fillMode != 0)
      result["fillMode"] = this.fillMode;
    if (this.imageData.length > 0)
      result["image"] = this.imageData;
    if (this.sourceURL.length > 0)
      result["sourceURL"] = this.sourceURL;
    let styles = [];
    let allDefault = true;
    let text = this.captionText.text;
    for (let index = 0; index < text.length; index++) {
      let style = this.captionText.styleAt(index);
      if (!style.isDefault())
        allDefault = false;
      styles.push(style.toCompactJSON());
      index += CodePoints.widthAt(text, index) - 1;
    }
    if (!allDefault)
      result["captionStyles"] = styles;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.captionText = RichText.fromJSON({ text: Utilities.string(data.caption), styles: Array.isArray(data.captionStyles) ? data.captionStyles : void 0 });
    this.displayHeight = Math.max(0, Utilities.number(data.displayHeight, 0));
    this.displayWidth = Math.max(0, Utilities.number(data.displayWidth, 0));
    this.fillMode = Utilities.clamp(Utilities.integer(data.fillMode, 0), 0, 2);
    this.imageData = Utilities.string(data.image).replace(/^data:[^,]*,/, "");
    this.sourceURL = Utilities.string(data.sourceURL);
    return true;
  }
  toHTML() {
    let fit = ["contain", "cover", "fill"][this.fillMode] || "contain";
    let size = this.displayWidth > 0 ? `width:${this.displayWidth}px;height:${this.displayHeight}px;` : "max-width:100%;";
    let result = `<figure style="width:fit-content;max-width:100%;${this.htmlBackgroundCSS()}"><img src="${Utilities.escapeAttribute(this.source)}" alt="${Utilities.escapeAttribute(this.caption)}" style="${size}object-fit:${fit}">`;
    if (this.caption.length > 0)
      result += `<figcaption style="text-align:center">${this.captionText.htmlText()}</figcaption>`;
    return result + "</figure>";
  }
  toMarkdown() {
    let source = this.source.replace(/\\/g, "\\\\").replace(/\)/g, "\\)");
    let alternate = this.caption.replace(/[\r\n\u2028]/g, " ").replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
    return this.markdownWithBackground(`![${alternate}](${source})`);
  }
  toPlainText() {
    return this.caption;
  }
};

// nodes/unknownnode.ts
var UnknownNode = class extends Node3 {
  static identifier = "unknown";
  static caption = "Unsupported";
  static icon = "bi bi-question-square";
  static insertable = false;
  #data = {};
  get type() {
    return Utilities.string(this.#data.type, "unknown");
  }
  get typeName() {
    return Utilities.format(this.strings.TextUnsupportedContentFormat, { type: this.type });
  }
  build(body) {
    let card = Utilities.element("div", "scv-unknown");
    card.innerHTML = `<i class="bi bi-puzzle"></i> `;
    card.append(document.createTextNode(this.typeName));
    body.append(card);
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.#data = JSON.parse(JSON.stringify(data));
    return true;
  }
  toJSON() {
    let result = JSON.parse(JSON.stringify(this.#data));
    result.nodeId = this.nodeId;
    return result;
  }
  inspectorSections() {
    return [];
  }
  get canExportHTML() {
    return false;
  }
  toPlainText() {
    return "";
  }
};

// nodes/mediaui.ts
var MediaUI = class {
  /** An empty-state panel with buttons to choose a file or enter an address. */
  static placeholder(node, icon, caption, chooseFile, enterURL) {
    let panel = Utilities.element("div", "scv-image-placeholder scv-media-placeholder", { contenteditable: "false" });
    panel.innerHTML = `<i class="${icon}"></i>`;
    let label = Utilities.element("div", "small");
    label.textContent = caption;
    panel.append(label);
    let buttons = Utilities.element("div", "scv-image-buttons");
    if (chooseFile) {
      let choose = Utilities.element("button", "btn btn-sm btn-primary", { type: "button" });
      choose.textContent = node.strings.TextChooseLocalFileCaption;
      choose.addEventListener("click", (event) => {
        event.stopPropagation();
        chooseFile();
      });
      buttons.append(choose);
    }
    let address = Utilities.element("button", `btn btn-sm ${chooseFile ? "btn-outline-secondary" : "btn-primary"}`, { type: "button" });
    address.textContent = node.strings.TextEnterURLCaption;
    address.addEventListener("click", (event) => {
      event.stopPropagation();
      enterURL();
    });
    buttons.append(address);
    if (node.editor && node.editor.readOnly)
      buttons.classList.add("d-none");
    panel.append(buttons);
    return panel;
  }
  /** Lets the user drag handle to resize frame. ratio is height / width, or 0 to keep the height. */
  static attachResize(node, handle, frame, ratio, done) {
    handle.addEventListener("pointerdown", (event) => {
      if (!node.editor || node.editor.readOnly || node.locked)
        return;
      event.preventDefault();
      event.stopPropagation();
      let startX = event.clientX;
      let startWidth = frame.getBoundingClientRect().width;
      let startHeight = frame.getBoundingClientRect().height;
      let rightToLeft = getComputedStyle(frame).direction == "rtl";
      let maximum = node.element && node.element.parentElement ? node.element.parentElement.clientWidth : 2e3;
      let width = startWidth;
      handle.setPointerCapture(event.pointerId);
      let move = (moveEvent) => {
        let delta = (moveEvent.clientX - startX) * (rightToLeft ? -1 : 1);
        width = Math.round(Utilities.clamp(startWidth + delta, 48, maximum));
        frame.style.width = `${width}px`;
        let factor = ratio();
        if (factor > 0)
          frame.style.height = `${Math.round(width * factor)}px`;
      };
      let up = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        handle.removeEventListener("pointercancel", up);
        if (Math.round(width) == Math.round(startWidth))
          return;
        let factor = ratio();
        done(width, factor > 0 ? Math.round(width * factor) : Math.round(startHeight));
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
    });
  }
  /** Reads a file as a data: URI. */
  static readDataURI(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result || "")));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });
  }
  static pickFile(accept, handler) {
    let input = Utilities.element("input", "", { type: "file", accept });
    input.addEventListener("change", () => {
      if (input.files && input.files.length > 0)
        handler(input.files[0]);
    });
    input.click();
  }
};

// helpers.ts
var History = class extends EventTarget {
  #editor;
  #undo = [];
  #redo = [];
  #lastKey = null;
  #lastTime = 0;
  #suspended = 0;
  /** Most steps kept. */
  limit = 200;
  /** Consecutive typing in one place within this many milliseconds is one step. */
  coalesceInterval = 1500;
  constructor(editor) {
    super();
    this.#editor = editor;
  }
  get owner() {
    return this.#editor;
  }
  get canUndo() {
    return this.#undo.length > 0 && !this.#editor.readOnly;
  }
  get canRedo() {
    return this.#redo.length > 0 && !this.#editor.readOnly;
  }
  get undoCount() {
    return this.#undo.length;
  }
  get redoCount() {
    return this.#redo.length;
  }
  /**
   * Records the current document as an undo step. Calls with the same
   * coalesceKey in quick succession, such as typing, record only the first.
   */
  checkpoint(coalesceKey = null) {
    if (this.#suspended > 0)
      return;
    let now = Date.now();
    if (coalesceKey !== null && coalesceKey === this.#lastKey && now - this.#lastTime < this.coalesceInterval) {
      this.#lastTime = now;
      return;
    }
    this.#undo.push(this.#capture());
    if (this.#undo.length > this.limit)
      this.#undo.shift();
    this.#redo = [];
    this.#lastKey = coalesceKey;
    this.#lastTime = now;
    this.dispatchEvent(new Event("changed"));
  }
  /** Ends typing coalescing, so the next change starts a new step. */
  breakCoalescing() {
    this.#lastKey = null;
  }
  undo() {
    if (!this.canUndo)
      return;
    this.#redo.push(this.#capture());
    this.#restore(this.#undo.pop());
  }
  redo() {
    if (!this.canRedo)
      return;
    this.#undo.push(this.#capture());
    this.#restore(this.#redo.pop());
  }
  reset() {
    this.#undo = [];
    this.#redo = [];
    this.#lastKey = null;
    this.dispatchEvent(new Event("changed"));
  }
  /**
   * @internal Applies a change made by someone else to every undo and redo step, so
   * undoing restores this user's earlier content without reverting the change.
   */
  rebase(transform) {
    let apply = (state) => {
      try {
        let document2 = JSON.parse(state.document);
        transform(document2);
        state.document = JSON.stringify(document2);
      } catch {
      }
    };
    this.#undo.forEach(apply);
    this.#redo.forEach(apply);
  }
  /** Runs work without recording steps. */
  suspend(work) {
    this.#suspended++;
    try {
      work();
    } finally {
      this.#suspended--;
    }
  }
  #capture() {
    return { document: this.#editor.toJSON(), selection: this.#editor.captureSelection() };
  }
  #restore(state) {
    this.#lastKey = null;
    this.#suspended++;
    try {
      this.#editor.restoreDocument(state.document);
      this.#editor.restoreSelection(state.selection);
    } finally {
      this.#suspended--;
    }
    this.dispatchEvent(new Event("changed"));
  }
};
var NodeTypes = class _NodeTypes extends EventTarget {
  #editor;
  #items = [];
  constructor(editor) {
    super();
    this.#editor = editor;
  }
  get owner() {
    return this.#editor;
  }
  static normalize(identifier) {
    return identifier.startsWith("node:") ? identifier.substring(5) : identifier;
  }
  /** Adds a node class. A class with the same identifier is replaced. */
  add(item) {
    this.addAt(this.#items.length, item);
  }
  addAt(index, item) {
    let existing = this.indexOf(item.identifier);
    if (existing >= 0) {
      this.#items.splice(existing, 1);
      if (existing < index)
        index--;
    }
    this.#items.splice(Utilities.clamp(index, 0, this.#items.length), 0, item);
    this.dispatchEvent(new Event("changed"));
  }
  indexOf(item) {
    let identifier = typeof item == "string" ? _NodeTypes.normalize(item) : item.identifier;
    return this.#items.findIndex((candidate) => candidate.identifier == identifier);
  }
  item(identifier) {
    return this.#items[this.indexOf(identifier)] || null;
  }
  itemAt(index) {
    return this.#items[index] || null;
  }
  items() {
    return this.#items.slice();
  }
  get lastIndex() {
    return this.#items.length - 1;
  }
  remove(item) {
    let index = this.indexOf(item);
    if (index >= 0)
      this.removeAt(index);
  }
  removeAt(index) {
    if (index < 0 || index >= this.#items.length)
      return;
    this.#items.splice(index, 1);
    this.dispatchEvent(new Event("changed"));
  }
  removeAll() {
    this.#items = [];
    this.dispatchEvent(new Event("changed"));
  }
};
var Statistics = class _Statistics {
  #editor;
  /** Words read per minute, used by readingMinutes. */
  wordsPerMinute = 200;
  constructor(editor) {
    this.#editor = editor;
  }
  get owner() {
    return this.#editor;
  }
  static countWords(value) {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      let segmenter = new Intl.Segmenter(void 0, { granularity: "word" });
      let count = 0;
      for (let segment of segmenter.segment(value))
        if (segment.isWordLike)
          count++;
      return count;
    }
    let matches = value.match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu);
    return matches ? matches.length : 0;
  }
  get words() {
    return _Statistics.countWords(this.#editor.toPlainText());
  }
  get characters() {
    return CodePoints.count(this.#editor.toPlainText().replace(/\n/g, ""));
  }
  get charactersExcludingSpaces() {
    return CodePoints.count(this.#editor.toPlainText().replace(/\s/g, ""));
  }
  get paragraphs() {
    return this.#editor.toPlainText().split(/\n/).filter((line) => line.trim().length > 0).length;
  }
  get readingMinutes() {
    let words = this.words;
    return words == 0 ? 0 : Math.max(1, Math.ceil(words / this.wordsPerMinute));
  }
  get selectedCharacters() {
    return CodePoints.count(this.#editor.selectedText().replace(/\n/g, ""));
  }
  get selectedWords() {
    return _Statistics.countWords(this.#editor.selectedText());
  }
};
var NodeSelection = class {
  #editor;
  constructor(editor) {
    this.#editor = editor;
  }
  get owner() {
    return this.#editor;
  }
  /** The primary selected node. */
  get node() {
    return this.#editor.selectedNode;
  }
  /** The selected nodes in document order. */
  nodes() {
    return this.#editor.inDocumentOrder(this.#editor.selectedNodes());
  }
  get lastNodeIndex() {
    return this.nodes().length - 1;
  }
  isSelected(node) {
    return this.nodes().indexOf(node) >= 0;
  }
  selectNode(node, addToSelection = false) {
    this.#editor.selectNode(node, addToSelection);
  }
  selectAllNodes() {
    this.#editor.selectNodes(this.#editor.nodes());
  }
  /** Selects all the text being edited, or every node when no text is being edited. */
  selectAll() {
    let host = this.#editor.activeHost;
    if (host) {
      host.select(0, host.rich.length);
    } else {
      this.selectAllNodes();
    }
  }
  deselectAll() {
    this.#editor.selectNodes([]);
  }
  clear() {
    this.deselectAll();
  }
  /** Selects text in the node being edited. Returns false when no text is being edited. */
  selectText(start, length) {
    let host = this.#editor.activeHost || (this.node ? this.node.primaryHost : null);
    if (!host)
      return false;
    host.select(start, start + length);
    return true;
  }
  get description() {
    let nodes = this.nodes();
    if (nodes.length == 0)
      return this.#editor.strings.TextNoSelectionCaption;
    return `${nodes.length} selected: ${nodes.map((node) => node.typeName).join(", ")}`;
  }
  get canDelete() {
    return !this.#editor.readOnly && this.nodes().some((node) => !node.locked);
  }
  get canDuplicate() {
    return this.canDelete;
  }
  get canMoveUp() {
    return this.#editor.canMoveNodes(this.nodes(), -1);
  }
  get canMoveDown() {
    return this.#editor.canMoveNodes(this.nodes(), 1);
  }
  get canCopy() {
    return this.nodes().length > 0 || this.#editor.selectedText().length > 0;
  }
  get canCut() {
    return this.canCopy && !this.#editor.readOnly;
  }
  get canPaste() {
    return !this.#editor.readOnly;
  }
  get canSelectAll() {
    return this.#editor.nodes().length > 0;
  }
  get canDeselectAll() {
    return this.nodes().length > 0;
  }
  /** Deletes the selected text, or the selected nodes when no text is selected. */
  delete() {
    let host = this.#editor.activeHost;
    let range = host ? host.selection() : null;
    if (host && range && range.end > range.start) {
      this.#editor.deleteText(host, range.start, range.end);
    } else {
      this.deleteNodes();
    }
  }
  deleteNodes() {
    this.#editor.removeNodes(this.nodes(), false);
  }
  duplicate() {
    this.#editor.duplicateNodes(this.nodes());
  }
  moveUp() {
    this.#editor.moveNodes(this.nodes(), -1);
  }
  moveDown() {
    this.#editor.moveNodes(this.nodes(), 1);
  }
  /** Selects every node from the anchor to node in document order. */
  selectRange(from, to) {
    this.#editor.selectRange(from, to);
  }
  copy() {
    this.#editor.copyToClipboard(false);
  }
  cut() {
    this.#editor.copyToClipboard(true);
  }
  paste() {
    this.#editor.pasteFromClipboard();
  }
};
var AutosaveStates = /* @__PURE__ */ ((AutosaveStates2) => {
  AutosaveStates2["saved"] = "saved";
  AutosaveStates2["unsaved"] = "unsaved";
  AutosaveStates2["saving"] = "saving";
  AutosaveStates2["failed"] = "failed";
  return AutosaveStates2;
})(AutosaveStates || {});
var Autosave = class {
  #editor;
  #save = null;
  #state = "saved" /* saved */;
  #lastError = null;
  #lastSaved = null;
  #timer = null;
  #firstChange = 0;
  #running = null;
  #again = false;
  #generation = 0;
  #listening = false;
  /** Milliseconds to wait after the last change before saving. */
  delay = 1500;
  /** The longest to wait while changes keep coming, in milliseconds, so long typing sessions are still saved. */
  maximumWait = 1e4;
  /** Milliseconds before a failed save is tried again. */
  retryDelay = 1e4;
  /** Asks the browser to warn before the page closes while changes aren't saved. */
  warnBeforeLeaving = true;
  constructor(editor) {
    this.#editor = editor;
    editor.addEventListener("contentChanged", (event) => {
      if (event.detail && event.detail.remote)
        return;
      if (editor.isChanged)
        this.#changed();
      else
        this.#loaded();
    });
  }
  get owner() {
    return this.#editor;
  }
  /** The application's save function, or null to turn autosave off. */
  get save() {
    return this.#save;
  }
  set save(value) {
    this.#save = typeof value == "function" ? value : null;
    if (!this.#save) {
      this.#clearTimer();
      this.#setState("saved" /* saved */);
    } else if (this.#editor.isChanged && this.#state == "saved" /* saved */) {
      this.#changed();
    }
  }
  get enabled() {
    return this.#save !== null;
  }
  get state() {
    return this.#state;
  }
  /** What the last failed save threw or rejected with, or null. */
  get lastError() {
    return this.#lastError;
  }
  /** When the document was last saved, or null. */
  get lastSaved() {
    return this.#lastSaved;
  }
  /**
   * Saves now, without waiting. Resolves true when the document is saved. While a save is
   * running, waits for it and saves again if anything changed meanwhile.
   */
  async saveNow() {
    this.#clearTimer();
    if (!this.#save)
      return false;
    if (this.#running) {
      this.#again = true;
      await this.#running;
      return this.#state == "saved" /* saved */;
    }
    this.#running = this.#run();
    try {
      return await this.#running;
    } finally {
      this.#running = null;
      if (this.#again) {
        this.#again = false;
        if (this.#state == "unsaved" /* unsaved */)
          this.#schedule(0);
      }
    }
  }
  /** Stops autosave and its listeners; the editor calls it when it is destroyed. */
  dispose() {
    this.#clearTimer();
    this.#listen(false);
    this.#save = null;
  }
  async #run() {
    let generation = this.#generation;
    this.#setState("saving" /* saving */);
    try {
      await this.#save(this.#editor);
    } catch (error) {
      this.#lastError = error;
      this.#setState("failed" /* failed */);
      this.#schedule(this.retryDelay);
      return false;
    }
    this.#lastError = null;
    this.#lastSaved = /* @__PURE__ */ new Date();
    if (generation == this.#generation) {
      this.#editor.isChanged = false;
      this.#setState("saved" /* saved */);
      return true;
    }
    this.#setState("unsaved" /* unsaved */);
    this.#schedule(this.delay);
    return true;
  }
  #changed() {
    this.#generation++;
    if (!this.#save)
      return;
    if (this.#state != "saving" /* saving */)
      this.#setState("unsaved" /* unsaved */);
    if (this.#running) {
      this.#again = true;
      return;
    }
    if (this.#firstChange == 0)
      this.#firstChange = Date.now();
    let waited = Date.now() - this.#firstChange;
    this.#schedule(Math.max(0, Math.min(this.delay, this.maximumWait - waited)));
  }
  #loaded() {
    this.#generation++;
    this.#clearTimer();
    if (!this.#running)
      this.#setState("saved" /* saved */);
  }
  #schedule(milliseconds) {
    if (this.#timer !== null)
      clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.saveNow();
    }, Math.max(0, milliseconds));
  }
  #clearTimer() {
    if (this.#timer !== null)
      clearTimeout(this.#timer);
    this.#timer = null;
    this.#firstChange = 0;
  }
  #setState(state) {
    if (state != "unsaved" /* unsaved */ && state != "saving" /* saving */)
      this.#firstChange = 0;
    this.#listen(state != "saved" /* saved */ && this.#save !== null);
    if (state == this.#state)
      return;
    this.#state = state;
    this.#editor.dispatchEvent(new CustomEvent("autosaveStateChanged", { detail: { state, error: state == "failed" /* failed */ ? this.#lastError : null } }));
  }
  // The page listeners are added only while something is unsaved: a beforeunload listener keeps
  // some browsers from caching the page for the back button.
  #listen(value) {
    if (typeof window == "undefined" || value == this.#listening)
      return;
    this.#listening = value;
    if (value) {
      window.addEventListener("beforeunload", this.#beforeUnload);
      document.addEventListener("visibilitychange", this.#visibilityChange);
    } else {
      window.removeEventListener("beforeunload", this.#beforeUnload);
      document.removeEventListener("visibilitychange", this.#visibilityChange);
    }
  }
  #beforeUnload = (event) => {
    if (!this.warnBeforeLeaving || this.#state == "saved" /* saved */)
      return;
    event.preventDefault();
    event.returnValue = "";
  };
  // Saves straight away when the page is hidden, as when the user switches tabs or closes it on a phone.
  #visibilityChange = () => {
    if (document.visibilityState == "hidden" && this.#state == "unsaved" /* unsaved */)
      this.saveNow();
  };
};
var StatusBar = class _StatusBar {
  static #items = [];
  /** Adds an item to every editor's status bar, such as the readability add-on's; one with the same identifier is replaced. */
  static registerItem(identifier, item) {
    _StatusBar.#items = _StatusBar.#items.filter((entry) => entry.identifier != identifier).concat([{ identifier, item }]);
  }
  #editor;
  #element = null;
  #counts = null;
  #extras = null;
  #save = null;
  #timer = null;
  showWords = true;
  showCharacters = true;
  showReadingTime = true;
  showSaveState = true;
  constructor(editor) {
    this.#editor = editor;
    let schedule = () => this.scheduleUpdate();
    for (let name of ["contentChanged", "selectionChanged", "editingChanged", "autosaveStateChanged"])
      editor.addEventListener(name, schedule);
  }
  get owner() {
    return this.#editor;
  }
  get element() {
    return this.#element;
  }
  /** Builds the bar in an element; the editor calls it as it draws itself. */
  attach(element) {
    document.addEventListener("selectionchange", this.#selectionChange);
    this.#element = element;
    element.replaceChildren();
    this.#counts = Utilities.element("span", "scv-status-counts");
    this.#extras = Utilities.element("span", "scv-status-extras");
    this.#save = Utilities.element("span", "scv-status-save");
    element.append(this.#counts, this.#extras, this.#save);
    this.update();
  }
  detach() {
    document.removeEventListener("selectionchange", this.#selectionChange);
    if (this.#timer !== null)
      clearTimeout(this.#timer);
    this.#timer = null;
    this.#element = null;
    this.#counts = null;
    this.#extras = null;
    this.#save = null;
  }
  // Selecting text inside a block raises no editor event.
  #selectionChange = () => {
    if (this.#editor.isEditingText && this.#editor.statusBarVisible)
      this.scheduleUpdate();
  };
  /** Updates the bar shortly, once, however many changes arrive meanwhile. */
  scheduleUpdate() {
    if (this.#timer !== null || !this.#element)
      return;
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.update();
    }, 150);
  }
  update() {
    let editor = this.#editor;
    if (!this.#element || !this.#counts || !this.#save || !editor.statusBarVisible)
      return;
    let strings = editor.strings;
    let statistics = editor.statistics;
    let number = (value) => value.toLocaleString();
    let parts = [];
    let text = editor.toPlainText();
    let words = Statistics.countWords(text);
    let selected = editor.isEditingText ? editor.selectedText() : "";
    if (this.showWords) {
      if (selected.length > 0)
        parts.push(Utilities.format(strings.TextSelectedWordsFormat, { selected: number(Statistics.countWords(selected)), count: number(words) }));
      else
        parts.push(words == 1 ? strings.TextOneWordCaption : Utilities.format(strings.TextWordsCountFormat, { count: number(words) }));
    }
    if (this.showCharacters) {
      let characters = CodePoints.count(text.replace(/\n/g, ""));
      if (selected.length > 0)
        parts.push(Utilities.format(strings.TextSelectedCharactersFormat, { selected: number(CodePoints.count(selected.replace(/\n/g, ""))), count: number(characters) }));
      else
        parts.push(characters == 1 ? strings.TextOneCharacterCaption : Utilities.format(strings.TextCharactersCountFormat, { count: number(characters) }));
    }
    if (this.showReadingTime && words > 0)
      parts.push(Utilities.format(strings.TextReadingTimeFormat, { count: number(Math.max(1, Math.ceil(words / statistics.wordsPerMinute))) }));
    this.#counts.textContent = parts.join(" \xB7 ");
    if (this.#extras) {
      let extras = this.#extras;
      extras.replaceChildren();
      _StatusBar.#items.forEach(({ identifier, item }) => {
        try {
          let content = item(editor, text);
          if (!content)
            return;
          content.dataset.statusItem = identifier;
          extras.append(content);
        } catch (error) {
          console.error(error);
        }
      });
    }
    let autosave = editor.autosave;
    this.#save.replaceChildren();
    this.#save.className = "scv-status-save";
    if (!this.showSaveState || !autosave.enabled)
      return;
    let state = autosave.state;
    this.#save.classList.add(`scv-status-${state}`);
    let icons = { saved: "bi bi-check2", unsaved: "bi bi-circle-fill", saving: "bi bi-arrow-repeat", failed: "bi bi-exclamation-triangle-fill" };
    let captions = { saved: strings.TextSavedCaption, unsaved: strings.TextUnsavedCaption, saving: strings.TextSavingCaption, failed: strings.TextSaveFailedCaption };
    this.#save.append(Utilities.element("i", icons[state], { "aria-hidden": "true" }), document.createTextNode(` ${captions[state]}`));
    if (state == "failed" /* failed */) {
      let retry = Utilities.element("button", "btn btn-link btn-sm scv-status-retry", { type: "button" });
      retry.textContent = strings.TextTryAgainCaption;
      retry.addEventListener("click", () => autosave.saveNow());
      this.#save.append(retry);
    }
  }
};

// importers.ts
var HTMLImporter7 = class _HTMLImporter {
  #editor;
  /** Readers for inline elements that become text of their own; see registerInlineElement. */
  static #inlineReaders = [];
  /**
   * Reads inline elements an add-on exports, such as formulas, into text with a style, instead of
   * reading their contents. The reader returns null for elements it doesn't know.
   */
  static registerInlineElement(reader) {
    if (_HTMLImporter.#inlineReaders.indexOf(reader) < 0)
      _HTMLImporter.#inlineReaders.push(reader);
  }
  constructor(editor) {
    this.#editor = editor;
  }
  /** Parses HTML into nodes. The nodes belong to no list until they are inserted. */
  import(html) {
    let parsed = new DOMParser().parseFromString(html, "text/html");
    parsed.querySelectorAll("script, style, template, meta, link, title, noscript").forEach((element) => element.remove());
    return this.importChildren(parsed.body);
  }
  /** The document-level styles of a full HTML page: the body's font and background, and the page's direction. */
  documentStyle(html) {
    let parsed = new DOMParser().parseFromString(html, "text/html");
    let result = this.elementDocumentStyle(parsed.body);
    let direction = (parsed.documentElement.getAttribute("dir") || "").trim().toLowerCase();
    if (direction == "rtl")
      result.direction = 2 /* rightToLeft */;
    if (direction == "ltr")
      result.direction = 1 /* leftToRight */;
    return result;
  }
  /** The document-level styles an element sets, such as a page's body. */
  elementDocumentStyle(element) {
    let result = { fontName: "", fontSize: 0, backgroundColor: null, backgroundImage: null, direction: null };
    if (!element)
      return result;
    let style = new TextStyle();
    TextHost.applyElementStyle(element, style);
    result.fontName = style.fontName;
    result.fontSize = style.fontSize;
    result.backgroundColor = Colors.fromCSS(element.style.backgroundColor);
    if (element.style.backgroundImage.length > 0) {
      let image = new BackgroundImage();
      BackgroundImage.applyCSS(image, element.style);
      if (!image.isEmpty)
        result.backgroundImage = image;
    }
    let direction = (element.getAttribute("dir") || element.style.direction || "").trim().toLowerCase();
    if (direction == "rtl")
      result.direction = 2 /* rightToLeft */;
    if (direction == "ltr")
      result.direction = 1 /* leftToRight */;
    return result;
  }
  importChildren(parent) {
    let result = [];
    let inline = [];
    let flush = () => {
      if (inline.length == 0)
        return;
      let rich = this.richText(inline);
      inline = [];
      if (rich.text.trim().length == 0)
        return;
      let node = new TextNode2();
      node.content = this.trimmed(rich);
      result.push(this.attach(node));
    };
    parent.childNodes.forEach((child) => {
      if (child.nodeType == 3) {
        inline.push(child);
        return;
      }
      if (!(child instanceof HTMLElement) && !(typeof MathMLElement != "undefined" && child instanceof MathMLElement))
        return;
      let element = child;
      let block = this.blockNode(element);
      if (block === void 0) {
        inline.push(child);
        return;
      }
      flush();
      if (Array.isArray(block)) {
        if (block.length == 1)
          this.readBlockStyle(element, block[0]);
        result.push(...block);
      } else if (block) {
        this.readBlockStyle(element, block);
        result.push(block);
      }
    });
    flush();
    return result;
  }
  /**
   * Applies an element's block styles to the node made from it: background image,
   * direction, borders, corner radii, block alignment from automatic margins, and
   * line height. Values the element doesn't set are left alone.
   */
  readBlockStyle(element, node) {
    if (!element || !node || !element.style)
      return;
    let style = element.style;
    BackgroundImage.applyCSS(node.backgroundImage, style);
    let direction = (element.getAttribute("dir") || style.direction || "").trim().toLowerCase();
    if (direction == "rtl")
      node.direction = 2 /* rightToLeft */;
    if (direction == "ltr")
      node.direction = 1 /* leftToRight */;
    let sides = ["Top", "Right", "Bottom", "Left"];
    sides.forEach((side) => {
      let lineStyle = style.getPropertyValue(`border-${side.toLowerCase()}-style`).trim().toLowerCase();
      let width = style.getPropertyValue(`border-${side.toLowerCase()}-width`).trim().toLowerCase();
      let color = style.getPropertyValue(`border-${side.toLowerCase()}-color`).trim();
      if (lineStyle.length == 0 && width.length == 0 && color.length == 0)
        return;
      let size = /^[\d.]+(px|pt)?$/.test(width) ? Math.max(0, parseFloat(width)) : 1;
      node[`border${side}`] = {
        visible: lineStyle.length > 0 && lineStyle != "none" && lineStyle != "hidden",
        size,
        color: Colors.fromCSS(color) || Colors.empty
      };
    });
    let corners = [["borderTopLeftRadius", "border-top-left-radius"], ["borderTopRightRadius", "border-top-right-radius"], ["borderBottomRightRadius", "border-bottom-right-radius"], ["borderBottomLeftRadius", "border-bottom-left-radius"]];
    corners.forEach(([property, css]) => {
      let value = style.getPropertyValue(css).trim().toLowerCase();
      if (value.length == 0 || value.indexOf("%") >= 0)
        return;
      let radius = parseFloat(value.split(/[\s\/]+/)[0]);
      if (isFinite(radius))
        node[property] = Math.max(0, radius);
    });
    let marginLeft = style.marginLeft.trim().toLowerCase();
    let marginRight = style.marginRight.trim().toLowerCase();
    let rightToLeft = node.direction == 2 /* rightToLeft */;
    if (marginLeft == "auto" && marginRight == "auto") {
      node.alignment = 2 /* middle */;
    } else if (marginLeft == "auto") {
      node.alignment = rightToLeft ? 1 /* leading */ : 3 /* trailing */;
    } else if (marginRight == "auto") {
      node.alignment = rightToLeft ? 3 /* trailing */ : 1 /* leading */;
    }
    node.readImportedStyle(style);
    if (node instanceof TextNode2) {
      let metrics = _HTMLImporter.lineMetrics(style.lineHeight);
      if (metrics) {
        node.lineHeight = Number((metrics.lineHeight / NormalLineHeightRatio).toFixed(4));
        node.lineSpacing = metrics.lineSpacing;
      }
    }
  }
  /** Reads a CSS line-height as a multiple of the font size and extra spacing in pixels, or null. */
  static lineMetrics(value) {
    value = (value || "").trim().toLowerCase().replace(/\s+/g, "");
    if (value == "" || value == "normal" || value == "initial" || value == "inherit")
      return null;
    if (value.startsWith("calc(") && value.endsWith(")"))
      value = value.substring(5, value.length - 1);
    let em = value.indexOf("em");
    if (em >= 0) {
      let height = parseFloat(value.substring(0, em));
      if (!(height > 0))
        return null;
      let spacing = value.substring(em + 2).match(/^\+?(-?[\d.]+)px/);
      return { lineHeight: height, lineSpacing: spacing ? parseFloat(spacing[1]) : 0 };
    }
    if (value.indexOf("px") < 0 && value.indexOf("%") < 0) {
      let height = parseFloat(value);
      if (height > 0)
        return { lineHeight: height, lineSpacing: 0 };
    }
    return null;
  }
  /** The editor the nodes are imported into. */
  get editor() {
    return this.#editor;
  }
  /** Connects an imported node to the editor, so it reads the editor's settings. Returns the node. */
  attach(node) {
    node.editor = this.#editor;
    return node;
  }
  /** Whether the editor has a node type registered, so its content can be imported. */
  hasType(identifier) {
    return !!this.#editor.nodeTypes.item(identifier);
  }
  /** Returns the node(s) for a block element, or undefined when the element is inline. */
  /** The types that read elements themselves, highest import priority first, then in registration order. */
  #importingTypes() {
    let types = this.#editor.nodeTypes.items().filter((type) => Object.prototype.hasOwnProperty.call(type, "importElement") && !!type.importElement);
    let priority = (type) => Number(Editor2.ownStatic(type, "importPriority")) || 0;
    return types.map((type, index) => ({ type, index })).sort((a, b) => priority(b.type) - priority(a.type) || a.index - b.index).map((item) => item.type);
  }
  blockNode(element) {
    let tag = element.tagName;
    if (element.dataset.scriviamoAnnotations !== void 0)
      return null;
    for (let type of this.#importingTypes()) {
      let result = type.importElement(element, this);
      if (result !== void 0)
        return result;
    }
    switch (tag) {
      case "P": {
        let node = new TextNode2();
        node.content = this.trimmed(this.richText(Array.from(element.childNodes)));
        this.readAlignment(element, node);
        return this.attach(node);
      }
      case "HR":
      case "AUDIO":
      case "VIDEO":
      case "IFRAME":
      case "INPUT":
      case "TEXTAREA":
      case "SELECT":
      case "DATALIST":
      case "BUTTON":
      case "BR":
        return null;
      case "LABEL":
        return element.querySelector("input, select, textarea") ? this.importChildren(element) : void 0;
      case "IMG":
      case "FIGURE":
      case "PICTURE": {
        let image = tag == "IMG" ? element : element.querySelector("img");
        if (!image)
          break;
        if (!this.hasType("image"))
          return null;
        let node = new ImageNode();
        let source = image.getAttribute("src") || "";
        if (source.startsWith("data:")) {
          node.imageData = source.substring(source.indexOf(",") + 1);
        } else {
          node.sourceURL = source;
        }
        let width = parseFloat(image.style.width || image.getAttribute("width") || "0");
        let height = parseFloat(image.style.height || image.getAttribute("height") || "0");
        if (!(width > 0 && height > 0) && node.imageData.length > 0) {
          let size = Utilities.imageDataSize(node.imageData);
          if (size) {
            width = size.width;
            height = size.height;
          }
        }
        if (width > 0 && height > 0) {
          node.displayWidth = width;
          node.displayHeight = height;
        }
        let caption = element.querySelector("figcaption");
        if (caption) {
          node.captionText = this.trimmed(this.richText(Array.from(caption.childNodes)));
        } else {
          node.caption = image.getAttribute("alt") || "";
        }
        return this.attach(node);
      }
      case "TABLE":
        return this.hasType("table") ? this.attach(this.#tableNode(element)) : null;
      case "DIV":
      case "SECTION":
      case "ARTICLE":
      case "MAIN":
      case "HEADER":
      case "FOOTER":
      case "CENTER":
      case "FORM":
      case "FIELDSET":
      case "DL":
      case "DD":
      case "DT":
      case "BODY":
      case "NAV": {
        let hasBlocks = Array.from(element.children).some((child) => this.isBlockElement(child));
        if (!hasBlocks && tag != "NAV") {
          let rich = this.trimmed(this.richText(Array.from(element.childNodes)));
          if (rich.text.length == 0)
            return null;
          let node = new TextNode2();
          node.content = rich;
          this.readAlignment(element, node);
          return this.attach(node);
        }
        return this.importChildren(element);
      }
      case "LI":
        return this.importChildren(element);
    }
    return this.isBlockElement(element) ? this.importChildren(element) : void 0;
  }
  /** Whether an element starts a block of its own rather than continuing the text around it. */
  isBlockElement(element) {
    if (element.tagName.toLowerCase() == "math")
      return element.getAttribute("display") == "block";
    return /^(P|DIV|H[1-6]|UL|OL|LI|PRE|BLOCKQUOTE|ASIDE|HR|TABLE|FIGURE|DETAILS|SECTION|ARTICLE|MAIN|HEADER|FOOTER|NAV|CENTER|FORM|FIELDSET|DL|DD|DT|IMG|PICTURE)$/.test(element.tagName);
  }
  /** Reads a text block's alignment from an element's text-align or align. */
  readAlignment(element, node) {
    let alignment = _HTMLImporter.alignmentFromCSS(element.style.textAlign || element.getAttribute("align") || "", _HTMLImporter.isRightToLeft(element, node.content.text));
    if (alignment !== null)
      node.textAlignment = alignment;
  }
  /** Whether an element's content runs right to left: from its dir or direction, or from its text. */
  static isRightToLeft(element, text) {
    let direction = (element.getAttribute("dir") || element.style.direction || "").trim().toLowerCase();
    if (direction == "rtl")
      return true;
    if (direction == "ltr")
      return false;
    let ancestor = element.parentElement ? element.parentElement.closest("[dir]") : null;
    let inherited = ancestor ? (ancestor.getAttribute("dir") || "").toLowerCase() : "";
    if (inherited == "rtl")
      return true;
    if (inherited == "ltr")
      return false;
    return Utilities.isRightToLeftText(text);
  }
  /** Maps a CSS text-align keyword to a logical alignment; physical left and right follow the direction. */
  static alignmentFromCSS(value, rightToLeft) {
    switch (value.trim().toLowerCase()) {
      case "center":
        return 2 /* middle */;
      case "start":
        return 1 /* leading */;
      case "end":
        return 3 /* trailing */;
      case "left":
        return rightToLeft ? 3 /* trailing */ : 1 /* leading */;
      case "right":
        return rightToLeft ? 1 /* leading */ : 3 /* trailing */;
    }
    return null;
  }
  #tableNode(element) {
    let rows = Array.from(element.rows);
    let columns = 0;
    let occupied = [];
    let placements = [];
    rows.forEach((row, rowIndex) => {
      occupied[rowIndex] = occupied[rowIndex] || [];
      let column = 0;
      Array.from(row.cells).forEach((cell) => {
        while (occupied[rowIndex][column])
          column++;
        placements.push({ row: rowIndex, column, cell });
        for (let r = 0; r < Math.max(1, cell.rowSpan); r++) {
          occupied[rowIndex + r] = occupied[rowIndex + r] || [];
          for (let c = 0; c < Math.max(1, cell.colSpan); c++)
            occupied[rowIndex + r][column + c] = true;
        }
        column += Math.max(1, cell.colSpan);
        columns = Math.max(columns, column);
      });
    });
    let table = new TableNode(Math.max(1, rows.length), Math.max(1, columns));
    this.attach(table);
    table.hasHeader = !!element.tHead || rows.length > 0 && Array.from(rows[0].cells).every((cell) => cell.tagName == "TH");
    table.hasFooter = !!element.tFoot;
    placements.forEach((placement) => {
      let children = this.importChildren(placement.cell);
      let rich = new RichText();
      let blockAlignment = null;
      let mixedAlignments = false;
      let noteAlignment = (node) => {
        let value = node instanceof TextNode2 ? node.textAlignment : 0 /* automatic */;
        if (blockAlignment === null)
          blockAlignment = value;
        else if (blockAlignment != value)
          mixedAlignments = true;
      };
      if (children.length > 0 && children[0].constructor === TextNode2) {
        noteAlignment(children[0]);
        rich = children.shift().content;
      }
      while (children.length > 0 && children[0].constructor === TextNode2) {
        noteAlignment(children[0]);
        rich.insert(rich.length, ParagraphBreak);
        rich.append(children.shift().content);
      }
      if (placement.cell.tagName == "TH")
        rich.styles.forEach((style) => style.bold = true);
      rich.nodes = children;
      rich.rowSpan = Math.max(1, placement.cell.rowSpan);
      rich.columnSpan = Math.max(1, placement.cell.colSpan);
      let align = _HTMLImporter.alignmentFromCSS(placement.cell.style.textAlign || placement.cell.getAttribute("align") || "", _HTMLImporter.isRightToLeft(placement.cell, rich.text));
      if (align !== null) {
        rich.textAlignment = align;
      } else if (blockAlignment !== null && !mixedAlignments) {
        rich.textAlignment = blockAlignment;
      }
      this.#readCellBorders(placement.cell, rich);
      let background = Colors.fromCSS(placement.cell.style.backgroundColor);
      if (background && background.alpha < 255) {
        rich.hasCellBackgroundColor = true;
        rich.cellBackgroundColor = background;
      }
      table.cells[placement.row * table.columns + placement.column] = rich;
    });
    return table;
  }
  /** Reads a table cell's border sides. Sides the cell doesn't set are left alone. */
  #readCellBorders(element, cell) {
    let sides = ["Top", "Right", "Bottom", "Left"];
    sides.forEach((side) => {
      let lineStyle = element.style.getPropertyValue(`border-${side.toLowerCase()}-style`).trim().toLowerCase();
      let width = element.style.getPropertyValue(`border-${side.toLowerCase()}-width`).trim().toLowerCase();
      let color = element.style.getPropertyValue(`border-${side.toLowerCase()}-color`).trim();
      if (lineStyle.length == 0 && width.length == 0 && color.length == 0)
        return;
      cell[`cellBorder${side}`] = {
        visible: lineStyle.length > 0 && lineStyle != "none" && lineStyle != "hidden",
        size: /^[\d.]+(px|pt)?$/.test(width) ? Math.max(0, parseFloat(width)) : 1,
        color: Colors.fromCSS(color) || Colors.empty
      };
    });
  }
  /** Converts inline DOM content into styled text. */
  richText(nodes, inherited = new TextStyle(), preformatted = false) {
    let result = new RichText();
    let walk = (node, style, pre) => {
      if (node.nodeType == 3) {
        let value = node.nodeValue || "";
        if (!pre)
          value = value.replace(/[\t\n\r ]+/g, " ");
        if (pre)
          value = value.replace(/\r\n?/g, "\n").replace(/\n/g, LineBreak);
        if (value.length > 0)
          result.insert(result.length, value, style);
        return;
      }
      if (node instanceof Element) {
        for (let reader of _HTMLImporter.#inlineReaders) {
          let read = reader(node, style);
          if (read) {
            if (read.text.length > 0)
              result.insert(result.length, read.text, read.style);
            return;
          }
        }
      }
      if (!(node instanceof HTMLElement))
        return;
      if (node.tagName == "BR") {
        result.insert(result.length, LineBreak, style);
        return;
      }
      if (node.tagName == "IMG" || node.tagName == "INPUT")
        return;
      let childStyle = style.clone();
      TextHost.applyElementStyle(node, childStyle);
      let isBlock = /^(P|DIV|LI|H[1-6]|BLOCKQUOTE|TR)$/.test(node.tagName);
      if (isBlock && result.length > 0 && !result.text.endsWith(LineBreak))
        result.insert(result.length, LineBreak, style);
      let childPre = pre || node.tagName == "PRE";
      node.childNodes.forEach((child) => walk(child, childStyle, childPre));
    };
    nodes.forEach((node) => walk(node, inherited, preformatted));
    return result;
  }
  /** Removes leading and trailing whitespace and collapses spaces around line breaks. */
  /** The text without leading and trailing white space. */
  trimmed(rich) {
    let text = rich.text;
    let start = 0;
    let end = text.length;
    while (start < end && /[ \u2028]/.test(text[start]))
      start++;
    while (end > start && /[ \u2028]/.test(text[end - 1]))
      end--;
    let result = rich.slice(start, end);
    result.copyStateFrom(rich);
    for (let index = result.text.length - 1; index > 0; index--) {
      if (result.text[index] == " " && (result.text[index - 1] == LineBreak || result.text[index + 1] == LineBreak))
        result.remove(index, index + 1);
    }
    return result;
  }
};
var MarkdownConverter = class _MarkdownConverter {
  static #inlineRules = [];
  /** Adds an inline syntax; see MarkdownInlineRule. */
  static registerInlineRule(rule) {
    if (_MarkdownConverter.#inlineRules.indexOf(rule) < 0)
      _MarkdownConverter.#inlineRules.push(rule);
  }
  static toHTML(markdown) {
    let lines = markdown.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
    let notes = _MarkdownConverter.#footnotes(lines);
    return _MarkdownConverter.#blocks(lines) + notes;
  }
  /**
   * Takes footnote definitions ("[^label]: text", with indented lines continuing them) out of
   * the lines, and returns them as a footnotes section, which the footnotes add-on reads.
   * References, [^label], become tags in the inline text.
   */
  static #footnotes(lines) {
    let items = [];
    let fence = null;
    for (let index = 0; index < lines.length; index++) {
      let opening = lines[index].match(/^ {0,3}(`{3,}|~{3,})/);
      if (opening)
        fence = fence === null ? opening[1] : lines[index].trim().startsWith(fence) ? null : fence;
      if (fence !== null)
        continue;
      let definition = lines[index].match(/^ {0,3}\[\^([^\]\s]+)\]:\s?(.*)$/);
      if (!definition)
        continue;
      let text = [definition[2]];
      let end = index + 1;
      while (end < lines.length && /^( {4}|\t)\S/.test(lines[end]))
        text.push(lines[end++].trim());
      lines.splice(index, end - index);
      index--;
      let label = definition[1];
      items.push(`<li id="fn-${Utilities.escapeAttribute(label)}" data-footnote-id="${Utilities.escapeAttribute(label)}">${_MarkdownConverter.inline(text.join(" ").trim())}</li>`);
    }
    return items.length == 0 ? "" : `<section class="footnotes" data-scriviamo-footnotes="true"><ol>${items.join("")}</ol></section>`;
  }
  static #blocks(lines) {
    let html = "";
    let index = 0;
    let paragraph = [];
    let flush = () => {
      if (paragraph.length == 0)
        return;
      let text = paragraph.map((line, lineIndex) => {
        let hardBreak = / {2,}$/.test(line) || line.endsWith("\\");
        let content = _MarkdownConverter.inline(line.replace(/\\$/, "").trim());
        return content + (hardBreak && lineIndex < paragraph.length - 1 ? "<br>" : "");
      }).join(" ");
      let image = text.match(/^<img [^>]+>$/);
      html += image ? `<figure>${text}</figure>` : `<p>${text}</p>`;
      paragraph = [];
    };
    while (index < lines.length) {
      let line = lines[index];
      let math = line.match(/^ {0,3}\$\$(.*)$/);
      if (math) {
        flush();
        let body = [];
        let rest = math[1];
        let oneLine = rest.match(/^(.*?)\$\$\s*$/);
        if (oneLine) {
          body.push(oneLine[1].trim());
          index++;
        } else {
          if (rest.trim().length > 0)
            body.push(rest.trim());
          index++;
          while (index < lines.length && !/^\s*\$\$\s*$/.test(lines[index])) {
            let closing = lines[index].match(/^(.*?)\$\$\s*$/);
            if (closing) {
              body.push(closing[1]);
              break;
            }
            body.push(lines[index]);
            index++;
          }
          index++;
        }
        html += `<pre><code class="language-math">${Utilities.escapeText(body.join("\n").trim())}</code></pre>`;
        continue;
      }
      let fence = line.match(/^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)/);
      if (fence) {
        flush();
        let marker = fence[1];
        let body = [];
        index++;
        while (index < lines.length && !lines[index].trim().startsWith(marker)) {
          body.push(lines[index]);
          index++;
        }
        index++;
        let language = fence[2] ? ` class="language-${Utilities.escapeAttribute(fence[2])}"` : "";
        html += `<pre><code${language}>${Utilities.escapeText(body.join("\n"))}</code></pre>`;
        continue;
      }
      if (line.trim().length == 0) {
        flush();
        index++;
        continue;
      }
      let heading = line.match(/^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/);
      if (heading) {
        flush();
        html += `<h${heading[1].length}>${_MarkdownConverter.inline(heading[2])}</h${heading[1].length}>`;
        index++;
        continue;
      }
      if (/^ {0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) {
        flush();
        html += "<hr>";
        index++;
        continue;
      }
      if (paragraph.length > 0 && /^ {0,3}(=+|-+)\s*$/.test(line)) {
        let level = line.trim().startsWith("=") ? 1 : 2;
        let text = paragraph.join(" ");
        paragraph = [];
        html += `<h${level}>${_MarkdownConverter.inline(text)}</h${level}>`;
        index++;
        continue;
      }
      if (/^ {0,3}>/.test(line)) {
        flush();
        let body = [];
        while (index < lines.length && /^ {0,3}>/.test(lines[index])) {
          body.push(lines[index].replace(/^ {0,3}> ?/, ""));
          index++;
        }
        let alert = body.length > 0 ? body[0].match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i) : null;
        if (alert) {
          let type = { NOTE: "info", TIP: "success", IMPORTANT: "info", WARNING: "warning", CAUTION: "danger" }[alert[1].toUpperCase()];
          html += `<aside class="alert alert-${type}">${body.slice(1).map((text) => _MarkdownConverter.inline(text)).join("<br>")}</aside>`;
        } else {
          let citationIndex = body.length - 1;
          let citation = "";
          if (citationIndex > 0 && /^(—|--)\s*/.test(body[citationIndex])) {
            citation = body[citationIndex].replace(/^(—|--)\s*/, "");
            body.pop();
          }
          html += `<blockquote>${_MarkdownConverter.#blocks(body)}${citation.length > 0 ? `<footer><cite>${Utilities.escapeText(citation)}</cite></footer>` : ""}</blockquote>`;
        }
        continue;
      }
      let listMatch = line.match(/^(\s*)([-*+]|\d+[.)])\s+/);
      if (listMatch && (paragraph.length == 0 || /^\s*([-*+]|1[.)])\s/.test(line))) {
        flush();
        let items = [];
        let indents = [];
        while (index < lines.length) {
          let current = lines[index];
          let match = current.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
          if (match) {
            let indent = match[1].length;
            while (indents.length > 0 && indent < indents[indents.length - 1])
              indents.pop();
            if (indents.length == 0 || indent > indents[indents.length - 1])
              indents.push(indent);
            items.push({ level: indents.length - 1, ordered: /\d/.test(match[2]), text: match[3] });
            index++;
          } else if (current.trim().length > 0 && /^\s{2,}/.test(current) && items.length > 0) {
            items[items.length - 1].text += " " + current.trim();
            index++;
          } else {
            break;
          }
        }
        html += _MarkdownConverter.#listHTML(items);
        continue;
      }
      if (line.indexOf("|") >= 0 && index + 1 < lines.length && /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(lines[index + 1])) {
        flush();
        let split = (value) => value.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|"));
        let header = split(line);
        let alignments = split(lines[index + 1]).map((cell) => cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : "");
        index += 2;
        let hasHeader = header.some((cell) => cell.length > 0);
        let table = "<table>";
        let cellHTML = (tag, value, column) => `<${tag}${alignments[column] ? ` style="text-align:${alignments[column]}"` : ""}>${_MarkdownConverter.inline(value)}</${tag}>`;
        if (hasHeader)
          table += `<thead><tr>${header.map((cell, column) => cellHTML("th", cell, column)).join("")}</tr></thead>`;
        table += "<tbody>";
        while (index < lines.length && lines[index].indexOf("|") >= 0 && lines[index].trim().length > 0) {
          let cells = split(lines[index]);
          while (cells.length < header.length)
            cells.push("");
          table += `<tr>${cells.slice(0, header.length).map((cell, column) => cellHTML("td", cell, column)).join("")}</tr>`;
          index++;
        }
        html += table + "</tbody></table>";
        continue;
      }
      if (/^ {0,3}<(\/?)(div|details|summary|table|aside|section|nav|figure|pre|p|h[1-6]|ul|ol|hr|blockquote|kbd|br)\b/i.test(line)) {
        flush();
        let body = [];
        let markdownInside = false;
        while (index < lines.length && lines[index].trim().length > 0) {
          body.push(lines[index]);
          index++;
        }
        if (/^<(details|div)\b/i.test(body[0].trim()) && !/<\/(details|div)>\s*$/i.test(body[body.length - 1]))
          markdownInside = true;
        if (markdownInside) {
          let inner = [];
          let closing = new RegExp(`^\\s*</${body[0].trim().match(/^<(\w+)/)[1]}>`, "i");
          while (index < lines.length && !closing.test(lines[index])) {
            inner.push(lines[index]);
            index++;
          }
          let close = index < lines.length ? lines[index] : "";
          index++;
          html += body.join("\n") + _MarkdownConverter.#blocks(inner) + close;
        } else {
          html += body.join("\n");
        }
        continue;
      }
      paragraph.push(line);
      index++;
    }
    flush();
    return html;
  }
  static #listHTML(items) {
    let html = "";
    let stack = [];
    let open = (ordered, checklist) => {
      let tag = ordered ? "ol" : "ul";
      stack.push(tag);
      html += `<${tag}${checklist ? ` class="checklist"` : ""}>`;
    };
    items.forEach((item, index) => {
      let task = item.text.match(/^\[([ xX])\]\s+(.*)$/);
      while (stack.length > item.level + 1) {
        html += `</li></${stack.pop()}>`;
      }
      if (stack.length < item.level + 1) {
        while (stack.length < item.level + 1)
          open(item.ordered, !!task);
      } else if (index > 0) {
        html += "</li>";
      }
      html += "<li>";
      if (task) {
        html += `<input type="checkbox"${task[1].trim().length > 0 ? " checked" : ""}> ${_MarkdownConverter.inline(task[2])}`;
      } else {
        html += _MarkdownConverter.inline(item.text);
      }
    });
    while (stack.length > 0)
      html += `</li></${stack.pop()}>`;
    return html;
  }
  /** Converts inline Markdown into HTML. */
  static inline(value) {
    let tokens = [];
    let stash = (html) => {
      tokens.push(html);
      return `\0${tokens.length - 1}\0`;
    };
    let text = value;
    text = text.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_match, _fence, code) => stash(`<code>${Utilities.escapeText(code.trim().length > 0 ? code.replace(/^ (.*) $/, "$1") : code)}</code>`));
    text = text.replace(/<(\/?)(kbd|sup|sub|mark|u|br|span|a)([^>]*)>/gi, (match) => stash(match));
    text = text.replace(/\\([\\`*_{}\[\]()#+\-.!|~<>$])/g, (_match, character) => stash(Utilities.escapeText(character)));
    for (let rule of _MarkdownConverter.#inlineRules)
      text = rule(text, stash);
    text = text.replace(/\[\^([^\]\s]+)\]/g, (_match, label) => stash(`<sup data-scriviamo-suggestion-provider="footnote" data-scriviamo-suggestion-id="${Utilities.escapeAttribute(label)}">${Utilities.escapeText(label)}</sup>`));
    text = text.replace(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"([^"]*)")?\s*\)/g, (_match, alt, source) => stash(`<img src="${Utilities.escapeAttribute(source)}" alt="${Utilities.escapeAttribute(alt)}">`));
    text = text.replace(/\[([^\]]+)\]\(\s*<?([^)\s>]+)>?(?:\s+"([^"]*)")?\s*\)/g, (_match, label, href, title) => stash(`<a href="${Utilities.escapeAttribute(href)}"${title ? ` title="${Utilities.escapeAttribute(title)}"` : ""}>`) + label + stash("</a>"));
    text = text.replace(/<(https?:\/\/[^>\s]+)>/g, (_match, href) => stash(`<a href="${Utilities.escapeAttribute(href)}">${Utilities.escapeText(href)}</a>`));
    text = Utilities.escapeText(text);
    text = text.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, "<strong>$2</strong>");
    text = text.replace(/(\*|_)(?=\S)([\s\S]*?\S)\1(?![\w*])/g, "<em>$2</em>");
    text = text.replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>");
    text = text.replace(/==(?=\S)([\s\S]*?\S)==/g, "<mark>$1</mark>");
    for (let pass = 0; pass < 3 && text.indexOf("\0") >= 0; pass++) {
      text = text.replace(/\u0000(\d+)\u0000/g, (_match, number) => tokens[Number(number)]);
    }
    return text;
  }
};
var PasteCleanup = class _PasteCleanup {
  /** The app pasted HTML came from, or null. */
  static source(html) {
    if (/id="docs-internal-guid-/.test(html))
      return "googledocs";
    if (/urn:schemas-microsoft-com:office:(word|office)|<meta[^>]+content=["']?Microsoft Word|class=["']?Mso|mso-[a-z-]+:/i.test(html))
      return "word";
    return null;
  }
  static clean(html) {
    let source = _PasteCleanup.source(html);
    if (!source || typeof DOMParser == "undefined")
      return html;
    let parsed = new DOMParser().parseFromString(html, "text/html");
    let body = parsed.body;
    body.querySelectorAll("style, script, meta, link, title, xml").forEach((element) => element.remove());
    if (source == "googledocs")
      _PasteCleanup.#cleanGoogleDocs(body);
    else
      _PasteCleanup.#cleanWord(body);
    _PasteCleanup.#cleanStyles(body);
    body.querySelectorAll("br.Apple-interchange-newline").forEach((element) => element.remove());
    return body.innerHTML;
  }
  static #unwrap(element) {
    element.replaceWith(...Array.from(element.childNodes));
  }
  static #cleanGoogleDocs(body) {
    body.querySelectorAll("b[id^='docs-internal-guid-']").forEach((element) => _PasteCleanup.#unwrap(element));
    body.querySelectorAll("li > p:only-child, td > p:only-child, th > p:only-child").forEach((element) => _PasteCleanup.#unwrap(element));
  }
  static #cleanWord(body) {
    Array.from(body.querySelectorAll("*")).forEach((element) => {
      if (element.tagName.includes(":")) {
        if (/^O:P$/i.test(element.tagName))
          _PasteCleanup.#unwrap(element);
        else
          element.remove();
      }
    });
    let comments = parsedComments(body);
    comments.forEach((comment) => comment.parentNode?.removeChild(comment));
    body.querySelectorAll("img").forEach((image) => {
      if (/^file:/i.test(image.getAttribute("src") || ""))
        image.remove();
    });
    body.querySelectorAll("p.MsoTitle").forEach((paragraph) => _PasteCleanup.#rename(paragraph, "h1"));
    body.querySelectorAll("p.MsoSubtitle").forEach((paragraph) => _PasteCleanup.#rename(paragraph, "h2"));
    _PasteCleanup.#wordLists(body);
    body.querySelectorAll("p").forEach((paragraph) => {
      if ((paragraph.textContent || "").replace(/[\s\u00a0]+/g, "").length == 0 && !paragraph.querySelector("img, table, input"))
        paragraph.remove();
    });
  }
  static #rename(element, tag) {
    let replacement = element.ownerDocument.createElement(tag);
    for (let attribute of Array.from(element.attributes))
      replacement.setAttribute(attribute.name, attribute.value);
    replacement.append(...Array.from(element.childNodes));
    element.replaceWith(replacement);
    return replacement;
  }
  /** Word writes lists as paragraphs with mso-list styles and typed bullets or numbers. */
  static #wordLists(body) {
    let isItem = (element) => !!element && element.tagName == "P" && /mso-list\s*:\s*l\d+/i.test(element.getAttribute("style") || "");
    let paragraphs = Array.from(body.querySelectorAll("p")).filter(isItem);
    let done = /* @__PURE__ */ new Set();
    for (let first of paragraphs) {
      if (done.has(first))
        continue;
      let run = [first];
      let listID = (style) => (style.match(/mso-list\s*:\s*(l\d+)/i) || [])[1] || "";
      let id = listID(first.getAttribute("style") || "");
      let next = first.nextElementSibling;
      while (isItem(next) && listID(next.getAttribute("style") || "") == id) {
        run.push(next);
        next = next.nextElementSibling;
      }
      run.forEach((item) => done.add(item));
      let document2 = first.ownerDocument;
      let root = null;
      let stack = [];
      for (let paragraph of run) {
        let style = paragraph.getAttribute("style") || "";
        let level = Number((style.match(/level(\d+)/i) || [])[1]) || 1;
        let marker = Array.from(paragraph.querySelectorAll("span")).find((span) => /mso-list\s*:\s*ignore/i.test(span.getAttribute("style") || "")) || null;
        let markerText = marker ? (marker.textContent || "").replace(/\s+/g, "") : "";
        if (marker)
          marker.remove();
        let ordered = /^(\(?[0-9]+|\(?[a-z]{1,3}|\(?[ivxlc]+)[.)]$/i.test(markerText);
        while (stack.length > 0 && stack[stack.length - 1].level > level)
          stack.pop();
        if (stack.length == 0 || stack[stack.length - 1].level < level) {
          let list = document2.createElement(ordered ? "ol" : "ul");
          if (stack.length == 0) {
            root = list;
          } else {
            let parentList = stack[stack.length - 1].list;
            let lastItem = parentList.lastElementChild || parentList.appendChild(document2.createElement("li"));
            lastItem.append(list);
          }
          stack.push({ level, list });
        }
        let item = document2.createElement("li");
        item.append(...Array.from(paragraph.childNodes));
        stack[stack.length - 1].list.append(item);
      }
      if (root)
        first.before(root);
      run.forEach((paragraph) => paragraph.remove());
    }
  }
  /**
   * Drops the styles every run carries, keeping what formats the text: weight, slant, decoration,
   * raised and lowered text, colors other than plain black, and backgrounds other than none.
   */
  static #cleanStyles(body) {
    let plain = /^(#0{3}|#0{6}|black|rgb\(0,\s*0,\s*0\)|windowtext|initial|inherit|auto)$/i;
    let none = /^(transparent|initial|inherit|white|#fff|#ffffff|rgb\(255,\s*255,\s*255\)|rgba\(0,\s*0,\s*0,\s*0\))$/i;
    body.querySelectorAll("[style]").forEach((element) => {
      let html = element;
      let kept = [];
      let css = html.style;
      let weight = css.fontWeight;
      if (weight == "bold" || weight == "bolder" || Number(weight) >= 600)
        kept.push("font-weight:bold");
      if (css.fontStyle == "italic" || css.fontStyle == "oblique")
        kept.push("font-style:italic");
      let decoration = `${css.textDecorationLine || css.textDecoration}`;
      let lines = ["underline", "line-through"].filter((line) => decoration.includes(line));
      if (lines.length > 0)
        kept.push(`text-decoration:${lines.join(" ")}`);
      if (css.verticalAlign == "super" || css.verticalAlign == "sub")
        kept.push(`vertical-align:${css.verticalAlign}`);
      if (css.color && !plain.test(css.color.trim()))
        kept.push(`color:${css.color}`);
      let background = css.backgroundColor || css.background;
      if (background && !none.test(background.trim()) && !/url\(/i.test(background))
        kept.push(`background-color:${css.backgroundColor || background}`);
      if (/^(center|right|justify)$/.test(css.textAlign) && /^(P|H[1-6]|DIV|TD|TH|LI)$/.test(html.tagName))
        kept.push(`text-align:${css.textAlign}`);
      if (kept.length > 0)
        html.setAttribute("style", kept.join(";"));
      else
        html.removeAttribute("style");
    });
    body.querySelectorAll("[class]").forEach((element) => {
      if (/^(Mso|xl\d|Apple-)/.test(element.getAttribute("class") || ""))
        element.removeAttribute("class");
    });
    Array.from(body.querySelectorAll("span, font")).forEach((element) => {
      if (element.attributes.length == 0 || element.tagName == "FONT" && !element.getAttribute("color"))
        _PasteCleanup.#unwrap(element);
    });
  }
};
function parsedComments(root) {
  let result = [];
  let walker = root.ownerDocument.createTreeWalker(root, 128);
  while (walker.nextNode())
    result.push(walker.currentNode);
  return result;
}

// popups.ts
var Popup2 = class _Popup {
  static #current = null;
  element;
  onClose = null;
  /** What the popup delivered when it closed by a choice, or null when it was dismissed. */
  chosenValue = null;
  /** Keeps focus where it is when pressing the popup. Off for popups with fields. */
  keepsFocus = true;
  /**
   * Whether pressing outside closes it, and opening another popup does. Off for panels that hold
   * work, such as an answer being written: they stay open until closed, and Escape closes them
   * while focus is inside.
   */
  dismissible = true;
  #outsideHandler = (event) => {
    if (!this.element.contains(event.target) && !(this.#anchor instanceof HTMLElement && this.#anchor.contains(event.target)))
      this.close();
  };
  #keyHandler = (event) => this.handleKey(event);
  #open = false;
  #scrollHandler = (event) => {
    if (this.element.contains(event.target))
      return;
    if (this.anchorProvider) {
      this.position();
    } else {
      this.close();
    }
  };
  /** Supplies the anchor's current rectangle; the popup then follows it when the page scrolls instead of closing. */
  anchorProvider = null;
  #anchor = null;
  constructor(classes = "") {
    this.element = Utilities.element("div", `scv-popup ${classes}`);
    this.element.addEventListener("mousedown", (event) => {
      let target = event.target;
      if (this.keepsFocus && !/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
        event.preventDefault();
    });
  }
  static get current() {
    return _Popup.#current;
  }
  static closeAll() {
    if (_Popup.#current)
      _Popup.#current.close();
  }
  get isOpen() {
    return this.#open;
  }
  /**
   * Shows the popup below the anchor, inside container so it shares the editor's theme. It opens
   * in the browser's top layer where it can, so the editor's bounds, overflow and stacking don't
   * clip or cover it.
   */
  show(anchor, container) {
    if (this.dismissible) {
      if (_Popup.#current && _Popup.#current !== this)
        _Popup.#current.close();
      _Popup.#current = this;
    }
    this.#open = true;
    this.#anchor = anchor;
    container.append(this.element);
    if (typeof this.element.showPopover == "function") {
      this.element.setAttribute("popover", "manual");
      try {
        this.element.showPopover();
      } catch (error) {
      }
    }
    this.position();
    container.dispatchEvent(new CustomEvent("scv-popup-opened", { detail: { popup: this }, bubbles: true }));
    setTimeout(() => {
      if (!this.#open)
        return;
      if (this.dismissible)
        document.addEventListener("mousedown", this.#outsideHandler, true);
      window.addEventListener("scroll", this.#scrollHandler, true);
    }, 0);
    if (this.dismissible) {
      window.addEventListener("keydown", this.#keyHandler, true);
    } else {
      this.element.addEventListener("keydown", this.#keyHandler);
    }
  }
  position() {
    let anchor = this.anchorProvider ? this.anchorProvider() || this.#anchor : this.#anchor;
    if (!anchor)
      return;
    let rect = anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor;
    let element = this.element;
    element.style.position = "fixed";
    element.style.left = "0px";
    element.style.top = "0px";
    let width = element.offsetWidth;
    let height = element.offsetHeight;
    let rightToLeft = getComputedStyle(element).direction == "rtl";
    let left = rightToLeft ? rect.right - width : rect.left;
    left = Utilities.clamp(left, 8, Math.max(8, window.innerWidth - width - 8));
    let top = rect.bottom + 4;
    if (top + height > window.innerHeight - 8 && rect.top - height - 4 > 8)
      top = rect.top - height - 4;
    top = Math.max(8, Math.min(top, window.innerHeight - height - 8));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }
  close() {
    if (_Popup.#current === this)
      _Popup.#current = null;
    this.#open = false;
    document.removeEventListener("mousedown", this.#outsideHandler, true);
    window.removeEventListener("keydown", this.#keyHandler, true);
    this.element.removeEventListener("keydown", this.#keyHandler);
    window.removeEventListener("scroll", this.#scrollHandler, true);
    if (this.element.isConnected) {
      let container = this.element.parentElement;
      if (this.element.hasAttribute("popover")) {
        try {
          this.element.hidePopover();
        } catch (error) {
        }
      }
      this.element.remove();
      if (this.onClose)
        this.onClose();
      if (container)
        container.dispatchEvent(new CustomEvent("scv-popup-closed", { detail: { popup: this }, bubbles: true }));
    }
  }
  handleKey(event) {
    if (event.key == "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }
};
var MenuList = class _MenuList {
  element;
  parent;
  entries = [];
  active = -1;
  submenu = null;
  submenuEntry = null;
  #menu;
  #hoverTimer = 0;
  constructor(menu, element, items, parent) {
    this.#menu = menu;
    this.element = element;
    this.parent = parent;
    element.setAttribute("role", "menu");
    items.forEach((item) => {
      if (item.isSeparator) {
        element.append(Utilities.element("hr", "dropdown-divider"));
        return;
      }
      let button = Utilities.element("button", "dropdown-item scv-menu-item", { type: "button", role: item.hasChildren ? "menuitem" : "menuitemcheckbox" });
      if (item.hasChildren) {
        button.setAttribute("aria-haspopup", "menu");
        button.setAttribute("aria-expanded", "false");
        button.classList.add("scv-menu-parent");
      } else {
        button.setAttribute("aria-checked", item.checked ? "true" : "false");
      }
      button.disabled = !item.enabled;
      if (item.checked && !item.hasChildren)
        button.classList.add("active");
      let icon = Utilities.element("i", `scv-menu-icon ${item.icon.length > 0 ? item.icon : item.checked ? "bi bi-check2" : ""}`);
      button.append(icon);
      let label = Utilities.element("span", "scv-menu-label");
      label.textContent = item.caption;
      if (item.captionStyle.length > 0)
        label.setAttribute("style", item.captionStyle);
      button.append(label);
      if (item.hasChildren) {
        let chosen = item.children.find((child) => child.checked && !child.isSeparator);
        if (chosen) {
          let value = Utilities.element("span", "scv-menu-value");
          value.textContent = chosen.caption;
          button.append(value);
        }
        button.append(Utilities.element("i", "bi bi-chevron-right scv-menu-arrow"));
      }
      let entry = { item, button };
      let index = this.entries.length;
      this.entries.push(entry);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (item.hasChildren) {
          if (this.submenuEntry === entry) {
            this.closeSubmenu();
          } else {
            this.openSubmenu(entry, false);
          }
          return;
        }
        this.#menu.choose(item);
      });
      button.addEventListener("mouseenter", () => {
        if (button.disabled)
          return;
        this.setActive(index, false);
        clearTimeout(this.#hoverTimer);
        this.#hoverTimer = window.setTimeout(() => {
          if (item.hasChildren) {
            if (this.submenuEntry !== entry)
              this.openSubmenu(entry, false);
          } else {
            this.closeSubmenu();
          }
        }, 150);
      });
      element.append(button);
    });
  }
  get enabledIndexes() {
    return this.entries.map((entry, index) => entry.button.disabled ? -1 : index).filter((index) => index >= 0);
  }
  setActive(index, scroll = true) {
    this.active = index;
    this.entries.forEach((entry, entryIndex) => entry.button.classList.toggle("scv-menu-focus", entryIndex == index));
    if (scroll && this.entries[index])
      this.entries[index].button.scrollIntoView({ block: "nearest" });
    this.#menu.focusList = this;
  }
  move(delta) {
    let enabled = this.enabledIndexes;
    if (enabled.length == 0)
      return;
    let position = enabled.indexOf(this.active);
    position = position < 0 ? delta > 0 ? 0 : enabled.length - 1 : (position + delta + enabled.length) % enabled.length;
    this.setActive(enabled[position]);
  }
  openSubmenu(entry, focusFirst) {
    this.closeSubmenu();
    clearTimeout(this.#hoverTimer);
    let element = Utilities.element("div", "dropdown-menu show scv-menu scv-submenu");
    this.#menu.element.append(element);
    let submenu = new _MenuList(this.#menu, element, entry.item.children, this);
    this.submenu = submenu;
    this.submenuEntry = entry;
    entry.button.setAttribute("aria-expanded", "true");
    entry.button.classList.add("scv-menu-open");
    _MenuList.position(element, entry.button.getBoundingClientRect());
    if (focusFirst) {
      submenu.move(1);
    } else {
      this.#menu.focusList = this;
    }
  }
  closeSubmenu() {
    if (!this.submenu)
      return;
    this.submenu.closeSubmenu();
    this.submenu.element.remove();
    if (this.submenuEntry) {
      this.submenuEntry.button.setAttribute("aria-expanded", "false");
      this.submenuEntry.button.classList.remove("scv-menu-open");
    }
    if (this.#menu.focusList && this.#menu.focusList.isInside(this.submenu))
      this.#menu.focusList = this;
    this.submenu = null;
    this.submenuEntry = null;
  }
  /** True when this list is list or one of its submenus. */
  isInside(list) {
    let current = this;
    while (current) {
      if (current === list)
        return true;
      current = current.parent;
    }
    return false;
  }
  /** Places a submenu beside the item that opened it, on the side with room. */
  static position(element, anchor) {
    element.style.position = "fixed";
    element.style.left = "0px";
    element.style.top = "0px";
    let width = element.offsetWidth;
    let height = element.offsetHeight;
    let rightToLeft = getComputedStyle(element).direction == "rtl";
    let after = anchor.right - 4;
    let before = anchor.left - width + 4;
    let left = rightToLeft ? before : after;
    if (!rightToLeft && left + width > window.innerWidth - 8)
      left = before;
    if (rightToLeft && left < 8)
      left = after;
    left = Utilities.clamp(left, 8, Math.max(8, window.innerWidth - width - 8));
    let top = Utilities.clamp(anchor.top - 6, 8, Math.max(8, window.innerHeight - height - 8));
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }
};
var PopupMenu = class extends Popup2 {
  #root;
  #onSelect;
  /** The list the arrow keys move in: the root or the deepest submenu being navigated. */
  focusList = null;
  constructor(items, onSelect) {
    super("dropdown-menu show scv-menu");
    this.#onSelect = onSelect;
    this.#root = new MenuList(this, this.element, items, null);
    this.focusList = this.#root;
  }
  /** Chooses an item that has no submenu. */
  choose(item) {
    if (!item.enabled || item.hasChildren)
      return;
    this.chosenValue = item;
    this.close();
    this.#onSelect(item);
  }
  close() {
    this.#root.closeSubmenu();
    super.close();
  }
  handleKey(event) {
    let list = this.focusList || this.#root;
    let rightToLeft = getComputedStyle(list.element).direction == "rtl";
    let forward = rightToLeft ? "ArrowLeft" : "ArrowRight";
    let back = rightToLeft ? "ArrowRight" : "ArrowLeft";
    let entry = list.entries[list.active];
    let handled = true;
    switch (event.key) {
      case "ArrowDown":
        list.move(1);
        break;
      case "ArrowUp":
        list.move(-1);
        break;
      case "Home":
        list.setActive(list.enabledIndexes[0] ?? -1);
        break;
      case "End":
        list.setActive(list.enabledIndexes[list.enabledIndexes.length - 1] ?? -1);
        break;
      case forward:
        if (entry && entry.item.hasChildren && !entry.button.disabled)
          list.openSubmenu(entry, true);
        break;
      case back:
        if (list.parent) {
          let parent = list.parent;
          parent.closeSubmenu();
          parent.setActive(parent.active);
        }
        break;
      case "Enter":
      case " ":
        if (!entry || entry.button.disabled)
          break;
        if (entry.item.hasChildren) {
          list.openSubmenu(entry, true);
        } else {
          this.choose(entry.item);
        }
        break;
      case "Escape":
        if (list.parent) {
          let parent = list.parent;
          parent.closeSubmenu();
          parent.setActive(parent.active);
        } else {
          handled = false;
        }
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    super.handleKey(event);
  }
};
var ColorPalette = class _ColorPalette extends Popup2 {
  static colors = [
    "#000000",
    "#434343",
    "#666666",
    "#999999",
    "#b7b7b7",
    "#d9d9d9",
    "#efefef",
    "#ffffff",
    "#c00000",
    "#e03e2d",
    "#f39c12",
    "#f1c40f",
    "#2dc26b",
    "#16a085",
    "#3598db",
    "#8e44ad",
    "#f8d7da",
    "#fde2cf",
    "#fff3cd",
    "#fffbd1",
    "#d1e7dd",
    "#cff4fc",
    "#cfe2ff",
    "#e2d9f3",
    "#842029",
    "#a1431b",
    "#997404",
    "#7d6f00",
    "#0f5132",
    "#055160",
    "#084298",
    "#432874"
  ];
  /** The colors chosen most recently, newest first, shared by every palette on the page. */
  static recentColors = [];
  static maximumRecentColors = 8;
  static #remember(hex) {
    let value = hex.toLowerCase();
    _ColorPalette.recentColors = [value].concat(_ColorPalette.recentColors.filter((color) => color != value)).slice(0, _ColorPalette.maximumRecentColors);
  }
  constructor(strings, onSelect) {
    super("scv-palette dropdown-menu show p-2");
    let choose = (hex) => {
      _ColorPalette.#remember(hex);
      this.close();
      onSelect(Colors.fromCSS(hex));
    };
    let swatches = (colors) => {
      let grid = Utilities.element("div", "scv-palette-grid");
      colors.forEach((hex) => {
        let swatch = Utilities.element("button", "scv-swatch", { type: "button", title: hex, "aria-label": hex });
        swatch.style.backgroundColor = hex;
        swatch.addEventListener("click", () => choose(hex));
        grid.append(swatch);
      });
      return grid;
    };
    this.element.append(swatches(_ColorPalette.colors));
    if (_ColorPalette.recentColors.length > 0) {
      let recent = swatches(_ColorPalette.recentColors);
      recent.classList.add("scv-palette-recent");
      this.element.append(recent);
    }
    let footer = Utilities.element("div", "scv-palette-footer");
    let automatic = Utilities.element("button", "btn btn-sm btn-outline-secondary", { type: "button" });
    automatic.textContent = strings.TextDefault;
    automatic.addEventListener("click", () => {
      this.close();
      onSelect(null);
    });
    footer.append(automatic);
    let custom = Utilities.element("label", "btn btn-sm btn-outline-secondary scv-palette-custom");
    custom.textContent = strings.TextCustomColorCaption;
    let input = Utilities.element("input", "", { type: "color" });
    input.addEventListener("change", () => choose(input.value));
    custom.append(input);
    footer.append(custom);
    this.element.append(footer);
  }
};
var TableSizePicker = class _TableSizePicker extends Popup2 {
  static maximumRows = 8;
  static maximumColumns = 10;
  rows = 1;
  columns = 1;
  #cells = [];
  #label;
  #strings;
  #onSelect;
  constructor(strings, onSelect) {
    super("dropdown-menu show scv-table-size");
    this.#strings = strings;
    this.#onSelect = onSelect;
    let grid = Utilities.element("div", "scv-table-size-grid", { role: "grid", "aria-label": strings.TextTableCaption });
    grid.style.gridTemplateColumns = `repeat(${_TableSizePicker.maximumColumns}, 1fr)`;
    for (let row = 1; row <= _TableSizePicker.maximumRows; row++) {
      for (let column = 1; column <= _TableSizePicker.maximumColumns; column++) {
        let cell = Utilities.element("button", "scv-table-size-cell", { type: "button", tabindex: "-1", "data-rows": String(row), "data-columns": String(column), "aria-label": this.#caption(row, column) });
        cell.addEventListener("mouseover", () => this.select(row, column));
        cell.addEventListener("click", () => this.choose());
        this.#cells.push(cell);
        grid.append(cell);
      }
    }
    this.#label = Utilities.element("div", "scv-table-size-label", { "aria-live": "polite" });
    this.element.append(grid, this.#label);
    this.select(1, 1);
  }
  #caption(rows, columns) {
    return Utilities.format(this.#strings.TextTableSizeCaptionFormat, { rows, columns });
  }
  /** Picks a size, highlighting it in the grid. */
  select(rows, columns) {
    this.rows = Utilities.clamp(rows, 1, _TableSizePicker.maximumRows);
    this.columns = Utilities.clamp(columns, 1, _TableSizePicker.maximumColumns);
    this.#cells.forEach((cell) => cell.classList.toggle("active", Number(cell.dataset.rows) <= this.rows && Number(cell.dataset.columns) <= this.columns));
    this.#label.textContent = this.#caption(this.rows, this.columns);
  }
  /** Chooses the size picked, and closes. */
  choose() {
    let rows = this.rows;
    let columns = this.columns;
    this.close();
    this.#onSelect(rows, columns);
  }
  handleKey(event) {
    let rightToLeft = getComputedStyle(this.element).direction == "rtl";
    let moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, rightToLeft ? 1 : -1], ArrowRight: [0, rightToLeft ? -1 : 1] };
    let move = moves[event.key];
    if (move) {
      event.preventDefault();
      event.stopPropagation();
      this.select(this.rows + move[0], this.columns + move[1]);
    } else if (event.key == "Enter") {
      event.preventDefault();
      event.stopPropagation();
      this.choose();
    } else {
      super.handleKey(event);
    }
  }
};
var Dialog = class {
  static prompt(container, strings, title, fields) {
    return new Promise((resolve) => {
      let backdrop = Utilities.element("dialog", "scv-dialog-backdrop");
      let dialog = Utilities.element("form", "scv-dialog modal-content shadow", { role: "dialog", "aria-modal": "true" });
      backdrop.append(dialog);
      let header = Utilities.element("div", "modal-header py-2");
      let heading = Utilities.element("h6", "modal-title");
      heading.textContent = title;
      header.append(heading);
      dialog.append(header);
      let body = Utilities.element("div", "modal-body");
      dialog.append(body);
      let inputs = {};
      fields.forEach((field) => {
        let identifier = `scv-${Utilities.uuid()}`;
        let group = Utilities.element("div", field.type == "checkbox" ? "form-check mb-2" : "mb-2");
        let label = Utilities.element("label", field.type == "checkbox" ? "form-check-label" : "form-label small mb-1", { for: identifier });
        label.textContent = field.label;
        let input;
        if (field.type == "select") {
          input = Utilities.element("select", "form-select form-select-sm", { id: identifier });
          (field.options || []).forEach((option) => input.append(new Option(option.caption, option.value)));
          input.value = String(field.value || "");
        } else if (field.type == "textarea") {
          input = Utilities.element("textarea", "form-control form-control-sm", { id: identifier, rows: "4" });
          input.value = String(field.value || "");
        } else if (field.type == "checkbox") {
          input = Utilities.element("input", "form-check-input", { id: identifier, type: "checkbox" });
          input.checked = field.value === true;
        } else {
          input = Utilities.element("input", "form-control form-control-sm", { id: identifier, type: field.type || "text" });
          input.value = String(field.value || "");
        }
        if (field.placeholder && "placeholder" in input)
          input.placeholder = field.placeholder;
        inputs[field.name] = input;
        if (field.type == "checkbox") {
          group.append(input, label);
        } else {
          group.append(label, input);
        }
        body.append(group);
      });
      let footer = Utilities.element("div", "modal-footer py-2");
      let cancel = Utilities.element("button", "btn btn-sm btn-secondary", { type: "button" });
      cancel.textContent = strings.TextCancelCaption;
      let ok = Utilities.element("button", "btn btn-sm btn-primary", { type: "submit" });
      ok.textContent = strings.TextOKCaption;
      footer.append(cancel, ok);
      dialog.append(footer);
      let finished = false;
      let finish = (result) => {
        if (finished)
          return;
        finished = true;
        if (backdrop.open)
          backdrop.close();
        backdrop.remove();
        resolve(result);
      };
      backdrop.addEventListener("cancel", (event) => {
        event.preventDefault();
        finish(null);
      });
      cancel.addEventListener("click", () => finish(null));
      backdrop.addEventListener("mousedown", (event) => {
        if (event.target === backdrop)
          finish(null);
      });
      dialog.addEventListener("keydown", (event) => {
        if (event.key == "Escape") {
          event.preventDefault();
          event.stopPropagation();
          finish(null);
        }
      });
      dialog.addEventListener("submit", (event) => {
        event.preventDefault();
        let result = {};
        Object.keys(inputs).forEach((name) => {
          let input = inputs[name];
          result[name] = input instanceof HTMLInputElement && input.type == "checkbox" ? input.checked : input.value;
        });
        finish(result);
      });
      Popup2.closeAll();
      container.append(backdrop);
      if (typeof backdrop.showModal == "function") {
        backdrop.showModal();
      } else {
        backdrop.setAttribute("open", "");
      }
      let first = dialog.querySelector("input, select, textarea");
      if (first) {
        first.focus();
        if (first instanceof HTMLInputElement && first.type != "checkbox")
          first.select();
      }
    });
  }
};
var ChoicePopup = class extends Popup2 {
  #list;
  #search = null;
  #items = [];
  #active = 0;
  #emptyCaption;
  onChoose;
  tabChooses = false;
  /** The item chosen, once one is; set before the popup closes. */
  chosen = null;
  constructor(classes, onChoose, search = null) {
    super(`dropdown-menu show scv-chooser ${classes}`);
    this.onChoose = onChoose;
    this.#emptyCaption = search ? search.emptyCaption : "";
    if (search) {
      this.keepsFocus = false;
      this.#search = Utilities.element("input", "form-control form-control-sm scv-chooser-search", { type: "search", placeholder: search.placeholder, "aria-label": search.placeholder });
      this.#search.addEventListener("input", () => this.setItems(search.filter(this.#search.value)));
      this.element.append(this.#search);
    }
    this.#list = Utilities.element("div", "scv-chooser-list", { role: "listbox" });
    if (search)
      this.#list.setAttribute("aria-label", search.placeholder);
    this.element.append(this.#list);
    if (search)
      this.setItems(search.filter(""));
  }
  get items() {
    return this.#items.slice();
  }
  /** What screen readers call the list, such as "Insert". */
  set label(value) {
    if (value)
      this.#list.setAttribute("aria-label", value);
    else
      this.#list.removeAttribute("aria-label");
  }
  get activeIndex() {
    return this.#active;
  }
  /**
   * Whether the search field shows, for a list made with a search filter. Without it, the list
   * shows every item and the text keeps focus; the arrow keys and Enter still choose.
   */
  get hasSearchField() {
    return !!this.#search && !this.#search.hidden;
  }
  set hasSearchField(value) {
    let search = this.#search;
    if (!search || value == !search.hidden)
      return;
    search.hidden = !value;
    this.keepsFocus = !value;
    if (!value && search.value.length > 0) {
      search.value = "";
      search.dispatchEvent(new Event("input"));
    }
    if (value && this.isOpen)
      search.focus();
    if (this.isOpen)
      this.position();
  }
  show(anchor, container) {
    super.show(anchor, container);
    if (this.hasSearchField)
      this.#search.focus();
  }
  setItems(items, active = 0) {
    this.#items = items;
    this.#active = Utilities.clamp(active, 0, Math.max(0, items.length - 1));
    this.#list.textContent = "";
    let group = void 0;
    items.forEach((item, index) => {
      if (item.group && item.group !== group) {
        let heading = Utilities.element("h6", "dropdown-header scv-chooser-group");
        heading.textContent = item.group;
        this.#list.append(heading);
      }
      group = item.group;
      let button = Utilities.element("button", "dropdown-item scv-menu-item", { type: "button", role: "option" });
      if (!item.render || !item.render(button, index == this.#active)) {
        let icon = item.icon || "";
        if (/^(https?:|data:|\/|\.)/.test(icon)) {
          let image = Utilities.element("img", "scv-menu-icon scv-menu-image", { src: icon, alt: "" });
          button.append(image);
        } else {
          button.append(Utilities.element("i", `scv-menu-icon ${icon}`));
        }
        let label = Utilities.element("span", "scv-menu-label");
        label.textContent = item.caption;
        button.append(label);
        if (item.detail) {
          let detail = Utilities.element("span", "scv-menu-value");
          detail.textContent = item.detail;
          button.append(detail);
        }
      }
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("mousemove", () => {
        if (this.#active != index)
          this.#setActive(index, false);
      });
      button.addEventListener("click", () => this.#choose(index));
      button.classList.toggle("scv-menu-focus", index == this.#active);
      button.setAttribute("aria-selected", index == this.#active ? "true" : "false");
      this.#list.append(button);
    });
    if (items.length == 0 && this.#emptyCaption.length > 0) {
      let empty = Utilities.element("div", "scv-chooser-empty text-body-secondary");
      empty.textContent = this.#emptyCaption;
      this.#list.append(empty);
    }
    if (this.isOpen)
      this.position();
  }
  #buttons() {
    return Array.from(this.#list.querySelectorAll("button"));
  }
  #setActive(index, scroll = true) {
    this.#active = index;
    this.#buttons().forEach((button2, buttonIndex) => {
      button2.classList.toggle("scv-menu-focus", buttonIndex == index);
      button2.setAttribute("aria-selected", buttonIndex == index ? "true" : "false");
    });
    let item = this.#items[index];
    let button = this.#buttons()[index];
    if (item && item.render && button) {
      button.textContent = "";
      item.render(button, true);
    }
    if (scroll && button)
      button.scrollIntoView({ block: "nearest" });
  }
  #choose(index) {
    let item = this.#items[index];
    if (!item)
      return;
    this.chosen = item;
    this.chosenValue = item;
    this.close();
    this.onChoose(item);
  }
  handleKey(event) {
    let count = this.#items.length;
    if ((event.key == "ArrowDown" || event.key == "ArrowUp") && count > 0) {
      event.preventDefault();
      event.stopPropagation();
      this.#setActive(event.key == "ArrowDown" ? (this.#active + 1) % count : this.#active <= 0 ? count - 1 : this.#active - 1);
      return;
    }
    if ((event.key == "Enter" || event.key == "Tab" && this.tabChooses && !event.shiftKey) && count > 0 && !event.isComposing) {
      event.preventDefault();
      event.stopPropagation();
      this.#choose(this.#active);
      return;
    }
    super.handleKey(event);
  }
};
var InsertionChooser = class extends ChoicePopup {
  constructor(strings, types, onSelect, choices = [], onChoice = (choice) => choice.choose(null)) {
    let entries = types.filter((type) => type.insertable).map((type) => ({ item: { caption: type.caption, icon: type.icon, value: () => onSelect(type) }, search: `${type.caption} ${type.keywords} ${type.identifier}`.toLowerCase() })).concat(choices.map((choice) => ({ item: { caption: choice.caption, icon: choice.icon, value: () => onChoice(choice) }, search: `${choice.caption} ${choice.keywords || ""}`.toLowerCase() })));
    super("", (item) => item.value(), {
      placeholder: strings.TextInsertNodeSearchHint,
      emptyCaption: "",
      filter: (query) => {
        let words = query.trim().toLowerCase();
        return entries.filter((entry) => words.length == 0 || entry.search.indexOf(words) >= 0).map((entry) => entry.item);
      }
    });
  }
};

// annotations.ts
var Comment = class _Comment {
  #id = Utilities.uuid();
  #authorID;
  #authorName;
  #created;
  #text;
  constructor(authorID = "", authorName = "", text = "") {
    this.#authorID = authorID.trim();
    this.#authorName = authorName.trim();
    this.#text = text.trim();
    this.#created = /* @__PURE__ */ new Date();
  }
  get id() {
    return this.#id;
  }
  /** The collaborator ID of the comment's author. */
  get authorID() {
    return this.#authorID;
  }
  get authorName() {
    return this.#authorName;
  }
  get created() {
    return this.#created;
  }
  get text() {
    return this.#text;
  }
  static fromJSON(data) {
    if (!data || typeof data != "object")
      return null;
    let result = new _Comment();
    result.#id = Utilities.string(data.id, result.#id) || result.#id;
    result.#authorID = Utilities.string(data.authorId);
    result.#authorName = Utilities.string(data.authorName);
    result.#text = Utilities.string(data.text);
    let seconds = Number(data.created);
    if (isFinite(seconds) && "created" in data)
      result.#created = new Date(seconds * 1e3);
    return result;
  }
  /** The comment as JSON, with its date in seconds since 1970. */
  toJSON() {
    let result = { id: this.#id };
    if (this.#authorID.length > 0)
      result.authorId = this.#authorID;
    if (this.#authorName.length > 0)
      result.authorName = this.#authorName;
    result.created = this.#created.getTime() / 1e3;
    result.text = this.#text;
    return result;
  }
};
var Annotation = class _Annotation {
  #id = Utilities.uuid();
  #nodeID = "";
  #segment = 0;
  // Offsets in UTF-16 units of the segment's text, or in code points while
  // #codePointOffsets is set, as read from JSON before the text was seen.
  #start = 0;
  #length = 0;
  #codePointOffsets = false;
  #coversNode = false;
  #quote = "";
  #resolved = false;
  #comments = [];
  #segmentText = "";
  #hasBaseline = false;
  #nodeMissing = false;
  /** Where the annotation's marker is shown, for placing the popover. */
  markerElement = null;
  get id() {
    return this.#id;
  }
  get nodeID() {
    return this.#nodeID;
  }
  get segment() {
    return this.#segment;
  }
  /** The offset of the annotated text in its text run. */
  get start() {
    return this.#start;
  }
  /** The length of the annotated text. It is 0 when the text has been deleted. */
  get length() {
    return this.#length;
  }
  get coversNode() {
    return this.#coversNode;
  }
  /** The text the annotation was made on. */
  get quote() {
    return this.#quote;
  }
  get resolved() {
    return this.#resolved;
  }
  /** True when the annotated text was deleted, or the node is no longer in the document. */
  get orphaned() {
    return this.#nodeMissing || !this.#coversNode && this.#length == 0;
  }
  /** When the thread's first comment was written. */
  get created() {
    return this.#comments.length > 0 ? this.#comments[0].created : null;
  }
  comments() {
    return this.#comments.slice();
  }
  commentAt(index) {
    return this.#comments[index] || null;
  }
  get lastCommentIndex() {
    return this.#comments.length - 1;
  }
  /** @internal */
  addComment(value) {
    if (value)
      this.#comments.push(value);
  }
  /** @internal */
  removeCommentAt(index) {
    if (index >= 0 && index < this.#comments.length)
      this.#comments.splice(index, 1);
  }
  /** @internal */
  setResolved(value) {
    this.#resolved = value;
  }
  /** @internal */
  setNodeMissing(value) {
    this.#nodeMissing = value;
  }
  /** @internal Sets what the annotation is attached to. */
  setAnchor(nodeID, segment, start, length, coversNode, quote, segmentText) {
    this.#nodeID = nodeID;
    this.#segment = Math.max(0, segment);
    this.#start = Math.max(0, start);
    this.#length = Math.max(0, length);
    this.#coversNode = coversNode;
    this.#quote = quote;
    this.#segmentText = segmentText;
    this.#hasBaseline = true;
    this.#codePointOffsets = false;
  }
  /** @internal Attaches this annotation where another one is. */
  copyAnchor(source) {
    if (!source)
      return;
    this.#nodeID = source.#nodeID;
    this.#segment = source.#segment;
    this.#start = source.#start;
    this.#length = source.#length;
    this.#coversNode = source.#coversNode;
    this.#quote = source.#quote;
    this.#segmentText = source.#segmentText;
    this.#hasBaseline = source.#hasBaseline;
    this.#codePointOffsets = source.#codePointOffsets;
    this.markerElement = source.markerElement;
  }
  /** @internal Takes every value of another annotation, keeping this object. */
  assign(source) {
    if (!source)
      return;
    this.copyAnchor(source);
    this.#id = source.#id;
    this.#resolved = source.#resolved;
    this.#comments = source.#comments.slice();
  }
  /**
   * @internal Moves the anchor to follow an edit to its text run, and returns whether
   * it moved. Text inserted before the anchor moves it, text inserted inside it grows
   * it, and deleted text shrinks it. An anchor whose text is deleted collapses where
   * the text was, and covers it again if the same text comes back there, as on undo.
   */
  adjustToText(currentText) {
    if (this.#codePointOffsets) {
      let start = _Annotation.fromCodePoints(currentText, this.#start);
      let end = _Annotation.fromCodePoints(currentText, this.#start + this.#length);
      this.#start = start;
      this.#length = end - start;
      this.#codePointOffsets = false;
      this.#segmentText = currentText;
      this.#hasBaseline = true;
      return false;
    }
    if (!this.#hasBaseline || this.#coversNode) {
      this.#segmentText = currentText;
      this.#hasBaseline = true;
      return false;
    }
    if (currentText === this.#segmentText)
      return false;
    let previous = this.#segmentText;
    let prefix = 0;
    let shortest = Math.min(previous.length, currentText.length);
    while (prefix < shortest && previous[prefix] === currentText[prefix])
      prefix++;
    let suffix = 0;
    while (suffix < shortest - prefix && previous[previous.length - 1 - suffix] === currentText[currentText.length - 1 - suffix])
      suffix++;
    let previousSuffix = previous.length - suffix;
    let currentSuffix = currentText.length - suffix;
    this.#segmentText = currentText;
    let startOffset = this.#start;
    let endOffset = this.#start + this.#length;
    let delta = currentSuffix - previousSuffix;
    if (this.#length == 0 && this.#quote.length > 0 && startOffset >= prefix && startOffset <= previousSuffix) {
      let inserted = currentText.substring(prefix, currentSuffix);
      let found = inserted.indexOf(this.#quote);
      if (found >= 0) {
        this.#start = prefix + found;
        this.#length = this.#quote.length;
        return true;
      }
    }
    if (endOffset <= prefix) {
      return false;
    } else if (startOffset >= previousSuffix) {
      this.#start = startOffset + delta;
    } else if (startOffset < prefix) {
      this.#length = (endOffset > previousSuffix ? endOffset + delta : prefix) - startOffset;
    } else if (endOffset > previousSuffix) {
      this.#start = currentSuffix;
      this.#length = endOffset + delta - currentSuffix;
    } else {
      this.#start = prefix;
      this.#length = 0;
    }
    this.#start = Utilities.clamp(this.#start, 0, currentText.length);
    this.#length = Utilities.clamp(this.#length, 0, currentText.length - this.#start);
    return true;
  }
  static fromCodePoints(text, count) {
    let index = 0;
    let seen = 0;
    while (seen < count && index < text.length) {
      let code = text.codePointAt(index) || 0;
      index += code > 65535 ? 2 : 1;
      seen++;
    }
    return index;
  }
  static fromJSON(data) {
    if (!data || typeof data != "object")
      return null;
    let result = new _Annotation();
    result.#id = Utilities.string(data.id, result.#id) || result.#id;
    result.#nodeID = Utilities.string(data.nodeId);
    result.#segment = Math.max(0, Utilities.integer(data.segment, 0));
    result.#start = Math.max(0, Utilities.integer(data.start, 0));
    result.#length = Math.max(0, Utilities.integer(data.length, 0));
    result.#coversNode = Utilities.boolean(data.coversNode, false);
    result.#quote = Utilities.string(data.quote);
    result.#resolved = Utilities.boolean(data.resolved, false);
    result.#codePointOffsets = !result.#coversNode;
    result.#hasBaseline = false;
    if (Array.isArray(data.comments)) {
      data.comments.forEach((item) => {
        let comment = Comment.fromJSON(item);
        if (comment)
          result.#comments.push(comment);
      });
    }
    return result.#nodeID.length > 0 ? result : null;
  }
  /** The annotation, its anchor and its comments as JSON. Offsets are in characters (code points). */
  toJSON() {
    let result = { id: this.#id, nodeId: this.#nodeID };
    if (this.#coversNode) {
      result.coversNode = true;
    } else {
      let start = this.#start;
      let length = this.#length;
      if (!this.#codePointOffsets && this.#hasBaseline) {
        start = CodePoints.count(this.#segmentText.substring(0, this.#start));
        length = CodePoints.count(this.#segmentText.substring(this.#start, this.#start + this.#length));
      }
      result.segment = this.#segment;
      result.start = start;
      result.length = length;
      result.quote = this.#quote;
    }
    if (this.#resolved)
      result.resolved = true;
    result.comments = this.#comments.map((comment) => comment.toJSON());
    return result;
  }
};
var Annotations = class {
  #owner;
  #handler;
  #items = [];
  #grouping = false;
  #selected = null;
  #popover = null;
  /** The collaborator ID recorded as the author of new comments. */
  authorID = "";
  /** The name recorded as the author of new comments. When both are empty, TextDefaultAuthorCaption is used. */
  authorName = "";
  constructor(owner, handler) {
    this.#owner = owner;
    this.#handler = handler;
  }
  get owner() {
    return this.#owner;
  }
  /** @internal Replaces every annotation without undo or events, as when a document is loaded. */
  load(items) {
    this.close();
    this.#items = items.slice();
    this.#selected = null;
  }
  /**
   * @internal Replaces a thread with a collaboration server's copy, adds it, or removes
   * it when data is null. Not an undo step; raises the usual annotation events.
   */
  applyRemote(identifier, data) {
    let existing = this.item(identifier);
    if (!data) {
      if (!existing)
        return;
      this.#items.splice(this.#items.indexOf(existing), 1);
      if (this.#selected === existing) {
        this.close();
        this.#selected = null;
      }
      this.#handler.changed("removed", existing);
      return;
    }
    let incoming = Annotation.fromJSON(data);
    if (!incoming)
      return;
    if (existing) {
      if (JSON.stringify(existing.toJSON()) === JSON.stringify(incoming.toJSON()))
        return;
      existing.assign(incoming);
      this.#handler.changed("changed", existing);
    } else {
      this.#items.push(incoming);
      this.#handler.changed("added", incoming);
    }
  }
  add(first, second, third, fourth, fifth) {
    if (typeof first == "string") {
      if (first.trim().length == 0)
        return null;
      let result2 = new Annotation();
      if (!this.#handler.selectionAnchor(result2))
        return null;
      return this.#addAnnotation(result2, first);
    }
    let node = first;
    if (!node || !this.#handler.containsNode(node))
      return null;
    if (typeof second == "string") {
      if (second.trim().length == 0)
        return null;
      let result2 = new Annotation();
      result2.setAnchor(node.nodeId, 0, 0, 0, true, "", "");
      return this.#addAnnotation(result2, second);
    }
    let start = Number(second);
    let length = Number(third);
    let text = String(fourth || "");
    let segment = Number(fifth || 0);
    if (text.trim().length == 0 || !(length > 0) || !(start >= 0) || !(segment >= 0) || segment >= this.#handler.segmentCount(node))
      return null;
    let segmentText = this.#handler.segmentText(node, segment);
    if (segmentText === null || start + length > segmentText.length)
      return null;
    let result = new Annotation();
    result.setAnchor(node.nodeId, segment, start, length, false, segmentText.substring(start, start + length), segmentText);
    return this.#addAnnotation(result, text);
  }
  /** @internal Starts a thread on an anchor taken from the selection when the popover opened. */
  addPrepared(anchor, text) {
    if (!anchor || text.trim().length == 0 || anchor.lastCommentIndex >= 0 || this.#items.indexOf(anchor) >= 0 || !this.canChange)
      return null;
    return this.#addAnnotation(anchor, text);
  }
  #addAnnotation(annotation, text) {
    if (!this.canChange)
      return null;
    let author = this.#author();
    this.#willChange();
    annotation.addComment(new Comment(author.id, author.name, text));
    this.#items.push(annotation);
    this.#handler.changed("added", annotation);
    return annotation;
  }
  #author() {
    let id = this.authorID.trim();
    let name = this.authorName.trim();
    if (id.length > 0 || name.length > 0)
      return { id, name };
    let identity = this.#handler.identity();
    if (identity && identity.name.trim().length > 0)
      return { id: identity.id.trim(), name: identity.name.trim() };
    return { id: "", name: this.#handler.strings.TextDefaultAuthorCaption };
  }
  #willChange() {
    if (!this.#grouping)
      this.#handler.willChange();
  }
  /** True when add(text) has something to annotate: selected text, or one selected node. */
  get canAdd() {
    return this.canChange && this.#handler.selectionAnchor(new Annotation());
  }
  /** True when threads can be added, answered, resolved and removed. False when comments are turned off, or may only be read. */
  get canChange() {
    return this.#handler.allowed && this.#handler.canChange;
  }
  /** The annotations attached to a node, in the order they were added. */
  annotationsAt(node) {
    if (!node)
      return [];
    return this.#items.filter((item) => item.nodeID == node.nodeId);
  }
  indexOf(annotation) {
    return this.#items.indexOf(annotation);
  }
  item(identifier) {
    return this.#items.find((item) => item.id == identifier) || null;
  }
  itemAt(index) {
    return this.#items[index] || null;
  }
  items() {
    return this.#items.slice();
  }
  get lastIndex() {
    return this.#items.length - 1;
  }
  remove(annotation) {
    let target = typeof annotation == "string" ? this.item(annotation) : annotation;
    let index = target ? this.#items.indexOf(target) : -1;
    if (index >= 0)
      this.removeAt(index);
  }
  removeAt(index) {
    if (index < 0 || index >= this.#items.length || !this.#handler.canChange)
      return;
    let removed = this.#items[index];
    this.#willChange();
    this.#items.splice(index, 1);
    if (this.#selected === removed)
      this.#selected = null;
    this.#handler.changed("removed", removed);
  }
  /** Removes every annotation, as one undo step. */
  removeAll() {
    if (this.#items.length == 0 || !this.#handler.canChange)
      return;
    this.#willChange();
    this.#grouping = true;
    for (let index = this.#items.length - 1; index >= 0; index--)
      this.removeAt(index);
    this.#grouping = false;
  }
  /** Removes a comment from a thread, and the thread when it was the last one. */
  removeComment(annotation, comment) {
    if (!annotation || !comment || this.#items.indexOf(annotation) < 0 || !this.#handler.canChange)
      return;
    let index = annotation.comments().indexOf(comment);
    if (index < 0)
      return;
    this.#willChange();
    this.#grouping = true;
    annotation.removeCommentAt(index);
    if (annotation.lastCommentIndex < 0) {
      this.remove(annotation);
    } else {
      this.#handler.changed("changed", annotation);
    }
    this.#grouping = false;
  }
  /** Adds a reply by the current author and returns it, or null when the text is empty. */
  reply(annotation, text) {
    if (!annotation || text.trim().length == 0 || this.#items.indexOf(annotation) < 0 || !this.canChange)
      return null;
    let author = this.#author();
    let result = new Comment(author.id, author.name, text);
    this.#willChange();
    annotation.addComment(result);
    this.#handler.changed("changed", annotation);
    return result;
  }
  /** Marks a discussion resolved. It stays visible, muted, and can be reopened. */
  resolve(annotation) {
    this.#setResolved(annotation, true);
  }
  reopen(annotation) {
    this.#setResolved(annotation, false);
  }
  #setResolved(annotation, value) {
    if (!annotation || annotation.resolved == value || this.#items.indexOf(annotation) < 0 || !this.#handler.canChange)
      return;
    this.#willChange();
    annotation.setResolved(value);
    this.#handler.changed("changed", annotation);
  }
  /** @internal An unsaved anchor for the selected text or node, or null. */
  prepareSelection() {
    let result = new Annotation();
    return this.#handler.selectionAnchor(result) ? result : null;
  }
  /** The annotation whose text is highlighted, as while its thread is open. */
  get selected() {
    return this.#selected;
  }
  set selected(value) {
    if (value === this.#selected)
      return;
    this.#selected = value;
    this.#handler.redraw();
  }
  /** True while the comment popover is open. */
  get visible() {
    return !!this.#popover && this.#popover.isOpen;
  }
  /**
   * Opens the comment popover on an annotation's thread, among the other threads on
   * its node, or on a new thread for the selection when annotation is null.
   */
  show(annotation = null, focusField = true) {
    let container = this.#handler.container;
    if (!this.#handler.allowed || !container)
      return;
    if (!annotation) {
      if (!this.canChange)
        return;
      let prepared = this.prepareSelection();
      if (!prepared)
        return;
      let rect = this.#handler.selectionRect();
      this.#open([], 0, prepared, rect, container, focusField);
      return;
    }
    if (this.#items.indexOf(annotation) < 0)
      return;
    let anchor = this.#handler.reveal(annotation);
    let threads = this.#items.filter((item) => item.nodeID == annotation.nodeID);
    this.#open(threads, threads.indexOf(annotation), null, anchor, container, focusField);
  }
  #open(threads, index, prepared, anchor, container, focusField) {
    this.close();
    let popover = new AnnotationPopover(this, this.#handler.strings, threads, index, prepared);
    popover.onClose = () => {
      if (this.#popover === popover) {
        this.#popover = null;
        this.selected = null;
      }
    };
    this.#popover = popover;
    let fallback = anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor;
    popover.anchorProvider = () => {
      let thread = popover.current;
      let marker = thread ? thread.markerElement : null;
      return marker && marker.isConnected ? marker.getBoundingClientRect() : fallback;
    };
    popover.show(anchor || container, container);
    if (focusField)
      popover.focusField();
  }
  /** @internal The popover changed the thread it shows. */
  popoverShowing(annotation) {
    this.selected = annotation;
  }
  /** Closes the comment popover when it is open. */
  close() {
    if (this.#popover)
      this.#popover.close();
  }
  /** @internal Rebuilds the open popover after the annotations changed. */
  refreshPopover() {
    if (this.#popover && this.#popover.isOpen)
      this.#popover.refresh();
  }
};
var AnnotationPopover = class extends Popup2 {
  #annotations;
  #strings;
  #threads;
  #index;
  #prepared;
  #field = null;
  constructor(annotations, strings, threads, index, prepared) {
    super("scv-annotation-popover");
    this.keepsFocus = false;
    this.#annotations = annotations;
    this.#strings = strings;
    this.#threads = threads;
    this.#index = Math.max(0, index);
    this.#prepared = prepared;
    this.element.setAttribute("role", "dialog");
    this.element.setAttribute("aria-label", strings.TextCommentsCaption);
    this.#build();
  }
  get current() {
    return this.#prepared ? null : this.#threads[this.#index] || null;
  }
  focusField() {
    if (this.#field)
      this.#field.focus();
  }
  refresh() {
    let items = this.#annotations.items();
    this.#threads = this.#threads.filter((thread) => items.indexOf(thread) >= 0);
    if (!this.#prepared && this.#threads.length == 0) {
      this.close();
      return;
    }
    this.#index = Utilities.clamp(this.#index, 0, Math.max(0, this.#threads.length - 1));
    let hadFocus = !!this.#field && document.activeElement === this.#field;
    let draft = this.#field ? this.#field.value : "";
    this.#build();
    if (this.#field)
      this.#field.value = draft;
    if (hadFocus)
      this.focusField();
    if (this.isOpen)
      this.position();
  }
  #build() {
    let strings = this.#strings;
    let element = this.element;
    element.textContent = "";
    let thread = this.current;
    this.#annotations.popoverShowing(thread || this.#prepared);
    let header = Utilities.element("div", "scv-annotation-header");
    let title = Utilities.element("span", "scv-annotation-title");
    if (thread) {
      title.textContent = Utilities.format(strings.TextCommentPositionFormat, { index: this.#index + 1, count: this.#threads.length });
      let status = Utilities.element("span", `badge ${thread.resolved ? "text-bg-secondary" : "text-bg-warning"} scv-annotation-status`);
      status.textContent = thread.resolved ? strings.TextResolvedCaption : strings.TextOpenStatusCaption;
      header.append(title, status);
      let previous = this.#iconButton("bi bi-chevron-up", strings.TextPreviousCommentTooltip, () => this.#move(-1));
      let next = this.#iconButton("bi bi-chevron-down", strings.TextNextCommentTooltip, () => this.#move(1));
      previous.disabled = this.#index <= 0;
      next.disabled = this.#index >= this.#threads.length - 1;
      let navigation = Utilities.element("span", "scv-annotation-navigation");
      navigation.append(previous, next);
      header.append(navigation);
    } else {
      title.textContent = strings.TextNewCommentCaption;
      header.append(title);
    }
    element.append(header);
    let quote = thread ? thread.quote : this.#prepared ? this.#prepared.quote : "";
    if (quote.length > 0) {
      let blockquote = Utilities.element("blockquote", "scv-annotation-quote");
      blockquote.textContent = quote;
      element.append(blockquote);
    }
    if (thread) {
      let list = Utilities.element("div", "scv-annotation-comments");
      thread.comments().forEach((comment) => {
        let item = Utilities.element("div", "scv-annotation-comment");
        let meta = Utilities.element("div", "scv-annotation-meta");
        let author = Utilities.element("strong");
        author.textContent = comment.authorName.length > 0 ? comment.authorName : strings.TextDefaultAuthorCaption;
        let time = Utilities.element("time", "text-body-secondary", { datetime: comment.created.toISOString() });
        time.textContent = comment.created.toLocaleString(void 0, { dateStyle: "medium", timeStyle: "short" });
        meta.append(author, time);
        let text = Utilities.element("div", "scv-annotation-text");
        text.textContent = comment.text;
        item.append(meta, text);
        list.append(item);
      });
      element.append(list);
    }
    if (!this.#annotations.canChange) {
      this.#field = null;
      return;
    }
    let field = Utilities.element("textarea", "form-control form-control-sm scv-annotation-field", { rows: "2", placeholder: thread ? strings.TextReplyHint : strings.TextCommentHint, "aria-label": thread ? strings.TextReplyHint : strings.TextCommentHint });
    field.addEventListener("keydown", (event) => {
      if (event.key == "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        this.#submit();
      }
    });
    this.#field = field;
    element.append(field);
    if (thread) {
      let actions = Utilities.element("div", "scv-annotation-actions");
      let fresh = Utilities.element("button", "btn btn-sm btn-outline-secondary", { type: "button", title: strings.TextNewCommentThreadTooltip });
      fresh.textContent = strings.TextNewCommentThreadCaption;
      fresh.addEventListener("click", () => {
        let anchor = new Annotation();
        anchor.copyAnchor(thread);
        this.#prepared = anchor;
        this.#build();
        this.position();
        this.focusField();
      });
      let resolve = Utilities.element("button", "btn btn-sm btn-outline-secondary", { type: "button" });
      resolve.textContent = thread.resolved ? strings.TextReopenCaption : strings.TextResolveCaption;
      resolve.addEventListener("click", () => {
        if (thread.resolved) {
          this.#annotations.reopen(thread);
        } else {
          this.#annotations.resolve(thread);
        }
      });
      let remove = Utilities.element("button", "btn btn-sm btn-outline-danger", { type: "button" });
      remove.textContent = strings.TextDeleteCommentThreadCaption;
      remove.addEventListener("click", () => this.#annotations.remove(thread));
      actions.append(fresh, resolve, remove);
      element.append(actions);
    }
  }
  #iconButton(icon, label, action) {
    let button = Utilities.element("button", "btn btn-sm btn-link scv-annotation-nav", { type: "button", title: label, "aria-label": label });
    button.append(Utilities.element("i", icon));
    button.addEventListener("click", action);
    return button;
  }
  #move(delta) {
    let index = this.#index + delta;
    if (index < 0 || index >= this.#threads.length)
      return;
    this.#index = index;
    this.#build();
    this.position();
  }
  #submit() {
    let text = this.#field ? this.#field.value : "";
    if (text.trim().length == 0)
      return;
    if (this.#prepared) {
      let added = this.#annotations.addPrepared(this.#prepared, text);
      if (!added)
        return;
      this.#prepared = null;
      this.#threads = this.#annotations.items().filter((item) => item.nodeID == added.nodeID);
      this.#index = Math.max(0, this.#threads.indexOf(added));
    } else {
      let thread = this.current;
      if (!thread || !this.#annotations.reply(thread, text))
        return;
    }
    if (this.#field)
      this.#field.value = "";
    this.#build();
    this.position();
    this.focusField();
  }
};

// formatting.ts
var FormattingStyles = /* @__PURE__ */ ((FormattingStyles2) => {
  FormattingStyles2[FormattingStyles2["bold"] = 0] = "bold";
  FormattingStyles2[FormattingStyles2["italic"] = 1] = "italic";
  FormattingStyles2[FormattingStyles2["underline"] = 2] = "underline";
  FormattingStyles2[FormattingStyles2["strikethrough"] = 3] = "strikethrough";
  FormattingStyles2[FormattingStyles2["code"] = 4] = "code";
  FormattingStyles2[FormattingStyles2["highlight"] = 5] = "highlight";
  FormattingStyles2[FormattingStyles2["keyboard"] = 6] = "keyboard";
  FormattingStyles2[FormattingStyles2["superscript"] = 7] = "superscript";
  FormattingStyles2[FormattingStyles2["subscript"] = 8] = "subscript";
  return FormattingStyles2;
})(FormattingStyles || {});
var Formatting = class _Formatting {
  #editor;
  static propertyNames = ["bold", "italic", "underline", "strikethrough", "code", "highlight", "keyboard", "superscript", "subscript"];
  constructor(editor) {
    this.#editor = editor;
  }
  get owner() {
    return this.#editor;
  }
  /** The ranges a formatting command applies to. */
  #targets() {
    let host = this.#editor.activeHost;
    if (host) {
      let selection = host.selection();
      if (selection)
        return [{ host, start: selection.start, end: selection.end }];
    }
    let result = [];
    this.#editor.selectedNodes().forEach((node) => {
      node.hosts().forEach((nodeHost) => {
        if (nodeHost.mode != 3 /* plain */)
          result.push({ host: nodeHost, start: 0, end: nodeHost.rich.length });
      });
    });
    return result;
  }
  /** The style at the caret, or of the first selected character. */
  currentStyle() {
    let pending = this.#editor.pendingStyle();
    if (pending)
      return pending;
    let targets = this.#targets();
    if (targets.length == 0)
      return new TextStyle();
    let target = targets[0];
    if (target.start == target.end) {
      let host = target.host;
      if (host.rich.length == 0 && host.node instanceof TextNode2)
        return host.node.baseStyle();
      return host.rich.insertionStyleAt(target.start);
    }
    return target.host.rich.styleAt(target.start);
  }
  canApply(style) {
    if (this.#editor.readOnly)
      return false;
    if (style !== void 0 && !this.#editor.activeFontOptions().allows(_Formatting.propertyNames[style]))
      return false;
    let targets = this.#targets();
    return targets.length > 0 && targets.every((target) => target.host.mode != 3 /* plain */);
  }
  isApplied(style) {
    let name = _Formatting.propertyNames[style];
    let pending = this.#editor.pendingStyle();
    if (pending)
      return pending[name] === true;
    let targets = this.#targets();
    if (targets.length == 0)
      return false;
    let ranged = targets.filter((target) => target.end > target.start);
    if (ranged.length == 0)
      return this.currentStyle()[name] === true;
    return ranged.every((target) => target.host.rich.everyStyle(target.start, target.end, (item) => item[name] === true));
  }
  toggle(style) {
    if (!this.canApply(style))
      return;
    let name = _Formatting.propertyNames[style];
    let value = !this.isApplied(style);
    this.apply((item) => {
      item[name] = value;
      if (value && style == 7 /* superscript */)
        item.subscript = false;
      if (value && style == 8 /* subscript */)
        item.superscript = false;
    });
  }
  /**
   * Calls change for the style of every character in the targets, then shows
   * the result. With only a caret, the change applies to the next typed text.
   */
  apply(change) {
    if (this.#editor.readOnly)
      return;
    let targets = this.#targets();
    if (targets.length == 0)
      return;
    if (targets.length == 1 && targets[0].start == targets[0].end) {
      let target = targets[0];
      let style = this.currentStyle().clone();
      change(style);
      this.#editor.setPendingStyle(target.host, target.start, style);
      this.#editor.updateToolbarState();
      return;
    }
    this.#editor.history.checkpoint();
    let focused = this.#editor.activeHost;
    let focusedRange = focused ? focused.selection() : null;
    let changedNodes = [];
    targets.forEach((target) => {
      target.host.rich.applyStyle(target.start, target.end, change);
      target.host.render();
      target.host.node.textChanged(target.host);
      if (changedNodes.indexOf(target.host.node) < 0)
        changedNodes.push(target.host.node);
    });
    if (focused && focusedRange)
      focused.select(focusedRange.start, focusedRange.end);
    changedNodes.forEach((node) => node.changed());
    this.#editor.updateToolbarState();
  }
  setTextColor(color) {
    this.apply((style) => style.textColor = color ? Colors.clone(color) : Colors.empty);
  }
  setBackgroundColor(color) {
    this.apply((style) => {
      style.hasBackgroundColor = color !== null;
      if (color) {
        style.backgroundColor = Colors.clone(color);
        style.highlight = false;
      }
    });
  }
  /** Sets the font family. An empty name follows the document font. */
  setFontName(name) {
    this.apply((style) => style.fontName = name);
  }
  /** Sets the font size in points. Zero follows the document size. */
  setFontSize(size) {
    this.apply((style) => style.fontSize = Math.max(0, size));
  }
  get canClearFormatting() {
    return this.canApply();
  }
  /** Removes character formatting, keeping links. */
  clearFormatting() {
    this.apply((style) => {
      let link = [style.linkURL, style.linkTitle, style.linkTarget];
      let suggestion = [style.suggestionProviderIdentifier, style.suggestionIdentifier];
      Object.assign(style, new TextStyle());
      [style.linkURL, style.linkTitle, style.linkTarget] = link;
      [style.suggestionProviderIdentifier, style.suggestionIdentifier] = suggestion;
    });
  }
  // Alignment
  get canAlign() {
    return !this.#editor.readOnly && (this.#editor.activeHost !== null || this.#editor.selectedNodes().length > 0);
  }
  /** The alignment of the text being edited, or of the selected node. */
  get alignment() {
    let host = this.#editor.activeHost;
    let node = host ? host.node : this.#editor.selectedNode;
    if (!node)
      return this.#editor.textAlignment;
    if (host && node instanceof TableNode) {
      let cell = node.cells[node.cellIndexOf(host)];
      if (cell && cell.textAlignment != 0 /* automatic */)
        return cell.textAlignment;
      return node.resolvedTextAlignment();
    }
    if (node instanceof TextNode2)
      return node.resolvedTextAlignment();
    if (node instanceof TableNode)
      return node.resolvedTextAlignment();
    return node.resolvedAlignment();
  }
  /** Aligns the text being edited, or the selected nodes. Text aligns within its block; other nodes align on the page. */
  align(value) {
    if (!this.canAlign)
      return;
    this.#editor.history.checkpoint();
    let host = this.#editor.activeHost;
    let selection = host ? host.selection() : null;
    let nodes = host ? [host.node] : this.#editor.selectedNodes();
    nodes.forEach((node) => {
      if (host && node instanceof TableNode) {
        let cell = node.cells[node.cellIndexOf(host)];
        if (cell)
          cell.textAlignment = value;
      } else if (node instanceof TextNode2) {
        node.textAlignment = value;
      } else if (node instanceof TableNode) {
        node.textAlignment = value;
      } else {
        node.alignment = value;
      }
      node.refresh();
      node.changed();
    });
    if (host && selection) {
      let refreshed = host.node.hosts()[host.index];
      if (refreshed)
        refreshed.select(selection.start, selection.end);
    }
    this.#editor.updateToolbarState();
  }
  // Links
  get canEditLink() {
    let host = this.#linkHost();
    return !this.#editor.readOnly && host !== null && host.mode != 3 /* plain */;
  }
  /** The text being edited, or the text of the one selected node, which a link then covers whole. */
  #linkHost() {
    let host = this.#editor.activeHost;
    if (host)
      return host;
    let nodes = this.#editor.selectedNodes();
    if (nodes.length != 1 || nodes[0].locked)
      return null;
    let primary = nodes[0].primaryHost;
    return primary && primary.rich.length > 0 ? primary : null;
  }
  /** The extent of the link around the caret, or null. */
  #linkRange(host, offset) {
    let rich = host.rich;
    let style = rich.styleAt(offset > 0 && (offset == rich.length || rich.styleAt(offset).linkURL.length == 0) ? offset - 1 : offset);
    if (rich.length == 0 || style.linkURL.length == 0)
      return null;
    let url = style.linkURL;
    let start = offset;
    let end = offset;
    while (start > 0 && rich.styleAt(start - 1).linkURL == url)
      start--;
    while (end < rich.length && rich.styleAt(end).linkURL == url)
      end++;
    return start < end ? { start, end } : null;
  }
  /** Shows the link dialog for the selection, adding, changing or removing its link. */
  async editLink() {
    if (!this.canEditLink)
      return;
    let host = this.#linkHost();
    let editing = host === this.#editor.activeHost;
    let selection = editing ? host.selection() : { start: 0, end: host.rich.length };
    if (!selection)
      return;
    let range = selection.start == selection.end ? this.#linkRange(host, selection.start) : selection;
    let style = range ? host.rich.styleAt(range.start) : new TextStyle();
    let strings = this.#editor.strings;
    let values = await this.#editor.prompt(strings.TextHyperlinkCaption, [
      { name: "url", label: strings.TextHyperlinkDialogPrompt, value: style.linkURL, type: "url", placeholder: "https://" },
      { name: "title", label: strings.TextLinkTitleCaption, value: style.linkTitle },
      { name: "newWindow", label: strings.TextLinkTargetCaption, value: style.linkTarget == "_blank", type: "checkbox" }
    ]);
    if (!values) {
      if (editing)
        host.select(selection.start, selection.end);
      return;
    }
    let url = String(values.url).trim();
    this.#editor.history.checkpoint();
    if (!range) {
      if (url.length == 0) {
        host.select(selection.start, selection.end);
        return;
      }
      let insertStyle = host.rich.insertionStyleAt(selection.start);
      host.rich.insert(selection.start, url, insertStyle);
      range = { start: selection.start, end: selection.start + url.length };
    }
    host.rich.applyStyle(range.start, range.end, (item) => {
      item.linkURL = url;
      item.linkTitle = url.length > 0 ? String(values.title) : "";
      item.linkTarget = url.length > 0 && values.newWindow ? "_blank" : "";
    });
    host.render();
    if (editing)
      host.select(range.end);
    host.node.textChanged(host);
    host.node.changed();
  }
  removeLink() {
    let host = this.#editor.activeHost;
    if (!host)
      return;
    let selection = host.selection();
    if (!selection)
      return;
    let range = selection.start == selection.end ? this.#linkRange(host, selection.start) : selection;
    if (!range)
      return;
    this.#editor.history.checkpoint();
    host.rich.applyStyle(range.start, range.end, (item) => {
      item.linkURL = "";
      item.linkTitle = "";
      item.linkTarget = "";
    });
    host.render();
    host.select(selection.start, selection.end);
    host.node.changed();
  }
};

// search.ts
var FindResult = class {
  node;
  hostIndex;
  start;
  length;
  constructor(node, hostIndex, start, length) {
    this.node = node;
    this.hostIndex = hostIndex;
    this.start = start;
    this.length = length;
  }
  get host() {
    return this.node.hosts()[this.hostIndex] || null;
  }
  get text() {
    let host = this.host;
    return host ? host.rich.text.substring(this.start, this.start + this.length) : "";
  }
};
var Search = class extends EventTarget {
  #editor;
  #results = [];
  #currentIndex = -1;
  #panel = null;
  #findInput = null;
  #replaceInput = null;
  #status = null;
  query = "";
  replacement = "";
  caseSensitive = false;
  wholeWord = false;
  useRegEx = false;
  patternError = "";
  constructor(editor) {
    super();
    this.#editor = editor;
  }
  get owner() {
    return this.#editor;
  }
  get matchCount() {
    return this.#results.length;
  }
  get currentIndex() {
    return this.#currentIndex;
  }
  get current() {
    return this.#results[this.#currentIndex] || null;
  }
  get visible() {
    return this.#panel !== null && !this.#panel.classList.contains("d-none");
  }
  #pattern(query) {
    this.patternError = "";
    if (query.length == 0)
      return null;
    let source = this.useRegEx ? query : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (this.wholeWord)
      source = `(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])`;
    try {
      return new RegExp(source, this.caseSensitive ? "gu" : "giu");
    } catch (error) {
      this.patternError = String(error && error.message ? error.message : error);
      return null;
    }
  }
  /** Finds every match of query, or of the current query. */
  findAll(query) {
    if (query !== void 0)
      this.query = query;
    this.#results = [];
    let pattern = this.#pattern(this.query);
    if (pattern) {
      this.#editor.allNodes().forEach((node) => {
        node.hosts().forEach((host) => {
          pattern.lastIndex = 0;
          let text = host.rich.text;
          let match;
          while ((match = pattern.exec(text)) !== null) {
            if (match[0].length == 0) {
              pattern.lastIndex++;
              continue;
            }
            this.#results.push(new FindResult(node, host.index, match.index, match[0].length));
          }
        });
      });
    }
    this.#currentIndex = Math.min(this.#currentIndex, this.#results.length - 1);
    this.#highlight();
    this.#updateStatus();
    return this.#results.slice();
  }
  /** Finds the first match at or after the caret and selects it. */
  find(query) {
    this.findAll(query);
    if (this.#results.length == 0)
      return null;
    let order = this.#editor.allNodes();
    let host = this.#editor.activeHost;
    let caretNode = host ? order.indexOf(host.node) : -1;
    let caretOffset = host && host.selection() ? host.selection().start : 0;
    let index = this.#results.findIndex((result) => {
      let nodeIndex = order.indexOf(result.node);
      if (nodeIndex != caretNode)
        return nodeIndex > caretNode;
      if (result.hostIndex != host.index)
        return result.hostIndex > host.index;
      return result.start >= caretOffset;
    });
    this.#currentIndex = index < 0 ? 0 : index;
    this.selectResult(this.#results[this.#currentIndex]);
    return this.current;
  }
  findNext() {
    if (this.#results.length == 0)
      this.findAll();
    if (this.#results.length == 0)
      return null;
    this.#currentIndex = (this.#currentIndex + 1) % this.#results.length;
    this.selectResult(this.#results[this.#currentIndex]);
    return this.current;
  }
  findPrevious() {
    if (this.#results.length == 0)
      this.findAll();
    if (this.#results.length == 0)
      return null;
    this.#currentIndex = this.#currentIndex <= 0 ? this.#results.length - 1 : this.#currentIndex - 1;
    this.selectResult(this.#results[this.#currentIndex]);
    return this.current;
  }
  selectResult(result) {
    if (!result)
      return;
    let index = this.#results.indexOf(result);
    if (index >= 0)
      this.#currentIndex = index;
    let host = result.host;
    if (!host)
      return;
    this.#editor.revealNode(result.node);
    if (this.visible) {
      this.#highlight();
      let position = host.positionOf(result.start);
      let range = document.createRange();
      range.setStart(position.node, position.offset);
      let rect = range.getBoundingClientRect();
      let element = position.node instanceof HTMLElement ? position.node : position.node.parentElement;
      if (element)
        element.scrollIntoView({ block: rect.height > 0 ? "nearest" : "center" });
    } else {
      host.select(result.start, result.start + result.length);
      host.element.scrollIntoView({ block: "nearest" });
    }
    this.#updateStatus();
  }
  #replacementFor(result, replacement) {
    if (!this.useRegEx)
      return replacement;
    let pattern = this.#pattern(this.query);
    if (!pattern)
      return replacement;
    return result.text.replace(new RegExp(pattern.source, pattern.flags.replace("g", "")), replacement);
  }
  /** Replaces a match, or the current match. Returns true when it replaced text. */
  replace(resultOrReplacement, replacement) {
    let result = resultOrReplacement instanceof FindResult ? resultOrReplacement : this.current;
    let value = typeof resultOrReplacement == "string" ? resultOrReplacement : replacement !== void 0 ? replacement : this.replacement;
    if (!result || this.#editor.readOnly)
      return false;
    let host = result.host;
    if (!host)
      return false;
    this.#editor.history.checkpoint();
    let text = this.#replacementFor(result, value);
    this.#replaceIn(host, result, text);
    host.render();
    host.node.textChanged(host);
    host.node.changed();
    let index = this.#currentIndex;
    let end = result.start + text.length;
    this.findAll();
    let results = this.#results;
    if (results.length > 0) {
      let next = -1;
      let seenHost = false;
      for (let position = 0; position < results.length && next < 0; position++) {
        if (results[position].host === host) {
          seenHost = true;
          if (results[position].start >= end)
            next = position;
        } else if (seenHost) {
          next = position;
        }
      }
      if (next < 0)
        next = seenHost || index >= results.length ? 0 : index;
      this.#currentIndex = next;
      this.selectResult(results[next]);
    }
    return true;
  }
  #replaceIn(host, result, value) {
    let style = host.rich.styleAt(result.start).clone();
    host.rich.remove(result.start, result.start + result.length);
    host.rich.insert(result.start, value, style);
  }
  /** Replaces every match. Returns the number replaced. */
  replaceAll(queryOrReplacement, replacement) {
    if (replacement !== void 0) {
      this.query = queryOrReplacement;
    } else if (queryOrReplacement !== void 0) {
      replacement = queryOrReplacement;
    }
    let value = replacement !== void 0 ? replacement : this.replacement;
    let results = this.findAll();
    if (results.length == 0 || this.#editor.readOnly)
      return 0;
    this.#editor.history.checkpoint();
    let changed = [];
    for (let index = results.length - 1; index >= 0; index--) {
      let result = results[index];
      let host = result.host;
      if (!host)
        continue;
      this.#replaceIn(host, result, this.#replacementFor(result, value));
      if (changed.indexOf(host) < 0)
        changed.push(host);
    }
    changed.forEach((host) => {
      host.render();
      host.node.textChanged(host);
      host.node.changed();
    });
    this.findAll();
    return results.length;
  }
  #highlight() {
    let registry = typeof CSS !== "undefined" ? CSS.highlights : null;
    if (!registry || typeof window.Highlight === "undefined")
      return;
    let all = [];
    let current = [];
    if (this.visible) {
      this.#results.forEach((result, index) => {
        let host = result.host;
        if (!host || !host.element.isConnected)
          return;
        let start = host.positionOf(result.start);
        let end = host.positionOf(result.start + result.length);
        let range = document.createRange();
        try {
          range.setStart(start.node, start.offset);
          range.setEnd(end.node, end.offset);
        } catch {
          return;
        }
        ;
        (index == this.#currentIndex ? current : all).push(range);
      });
    }
    registry.set("scv-search", new window.Highlight(...all));
    registry.set("scv-search-current", new window.Highlight(...current));
  }
  /** Shows the search bar. */
  show(replace = false) {
    if (!this.#panel)
      this.#buildPanel();
    this.#panel.classList.remove("d-none");
    this.#panel.classList.toggle("scv-search-replacing", replace || this.#panel.classList.contains("scv-search-replacing"));
    let selected = this.#editor.selectedText();
    if (selected.length > 0 && selected.indexOf("\n") < 0) {
      this.#findInput.value = selected;
      this.query = selected;
    }
    this.#findInput.focus();
    this.#findInput.select();
    this.findAll();
  }
  close() {
    if (!this.#panel)
      return;
    this.#panel.classList.add("d-none");
    this.#highlight();
    let current = this.current;
    if (current && current.host) {
      current.host.select(current.start, current.start + current.length);
    }
  }
  #buildPanel() {
    let strings = this.#editor.strings;
    let panel = Utilities.element("div", "scv-search d-none");
    let row = Utilities.element("div", "scv-search-row");
    let toggle = Utilities.element("button", "btn btn-sm btn-link scv-search-toggle", { type: "button", title: strings.TextReplaceCaption });
    toggle.innerHTML = `<i class="bi bi-chevron-right"></i>`;
    toggle.addEventListener("click", () => panel.classList.toggle("scv-search-replacing"));
    row.append(toggle);
    let find = Utilities.element("input", "form-control form-control-sm", { type: "search", placeholder: strings.TextFindHint, "aria-label": strings.TextFindHint });
    find.addEventListener("input", () => {
      this.query = find.value;
      this.#currentIndex = -1;
      this.findAll();
      if (this.#results.length > 0)
        this.findNext();
    });
    find.addEventListener("keydown", (event) => {
      if (event.key == "Enter") {
        event.preventDefault();
        event.shiftKey ? this.findPrevious() : this.findNext();
      } else if (event.key == "Escape") {
        event.preventDefault();
        this.close();
      }
    });
    row.append(find);
    this.#findInput = find;
    let option = (icon, title, read, write) => {
      let button = Utilities.element("button", "btn btn-sm scv-search-option", { type: "button", title, "aria-pressed": "false" });
      button.innerHTML = icon;
      button.addEventListener("click", () => {
        write(!read());
        button.classList.toggle("active", read());
        button.setAttribute("aria-pressed", read() ? "true" : "false");
        this.findAll();
      });
      return button;
    };
    row.append(option("Aa", strings.TextMatchCaseCaption, () => this.caseSensitive, (value) => this.caseSensitive = value));
    row.append(option(`<span class="text-decoration-underline">ab</span>`, strings.TextWholeWordCaption, () => this.wholeWord, (value) => this.wholeWord = value));
    row.append(option(".*", strings.TextRegularExpressionCaption, () => this.useRegEx, (value) => this.useRegEx = value));
    this.#status = Utilities.element("span", "scv-search-status small text-body-secondary");
    row.append(this.#status);
    let previous = Utilities.element("button", "btn btn-sm", { type: "button", title: strings.TextFindPreviousCaption });
    previous.innerHTML = `<i class="bi bi-arrow-up"></i>`;
    previous.addEventListener("click", () => this.findPrevious());
    let next = Utilities.element("button", "btn btn-sm", { type: "button", title: strings.TextFindNextCaption });
    next.innerHTML = `<i class="bi bi-arrow-down"></i>`;
    next.addEventListener("click", () => this.findNext());
    let close = Utilities.element("button", "btn-close btn-sm ms-1", { type: "button", "aria-label": strings.TextDoneCaption });
    close.addEventListener("click", () => this.close());
    row.append(previous, next, close);
    panel.append(row);
    let replaceRow = Utilities.element("div", "scv-search-row scv-search-replace");
    let replace = Utilities.element("input", "form-control form-control-sm", { type: "text", placeholder: strings.TextReplaceHint, "aria-label": strings.TextReplaceHint });
    replace.addEventListener("input", () => this.replacement = replace.value);
    replace.addEventListener("keydown", (event) => {
      if (event.key == "Enter") {
        event.preventDefault();
        this.replace();
      } else if (event.key == "Escape") {
        event.preventDefault();
        this.close();
      }
    });
    this.#replaceInput = replace;
    let replaceOne = Utilities.element("button", "btn btn-sm btn-outline-secondary", { type: "button" });
    replaceOne.textContent = strings.TextReplaceCaption;
    replaceOne.addEventListener("click", () => this.replace());
    let replaceAll = Utilities.element("button", "btn btn-sm btn-outline-secondary", { type: "button" });
    replaceAll.textContent = strings.TextReplaceAllCaption;
    replaceAll.addEventListener("click", () => this.replaceAll());
    replaceRow.append(replace, replaceOne, replaceAll);
    panel.append(replaceRow);
    this.#panel = panel;
    this.#editor.searchContainer.append(panel);
  }
  #updateStatus() {
    if (!this.#status)
      return;
    let strings = this.#editor.strings;
    if (this.patternError.length > 0) {
      this.#status.textContent = strings.TextNoMatchesCaption;
      this.#status.title = this.patternError;
    } else if (this.query.length == 0) {
      this.#status.textContent = "";
    } else if (this.#results.length == 0) {
      this.#status.textContent = strings.TextNoMatchesCaption;
    } else if (this.#currentIndex >= 0) {
      this.#status.textContent = Utilities.format(strings.TextMatchPositionFormat, { index: this.#currentIndex + 1, count: this.#results.length });
    } else {
      this.#status.textContent = Utilities.format(strings.TextMatchCountFormat, { count: this.#results.length });
    }
    this.dispatchEvent(new Event("changed"));
    if (this.#replaceInput)
      this.#replaceInput.value = this.replacement;
  }
};

// toolbarview.ts
var ToolbarView = class {
  /**
   * Creates the element for an item. activate is called with the item, and with the
   * chosen menu item for menus and color items (a color item's choice carries the
   * color, or null for Default, in its value).
   */
  static buildItem(item, displayMode, strings, popupContainer, prepareMenu, activate) {
    if (item.kind == 3 /* separator */) {
      let separator = Utilities.element("div", "scv-toolbar-separator", { role: "separator" });
      item.element = separator;
      return separator;
    }
    if (item.kind == 4 /* flexibleSpace */) {
      let space = Utilities.element("div", "scv-toolbar-space");
      item.element = space;
      return space;
    }
    let button = Utilities.element("button", "btn btn-sm scv-toolbar-button", { type: "button", title: item.tooltip, "aria-label": item.tooltip || item.caption });
    button.dataset.identifier = item.identifier;
    let showIcon = item.icon.length > 0 && displayMode != 2 /* textOnly */;
    let showCaption = item.alwaysShowCaption || displayMode != 0 /* iconOnly */ || item.icon.length == 0;
    if (showIcon)
      button.append(Utilities.element("i", `${item.icon} scv-toolbar-icon`));
    if (showCaption) {
      let caption = Utilities.element("span", "scv-toolbar-caption");
      caption.textContent = item.caption;
      button.append(caption);
    }
    if (item.kind == 2 /* menu */ || item.kind == 5 /* color */) {
      button.classList.add("scv-toolbar-menu");
      button.setAttribute("aria-haspopup", "true");
      button.append(Utilities.element("i", "bi bi-chevron-down scv-toolbar-chevron"));
    }
    if (item.kind == 5 /* color */) {
      let swatch = Utilities.element("span", "scv-toolbar-swatch");
      button.append(swatch);
    }
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (button.disabled)
        return;
      if (item.kind == 2 /* menu */) {
        if (Popup2.current && Popup2.current.element.dataset.owner == item.identifier) {
          Popup2.closeAll();
          return;
        }
        prepareMenu(item);
        if (item.makePopup) {
          let popup = item.makePopup((menuItem) => activate(item, menuItem));
          popup.element.dataset.owner = item.identifier;
          popup.show(button, popupContainer);
          return;
        }
        let menu = new PopupMenu(item.menuItems, (menuItem) => activate(item, menuItem));
        menu.element.dataset.owner = item.identifier;
        menu.show(button, popupContainer);
      } else if (item.kind == 5 /* color */) {
        let palette = new ColorPalette(strings, (color) => {
          let menuItem = new ToolbarMenuItem(color ? Colors.toHex(color) : "default", "");
          menuItem.value = color;
          activate(item, menuItem);
        });
        palette.element.dataset.owner = item.identifier;
        palette.show(button, popupContainer);
      } else {
        activate(item, null);
      }
    });
    item.element = button;
    return button;
  }
};

// exporters.ts
var Stylesheet8 = class _Stylesheet {
  #selectors = [];
  #rules = /* @__PURE__ */ new Map();
  #atRules = [];
  /** Adds the rules in CSS text. Comments are dropped; at-rules are kept as written. */
  addCSS(css) {
    let text = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
    let index = 0;
    while (index < text.length) {
      let open = text.indexOf("{", index);
      if (open < 0)
        break;
      let selector = text.substring(index, open).trim();
      let depth = 1;
      let cursor = open + 1;
      while (cursor < text.length && depth > 0) {
        if (text[cursor] == "{")
          depth++;
        if (text[cursor] == "}")
          depth--;
        cursor++;
      }
      let body = text.substring(open + 1, cursor - 1);
      if (selector.startsWith("@")) {
        this.#atRules.push(`${selector} {${body}}`);
      } else if (selector.length > 0) {
        this.addRule(selector, body);
      }
      index = cursor;
    }
  }
  /** Adds declarations such as "color: red; margin: 0" to the rule for a selector. */
  addRule(selector, declarations) {
    selector = _Stylesheet.#normalize(selector);
    if (selector.length == 0)
      return;
    if (!this.#rules.has(selector)) {
      this.#rules.set(selector, []);
      this.#selectors.push(selector);
    }
    String(declarations || "").split(";").forEach((declaration) => {
      let colon = declaration.indexOf(":");
      if (colon <= 0)
        return;
      let name = declaration.substring(0, colon).trim().toLowerCase();
      let value = declaration.substring(colon + 1).trim();
      if (name.length > 0 && value.length > 0)
        this.setProperty(selector, name, value);
    });
  }
  hasRule(selector) {
    return this.#rules.has(_Stylesheet.#normalize(selector));
  }
  /** The value of a property in a selector's rule, or "" when it isn't set. */
  propertyValue(selector, propertyName) {
    let rule = this.#rules.get(_Stylesheet.#normalize(selector));
    let entry = rule ? rule.find(([name]) => name == propertyName.trim().toLowerCase()) : null;
    return entry ? entry[1] : "";
  }
  get ruleCount() {
    return this.#selectors.length;
  }
  selectorAt(index) {
    return this.#selectors[index] || "";
  }
  /** Sets a property in a selector's rule. A property already set keeps its position. */
  setProperty(selector, propertyName, value) {
    selector = _Stylesheet.#normalize(selector);
    if (selector.length == 0)
      return;
    if (!this.#rules.has(selector)) {
      this.#rules.set(selector, []);
      this.#selectors.push(selector);
    }
    let rule = this.#rules.get(selector);
    let name = propertyName.trim().toLowerCase();
    let existing = rule.find((entry) => entry[0] == name);
    if (existing) {
      existing[1] = value.trim();
    } else {
      rule.push([name, value.trim()]);
    }
  }
  /** The rules as CSS, one declaration per line, in the order they were added, followed by at-rules. */
  toString() {
    let blocks = this.#selectors.map((selector) => `${selector} {
${this.#rules.get(selector).map(([name, value]) => `  ${name}: ${value};`).join("\n")}
}`);
    return blocks.concat(this.#atRules).join("\n");
  }
  /** Collapses whitespace and writes selector lists as "a, b", so equivalent selectors share a rule. */
  static #normalize(selector) {
    return String(selector || "").replace(/\s+/g, " ").split(",").map((part) => part.trim()).filter((part) => part.length > 0).join(", ");
  }
};
var ExportFormats = /* @__PURE__ */ ((ExportFormats2) => {
  ExportFormats2[ExportFormats2["custom"] = 0] = "custom";
  ExportFormats2[ExportFormats2["html"] = 1] = "html";
  ExportFormats2[ExportFormats2["json"] = 2] = "json";
  ExportFormats2[ExportFormats2["markdown"] = 3] = "markdown";
  ExportFormats2[ExportFormats2["plainText"] = 4] = "plainText";
  return ExportFormats2;
})(ExportFormats || {});
var Exporter = class _Exporter {
  identifier;
  format;
  fileExtension = "txt";
  mimeType = "text/plain";
  constructor(identifier, format = 0 /* custom */) {
    this.identifier = identifier.trim();
    this.format = format;
    switch (format) {
      case 1 /* html */:
        this.fileExtension = "html";
        this.mimeType = "text/html";
        break;
      case 2 /* json */:
        this.fileExtension = "json";
        this.mimeType = "application/json";
        break;
      case 3 /* markdown */:
        this.fileExtension = "md";
        this.mimeType = "text/markdown";
        break;
    }
  }
  export(editor) {
    if (!editor)
      return "";
    switch (this.format) {
      case 1 /* html */:
        return editor.toHTML(true);
      case 2 /* json */:
        return editor.toJSON();
      case 3 /* markdown */:
        return editor.toMarkdown();
      case 4 /* plainText */:
        return editor.toPlainText();
    }
    return "";
  }
  /**
   * The export as a file's contents. Formats that make binary files, such as Word documents,
   * override this rather than export; text formats get their text.
   */
  async exportBlob(editor) {
    return new Blob([this.export(editor)], { type: `${this.mimeType};charset=utf-8` });
  }
  /** Offers the export to the user as a download named fileName plus the extension. */
  exportToFile(editor, fileName = "document") {
    if (typeof document == "undefined")
      return false;
    if (this.exportBlob === _Exporter.prototype.exportBlob) {
      _Exporter.download(new Blob([this.export(editor)], { type: `${this.mimeType};charset=utf-8` }), this.fileExtension.length > 0 ? `${fileName}.${this.fileExtension}` : fileName);
      return true;
    }
    this.exportBlob(editor).then((blob) => _Exporter.download(blob, this.fileExtension.length > 0 ? `${fileName}.${this.fileExtension}` : fileName), (error) => {
      if (editor && typeof editor.showMessage == "function")
        editor.showMessage(String(error && error.message || error), "danger");
    });
    return true;
  }
  /** Saves a file through the browser. */
  static download(blob, fileName) {
    if (typeof document == "undefined")
      return;
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
};
var Exporters = class {
  #owner;
  #items = [];
  constructor(owner) {
    this.#owner = owner;
  }
  get owner() {
    return this.#owner;
  }
  #indexOfIdentifier(identifier) {
    let key = String(identifier || "").trim().toLowerCase();
    return this.#items.findIndex((item) => item.identifier.toLowerCase() == key);
  }
  add(item) {
    if (!item)
      return;
    let existing = this.#indexOfIdentifier(item.identifier);
    if (existing >= 0) {
      this.#items[existing] = item;
    } else {
      this.#items.push(item);
    }
  }
  addAt(index, item) {
    if (!item)
      return;
    let existing = this.#indexOfIdentifier(item.identifier);
    if (existing >= 0)
      this.#items.splice(existing, 1);
    this.#items.splice(Utilities.clamp(index, 0, this.#items.length), 0, item);
  }
  indexOf(item) {
    return this.#items.indexOf(item);
  }
  item(identifier) {
    let index = this.#indexOfIdentifier(identifier);
    return index < 0 ? null : this.#items[index];
  }
  itemAt(index) {
    return this.#items[index] || null;
  }
  items() {
    return this.#items.slice();
  }
  get lastIndex() {
    return this.#items.length - 1;
  }
  remove(item) {
    this.removeAt(typeof item == "string" ? this.#indexOfIdentifier(item) : this.#items.indexOf(item));
  }
  removeAt(index) {
    if (index >= 0 && index < this.#items.length)
      this.#items.splice(index, 1);
  }
  removeAll() {
    this.#items = [];
  }
};
var NotificationTypes = /* @__PURE__ */ ((NotificationTypes2) => {
  NotificationTypes2[NotificationTypes2["info"] = 0] = "info";
  NotificationTypes2[NotificationTypes2["success"] = 1] = "success";
  NotificationTypes2[NotificationTypes2["warning"] = 2] = "warning";
  NotificationTypes2[NotificationTypes2["danger"] = 3] = "danger";
  return NotificationTypes2;
})(NotificationTypes || {});
var Notification = class {
  message;
  type;
  title;
  duration = 15;
  /** @internal The element showing it, while it is shown. */
  element = null;
  constructor(message, type = 0 /* info */, title = "") {
    this.message = message;
    this.type = type;
    this.title = title;
  }
  /** The Bootstrap color name for the type. */
  get indicator() {
    return ["info", "success", "warning", "danger"][this.type] || "info";
  }
  static typeFor(indicator) {
    let index = ["info", "success", "warning", "danger"].indexOf(indicator);
    return index < 0 ? 0 /* info */ : index;
  }
};

// editor.ts
var ValidationSeverities = /* @__PURE__ */ ((ValidationSeverities2) => {
  ValidationSeverities2[ValidationSeverities2["warning"] = 0] = "warning";
  ValidationSeverities2[ValidationSeverities2["error"] = 1] = "error";
  return ValidationSeverities2;
})(ValidationSeverities || {});
var ValidationIssue = class {
  severity;
  message;
  constructor(severity, message) {
    this.severity = severity;
    this.message = message;
  }
};
var ClipboardType = "application/x-scriviamo";
var Editor2 = class _Editor extends EventTarget {
  static #nodeTypeRegistry = [];
  static #extensions = [];
  static #panels = [];
  /**
   * Registers a node type for every editor created afterwards. order places it in
   * the insertion and block type menus; the built-in types use multiples of 10.
   * A type with the same identifier is replaced.
   */
  static registerNodeType(type, order = 1e3) {
    let list = _Editor.#nodeTypeRegistry.filter((entry) => entry.type.identifier != type.identifier);
    list.push({ type, order });
    list.sort((a, b) => a.order - b.order);
    _Editor.#nodeTypeRegistry = list;
  }
  /** The node types new editors start with, in menu order. */
  static registeredNodeTypes() {
    return _Editor.#nodeTypeRegistry.map((entry) => entry.type);
  }
  /** Registers an extension for every editor created afterwards. */
  static registerExtension(extension) {
    if (_Editor.#extensions.indexOf(extension) < 0)
      _Editor.#extensions.push(extension);
  }
  static extensions() {
    return _Editor.#extensions.slice();
  }
  /** Registers a panel about the document, such as an outline; one with the same identifier is replaced. */
  static registerPanel(panel) {
    _Editor.#panels = _Editor.#panels.filter((item) => item.identifier != panel.identifier).concat([panel]);
  }
  /** The registered panels, in the order they were registered. */
  static panels() {
    return _Editor.#panels.slice();
  }
  /** A static member a node type declares itself, rather than inherits from the type it extends. */
  static ownStatic(type, name) {
    return Object.prototype.hasOwnProperty.call(type, name) ? type[name] : void 0;
  }
  id = Utilities.uuid();
  documentID = "";
  strings = new Strings();
  nodeTypes;
  toolbarItems = new ToolbarItems();
  history;
  formatting;
  selection;
  search;
  statistics;
  importer;
  /** Text suggestion providers, asked in order while typing. Starts with an emoji provider, "emoji". */
  suggestionProviders;
  lastValidationIssues = [];
  /** The export formats offered by export and exportToFile. */
  exporters;
  /** The document's discussion threads. */
  annotations;
  /** Saves the document after changes, through the application's save function. */
  autosave;
  /** The bar under the document; shown while statusBarVisible is true. */
  statusBar;
  /**
   * The toolbar's Insert menu shows a search field once it offers at least this many block
   * types. 0 always shows it; Infinity never does.
   */
  insertMenuSearchThreshold = 5;
  /**
   * Uploads files the user adds (pictures, audio, video and backgrounds) and returns the address
   * each is shown from. Without one, files are embedded in the document as data.
   */
  fileUploader = null;
  /** The font names and sizes the toolbar offers, and the character formats available. A node's own fontOptions replace these while it is formatted. */
  fontOptions = new FontOptions();
  /** Font families offered by the Font menu. "System" is the platform's interface font. */
  get fontNames() {
    return this.fontOptions.fontNames();
  }
  set fontNames(value) {
    this.fontOptions.setFontNames(value || []);
  }
  /** Font sizes offered by the Size menu, after Default. */
  get fontSizes() {
    return [0].concat(this.fontOptions.sizes());
  }
  set fontSizes(value) {
    this.fontOptions.setSizes(value || []);
  }
  /** The font options in effect: those of the node being formatted, or the editor's. */
  activeFontOptions() {
    let node = this.#activeHost ? this.#activeHost.node : this.selectedNode;
    return node && node.fontOptions ? node.fontOptions : this.fontOptions;
  }
  #parentElement;
  #element = null;
  #toolbarElement = null;
  #searchContainer = null;
  #statusBarElement = null;
  #statusBarVisible = false;
  #scrollerElement = null;
  #pageElement = null;
  #documentElement = null;
  #nodeToolbarElement = null;
  #gutterElement = null;
  #dropIndicator = null;
  #messagesElement = null;
  #disabledLayer = null;
  #nodes = [];
  #listElements = /* @__PURE__ */ new WeakMap();
  #listOwners = /* @__PURE__ */ new WeakMap();
  #selected = [];
  #activeHost = null;
  #editingNode = null;
  #pending = null;
  #composing = false;
  #updateDepth = 0;
  #deferredChange = false;
  #isChanged = false;
  #allowAnnotations = true;
  #annotationLayer = null;
  #annotationTimer = 0;
  #hoveredAnnotationLine = "";
  #annotationRanges = [];
  #tocTimer = 0;
  #stateFrame = 0;
  #hoverNode = null;
  #dragNode = null;
  #dragNodes = [];
  #anchorNode = null;
  #dropTarget = null;
  #suggestionPopup = null;
  #suggestionState = null;
  #suggestionSerial = 0;
  #backgroundImage = new BackgroundImage();
  #fontName = "System";
  #fontSize = DefaultFontSize;
  #backgroundColor = Colors.make(255, 255, 255);
  #alignment = 1 /* leading */;
  #textAlignment = 1 /* leading */;
  #direction = 0 /* automatic */;
  #readOnly = false;
  #enabled = true;
  #toolbarVisible = true;
  #toolbarDisplayMode = 0 /* iconOnly */;
  #showContextualToolbars = true;
  #adaptiveHeight = false;
  #class = "";
  /** Shows the add and drag buttons beside the block under the pointer. */
  isHoverInsertionEnabled = true;
  /** Turns Markdown typed while editing into the formatting or block it describes. False types the characters as they are. */
  markdownShortcuts = true;
  // Not on a server, where there is nothing to observe.
  #heightObserver = typeof ResizeObserver == "undefined" ? null : new ResizeObserver(() => {
    if (this.#adaptiveHeight && this.#element)
      this.dispatchEvent(new CustomEvent("heightChanged", { detail: this.#element.offsetHeight }));
    this.#positionNodeToolbar();
    this.#scheduleAnnotationMarkers();
    this.#schedulePresence();
  });
  #selectionChangeHandler = () => this.#onSelectionChange();
  /**
   * Creates an editor in element. With null instead of an element, the editor is headless: it
   * draws nothing and needs no browser, but loads, changes and exports documents, such as for
   * rendering saved documents to HTML on a server.
   */
  constructor(element, options) {
    super();
    this.#parentElement = element;
    this.nodeTypes = new NodeTypes(this);
    this.history = new History(this);
    this.formatting = new Formatting(this);
    this.selection = new NodeSelection(this);
    this.search = new Search(this);
    this.statistics = new Statistics(this);
    this.importer = new HTMLImporter7(this);
    this.suggestionProviders = new SuggestionProviders(this);
    this.suggestionProviders.add(new Suggestions.EmojiProvider());
    this.annotations = new Annotations(this, this.#annotationHandler());
    this.autosave = new Autosave(this);
    this.statusBar = new StatusBar(this);
    this.exporters = new Exporters(this);
    this.exporters.add(new Exporter("html", 1 /* html */));
    this.exporters.add(new Exporter("json", 2 /* json */));
    this.exporters.add(new Exporter("markdown", 3 /* markdown */));
    this.exporters.add(new Exporter("text", 4 /* plainText */));
    _Editor.registeredNodeTypes().forEach((type) => this.nodeTypes.add(type));
    if (options && options.strings)
      this.strings.apply(options.strings);
    this.#buildDefaultToolbar();
    this.toolbarItems.addEventListener("changed", () => this.#renderToolbar());
    this.nodeTypes.addEventListener("changed", () => this.#renderToolbar());
    this.history.addEventListener("changed", () => this.updateToolbarState());
    this.#applyOptions(options, true);
    _Editor.#extensions.forEach((extension) => extension.install?.(this));
  }
  /**
   * Stores a file the user added and returns the address to show it from: the fileUploader's
   * result, or a data: URI when there's no uploader or it returns null. Rejects when the upload
   * fails or is aborted.
   */
  async storeFile(file, kind, node = null, progress, signal) {
    let uploader = this.fileUploader;
    if (!uploader)
      return MediaUI.readDataURI(file);
    let result = await uploader({
      file,
      name: typeof file.name == "string" ? file.name : "",
      type: file.type || "",
      kind,
      node,
      editor: this,
      progress: (fraction) => progress?.(Utilities.clamp(Number(fraction) || 0, 0, 1)),
      signal: signal || new AbortController().signal
    });
    if (signal && signal.aborted)
      throw new DOMException("The upload was cancelled.", "AbortError");
    if (result === null || result === void 0 || result === "")
      return MediaUI.readDataURI(file);
    if (typeof result != "string")
      throw new TypeError("The file uploader didn't return an address.");
    return result;
  }
  /**
   * A saved document (JSON, as a string or object) as HTML, without a page or a visible editor,
   * such as on a server. includeDocumentElements makes a whole page with its stylesheet. Import
   * the add-ons the document uses first.
   */
  static renderHTML(content, includeDocumentElements = false, includeAnnotations = false) {
    return new _Editor(null, { content }).toHTML(includeDocumentElements, includeAnnotations);
  }
  /** A saved document as Markdown, without a page or a visible editor. */
  static renderMarkdown(content) {
    return new _Editor(null, { content }).toMarkdown();
  }
  /** A saved document as plain text, without a page or a visible editor. */
  static renderPlainText(content) {
    return new _Editor(null, { content }).toPlainText();
  }
  /** Sets up autosave from a save function, a save function with settings, or null to turn it off. */
  updateAutosave(value) {
    if (value && typeof value == "object") {
      for (let name of ["delay", "maximumWait", "retryDelay"])
        if (typeof value[name] == "number")
          this.autosave[name] = value[name];
      if (typeof value.warnBeforeLeaving == "boolean")
        this.autosave.warnBeforeLeaving = value.warnBeforeLeaving;
      this.autosave.save = value.save;
    } else {
      this.autosave.save = typeof value == "function" ? value : null;
    }
  }
  updateOptions(options) {
    this.#applyOptions(options, false);
  }
  #applyOptions(options, constructing) {
    let defaults = {
      readOnly: false,
      toolbarVisible: true,
      toolbarDisplayMode: 0 /* iconOnly */,
      showContextualToolbars: true,
      isHoverInsertionEnabled: true,
      markdownShortcuts: true,
      allowAnnotations: true,
      adaptiveHeight: false,
      class: ""
    };
    let instanceOptions = { ...defaults, ...options };
    if (instanceOptions.strings && !constructing)
      this.localize(instanceOptions.strings);
    if (instanceOptions.fontName)
      this.#fontName = instanceOptions.fontName;
    if (instanceOptions.fontSize)
      this.#fontSize = instanceOptions.fontSize;
    this.#readOnly = instanceOptions.readOnly;
    this.#toolbarVisible = instanceOptions.toolbarVisible;
    this.#toolbarDisplayMode = instanceOptions.toolbarDisplayMode;
    this.#showContextualToolbars = instanceOptions.showContextualToolbars;
    this.isHoverInsertionEnabled = instanceOptions.isHoverInsertionEnabled;
    this.markdownShortcuts = instanceOptions.markdownShortcuts;
    this.#allowAnnotations = instanceOptions.allowAnnotations !== false;
    this.#adaptiveHeight = instanceOptions.adaptiveHeight;
    this.#class = instanceOptions.class;
    if (instanceOptions.statusBar !== void 0)
      this.#statusBarVisible = !!instanceOptions.statusBar;
    if (typeof instanceOptions.insertMenuSearchThreshold == "number")
      this.insertMenuSearchThreshold = instanceOptions.insertMenuSearchThreshold;
    if (instanceOptions.autosave)
      this.updateAutosave(instanceOptions.autosave);
    if (instanceOptions.fileUploader !== void 0)
      this.fileUploader = typeof instanceOptions.fileUploader == "function" ? instanceOptions.fileUploader : null;
    this.render();
    if (instanceOptions.content) {
      this.fromJSON(instanceOptions.content);
    } else if (instanceOptions.html) {
      this.fromHTML(instanceOptions.html);
    } else if (instanceOptions.markdown) {
      this.fromMarkdown(instanceOptions.markdown);
    }
  }
  // Properties
  get element() {
    return this.#element;
  }
  /** The element the search bar is placed in. */
  get searchContainer() {
    return this.#searchContainer;
  }
  get enabled() {
    return this.#enabled;
  }
  set enabled(value) {
    this.#enabled = value;
    if (this.#disabledLayer)
      this.#disabledLayer.classList.toggle("d-none", value);
  }
  get readOnly() {
    return this.#readOnly;
  }
  set readOnly(value) {
    if (this.#readOnly == value)
      return;
    this.#readOnly = value;
    this.dispatchEvent(new CustomEvent("readOnlyChanged", { detail: { readOnly: value } }));
    this.#element?.classList.toggle("scv-readonly", value);
    if (value)
      this.endEditing();
    this.allNodes().forEach((node) => node.hosts().forEach((host) => host.editable = this.isEditingNode(node)));
    this.#documentElement?.querySelectorAll(".scv-code-language").forEach((input) => input.readOnly = value);
    this.#updateEmptyDocument();
    this.#renderNodeToolbar();
    this.updateToolbarState();
  }
  get class() {
    return this.#class;
  }
  /** Shows the bar under the document, with word and character counts and the autosave state. */
  get statusBarVisible() {
    return this.#statusBarVisible;
  }
  set statusBarVisible(value) {
    value = !!value;
    if (this.#statusBarVisible == value)
      return;
    this.#statusBarVisible = value;
    this.#statusBarElement?.classList.toggle("d-none", !value);
    if (value)
      this.statusBar.update();
  }
  set class(value) {
    if (this.#element && this.#class.length > 0)
      this.#element.classList.remove(...this.#class.split(" ").filter((name) => name.length > 0));
    this.#class = value;
    if (this.#element && value.length > 0)
      this.#element.classList.add(...value.split(" ").filter((name) => name.length > 0));
  }
  get adaptiveHeight() {
    return this.#adaptiveHeight;
  }
  set adaptiveHeight(value) {
    this.#adaptiveHeight = value;
    this.#element?.classList.toggle("scv-adaptive", value);
  }
  get toolbarVisible() {
    return this.#toolbarVisible;
  }
  set toolbarVisible(value) {
    this.#toolbarVisible = value;
    this.#toolbarElement?.classList.toggle("d-none", !value);
  }
  get toolbarDisplayMode() {
    return this.#toolbarDisplayMode;
  }
  set toolbarDisplayMode(value) {
    this.#toolbarDisplayMode = value;
    this.#renderToolbar();
  }
  get showContextualToolbars() {
    return this.#showContextualToolbars;
  }
  set showContextualToolbars(value) {
    this.#showContextualToolbars = value;
    this.#renderNodeToolbar();
  }
  /** The document font. "System" uses the platform's interface font. */
  get fontName() {
    return this.#fontName;
  }
  set fontName(value) {
    this.#fontName = value || "System";
    this.#applyDocumentAppearance();
  }
  /** The document font size. Text whose size is Default (zero) uses it. */
  get fontSize() {
    return this.#fontSize;
  }
  set fontSize(value) {
    this.#fontSize = value > 0 ? value : DefaultFontSize;
    this.#applyDocumentAppearance();
  }
  /** The picture drawn behind the document. */
  get backgroundImage() {
    return this.#backgroundImage;
  }
  set backgroundImage(value) {
    this.#backgroundImage = value || new BackgroundImage();
    this.#applyDocumentAppearance();
  }
  /** The inspector's sections for the document, shown when no node is selected. */
  inspectorSections() {
    return InspectorDefaults.document(this);
  }
  get backgroundColor() {
    return Colors.clone(this.#backgroundColor);
  }
  set backgroundColor(value) {
    this.#backgroundColor = Colors.clone(value);
    this.#applyDocumentAppearance();
  }
  /** Where nodes narrower than the page sit when their alignment is Automatic. */
  get alignment() {
    return this.#alignment;
  }
  set alignment(value) {
    this.#alignment = value == 0 /* automatic */ ? 1 /* leading */ : value;
    this.renderDocument();
  }
  /** The alignment of text whose alignment is Automatic. */
  get textAlignment() {
    return this.#textAlignment;
  }
  set textAlignment(value) {
    this.#textAlignment = value == 0 /* automatic */ ? 1 /* leading */ : value;
    this.renderDocument();
  }
  get direction() {
    return this.#direction;
  }
  set direction(value) {
    this.#direction = value;
    this.#applyDocumentAppearance();
  }
  /** True when the document changed since it was loaded or isChanged was cleared. */
  get isChanged() {
    return this.#isChanged;
  }
  set isChanged(value) {
    this.#isChanged = value;
  }
  get isEditingText() {
    return this.#activeHost !== null;
  }
  /** The text being edited, if any. */
  get activeHost() {
    return this.#activeHost;
  }
  /** The primary selected node. */
  get selectedNode() {
    return this.#selected[this.#selected.length - 1] || null;
  }
  selectedNodes() {
    return this.#selected.slice();
  }
  // Rendering
  render() {
    if (!this.#parentElement)
      return;
    if (this.#element) {
      this.#heightObserver?.disconnect();
      document.removeEventListener("selectionchange", this.#selectionChangeHandler);
      this.#element.remove();
    }
    let root = Utilities.element("div", "scv-editor");
    root.id = this.id;
    if (this.#class.length > 0)
      root.classList.add(...this.#class.split(" ").filter((name) => name.length > 0));
    root.classList.toggle("scv-adaptive", this.#adaptiveHeight);
    root.classList.toggle("scv-readonly", this.#readOnly);
    this.#element = root;
    this.#toolbarElement = Utilities.element("div", "scv-toolbar", { role: "toolbar" });
    this.#toolbarElement.classList.toggle("d-none", !this.#toolbarVisible);
    this.#attachCustomizerTargets(this.#toolbarElement);
    this.#customizer = null;
    root.append(this.#toolbarElement);
    this.#searchContainer = Utilities.element("div", "scv-search-container");
    root.append(this.#searchContainer);
    this.#scrollerElement = Utilities.element("div", "scv-scroller");
    root.append(this.#scrollerElement);
    this.#scrollerElement.addEventListener("scroll", () => {
      this.#positionNodeToolbar();
      this.dispatchEvent(new CustomEvent("scrollChanged", { detail: { x: this.#scrollerElement.scrollLeft, y: this.#scrollerElement.scrollTop } }));
    });
    this.#pageElement = Utilities.element("div", "scv-page");
    this.#scrollerElement.append(this.#pageElement);
    this.#documentElement = Utilities.element("div", "scv-document");
    this.#pageElement.append(this.#documentElement);
    this.#gutterElement = Utilities.element("div", "scv-gutter d-none", { contenteditable: "false" });
    this.#pageElement.append(this.#gutterElement);
    this.#buildGutter();
    this.#nodeToolbarElement = Utilities.element("div", "scv-node-toolbar d-none", { role: "toolbar" });
    this.#pageElement.append(this.#nodeToolbarElement);
    this.#dropIndicator = Utilities.element("div", "scv-drop-indicator d-none");
    this.#pageElement.append(this.#dropIndicator);
    this.#annotationLayer = Utilities.element("div", "scv-annotation-layer", { contenteditable: "false" });
    this.#pageElement.append(this.#annotationLayer);
    this.#presenceLayer = Utilities.element("div", "scv-presence-layer", { contenteditable: "false", "aria-hidden": "true" });
    this.#pageElement.append(this.#presenceLayer);
    this.#statusBarElement = Utilities.element("div", "scv-statusbar", { role: "group", "aria-label": this.strings.TextStatusBarCaption });
    this.#statusBarElement.classList.toggle("d-none", !this.#statusBarVisible);
    root.append(this.#statusBarElement);
    this.statusBar.attach(this.#statusBarElement);
    this.#messagesElement = Utilities.element("div", "scv-messages");
    root.append(this.#messagesElement);
    this.#disabledLayer = Utilities.element("div", "scv-disabled-layer");
    this.#disabledLayer.classList.toggle("d-none", this.#enabled);
    root.append(this.#disabledLayer);
    this.#attachEvents();
    this.#parentElement.append(root);
    this.#heightObserver?.observe(root);
    document.addEventListener("selectionchange", this.#selectionChangeHandler);
    this.#renderToolbar();
    this.#applyDocumentAppearance();
    this.renderDocument();
  }
  /** Removes the editor from the page and releases its listeners. */
  destroy() {
    Popup2.closeAll();
    this.statusBar.detach();
    this.autosave.dispose();
    this.#heightObserver?.disconnect();
    if (typeof document != "undefined")
      document.removeEventListener("selectionchange", this.#selectionChangeHandler);
    if (this.#element)
      this.#element.remove();
    this.#element = null;
  }
  #applyDocumentAppearance() {
    let element = this.#documentElement;
    if (!element)
      return;
    element.style.fontFamily = Utilities.fontFamilyCSS(this.#fontName);
    element.style.fontSize = `${this.#fontSize}px`;
    let white = Colors.make(255, 255, 255);
    element.style.backgroundColor = Colors.equals(this.#backgroundColor, white) ? "" : Colors.toCSS(this.#backgroundColor);
    element.setAttribute("style", element.getAttribute("style").replace(/background-image[^;]*;?|background-size[^;]*;?|background-repeat[^;]*;?|background-position[^;]*;?/g, "") + (this.backgroundImage.isEmpty ? "" : ";" + this.backgroundImage.toCSS()));
    if (this.#direction == 2 /* rightToLeft */) {
      element.dir = "rtl";
    } else if (this.#direction == 1 /* leftToRight */) {
      element.dir = "ltr";
    } else {
      element.removeAttribute("dir");
    }
  }
  /** Rebuilds every node's DOM. */
  renderDocument() {
    if (!this.#documentElement)
      return;
    let state = this.captureSelection();
    this.#documentElement.textContent = "";
    this.mountChildren(this.#nodes, this.#documentElement, null);
    this.#applySelectionClasses();
    if (state && this.#documentElement.contains(document.activeElement))
      this.restoreSelection(state);
    this.#renderNodeToolbar();
    this.#schedulePresence();
  }
  /** Renders a list of nodes into a container element. Container nodes call this for their children. */
  mountChildren(list, container, owner) {
    this.#listElements.set(list, container);
    this.#listOwners.set(list, owner);
    container.classList.add("scv-children");
    container.textContent = "";
    list.forEach((child) => {
      child.parent = owner;
      container.append(this.renderNode(child));
    });
    container.classList.toggle("scv-children-empty", list.length == 0);
    if (container === this.#documentElement)
      this.#updateEmptyDocument();
  }
  /**
   * An empty document can take the keyboard focus, so a paragraph can be started from the
   * keyboard. Otherwise the document takes the focus only when it is selected by a click on
   * empty space, so shortcuts such as undo keep working.
   */
  #updateEmptyDocument() {
    let element = this.#documentElement;
    if (!element)
      return;
    let empty = this.#nodes.length == 0;
    element.classList.toggle("scv-children-empty", empty);
    element.tabIndex = empty && !this.#readOnly ? 0 : -1;
  }
  /** Builds a node's DOM for this editor. */
  renderNode(node) {
    node.editor = this;
    let element = node.render();
    element.tabIndex = -1;
    element.classList.toggle("scv-locked", node.locked);
    if (this.#selected.indexOf(node) >= 0)
      element.classList.add("scv-selected");
    node.hosts().forEach((host) => host.editable = this.isEditingNode(node));
    return element;
  }
  /** Rebuilds one node in place, keeping the caret in its text. */
  refreshNode(node) {
    let old = node.element;
    if (!old || !old.parentNode)
      return;
    let state = this.captureSelection();
    let keepFocus = old.contains(document.activeElement);
    let replacement = this.renderNode(node);
    old.replaceWith(replacement);
    if (keepFocus && state) {
      if (state.nodeId == node.nodeId || node.descendants().some((child) => child.nodeId == state.nodeId)) {
        this.restoreSelection(state);
      } else {
        replacement.focus({ preventScroll: true });
      }
    }
    this.#applySelectionClasses();
    this.#renderNodeToolbar();
  }
  /** Puts a list's nodes into its container in order, rendering new ones. */
  #syncList(list) {
    let container = this.#listElements.get(list);
    if (!container)
      return;
    let owner = this.#listOwners.get(list) || null;
    let expected = /* @__PURE__ */ new Set();
    list.forEach((child) => {
      child.parent = owner;
      child.editor = this;
      if (!child.element || child.element.parentElement !== container) {
        if (child.element)
          child.element.remove();
        this.renderNode(child);
      }
      expected.add(child.element);
    });
    Array.from(container.children).forEach((child) => {
      if (child.classList.contains("scv-node") && !expected.has(child))
        child.remove();
    });
    list.forEach((child) => container.append(child.element));
    container.classList.toggle("scv-children-empty", list.length == 0);
    if (container === this.#documentElement)
      this.#updateEmptyDocument();
  }
  // Document structure
  /** The root nodes. */
  nodes() {
    return this.#nodes.slice();
  }
  nodeAt(index) {
    return this.#nodes[index] || null;
  }
  get lastNodeIndex() {
    return this.#nodes.length - 1;
  }
  /** Every node, including those inside containers, in document order. */
  allNodes() {
    let result = [];
    this.#nodes.forEach((node) => {
      result.push(node);
      result.push(...node.descendants());
    });
    return result;
  }
  nodeWithID(identifier) {
    return this.allNodes().find((node) => node.nodeId == identifier) || null;
  }
  /** The list that holds node: the root list or a container's list. */
  listContaining(node) {
    if (this.#nodes.indexOf(node) >= 0)
      return this.#nodes;
    let owner = node.parent;
    if (owner) {
      let list = owner.childLists().find((candidate) => candidate.indexOf(node) >= 0);
      if (list)
        return list;
    }
    for (let candidate of this.allNodes()) {
      let list = candidate.childLists().find((items) => items.indexOf(node) >= 0);
      if (list)
        return list;
    }
    return null;
  }
  #ownerOf(list) {
    if (list === this.#nodes)
      return null;
    if (this.#listOwners.has(list))
      return this.#listOwners.get(list);
    return this.allNodes().find((node) => node.childLists().indexOf(list) >= 0) || null;
  }
  addNode(node) {
    this.insertNodes(this.#nodes, this.#nodes.length, [node], null);
  }
  insertNode(index, node) {
    this.insertNodes(this.#nodes, index, [node], null);
  }
  removeNodeAt(index) {
    let node = this.#nodes[index];
    if (node)
      this.removeNodes([node]);
  }
  removeNode(node) {
    this.removeNodes([node]);
  }
  removeAllNodes() {
    this.history.checkpoint();
    this.#nodes.splice(0, this.#nodes.length);
    this.#selected = [];
    this.#syncList(this.#nodes);
    this.#documentChanged(null);
  }
  /** Inserts nodes into a list at index. */
  insertNodes(list, index, nodes, owner) {
    if (nodes.length == 0)
      return;
    this.history.checkpoint();
    if (owner === void 0)
      owner = this.#ownerOf(list);
    nodes.forEach((node) => {
      node.editor = this;
      node.parent = owner;
    });
    list.splice(Utilities.clamp(index, 0, list.length), 0, ...nodes);
    if (this.#listElements.has(list)) {
      this.#syncList(list);
    } else if (owner) {
      owner.refresh();
    }
    this.recognizeSuggestions(nodes);
    this.#documentChanged(nodes[0]);
  }
  insertNodesAfter(reference, nodes) {
    let list = this.listContaining(reference) || this.#nodes;
    this.insertNodes(list, list.indexOf(reference) + 1, nodes, reference.parent);
  }
  insertNodesBefore(reference, nodes) {
    let list = this.listContaining(reference) || this.#nodes;
    this.insertNodes(list, Math.max(0, list.indexOf(reference)), nodes, reference.parent);
  }
  /** Replaces a node with other nodes. Passing the node itself among them keeps it. */
  replaceNode(node, replacements) {
    let list = this.listContaining(node);
    if (!list)
      return;
    this.history.checkpoint();
    let index = list.indexOf(node);
    replacements.forEach((replacement) => {
      replacement.editor = this;
      replacement.parent = node.parent;
    });
    list.splice(index, 1, ...replacements);
    if (replacements.indexOf(node) < 0)
      this.#selected = this.#selected.filter((item) => item !== node);
    if (replacements.indexOf(node) >= 0 && node.element) {
      let state = this.captureSelection();
      node.element.remove();
      node.element = null;
      this.#syncList(list);
      if (state)
        this.restoreSelection(state);
    } else {
      this.#syncList(list);
    }
    this.#documentChanged(replacements[0] || null);
  }
  /** Removes nodes. selectNext selects the node that takes their place. */
  removeNodes(nodes, selectNext = true) {
    let removable = nodes.filter((node) => !node.locked);
    if (removable.length == 0 || this.#readOnly)
      return;
    this.history.checkpoint();
    let focusTarget = null;
    removable.forEach((node) => {
      let list = this.listContaining(node);
      if (!list)
        return;
      let index = list.indexOf(node);
      focusTarget = list[index + 1] || list[index - 1] || node.parent;
      list.splice(index, 1);
      this.#syncList(list);
    });
    this.#selected = this.#selected.filter((node) => removable.indexOf(node) < 0);
    if (this.#editingNode && (removable.indexOf(this.#editingNode) >= 0 || removable.some((node) => node.descendants().indexOf(this.#editingNode) >= 0))) {
      this.#editingNode = null;
      this.#activeHost = null;
    }
    if (!selectNext) {
      this.selectNodes([]);
    } else if (focusTarget && removable.indexOf(focusTarget) < 0) {
      this.selectNode(focusTarget);
    }
    this.#documentChanged(null);
  }
  /** Moves a node up (negative) or down (positive) within its list. */
  moveNode(node, delta) {
    this.moveNodes([node], delta);
  }
  /**
   * Moves nodes up (negative) or down (positive) one place within their lists,
   * keeping their order. A group already at the edge of its list stays put. One undo step.
   */
  moveNodes(nodes, delta) {
    nodes = this.inDocumentOrder(nodes).filter((node) => !node.locked);
    if (nodes.length == 0 || this.#readOnly || delta == 0)
      return;
    let groups = /* @__PURE__ */ new Map();
    nodes.forEach((node) => {
      let list = this.listContaining(node);
      if (!list)
        return;
      if (!groups.has(list))
        groups.set(list, []);
      groups.get(list).push(node);
    });
    let movable = Array.from(groups.entries()).filter(([list, members]) => {
      let indexes = members.map((member) => list.indexOf(member));
      return delta < 0 ? Math.min(...indexes) > 0 : Math.max(...indexes) < list.length - 1;
    });
    if (movable.length == 0)
      return;
    this.history.checkpoint();
    let state = this.captureSelection();
    movable.forEach(([list, members]) => {
      let ordered = members.slice().sort((a, b) => (list.indexOf(a) - list.indexOf(b)) * (delta < 0 ? 1 : -1));
      ordered.forEach((member) => {
        let index = list.indexOf(member);
        let target = index + (delta < 0 ? -1 : 1);
        list.splice(index, 1);
        list.splice(target, 0, member);
      });
      this.#syncList(list);
    });
    if (state)
      this.restoreSelection(state);
    nodes[delta < 0 ? 0 : nodes.length - 1].element?.scrollIntoView({ block: "nearest" });
    this.#documentChanged(nodes[0]);
    this.#renderNodeToolbar();
  }
  /** Moves a node to a list position, such as after a drag. */
  moveNodeTo(node, list, index) {
    this.moveNodesTo([node], list, index);
  }
  /** Moves nodes, in document order, to a list position. One undo step. */
  moveNodesTo(nodes, list, index) {
    nodes = this.inDocumentOrder(nodes).filter((node) => !node.locked);
    if (nodes.length == 0 || this.#readOnly)
      return;
    if (nodes.some((node) => node.childLists().indexOf(list) >= 0 || node.descendants().some((child) => child.childLists().indexOf(list) >= 0)))
      return;
    nodes = nodes.filter((node) => !nodes.some((other) => other !== node && other.descendants().indexOf(node) >= 0));
    this.history.checkpoint();
    let touched = [list];
    nodes.forEach((node) => {
      let current = this.listContaining(node);
      if (!current)
        return;
      let currentIndex = current.indexOf(node);
      if (current === list && currentIndex < index)
        index--;
      current.splice(currentIndex, 1);
      if (touched.indexOf(current) < 0)
        touched.push(current);
    });
    index = Utilities.clamp(index, 0, list.length);
    list.splice(index, 0, ...nodes);
    let owner = this.#ownerOf(list);
    nodes.forEach((node) => {
      node.parent = owner;
      node.element?.remove();
      node.element = null;
    });
    touched.forEach((changed) => this.#syncList(changed));
    this.selectNodes(nodes);
    this.#documentChanged(nodes[0]);
  }
  /** Copies nodes, placing each copy after its original, and selects the copies. One undo step. */
  duplicateNodes(nodes) {
    nodes = this.inDocumentOrder(nodes).filter((node) => !node.locked);
    if (nodes.length == 0 || this.#readOnly)
      return;
    this.history.checkpoint();
    let copies = [];
    this.history.suspend(() => {
      nodes.slice().reverse().forEach((node) => {
        let copy = this.cloneNode(node);
        if (copy) {
          this.insertNodesAfter(node, [copy]);
          copies.unshift(copy);
        }
      });
    });
    if (copies.length > 0)
      this.selectNodes(copies);
  }
  /** Whether moveNodes would move any of nodes. */
  canMoveNodes(nodes, delta) {
    if (this.#readOnly)
      return false;
    return nodes.some((node) => {
      let list = this.listContaining(node);
      if (!list || node.locked)
        return false;
      let index = list.indexOf(node);
      return delta < 0 ? index > 0 && nodes.indexOf(list[index - 1]) < 0 : index < list.length - 1 && nodes.indexOf(list[index + 1]) < 0;
    });
  }
  /** nodes sorted into the order they appear in the document. */
  inDocumentOrder(nodes) {
    let order = this.allNodes();
    return nodes.filter((node, index) => nodes.indexOf(node) == index && order.indexOf(node) >= 0).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
  /** Selects every node from one node to another in document order, keeping from as the anchor. */
  selectRange(from, to) {
    let order = this.#selectableNodes();
    let start = order.indexOf(from);
    let end = order.indexOf(to);
    if (start < 0 || end < 0) {
      this.selectNode(to);
      return;
    }
    let range = order.slice(Math.min(start, end), Math.max(start, end) + 1);
    range = range.filter((node) => !range.some((other) => other !== node && other.descendants().indexOf(node) >= 0));
    if (range.indexOf(to) < 0)
      range.push(to);
    this.selectNodes(range.filter((node) => node !== to).concat([to]));
    this.#anchorNode = from;
  }
  /** Copies a node, giving it and its descendants new IDs. */
  cloneNode(node) {
    return this.nodeFromJSON(_Editor.renewIDs(node.toJSON()));
  }
  static renewIDs(data) {
    if (Array.isArray(data))
      return data.map((item) => _Editor.renewIDs(item));
    if (data && typeof data == "object") {
      let result = {};
      Object.keys(data).forEach((key) => {
        result[key] = key == "nodeId" ? Utilities.uuid() : _Editor.renewIDs(data[key]);
      });
      return result;
    }
    return data;
  }
  /** Builds a node from its JSON using the registered types. Unknown types are kept as they are. */
  nodeFromJSON(data) {
    if (!data || typeof data != "object")
      return null;
    let type = this.nodeTypes.item(Utilities.string(data.type));
    let node = type ? new type() : new UnknownNode();
    node.editor = this;
    if (!node.fromJSON(data))
      return null;
    return node;
  }
  /** Inserts a node of a registered type where the user is working, and starts editing it. */
  insertNodeOfType(type, replace = null) {
    let nodeClass = typeof type == "string" ? this.nodeTypes.item(type) : type;
    if (!nodeClass || this.#readOnly)
      return null;
    return this.insertNewNode(nodeClass.create(this), replace);
  }
  /**
   * Inserts a node made for this editor where the user is working, as insertNodeOfType does:
   * at the caret, in place of an empty paragraph, or after the selected node. One undo step.
   */
  insertNewNode(node, replace = null) {
    if (this.#readOnly)
      return null;
    node.editor = this;
    let host = this.#activeHost;
    let point = host ? host.node.insertionPoint(host) : null;
    if (replace && replace.element) {
      this.replaceNode(replace, [node]);
    } else if (host && point) {
      host.node.revealContent();
      this.insertNodes(point.list, point.index, [node], host.node);
    } else {
      let reference = host ? host.node : this.selectedNode;
      if (reference && reference.constructor === TextNode2 && reference.content.length == 0) {
        this.replaceNode(reference, [node]);
      } else if (reference) {
        this.insertNodesAfter(reference, [node]);
      } else {
        this.addNode(node);
      }
    }
    if (node.hosts().length > 0) {
      this.focusNode(node, node instanceof TableNode ? 0 : void 0);
    } else {
      this.selectNode(node);
      let list = this.listContaining(node);
      if (list && list.indexOf(node) == list.length - 1) {
        let paragraph = new TextNode2();
        this.insertNodesAfter(node, [paragraph]);
        this.selectNode(node);
      }
    }
    node.inserted();
    return node;
  }
  // Conversion
  /**
   * Turns text blocks into another kind: "text", "heading" (with level),
   * "quote", "alert" (with alert type), "codeblock", or "list" (with list type).
   * Selecting a list's own type turns it back into paragraphs.
   */
  setBlockType(kind, value = 0, target = null) {
    if (this.#readOnly)
      return;
    let host = target || this.#activeHost;
    let selection = host ? host.selection() : null;
    let nodes = host ? [host.node] : this.#selected;
    nodes = nodes.filter((node) => node instanceof TextNode2 && node.isTextBlock && !node.locked);
    if (nodes.length == 0)
      return;
    this.history.checkpoint();
    let focusTarget = null;
    let converted = [];
    nodes.forEach((node) => {
      let replacement = this.convertTextBlock(node, kind, value);
      if (replacement.length == 0)
        return;
      converted.push(...replacement);
      if (replacement.length == 1 && replacement[0] === node) {
        node.refresh();
        node.changed();
      } else {
        this.replaceNode(node, replacement);
      }
      focusTarget = replacement[0];
    });
    if (focusTarget && host) {
      let target2 = focusTarget;
      let offset = selection ? Math.min(selection.start, target2.primaryHost ? target2.primaryHost.rich.length : 0) : 0;
      this.focusNode(target2, offset);
    } else if (converted.length > 0) {
      this.selectNodes(converted);
    }
    this.updateToolbarState();
  }
  /**
   * The blocks a text block becomes for setBlockType: the block itself when it
   * handles the conversion, or a block of the registered type named by kind made
   * from its plain content. Unregistered kinds convert nothing.
   */
  convertTextBlock(node, kind, value) {
    let own = node.convertBlock(kind, value);
    if (own)
      return own;
    let type = kind == "text" ? TextNode2 : this.nodeTypes.item(kind);
    if (!type || !type.fromBlockContent)
      return [];
    if (type === TextNode2 && node.constructor === TextNode2)
      return [node];
    return type.fromBlockContent(node.plainContent(), value, node);
  }
  /** The block type menu entries of the registered text types: [identifier, caption, icon]. */
  #blockKindEntries(compact) {
    let result = [];
    this.nodeTypes.items().forEach((type) => {
      let kinds = _Editor.ownStatic(type, "blockKinds");
      if (kinds)
        result.push(...kinds.call(type, this.strings, compact));
    });
    return result;
  }
  /** Whether a block type menu entry describes the current kind, such as "alert:0" for any alert. */
  static #blockKindMatches(identifier, kind, entries) {
    if (identifier == kind)
      return true;
    if (entries.some((entry) => entry[0] == kind))
      return false;
    let prefix = identifier.split(":")[0];
    return identifier.indexOf(":") > 0 && kind.startsWith(prefix + ":");
  }
  /** The current block kind for the toolbar: "text", "heading:2", "list:1"... */
  #currentBlockKind() {
    let node = this.#activeHost ? this.#activeHost.node : this.selectedNode;
    return node ? node.blockKind : "";
  }
  // Selection
  /** Starts editing a node's text at offset (the end when omitted), or selects the node when it has no text. */
  focusNode(node, offset, hostIndex = 0) {
    if (!node.element)
      return;
    this.revealNode(node);
    let host = node.hosts()[hostIndex] || node.primaryHost;
    if (host && !this.#readOnly && !node.locked) {
      host.select(offset === void 0 ? host.rich.length : offset);
      host.element.scrollIntoView({ block: "nearest" });
    } else {
      this.selectNode(node);
    }
  }
  /** The node whose text is being edited, or null when nodes are only selected. */
  get editingNode() {
    return this.#editingNode;
  }
  /** True when node's text can be edited right now: it is the node being edited. */
  isEditingNode(node) {
    return !this.#readOnly && !node.locked && node === this.#editingNode;
  }
  /**
   * Starts editing a node's text, with the caret at offset (the end when omitted).
   * Selecting a node doesn't make it editable; double-click, Return or this does.
   */
  beginEditing(node = this.selectedNode, offset, hostIndex = 0) {
    if (!node)
      return;
    this.focusNode(node, offset, hostIndex);
  }
  /** Stops editing text, leaving the node selected. */
  endEditing() {
    let node = this.#editingNode;
    if (!node)
      return;
    this.#editingNode = null;
    this.#activeHost = null;
    this.#pending = null;
    this.history.breakCoalescing();
    node.hosts().forEach((host) => host.editable = false);
    let selection = window.getSelection();
    if (selection && this.#documentElement && this.#documentElement.contains(selection.anchorNode))
      selection.removeAllRanges();
    this.dispatchEvent(new CustomEvent("editingChanged", { detail: { node: null } }));
  }
  /** Makes node the one being edited, so its text becomes editable. */
  #setEditingNode(node) {
    if (this.#editingNode === node)
      return;
    let previous = this.#editingNode;
    this.#editingNode = node;
    if (previous)
      previous.hosts().forEach((host) => host.editable = false);
    node.hosts().forEach((host) => host.editable = this.isEditingNode(node));
    this.dispatchEvent(new CustomEvent("editingChanged", { detail: { node } }));
  }
  /** Selects a node as a whole, ending text editing. */
  selectNode(node, addToSelection = false) {
    if (!node)
      return;
    let nodes = addToSelection ? this.#selected.filter((item) => item !== node).concat([node]) : [node];
    this.selectNodes(nodes);
  }
  selectNodes(nodes) {
    this.endEditing();
    if (nodes.length <= 1 || !this.#anchorNode || nodes.indexOf(this.#anchorNode) < 0)
      this.#anchorNode = nodes[0] || null;
    let selection = window.getSelection();
    if (selection && this.#documentElement && this.#documentElement.contains(selection.anchorNode))
      selection.removeAllRanges();
    this.#activeHost = null;
    this.#setSelection(nodes, true);
    let primary = this.selectedNode;
    if (primary && primary.element) {
      primary.element.focus({ preventScroll: true });
      primary.element.scrollIntoView({ block: "nearest" });
    }
  }
  #setSelection(nodes, nodeMode) {
    let previous = this.selectedNode;
    this.#selected = nodes.slice();
    nodes.forEach((node) => {
      for (let parent = node.parent; parent; parent = parent.parent)
        parent.revealContent();
    });
    this.#element?.classList.toggle("scv-node-mode", nodeMode && nodes.length > 0);
    this.#applySelectionClasses();
    this.#renderNodeToolbar();
    if (previous !== this.selectedNode)
      this.dispatchEvent(new CustomEvent("selectionChanged", { detail: { node: this.selectedNode } }));
    this.#collaborationClient?.editorSelectionChanged(previous !== this.selectedNode);
    this.updateToolbarState();
  }
  #applySelectionClasses() {
    if (!this.#documentElement)
      return;
    this.#documentElement.querySelectorAll(".scv-node.scv-selected").forEach((element) => element.classList.remove("scv-selected"));
    this.#selected.forEach((node) => node.element?.classList.add("scv-selected"));
  }
  #onSelectionChange() {
    if (!this.#documentElement)
      return;
    let selection = window.getSelection();
    let host = null;
    if (selection && selection.rangeCount > 0 && this.#documentElement.contains(selection.anchorNode)) {
      host = TextHost.from(selection.anchorNode, this.#documentElement);
    }
    if (host !== this.#activeHost) {
      if (this.#activeHost === null && host === null)
        return;
      this.history.breakCoalescing();
      this.#activeHost = host;
    }
    if (host && !this.#readOnly && host.node !== this.#editingNode) {
      if (host.node.locked) {
        host = null;
        this.#activeHost = null;
      } else {
        this.#setEditingNode(host.node);
      }
    }
    if (this.#suggestionState) {
      let state = this.#suggestionState;
      let range = host === state.host ? host.selection() : null;
      if (!range || range.start != range.end || range.start != state.request.startPosition + state.request.length)
        this.#updateSuggestions(host);
    }
    if (host) {
      this.#noteCaretPosition(host);
      if (this.#pending) {
        let range = host.selection();
        if (this.#pending.host !== host || !range || range.start != this.#pending.offset || range.end != range.start)
          this.#pending = null;
      }
      if (this.#selected.length != 1 || this.#selected[0] !== host.node || this.#element.classList.contains("scv-node-mode"))
        this.#setSelection([host.node], false);
    } else if (this.#element && !this.#element.classList.contains("scv-node-mode")) {
      this.#pending = null;
    }
    this.#collaborationClient?.editorSelectionChanged(false);
    this.updateToolbarState();
  }
  /** Opens collapsed sections that contain node. */
  revealNode(node) {
    let parent = node.parent;
    while (parent) {
      parent.revealContent();
      parent = parent.parent;
    }
  }
  scrollToNode(node) {
    this.revealNode(node);
    node.element?.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  scrollTo(x, y) {
    this.#scrollerElement?.scrollTo(x, y);
  }
  /** The selection, as IDs and offsets that survive re-rendering. */
  captureSelection() {
    let host = this.#activeHost;
    if (host && host.element.isConnected) {
      let range = host.selection();
      if (range)
        return { nodeId: host.node.nodeId, hostIndex: host.index, start: range.start, end: range.end, nodeIds: [] };
    }
    if (this.#selected.length > 0)
      return { nodeId: "", hostIndex: -1, start: 0, end: 0, nodeIds: this.#selected.map((node) => node.nodeId) };
    return null;
  }
  restoreSelection(state) {
    if (!state)
      return;
    if (state.nodeId.length > 0) {
      let node = this.nodeWithID(state.nodeId);
      let host = node ? node.hosts()[state.hostIndex] : null;
      if (host) {
        host.select(state.start, state.end);
        this.#activeHost = host;
        this.#setSelection([node], false);
        return;
      }
      if (node) {
        this.selectNode(node);
        return;
      }
    }
    let nodes = state.nodeIds.map((identifier) => this.nodeWithID(identifier)).filter((node) => node !== null);
    if (nodes.length > 0)
      this.selectNodes(nodes);
  }
  /** The selected text, or the plain text of the selected nodes. */
  selectedText() {
    let host = this.#activeHost;
    if (host) {
      let range = host.selection();
      return range ? host.rich.text.substring(range.start, range.end).replace(/\u2028/g, "\n") : "";
    }
    return this.inDocumentOrder(this.#selected).map((node) => node.toPlainText()).join("\n");
  }
  /** Records the text being edited right away, before the browser reports the selection change. */
  hostActivated(host) {
    this.#noteCaretPosition(host);
    if (!this.#readOnly && !host.node.locked)
      this.#setEditingNode(host.node);
    if (this.#activeHost === host)
      return;
    this.history.breakCoalescing();
    this.#activeHost = host;
    if (this.#selected.length != 1 || this.#selected[0] !== host.node || this.#element.classList.contains("scv-node-mode"))
      this.#setSelection([host.node], false);
  }
  /** Remembers which table cell or radio option has the caret, for commands and the inspector. */
  #noteCaretPosition(host) {
    let node = host.node;
    node.noteCaretHost(host);
  }
  pendingStyle() {
    return this.#pending ? this.#pending.style : null;
  }
  /** Sets the style the next typed text at offset receives. */
  setPendingStyle(host, offset, style) {
    this.#pending = { host, offset, style };
  }
  // Changes
  /** Called by nodes after their content or persistent properties change. */
  nodeChanged(node) {
    this.#isChanged = true;
    if (this.#updateDepth > 0) {
      this.#deferredChange = true;
      return;
    }
    this.#syncAnnotations();
    this.dispatchEvent(new CustomEvent("contentChanged", { detail: { node } }));
    this.#collaborationClient?.editorContentChanged(node);
    if (!node || node instanceof HeadingNode)
      this.#scheduleTableOfContents();
    this.#positionNodeToolbar();
    this.#scheduleAnnotationMarkers();
    this.#schedulePresence();
  }
  #documentChanged(node) {
    this.#scheduleTableOfContents();
    this.nodeChanged(node);
  }
  #scheduleTableOfContents() {
    if (!this.#element)
      return;
    clearTimeout(this.#tocTimer);
    this.#tocTimer = setTimeout(() => {
      this.allNodes().forEach((node) => {
        if (node.followsHeadings)
          this.refreshNode(node);
      });
    }, 250);
  }
  /** Starts a batch of changes. Events wait until the matching endUpdate. Batches may be nested. */
  beginUpdate() {
    this.#updateDepth++;
  }
  endUpdate() {
    if (this.#updateDepth == 0)
      return;
    this.#updateDepth--;
    if (this.#updateDepth == 0 && this.#deferredChange) {
      this.#deferredChange = false;
      this.nodeChanged(null);
    }
  }
  /** A unique fragment identifier for a heading, from its text. */
  anchorFor(heading) {
    let used = {};
    for (let node of this.allNodes()) {
      if (!(node instanceof HeadingNode))
        continue;
      let slug = Utilities.slug(node.text) || "section";
      let count = used[slug] || 0;
      used[slug] = count + 1;
      if (node === heading)
        return count == 0 ? slug : `${slug}-${count}`;
    }
    return Utilities.slug(heading.text);
  }
  // Text editing
  /** Inserts text at the caret, replacing the selection. Returns false when no text is being edited. */
  insertText(value) {
    let host = this.#activeHost;
    if (!host || this.#readOnly)
      return false;
    this.#insertRich(host, this.#textToRich(host, value));
    return true;
  }
  /** Replaces text in the node being edited. */
  replaceText(start, length, value, style) {
    let host = this.#activeHost || (this.selectedNode ? this.selectedNode.primaryHost : null);
    if (!host || this.#readOnly)
      return false;
    this.history.checkpoint();
    host.rich.remove(start, start + length);
    host.rich.insert(start, value, style);
    host.render();
    host.select(start + value.length);
    host.node.textChanged(host);
    host.node.changed();
    return true;
  }
  deleteText(host, start, end) {
    if (this.#readOnly)
      return;
    this.history.checkpoint();
    host.rich.remove(start, end);
    if (host.mode == 2 /* list */)
      host.sync();
    host.render();
    host.select(start);
    host.node.textChanged(host);
    host.node.changed();
  }
  #textToRich(host, value) {
    let normalized = value.replace(/\r\n?/g, "\n");
    if (host.mode == 0 /* inline */)
      normalized = normalized.replace(/\n/g, LineBreak);
    if (host.mode == 2 /* list */)
      normalized = normalized.replace(/\n/g, LineBreak);
    let selection = host.selection();
    let style = this.#pending && this.#pending.host === host ? this.#pending.style : host.rich.length == 0 && host.node instanceof TextNode2 ? host.node.baseStyle() : host.rich.insertionStyleAt(selection ? selection.start : 0);
    if (host.mode == 3 /* plain */)
      style = new TextStyle();
    return new RichText(normalized, style);
  }
  #insertRich(host, rich) {
    let selection = host.selection() || { start: host.rich.length, end: host.rich.length };
    this.history.checkpoint();
    host.rich.remove(selection.start, selection.end);
    let content = rich;
    if (host.mode == 3 /* plain */) {
      content = new RichText(rich.text.replace(/\u2028/g, "\n"));
    } else if (host.mode == 0 /* inline */ || host.mode == 2 /* list */) {
      content = rich.clone();
      content.text = content.text.replace(/\n/g, LineBreak);
    }
    host.rich.insert(selection.start, content);
    if (host.mode == 2 /* list */) {
      host.rich.listLevels = host.rich.listLevels.slice(0, host.rich.text.split(ParagraphBreak).length);
    }
    this.#pending = null;
    host.render();
    host.select(selection.start + content.length);
    host.node.textChanged(host);
    host.node.changed();
  }
  /** Splits a text node at the caret, as Enter does. */
  #splitNode(host) {
    let node = host.node;
    let selection = host.selection();
    if (!selection)
      return;
    this.history.checkpoint();
    if (selection.end > selection.start)
      host.rich.remove(selection.start, selection.end);
    let offset = selection.start;
    if (offset == 0 && host.rich.length > 0) {
      let paragraph = new TextNode2();
      this.insertNodesBefore(node, [paragraph]);
      host.render();
      host.select(0);
      return;
    }
    let following = node.createFollowingNode();
    following.content = host.rich.slice(offset);
    if (following.content.length == 0 && offset > 0) {
      let style = host.rich.styleAt(offset - 1).clone();
      style.linkURL = "";
      style.linkTitle = "";
      style.linkTarget = "";
      if (node instanceof HeadingNode)
        style = new TextStyle();
      if (!style.isDefault())
        this.#pending = null;
    }
    host.rich.remove(offset, host.rich.length);
    host.render();
    node.textChanged(host);
    this.insertNodesAfter(node, [following]);
    this.focusNode(following, 0);
  }
  /** Backspace at the start of a text node. Returns true when handled. */
  #joinBackward(host) {
    let node = host.node;
    if (!(node instanceof TextNode2) || host !== node.primaryHost || !node.isTextBlock)
      return false;
    if (node.becomesTextOnBackspace) {
      this.setBlockType("text");
      return true;
    }
    let list = this.listContaining(node);
    if (!list)
      return false;
    let index = list.indexOf(node);
    let previous = list[index - 1];
    if (!previous) {
      if (node.content.length == 0 && node.parent && list.length > 1) {
        this.removeNodes([node]);
        return true;
      }
      return false;
    }
    if (previous instanceof TextNode2 && previous.isTextBlock && previous.primaryHost && !previous.locked) {
      this.history.checkpoint();
      let previousHost = previous.primaryHost;
      let offset = previous.content.length;
      let addition = previous.joinedContent(node.content.clone());
      previous.content.append(addition);
      previous.content.nodes.push(...node.content.nodes);
      list.splice(index, 1);
      this.#syncList(list);
      previousHost.render();
      previousHost.select(offset);
      previous.textChanged(previousHost);
      this.#documentChanged(previous);
      return true;
    }
    if (node.content.length == 0) {
      this.removeNodes([node]);
      this.selectNode(previous);
    } else {
      this.selectNode(previous);
    }
    return true;
  }
  /** Delete at the end of a text node. Returns true when handled. */
  #joinForward(host) {
    let node = host.node;
    if (!(node instanceof TextNode2) || host !== node.primaryHost || !node.joinsForward)
      return false;
    let list = this.listContaining(node);
    if (!list)
      return false;
    let next = list[list.indexOf(node) + 1];
    if (!next)
      return false;
    if (next instanceof TextNode2 && next.joinsForward && !next.locked) {
      this.history.checkpoint();
      let offset = node.content.length;
      let addition = node.joinedContent(next.content.clone());
      node.content.append(addition);
      list.splice(list.indexOf(next), 1);
      this.#syncList(list);
      host.render();
      host.select(offset);
      node.textChanged(host);
      this.#documentChanged(node);
      return true;
    }
    if (next instanceof TextNode2 && !next.joinsForward)
      return false;
    this.selectNode(next);
    return true;
  }
  /** The text hosts and text-less nodes in document order: the places arrow keys move between. */
  #stops() {
    let result = [];
    let visit = (node) => {
      let hosts = node.hosts();
      if (hosts.length == 0) {
        result.push(node);
      } else {
        hosts.forEach((host) => result.push(host));
      }
      node.childLists().forEach((list) => list.forEach((child) => {
        if (child.element && child.element.offsetParent !== null)
          visit(child);
      }));
    };
    this.#nodes.forEach(visit);
    if (result.some((stop) => stop instanceof TextHost)) {
      result.sort((a, b) => {
        let elementA = a instanceof TextHost ? a.element : a.element;
        let elementB = b instanceof TextHost ? b.element : b.element;
        if (!elementA || !elementB)
          return 0;
        return elementA.compareDocumentPosition(elementB) & 4 ? -1 : 1;
      });
    }
    return result;
  }
  /** Every visible node in document order, including those inside containers. */
  #selectableNodes() {
    return this.allNodes().filter((node) => node.element && node.element.offsetParent !== null);
  }
  /** Selects the node before or after the primary selection. Extending adds it to the selection. */
  #selectAdjacentNode(forward, extend) {
    let nodes = this.#selectableNodes();
    let current = this.selectedNode;
    let index = current ? nodes.indexOf(current) : -1;
    let target = nodes[index < 0 ? forward ? 0 : nodes.length - 1 : index + (forward ? 1 : -1)];
    if (!target)
      return;
    if (extend) {
      this.selectRange(this.#anchorNode && this.#selected.indexOf(this.#anchorNode) >= 0 ? this.#anchorNode : current || target, target);
    } else {
      this.selectNode(target);
    }
  }
  /** The DOM position under a point, or null. */
  static caretFromPoint(x, y) {
    let source = document;
    if (typeof source.caretPositionFromPoint == "function") {
      let position = source.caretPositionFromPoint(x, y);
      if (position)
        return { node: position.offsetNode, offset: position.offset };
    }
    if (typeof source.caretRangeFromPoint == "function") {
      let range = source.caretRangeFromPoint(x, y);
      if (range)
        return { node: range.startContainer, offset: range.startOffset };
    }
    return null;
  }
  #moveToStop(from, delta) {
    let stops = this.#stops();
    let index = stops.indexOf(from);
    if (index < 0)
      return false;
    let target = stops[index + delta];
    if (!target)
      return false;
    if (target instanceof TextHost) {
      target.select(delta < 0 ? target.rich.length : 0);
      target.element.scrollIntoView({ block: "nearest" });
    } else {
      this.selectNode(target);
    }
    return true;
  }
  // Keyboard
  #attachEvents() {
    let documentElement = this.#documentElement;
    documentElement.addEventListener("keydown", (event) => this.#onKeyDown(event));
    documentElement.addEventListener("focus", (event) => {
      if (event.target === documentElement && this.#nodes.length == 0)
        this.#startEmptyDocument();
    });
    documentElement.addEventListener("beforeinput", (event) => this.#onBeforeInput(event));
    documentElement.addEventListener("input", (event) => this.#onInput(event));
    documentElement.addEventListener("compositionstart", () => this.#composing = true);
    documentElement.addEventListener("compositionend", (event) => {
      this.#composing = false;
      this.#onInput(event);
    });
    documentElement.addEventListener("paste", (event) => this.#onPaste(event));
    documentElement.addEventListener("copy", (event) => this.#onCopy(event, false));
    documentElement.addEventListener("cut", (event) => this.#onCopy(event, true));
    documentElement.addEventListener("mousedown", (event) => this.#onMouseDown(event));
    documentElement.addEventListener("click", (event) => this.#onClick(event));
    this.#pageElement.addEventListener("contextmenu", (event) => this.#onContextMenu(event));
    if (this.#toolbarElement)
      this.#toolbarElement.addEventListener("contextmenu", (event) => this.#onToolbarContextMenu(event));
    this.#pageElement.addEventListener("mousedown", (event) => {
      if (event.target === this.#pageElement || event.target === this.#documentElement)
        this.#onBlankPress(event);
    });
    this.#scrollerElement.addEventListener("mousedown", (event) => {
      if (event.target === this.#scrollerElement)
        this.#onBlankPress(event);
    });
    this.#pageElement.addEventListener("mousemove", (event) => {
      this.#onHover(event);
      this.#notePointerNode(event);
      if (this.#collaborationClient) {
        let page = this.#pageElement.getBoundingClientRect();
        this.#collaborationClient.editorPointerMoved(event.clientX - page.left, event.clientY - page.top, this.#pointerAnchor(event.clientX, event.clientY));
      }
    });
    this.#pageElement.addEventListener("mouseleave", () => this.#setPointerNode(null));
    let root = this.#element;
    root.addEventListener("mouseenter", (event) => this.dispatchEvent(new CustomEvent("pointerEnter", { detail: this.#pointerDetail(event) })));
    root.addEventListener("mouseleave", (event) => this.dispatchEvent(new CustomEvent("pointerExit", { detail: this.#pointerDetail(event) })));
    root.addEventListener("mousemove", (event) => this.dispatchEvent(new CustomEvent("pointerMoved", { detail: this.#pointerDetail(event) })));
    root.addEventListener("scv-popup-opened", (event) => {
      let popup = event.detail.popup;
      this.dispatchEvent(new CustomEvent("pickerOpened", { detail: { picker: popup } }));
    });
    root.addEventListener("scv-popup-closed", (event) => {
      let popup = event.detail.popup;
      this.dispatchEvent(new CustomEvent("pickerClosed", { detail: { picker: popup, committed: popup.chosenValue !== null, value: popup.chosenValue } }));
    });
    this.#pageElement.addEventListener("mouseleave", () => this.#positionGutter(null));
    this.#pageElement.addEventListener("dragover", (event) => this.#onDragOver(event));
    this.#pageElement.addEventListener("dragleave", (event) => {
      if (!this.#pageElement.contains(event.relatedTarget))
        this.#dropIndicator.classList.add("d-none");
    });
    this.#pageElement.addEventListener("drop", (event) => this.#onDrop(event));
    window.addEventListener("resize", () => {
      this.#positionNodeToolbar();
      this.#scheduleAnnotationMarkers();
    });
  }
  static get isMac() {
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  }
  #onKeyDown(event) {
    if (event.isComposing || this.#composing)
      return;
    let keyEvent = new CustomEvent("keyPress", { detail: { key: event.key, event }, cancelable: true });
    if (!this.dispatchEvent(keyEvent)) {
      event.preventDefault();
      return;
    }
    let host = TextHost.from(event.target, this.#documentElement);
    if (host && host !== this.#activeHost)
      this.#activeHost = host;
    if (event.altKey && event.shiftKey && !event.metaKey && !event.ctrlKey && (event.key == "ArrowUp" || event.key == "ArrowDown") && this.#selected.length > 0) {
      event.preventDefault();
      this.moveNodes(this.#selected, event.key == "ArrowUp" ? -1 : 1);
      return;
    }
    if (this.#handleShortcut(event))
      return;
    if (host) {
      if (host.node.handleKeyDown(event, host) || event.defaultPrevented)
        return;
      this.#handleTextKey(event, host);
      return;
    }
    let target = event.target.closest ? event.target.closest(".scv-node") : null;
    if (target && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(event.target.tagName))
      return;
    this.#handleNodeKey(event);
  }
  #handleShortcut(event) {
    let modifier = _Editor.isMac ? event.metaKey : event.ctrlKey;
    if (!modifier) {
      if (event.key == "Escape" && this.#activeHost) {
        event.preventDefault();
        this.selectNode(this.#activeHost.node);
        return true;
      }
      return false;
    }
    let key = event.key.toLowerCase();
    let code = event.code;
    let run = (action) => {
      event.preventDefault();
      action();
      return true;
    };
    if (key == "z" && !event.shiftKey)
      return run(() => this.history.undo());
    if (key == "z" && event.shiftKey || key == "y")
      return run(() => this.history.redo());
    if (key == "f" && !event.altKey)
      return run(() => this.search.show(false));
    if (key == "f" && event.altKey || key == "h" && !_Editor.isMac)
      return run(() => this.search.show(true));
    if (key == "p" && event.shiftKey && !event.altKey)
      return run(() => this.showCommandSearch());
    if (key == "p" && !event.shiftKey && !event.altKey)
      return run(() => this.print());
    if (event.shiftKey && (key == "arrowup" || key == "arrowdown") && this.selectedNode)
      return run(() => this.moveNodes(this.#selected, key == "arrowup" ? -1 : 1));
    if (event.altKey && code == "KeyM" && !event.shiftKey)
      return run(() => this.annotations.show(null));
    if (key == "a" && !event.shiftKey && !this.#activeHost && this.#selected.length > 0)
      return run(() => this.selection.selectAllNodes());
    if (key == "a" && !event.shiftKey && this.#activeHost) {
      let range = this.#activeHost.selection();
      if (range && range.start == 0 && range.end == this.#activeHost.rich.length)
        return run(() => this.selection.selectAllNodes());
      return false;
    }
    if (this.#readOnly)
      return false;
    if (key == "b" && !event.shiftKey)
      return run(() => this.formatting.toggle(0 /* bold */));
    if (key == "i" && !event.shiftKey)
      return run(() => this.formatting.toggle(1 /* italic */));
    if (key == "u" && !event.shiftKey)
      return run(() => this.formatting.toggle(2 /* underline */));
    if (event.shiftKey && (key == "x" || key == "s"))
      return run(() => this.formatting.toggle(3 /* strikethrough */));
    if (key == "e" && !event.shiftKey)
      return run(() => this.formatting.toggle(4 /* code */));
    if (event.shiftKey && key == "h")
      return run(() => this.formatting.toggle(5 /* highlight */));
    if (key == "." && !event.shiftKey)
      return run(() => this.formatting.toggle(7 /* superscript */));
    if (key == "," && !event.shiftKey)
      return run(() => this.formatting.toggle(8 /* subscript */));
    if (key == "k")
      return run(() => this.formatting.editLink());
    if (key == "\\")
      return run(() => this.formatting.clearFormatting());
    if (event.altKey && /^Digit[0-6]$/.test(code)) {
      let level = Number(code.substring(5));
      return run(() => level == 0 ? this.setBlockType("text") : this.setBlockType("heading", level));
    }
    for (let extension of _Editor.#extensions) {
      if (extension.handleCommandKey && extension.handleCommandKey(this, event)) {
        event.preventDefault();
        return true;
      }
    }
    if (event.shiftKey && key == "d" && this.#selected.length > 0)
      return run(() => this.duplicateNodes(this.#selected));
    return false;
  }
  #handleTextKey(event, host) {
    let selection = host.selection();
    if (!selection)
      return;
    let collapsed = selection.start == selection.end;
    let modifier = event.metaKey || event.ctrlKey || event.altKey;
    if (event.key == "Enter" && !this.#readOnly) {
      event.preventDefault();
      if (event.shiftKey || host.mode == 1 /* multiline */ || host.mode == 3 /* plain */) {
        let character = event.shiftKey && host.mode != 3 /* plain */ ? LineBreak : host.mode == 3 /* plain */ ? "\n" : ParagraphBreak;
        if (host.mode == 0 /* inline */ || host.mode == 2 /* list */)
          character = LineBreak;
        let rich = this.#textToRich(host, character);
        this.#insertRich(host, rich);
        return;
      }
      let node = host.node;
      if (node instanceof TextNode2 && host === node.primaryHost && host.mode == 0 /* inline */) {
        this.#splitNode(host);
      } else {
        let paragraph = new TextNode2();
        this.insertNodesAfter(node, [paragraph]);
        this.focusNode(paragraph, 0);
      }
      return;
    }
    if (event.key == "Backspace" && collapsed && selection.start == 0 && !modifier && !this.#readOnly) {
      if (this.#joinBackward(host))
        event.preventDefault();
      return;
    }
    if (event.key == "Delete" && collapsed && selection.end == host.rich.length && !modifier && !this.#readOnly) {
      if (this.#joinForward(host))
        event.preventDefault();
      return;
    }
    if (event.key == "Tab" && !modifier) {
      event.preventDefault();
      return;
    }
    if (event.shiftKey || modifier)
      return;
    if (event.key == "ArrowUp" && host.isCaretOnFirstLine() || event.key == "ArrowLeft" && collapsed && selection.start == 0) {
      if (this.#moveToStop(host, -1))
        event.preventDefault();
    } else if (event.key == "ArrowDown" && host.isCaretOnLastLine() || event.key == "ArrowRight" && collapsed && selection.end == host.rich.length) {
      if (this.#moveToStop(host, 1))
        event.preventDefault();
    }
  }
  #handleNodeKey(event) {
    let node = this.selectedNode;
    if (!node)
      return;
    if (!this.dispatchEvent(new CustomEvent("nodeKeyPress", { detail: { node, key: event.key, event }, cancelable: true }))) {
      event.preventDefault();
      return;
    }
    if (node.handleKeyDown(event, null) || event.defaultPrevented)
      return;
    switch (event.key) {
      case "Backspace":
      case "Delete":
        event.preventDefault();
        this.removeNodes(this.#selected);
        break;
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault();
        this.#selectAdjacentNode(event.key == "ArrowDown", event.shiftKey);
        break;
      case "Tab":
        if (event.metaKey || event.ctrlKey || event.altKey)
          break;
        event.preventDefault();
        this.#selectAdjacentNode(!event.shiftKey, false);
        break;
      case "Home":
      case "End": {
        event.preventDefault();
        let nodes = this.#selectableNodes();
        let target = event.key == "End" ? nodes[nodes.length - 1] : nodes[0];
        if (!target)
          break;
        if (event.shiftKey) {
          this.selectRange(this.#anchorNode || node, target);
        } else {
          this.selectNode(target);
        }
        break;
      }
      case "Enter":
        event.preventDefault();
        if (node.primaryHost && !this.#readOnly && !node.locked) {
          this.beginEditing(node);
        } else if (!this.#readOnly) {
          let paragraph = new TextNode2();
          this.insertNodesAfter(node, [paragraph]);
          this.focusNode(paragraph, 0);
        }
        break;
      case "Escape":
        event.preventDefault();
        this.selectNodes([]);
        break;
    }
  }
  #onBeforeInput(event) {
    let host = TextHost.from(event.target, this.#documentElement);
    if (!host)
      return;
    this.#activeHost = host;
    if (this.#readOnly) {
      event.preventDefault();
      return;
    }
    switch (event.inputType) {
      case "historyUndo":
        event.preventDefault();
        this.history.undo();
        return;
      case "historyRedo":
        event.preventDefault();
        this.history.redo();
        return;
      case "formatBold":
        event.preventDefault();
        this.formatting.toggle(0 /* bold */);
        return;
      case "formatItalic":
        event.preventDefault();
        this.formatting.toggle(1 /* italic */);
        return;
      case "formatUnderline":
        event.preventDefault();
        this.formatting.toggle(2 /* underline */);
        return;
      case "insertParagraph":
      case "insertLineBreak":
        event.preventDefault();
        this.#handleTextKey(new KeyboardEvent("keydown", { key: "Enter", shiftKey: event.inputType == "insertLineBreak" }), host);
        return;
    }
    if (event.inputType == "insertText" && event.data && host.mode != 3 /* plain */) {
      let selection = host.selection();
      let style = null;
      if (this.#pending && this.#pending.host === host && selection && selection.start == selection.end && selection.start == this.#pending.offset) {
        style = this.#pending.style;
      } else if (host.rich.length == 0 && host.node instanceof TextNode2) {
        style = host.node.baseStyle();
        if (style.isDefault())
          style = null;
      } else if (selection && selection.start > 0) {
        let before = host.rich.styleAt(selection.start - 1);
        let after = selection.end < host.rich.length ? host.rich.styleAt(selection.end) : null;
        if (before.suggestionProviderIdentifier.length > 0 && !(after && after.suggestionProviderIdentifier == before.suggestionProviderIdentifier && after.suggestionIdentifier == before.suggestionIdentifier)) {
          style = _Editor.#untagged(before);
        }
      }
      if (style && selection) {
        event.preventDefault();
        this.history.checkpoint(host);
        host.rich.remove(selection.start, selection.end);
        host.rich.insert(selection.start, event.data, style);
        host.render();
        let offset = selection.start + event.data.length;
        host.select(offset);
        if (this.#pending)
          this.#pending.offset = offset;
        host.node.textChanged(host);
        host.node.changed();
        this.#afterTyping(host);
      }
    }
  }
  #onInput(event) {
    if (this.#composing)
      return;
    let host = TextHost.from(event.target, this.#documentElement);
    if (!host)
      return;
    this.#activeHost = host;
    let coalesce = event.inputType && event.inputType.startsWith("delete") ? `delete-${host.node.nodeId}` : host;
    this.history.checkpoint(coalesce);
    let pending = this.#pending && this.#pending.host === host ? this.#pending : null;
    if (!host.sync())
      return;
    if (pending && host.mode != 3 /* plain */ && (!event.inputType || event.inputType.startsWith("insert"))) {
      let range = host.selection();
      if (range && range.start == range.end && range.start > pending.offset && range.start - pending.offset <= 64) {
        host.rich.applyStyle(pending.offset, range.start, (style) => Object.assign(style, pending.style.clone()));
        host.render();
        host.select(range.start);
        pending.offset = range.start;
        this.#pending = pending;
      }
    }
    host.node.textChanged(host);
    host.node.changed();
    this.#afterTyping(host);
  }
  /** Markdown-style shortcuts typed at the start of a paragraph, and the block chooser for "/". */
  #afterTyping(host) {
    if (this.#readOnly)
      return;
    let selection = host.selection();
    if (!selection || selection.start != selection.end)
      return;
    if (this.markdownShortcuts && this.#applyInlineMarkdown(host, selection.start)) {
      this.#closeSuggestions();
      return;
    }
    this.#updateSuggestions(host);
    let node = host.node;
    if (!(node instanceof TextNode2) || node.constructor !== TextNode2 || host !== node.primaryHost)
      return;
    let text = node.content.text;
    let caret = selection.start;
    if (text == "/" && caret == 1) {
      let rect = host.caretRect();
      this.showInsertionChooser(rect || host.element, node);
      return;
    }
    if (!this.markdownShortcuts)
      return;
    let rules = [];
    this.nodeTypes.items().forEach((type) => {
      let shortcuts = _Editor.ownStatic(type, "markdownShortcuts") || [];
      shortcuts.forEach((shortcut) => rules.push([shortcut, type]));
    });
    for (let [shortcut, type] of rules) {
      let match = text.match(shortcut.pattern);
      if (!match || caret != match[0].length)
        continue;
      let value = shortcut.value ? shortcut.value(match) : 0;
      this.history.breakCoalescing();
      node.content.remove(caret - 1, caret);
      this.history.checkpoint();
      this.history.suspend(() => {
        node.content.remove(0, match[0].length - 1);
        if (shortcut.insertsBlock) {
          let block = type.create(this);
          block.editor = this;
          this.insertNodesBefore(node, [block]);
          host.render();
          host.select(0);
          return;
        }
        host.render();
        host.select(0);
        this.setBlockType(type.identifier, value, host);
        let replacement = this.#activeHost ? this.#activeHost.node : null;
        if (replacement && shortcut.finish)
          shortcut.finish(replacement, match);
      });
      return;
    }
  }
  /**
   * Typing the closing marker of `code`, **bold**, *italic*, _italic_,
   * ~~strikethrough~~ or ==highlight== removes both markers and formats the text
   * between them. The opening marker must start the line or follow a space, and
   * the text between must not start or end with a space, so snake_case_names and
   * 2 * 3 * 4 stay as typed. Returns true when it converted something.
   */
  #applyInlineMarkdown(host, caret) {
    if (host.mode == 3 /* plain */ || host.node instanceof CodeBlockNode || caret == 0)
      return false;
    let rich = host.rich;
    let typed = rich.text[caret - 1];
    let before = rich.text.substring(0, caret);
    let lineStart = Math.max(before.lastIndexOf(ParagraphBreak), before.lastIndexOf(LineBreak)) + 1;
    let line = before.substring(lineStart);
    let marker = "";
    let apply;
    switch (typed) {
      case "*":
        if (line.endsWith("**")) {
          marker = "**";
          apply = (style, value) => style.bold = value;
        } else {
          marker = "*";
          apply = (style, value) => style.italic = value;
        }
        break;
      case "_":
        marker = "_";
        apply = (style, value) => style.italic = value;
        break;
      case "~":
        if (!line.endsWith("~~"))
          return false;
        marker = "~~";
        apply = (style, value) => style.strikethrough = value;
        break;
      case "`":
        marker = "`";
        apply = (style, value) => style.code = value;
        break;
      case "=":
        if (!line.endsWith("=="))
          return false;
        marker = "==";
        apply = (style, value) => {
          style.highlight = value;
          if (value)
            style.hasBackgroundColor = false;
        };
        break;
      default:
        return false;
    }
    let formatName = { "**": "bold", "*": "italic", "_": "italic", "~~": "strikethrough", "`": "code", "==": "highlight" }[marker];
    if (formatName && !this.activeFontOptions().allows(formatName))
      return false;
    let body = line.substring(0, line.length - marker.length);
    let openIndex = body.lastIndexOf(marker);
    if (openIndex < 0)
      return false;
    let content = body.substring(openIndex + marker.length);
    if (content.length == 0 || content.startsWith(" ") || content.endsWith(" "))
      return false;
    if (content.indexOf(marker[0]) >= 0)
      return false;
    if (openIndex > 0 && body[openIndex - 1] != " ")
      return false;
    this.history.breakCoalescing();
    this.history.checkpoint();
    let openStart = lineStart + openIndex;
    let contentStart = openStart + marker.length;
    let contentEnd = contentStart + content.length;
    rich.remove(contentEnd, contentEnd + marker.length);
    rich.remove(openStart, contentStart);
    rich.applyStyle(openStart, openStart + content.length, (style) => apply(style, true));
    host.render();
    let caretAfter = openStart + content.length;
    host.select(caretAfter);
    let typingStyle = rich.styleAt(caretAfter - 1).clone();
    apply(typingStyle, false);
    this.setPendingStyle(host, caretAfter, typingStyle);
    host.node.textChanged(host);
    host.node.changed();
    this.history.breakCoalescing();
    this.updateToolbarState();
    return true;
  }
  // Context menu
  /** True while the editor shows its own context menu. Holding Shift shows the browser's, with its spelling suggestions. */
  contextMenuEnabled = true;
  #onToolbarContextMenu(event) {
    if (!this.contextMenuEnabled || event.shiftKey)
      return;
    event.preventDefault();
    if (this.#readOnly || this.#customizer)
      return;
    let strings = this.strings;
    let items = [new ToolbarMenuItem("customizetoolbar", strings.TextCustomizeToolbarMenuCaption, "bi bi-tools"), ToolbarMenuItem.separator()];
    [strings.TextIconOnlyCaption, strings.TextIconAndTextCaption, strings.TextTextOnlyCaption].forEach((caption, index) => {
      let item = new ToolbarMenuItem(`toolbarmode:${index}`, caption);
      item.checked = this.#toolbarDisplayMode == index;
      items.push(item);
    });
    let menu = new PopupMenu(items, (item) => {
      if (item.identifier == "customizetoolbar") {
        this.showToolbarCustomizer();
      } else if (item.identifier.startsWith("toolbarmode:")) {
        this.toolbarDisplayMode = Number(item.identifier.substring(12));
      }
    });
    menu.show(new DOMRect(event.clientX, event.clientY, 0, 0), this.#element);
  }
  #onContextMenu(event) {
    if (!this.contextMenuEnabled || event.shiftKey)
      return;
    let target = event.target;
    if (!this.#documentElement || !this.#documentElement.contains(target))
      return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) && !TextHost.from(target, this.#documentElement))
      return;
    event.preventDefault();
    Popup2.closeAll();
    let host = TextHost.from(target, this.#documentElement);
    let selection = window.getSelection();
    let insideTextSelection = !!host && host === this.#activeHost && !!selection && selection.rangeCount > 0 && !selection.isCollapsed && Array.from(selection.getRangeAt(0).getClientRects()).some((rect) => event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
    let element = target.closest(".scv-node");
    let pressed = element ? this.allNodes().find((node) => node.element === element) || null : null;
    if (!insideTextSelection && pressed && !(host && host === this.#activeHost) && this.#selected.indexOf(pressed) < 0)
      this.selectNode(pressed);
    this.#showContextMenu(new DOMRect(event.clientX, event.clientY, 0, 0));
  }
  /** Shows the editor's context menu: undo, the clipboard, Select All, then the selected node's actions. */
  #showContextMenu(anchor) {
    let strings = this.strings;
    let readOnly = this.#readOnly;
    let host = this.#activeHost;
    let range = host ? host.selection() : null;
    let hasText = !!range && range.end > range.start;
    let hasNodes = !host && this.#selected.length > 0;
    let canChange = !readOnly && (hasText || hasNodes && this.#selected.some((node2) => !node2.locked));
    let item = (identifier, caption, icon, enabled) => {
      let entry = new ToolbarMenuItem(identifier, caption, icon);
      entry.enabled = enabled;
      return entry;
    };
    let items = [
      item("undo", strings.TextUndoMenuCaption, "bi bi-arrow-counterclockwise", !readOnly && this.history.canUndo),
      item("redo", strings.TextRedoMenuCaption, "bi bi-arrow-clockwise", !readOnly && this.history.canRedo),
      ToolbarMenuItem.separator(),
      item("cut", strings.TextCutMenuCaption, "bi bi-scissors", canChange),
      item("copy", strings.TextCopyMenuCaption, "bi bi-copy", hasText || hasNodes),
      item("paste", strings.TextPasteMenuCaption, "bi bi-clipboard", !readOnly && (!!host || this.#selected.length > 0) && !!navigator.clipboard),
      item("delete", strings.TextDeleteCaption, "bi bi-trash3", canChange),
      ToolbarMenuItem.separator(),
      item("selectall", strings.TextSelectAllMenuCaption, "bi bi-check2-all", true)
    ];
    let node = this.#selected.length == 1 ? this.#selected[0] : null;
    let actions = node && !node.locked ? node.actions().filter((action) => action.kind != 3 /* separator */ && action.kind != 4 /* flexibleSpace */) : [];
    let extra = node ? node.contextMenuItems() : [];
    if (actions.length > 0 || extra.length > 0)
      items.push(ToolbarMenuItem.separator());
    actions.forEach((action, index) => {
      let caption = action.caption.length > 0 ? action.caption : action.tooltip;
      let entry;
      if (action.kind == 2 /* menu */ && action.menuItems.length > 0) {
        entry = ToolbarMenuItem.submenu(`action:${index}`, caption, action.icon, action.menuItems);
      } else {
        entry = new ToolbarMenuItem(`action:${index}`, caption, action.icon);
        if (action.kind == 1 /* toggle */)
          entry.checked = action.active;
      }
      entry.enabled = !readOnly && action.enabled;
      items.push(entry);
    });
    extra.forEach((entry, index) => {
      if (entry.isSeparator) {
        items.push(entry);
        return;
      }
      let copy = entry.hasChildren ? ToolbarMenuItem.submenu(`custom:${index}`, entry.caption, entry.icon, entry.children) : new ToolbarMenuItem(`custom:${index}`, entry.caption, entry.icon);
      copy.enabled = !readOnly && entry.enabled;
      copy.checked = entry.checked;
      items.push(copy);
    });
    let state = this.captureSelection();
    let menu = new PopupMenu(items, (chosen) => {
      this.restoreSelection(state);
      this.#performContextCommand(chosen, node, actions, extra);
    });
    menu.show(anchor, this.#element);
  }
  #performContextCommand(chosen, node, actions, extra) {
    let identifier = chosen.identifier;
    let host = this.#activeHost;
    switch (identifier) {
      case "undo":
        this.history.undo();
        return;
      case "redo":
        this.history.redo();
        return;
      case "cut":
        this.copyToClipboard(true);
        return;
      case "copy":
        this.copyToClipboard(false);
        return;
      case "paste":
        this.pasteFromClipboard();
        return;
      case "delete": {
        if (this.#readOnly)
          return;
        let range = host ? host.selection() : null;
        if (host && range && range.end > range.start) {
          this.deleteText(host, range.start, range.end);
        } else if (this.#selected.length > 0) {
          this.removeNodes(this.#selected);
        }
        return;
      }
      case "selectall": {
        if (host) {
          host.select(0, host.rich.length);
        } else {
          this.selection.selectAllNodes();
        }
        return;
      }
    }
    if (!node || this.#readOnly)
      return;
    let owner = (entries, target) => entries.some((entry2) => entry2 === target || entry2.hasChildren && owner(entry2.children, target));
    let actionIndex = identifier.startsWith("action:") ? Number(identifier.substring(7)) : actions.findIndex((action) => owner(action.menuItems, chosen));
    if (actionIndex >= 0 && actions[actionIndex]) {
      this.history.checkpoint();
      let action = actions[actionIndex];
      if (!node.performAction(action, action.menuItems.length > 0 ? chosen : null))
        this.dispatchEvent(new CustomEvent("toolbarItemPressed", { detail: { item: action, menuItem: chosen, node } }));
      this.#renderNodeToolbar();
      return;
    }
    let extraIndex = identifier.startsWith("custom:") ? Number(identifier.substring(7)) : extra.findIndex((entry2) => owner(entry2.children, chosen));
    let entry = extra[extraIndex];
    if (entry) {
      this.history.checkpoint();
      node.performContextMenuItem(entry.hasChildren ? chosen : entry);
      node.changed();
      this.#renderNodeToolbar();
    }
  }
  // Annotations
  /** Turns comments on or off: the margin markers, Add Comment and the popover. Threads in the document are kept. */
  get allowAnnotations() {
    return this.#allowAnnotations;
  }
  set allowAnnotations(value) {
    if (this.#allowAnnotations == value)
      return;
    this.#allowAnnotations = value;
    if (!value)
      this.annotations.close();
    this.#scheduleAnnotationMarkers();
    this.updateToolbarState();
    this.#renderNodeToolbar();
  }
  #annotationHandler() {
    let editor = this;
    return {
      selectionAnchor: (annotation) => editor.#selectionAnchor(annotation),
      containsNode: (node) => !!node && editor.nodeWithID(node.nodeId) === node,
      willChange: () => {
        editor.#syncAnnotations();
        editor.history.breakCoalescing();
        editor.history.checkpoint();
      },
      changed: (kind, annotation) => {
        editor.#isChanged = true;
        editor.#syncAnnotations();
        let name = kind == "added" ? "annotationAdded" : kind == "removed" ? "annotationRemoved" : "annotationChanged";
        editor.dispatchEvent(new CustomEvent(name, { detail: { annotation } }));
        editor.dispatchEvent(new CustomEvent("annotationsChanged", { detail: { annotation } }));
        editor.#collaborationClient?.editorAnnotationChanged(annotation, kind == "removed");
        editor.history.breakCoalescing();
        editor.annotations.refreshPopover();
        editor.#renderAnnotationMarkers();
        editor.updateToolbarState();
      },
      redraw: () => editor.#renderAnnotationMarkers(),
      reveal: (annotation) => {
        let node = editor.nodeWithID(annotation.nodeID);
        if (node && node.element)
          editor.revealNode(node);
        editor.#renderAnnotationMarkers();
        if (annotation.markerElement && annotation.markerElement.isConnected)
          return annotation.markerElement;
        return node && node.element ? node.element.getBoundingClientRect() : null;
      },
      selectionRect: () => {
        let host = editor.#activeHost;
        if (host) {
          let selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            let rects = selection.getRangeAt(0).getClientRects();
            if (rects.length > 0)
              return rects[0];
          }
        }
        let node = editor.selectedNode;
        return node && node.element ? node.element.getBoundingClientRect() : null;
      },
      segmentText: (node, segment) => {
        let host = node.hosts()[segment];
        return host ? host.rich.text : null;
      },
      segmentCount: (node) => node.hosts().length,
      get allowed() {
        return editor.#allowAnnotations;
      },
      get canChange() {
        return editor.#collaborationAnnotationsAllowed;
      },
      identity: () => editor.#collaborationClient ? editor.#collaborationClient.identity() : null,
      get container() {
        return editor.#element;
      },
      get strings() {
        return editor.strings;
      }
    };
  }
  /** Anchors annotation to the selected text while editing, or else the one selected node. */
  #selectionAnchor(annotation) {
    if (!this.#allowAnnotations || this.#selected.length != 1)
      return false;
    let node = this.#selected[0];
    let host = this.#activeHost;
    let range = host && host.node === node ? host.selection() : null;
    if (host && range && range.end > range.start) {
      let text = host.rich.text;
      annotation.setAnchor(node.nodeId, Math.max(0, node.hosts().indexOf(host)), range.start, range.end - range.start, false, text.substring(range.start, range.end), text);
    } else {
      annotation.setAnchor(node.nodeId, 0, 0, 0, true, "", "");
    }
    return true;
  }
  /** Keeps each annotation's anchor on its text, and notes which nodes are gone. */
  #syncAnnotations() {
    if (!this.annotations)
      return;
    this.annotations.items().forEach((item) => {
      let node = this.nodeWithID(item.nodeID);
      item.setNodeMissing(!node);
      if (!node || item.coversNode)
        return;
      let host = node.hosts()[item.segment];
      if (host && item.adjustToText(host.rich.text) && !this.#applyingRemote)
        this.#movedAnchorIDs.add(item.id);
    });
  }
  #scheduleAnnotationMarkers() {
    if (!this.#element)
      return;
    clearTimeout(this.#annotationTimer);
    this.#annotationTimer = setTimeout(() => this.#renderAnnotationMarkers(), 0);
  }
  /** The DOM range an annotation covers, or null for a whole node or an orphan. */
  #annotationRange(item, node) {
    if (item.coversNode || item.orphaned)
      return null;
    let host = node.hosts()[item.segment];
    if (!host || !host.element.isConnected)
      return null;
    let start = host.positionOf(item.start);
    let end = host.positionOf(item.start + item.length);
    let range = document.createRange();
    try {
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
    } catch {
      return null;
    }
    return range;
  }
  /**
   * Marks comments in the document's trailing margin, or its leading margin in a
   * right-to-left document: one speech bubble per line that has comments, counting
   * those in its open threads, muted when all of them are resolved. Text is
   * highlighted only for the open thread and for the line whose marker is pointed at.
   */
  #renderAnnotationMarkers() {
    clearTimeout(this.#annotationTimer);
    let layer = this.#annotationLayer;
    if (!layer || !this.#pageElement || !this.#documentElement)
      return;
    layer.textContent = "";
    this.#syncAnnotations();
    let items = this.annotations.items();
    items.forEach((item) => item.markerElement = null);
    if (!this.#allowAnnotations || items.length == 0) {
      this.#applyAnnotationHighlights([], []);
      return;
    }
    let page = this.#pageElement.getBoundingClientRect();
    let documentRect = this.#documentElement.getBoundingClientRect();
    let documentStyle = getComputedStyle(this.#documentElement);
    let rightToLeft = documentStyle.direction == "rtl";
    let contentLeft = documentRect.left + parseFloat(documentStyle.paddingLeft || "0");
    let contentRight = documentRect.right - parseFloat(documentStyle.paddingRight || "0");
    let lines = [];
    let ranges = /* @__PURE__ */ new Map();
    items.forEach((item) => {
      let node = this.nodeWithID(item.nodeID);
      if (!node || !node.element || !node.element.isConnected)
        return;
      let range = this.#annotationRange(item, node);
      if (range)
        ranges.set(item, range);
      let rects = range ? Array.from(range.getClientRects()).filter((rect) => rect.width > 0 || rect.height > 0) : [];
      let anchorTop;
      let anchorHeight;
      if (rects.length > 0) {
        anchorTop = rects[0].top;
        anchorHeight = rects[0].height;
      } else {
        let host = node.primaryHost;
        let first = host && host.element.isConnected ? host.element.getClientRects()[0] : null;
        let frame = (node.body || node.element).getBoundingClientRect();
        anchorTop = frame.top;
        anchorHeight = Math.min(frame.height, first ? Math.min(first.height, 24) : 24);
        let lineHeight = parseFloat(getComputedStyle(host ? host.element : node.element).lineHeight);
        if (isFinite(lineHeight) && lineHeight > 0)
          anchorHeight = Math.min(frame.height, lineHeight);
      }
      let key = `${node.nodeId}:${Math.round(anchorTop)}`;
      let line = lines.find((entry) => entry.key == key);
      if (!line) {
        line = { key, top: anchorTop, height: anchorHeight, count: 0, open: false, first: item, items: [] };
        lines.push(line);
      }
      if (!item.resolved && !line.open) {
        line.open = true;
        line.count = 0;
        line.first = item;
      }
      if (!item.resolved || !line.open)
        line.count += item.lastCommentIndex + 1;
      line.items.push(item);
    });
    let strings = this.strings;
    lines.forEach((line) => {
      let marker = Utilities.element("button", `scv-annotation-marker${line.open ? "" : " scv-annotation-resolved"}`, { type: "button", "aria-label": `${strings.TextCommentsCaption}: ${line.count}`, title: strings.TextCommentsCaption });
      marker.append(Utilities.element("i", "bi bi-chat-fill"));
      let count = Utilities.element("span", "scv-annotation-count");
      count.textContent = String(line.count);
      marker.append(count);
      let width = 30;
      let height = 20;
      let left = rightToLeft ? contentLeft - 8 - width : contentRight + 8;
      left = Utilities.clamp(left - page.left, 0, Math.max(0, page.width - width));
      marker.style.left = `${left}px`;
      marker.style.top = `${Math.round(line.top - page.top + (line.height - height) / 2)}px`;
      marker.addEventListener("mousedown", (event) => event.preventDefault());
      marker.addEventListener("mouseenter", () => {
        this.#hoveredAnnotationLine = line.key;
        this.#applyAnnotationHighlights(lines.flatMap((entry) => entry.key == line.key ? entry.items : []), ranges);
      });
      marker.addEventListener("mouseleave", () => {
        this.#hoveredAnnotationLine = "";
        this.#applyAnnotationHighlights([], ranges);
      });
      marker.addEventListener("click", () => {
        let selectedEvent = new CustomEvent("annotationSelected", { detail: { annotation: line.first }, cancelable: true });
        if (this.dispatchEvent(selectedEvent))
          this.annotations.show(line.first);
      });
      line.items.forEach((item) => item.markerElement = marker);
      layer.append(marker);
    });
    let hovered = this.#hoveredAnnotationLine.length > 0 ? lines.filter((line) => line.key == this.#hoveredAnnotationLine).flatMap((line) => line.items) : [];
    this.#applyAnnotationHighlights(hovered, ranges);
  }
  static #highlights = null;
  /** Highlights the text of the selected annotation and of the hovered ones, with the CSS Custom Highlight API where it exists. */
  #applyAnnotationHighlights(hovered, ranges) {
    let registry = globalThis.CSS && CSS.highlights;
    let HighlightClass = globalThis.Highlight;
    if (!registry || !HighlightClass)
      return;
    if (!_Editor.#highlights) {
      _Editor.#highlights = { open: new HighlightClass(), resolved: new HighlightClass(), selected: new HighlightClass() };
      registry.set("scv-annotation", _Editor.#highlights.open);
      registry.set("scv-annotation-resolved", _Editor.#highlights.resolved);
      registry.set("scv-annotation-selected", _Editor.#highlights.selected);
    }
    let highlights = _Editor.#highlights;
    this.#annotationRanges.forEach((range) => {
      highlights.open.delete(range);
      highlights.resolved.delete(range);
      highlights.selected.delete(range);
    });
    this.#annotationRanges = [];
    if (!(ranges instanceof Map))
      return;
    let selected = this.annotations.selected;
    ranges.forEach((range, item) => {
      if (item === selected) {
        highlights.selected.add(range);
      } else if (hovered.indexOf(item) >= 0) {
        (item.resolved ? highlights.resolved : highlights.open).add(range);
      } else {
        return;
      }
      this.#annotationRanges.push(range);
    });
  }
  /** The comment threads as a section after the content, for toHTML. */
  #annotationsHTML() {
    this.#syncAnnotations();
    let strings = this.strings;
    let items = this.annotations.items().map((item) => {
      let json = item.toJSON();
      let entry = `<li class="annotation${item.resolved ? " resolved" : ""}" id="annotation-${Utilities.escapeAttribute(item.id)}" data-node-id="${Utilities.escapeAttribute(item.nodeID)}"`;
      entry += item.coversNode ? ` data-covers-node="true"` : ` data-segment="${json.segment}" data-start="${json.start}" data-length="${json.length}"`;
      if (item.resolved)
        entry += ` data-resolved="true"`;
      entry += ">";
      if (item.quote.length > 0)
        entry += `<blockquote>${Utilities.escapeText(item.quote)}</blockquote>`;
      item.comments().forEach((comment) => {
        let author = comment.authorName.length > 0 ? comment.authorName : strings.TextDefaultAuthorCaption;
        let stamp = comment.created.toISOString().substring(0, 19);
        let shown = comment.created.toLocaleString(void 0, { dateStyle: "medium", timeStyle: "short" });
        entry += `<p class="comment" data-author-id="${Utilities.escapeAttribute(comment.authorID)}"><strong>${Utilities.escapeText(author)}</strong> <time datetime="${stamp}">${Utilities.escapeText(shown)}</time><br>${Utilities.escapeText(comment.text).replace(/\r\n|\r|\n/g, "<br>")}</p>`;
      });
      return `${entry}</li>`;
    });
    if (items.length == 0)
      return "";
    return `
<section class="annotations" data-scriviamo-annotations="true" style="border-top:1px solid #d0d7de;margin-top:2em;padding-top:1em;font-size:.9em"><h2>${Utilities.escapeText(strings.TextCommentsCaption)}</h2><ol>${items.join("")}</ol></section>`;
  }
  // Suggestions
  static #untagged(style) {
    let result = style.clone();
    result.suggestionProviderIdentifier = "";
    result.suggestionIdentifier = "";
    result.suggestionTextColor = Colors.clone(TextStyle.defaults.suggestionTextColor);
    result.suggestionBackgroundColor = Colors.clone(TextStyle.defaults.suggestionBackgroundColor);
    result.suggestionBorderColor = Colors.clone(TextStyle.defaults.suggestionBorderColor);
    return result;
  }
  /** The providers asked for a host: its node's own provider, or else the editor's. */
  #providersFor(host) {
    let own = host.node.suggestionProvider;
    return own ? [own] : this.suggestionProviders.items();
  }
  /** True while the suggestion popup is showing. */
  get suggestionsVisible() {
    return !!this.#suggestionState;
  }
  /** Asks the providers about the text before the caret, and shows or hides the suggestion popup. */
  #updateSuggestions(host) {
    let serial = ++this.#suggestionSerial;
    let range = host ? host.selection() : null;
    if (!host || !range || range.start != range.end || this.#readOnly || host.mode == 3 /* plain */ || !host.editable) {
      this.#closeSuggestions();
      return;
    }
    let caret = range.start;
    let textBeforeCaret = host.rich.text.substring(0, caret);
    let provider = null;
    let request = null;
    this.#providersFor(host).forEach((candidate) => {
      let candidateRequest = candidate.match(textBeforeCaret, caret, host);
      if (!candidateRequest)
        return;
      if (!request || candidateRequest.startPosition > request.startPosition) {
        request = candidateRequest;
        provider = candidate;
      }
    });
    if (!provider || !request) {
      this.#closeSuggestions();
      return;
    }
    let chosenProvider = provider;
    let chosenRequest = request;
    let show = (items) => {
      if (serial != this.#suggestionSerial)
        return;
      if (!Array.isArray(items) || items.length == 0) {
        this.#closeSuggestions();
        return;
      }
      this.#showSuggestions(host, chosenProvider, chosenRequest, items);
    };
    let result = chosenProvider.suggestions(chosenRequest, 6);
    if (Array.isArray(result)) {
      show(result);
    } else {
      Promise.resolve(result).then(show, () => {
        if (serial == this.#suggestionSerial)
          this.#closeSuggestions();
      });
    }
  }
  #showSuggestions(host, provider, request, items) {
    this.#suggestionState = { host, provider, request, items };
    let choices = items.map((suggestion, index) => ({
      caption: suggestion.caption,
      value: index,
      icon: suggestion.icon,
      detail: suggestion.detail,
      render: (element, selected) => suggestion.render(element, selected)
    }));
    let popup = this.#suggestionPopup;
    if (!popup) {
      popup = new ChoicePopup("scv-suggestions", (item) => this.#commitSuggestion(item.value));
      popup.label = this.strings.TextSuggestionsCaption;
      popup.tabChooses = true;
      popup.anchorProvider = () => {
        let state = this.#suggestionState;
        return state ? state.host.caretRect() : null;
      };
      popup.element.setAttribute("aria-label", this.strings.TextSuggestionsCaption);
      popup.onClose = () => {
        if (this.#suggestionPopup === popup && !popup.chosen) {
          this.#suggestionState = null;
          this.#suggestionPopup = null;
        }
      };
      this.#suggestionPopup = popup;
    }
    popup.setItems(choices);
    let caretRect = host.caretRect() || host.element.getBoundingClientRect();
    if (popup.isOpen) {
      popup.position();
    } else {
      popup.show(caretRect, this.#element || document.body);
    }
  }
  #closeSuggestions() {
    this.#suggestionSerial++;
    let popup = this.#suggestionPopup;
    this.#suggestionState = null;
    this.#suggestionPopup = null;
    if (popup)
      popup.close();
  }
  #commitSuggestion(index) {
    let state = this.#suggestionState;
    this.#suggestionState = null;
    this.#suggestionPopup = null;
    if (!state || !state.items[index] || this.#readOnly)
      return;
    let host = state.host;
    this.history.breakCoalescing();
    this.history.checkpoint();
    let base = this.#pending && this.#pending.host === host ? this.#pending.style : host.rich.insertionStyleAt(state.request.startPosition);
    let caret = state.provider.commitSuggestion(host, state.request, state.items[index], _Editor.#untagged(base));
    if (caret < 0)
      return;
    host.render();
    host.select(caret);
    let inserted = host.rich.styleAt(caret - 1);
    if (inserted.suggestionProviderIdentifier.length > 0)
      this.setPendingStyle(host, caret, _Editor.#untagged(inserted));
    host.node.textChanged(host);
    host.node.changed();
    this.history.breakCoalescing();
    this.updateToolbarState();
    this.dispatchEvent(new CustomEvent("suggestionCommitted", { detail: { node: host.node, provider: state.provider, suggestion: state.items[index] } }));
  }
  /**
   * Turns plain trigger text that exactly matches a provider's suggestion into a
   * committed tag, as when the text was loaded or pasted. Called for nodes as they
   * are added or loaded.
   */
  recognizeSuggestions(nodes) {
    let visit = (node) => {
      node.hosts().forEach((host) => {
        if (host.mode == 3 /* plain */ || host.rich.length == 0)
          return;
        let own = node.suggestionProvider;
        let providers = own ? [own].concat(this.suggestionProviders.items().filter((item) => item !== own)) : this.suggestionProviders.items();
        let changed = false;
        providers.forEach((provider) => {
          if (this.#recognize(host, provider))
            changed = true;
        });
        if (changed)
          host.render();
      });
      node.descendants().forEach((child) => visit(child));
    };
    nodes.forEach((node) => visit(node));
  }
  #recognize(host, provider) {
    if (provider.trigger.length > 0 && host.rich.text.indexOf(provider.trigger) < 0)
      return false;
    let changed = false;
    let caret = 1;
    while (caret <= host.rich.length) {
      let text = host.rich.text;
      let request = provider.match(text.substring(0, caret), caret, host);
      if (request && request.length > 0 && request.startPosition + request.length <= text.length) {
        let existing = host.rich.styleAt(request.startPosition);
        if (existing.suggestionProviderIdentifier.length == 0) {
          let matched = text.substring(request.startPosition, request.startPosition + request.length);
          let found = provider.suggestions(request, Math.max(6, provider.lastIndex + 1));
          if (Array.isArray(found)) {
            let suggestion = found.find((item) => item && item.insertText == matched);
            if (suggestion) {
              let committed = provider.commitSuggestion(host, request, suggestion, existing);
              if (committed >= 0) {
                caret = committed;
                changed = true;
              }
            }
          }
        }
      }
      caret++;
    }
    return changed;
  }
  // Pointer
  #nodeFromElement(element) {
    let nodeElement = element ? element.closest(".scv-node") : null;
    if (!nodeElement || !this.#documentElement.contains(nodeElement))
      return null;
    let identifier = nodeElement.dataset.nodeId;
    return this.allNodes().find((node) => node.nodeId == identifier) || null;
  }
  #onMouseDown(event) {
    let target = event.target;
    let node = this.#nodeFromElement(target);
    if (!node)
      return;
    let host = TextHost.from(target, this.#documentElement);
    let modifier = event.shiftKey || event.metaKey || event.ctrlKey;
    if (host && host.editable) {
      if (event.shiftKey && !host.element.contains(document.activeElement)) {
        event.preventDefault();
        this.selectNode(node, true);
      }
      return;
    }
    if (host && this.#readOnly) {
      if (this.#selected.length != 1 || this.#selected[0] !== node)
        this.#setSelection([node], false);
      return;
    }
    if (host && event.detail >= 2 && event.button == 0 && !modifier && !node.locked && !target.closest(".scv-widget")) {
      event.preventDefault();
      let point = _Editor.caretFromPoint(event.clientX, event.clientY);
      let offset = point && host.element.contains(point.node) ? host.offsetOf(point.node, point.offset) : void 0;
      this.focusNode(node, offset, host.index);
      return;
    }
    if (target.closest("input, select, textarea, button, a, .scv-widget, .scv-resize-handle, .scv-image-buttons")) {
      if (!target.closest(".scv-widget"))
        this.#setSelection([node], true);
      return;
    }
    event.preventDefault();
    if (modifier && this.#selected.indexOf(node) >= 0 && this.#selected.length > 1) {
      this.selectNodes(this.#selected.filter((item) => item !== node));
    } else {
      this.selectNode(node, modifier);
    }
  }
  /**
   * A press on empty space selects the document: no node is selected or edited. In an empty
   * document it starts a paragraph instead, and a double-click below the last node continues
   * typing there.
   */
  #onBlankPress(event) {
    if (event.button != 0)
      return;
    if (this.#nodes.length == 0) {
      if (this.#readOnly)
        return;
      event.preventDefault();
      this.#startEmptyDocument();
      return;
    }
    let last = this.#nodes[this.#nodes.length - 1];
    let below = !!last && !!last.element && event.clientY >= last.element.getBoundingClientRect().bottom;
    if (event.detail < 2 || !below || this.#readOnly) {
      event.preventDefault();
      if (this.#selected.length > 0 || this.#editingNode)
        this.selectNodes([]);
      this.#documentElement.focus({ preventScroll: true });
      return;
    }
    event.preventDefault();
    if (last instanceof TextNode2 && last.constructor === TextNode2) {
      this.focusNode(last);
    } else {
      let paragraph = new TextNode2();
      this.addNode(paragraph);
      this.focusNode(paragraph, 0);
    }
  }
  /**
   * An empty document has no nodes. Clicking or tabbing into it starts a paragraph
   * to type in; an empty paragraph isn't a change to the document.
   */
  #startEmptyDocument() {
    if (this.#nodes.length > 0 || this.#readOnly)
      return;
    let changed = this.#isChanged;
    let paragraph = new TextNode2();
    this.history.suspend(() => this.addNode(paragraph));
    this.#isChanged = changed;
    this.focusNode(paragraph, 0);
  }
  #onClick(event) {
    let target = event.target;
    let node = this.#nodeFromElement(target);
    if (!node)
      return;
    if (node.handleClick(event))
      return;
    let link = target.closest("a[href]");
    if (link && TextHost.from(link, this.#documentElement)) {
      event.preventDefault();
      let modifier = _Editor.isMac ? event.metaKey : event.ctrlKey;
      if (!modifier && !this.#readOnly)
        return;
      let url = link.getAttribute("href") || "";
      let detail = { node, url, text: link.textContent || "", title: link.title || "" };
      let pressed = new CustomEvent("linkPressed", { detail, cancelable: true });
      if (this.dispatchEvent(pressed))
        window.open(url, "_blank", "noopener");
    }
  }
  // Gutter and dragging
  #buildGutter() {
    let gutter = this.#gutterElement;
    let add = Utilities.element("button", "scv-gutter-button scv-gutter-add", { type: "button", title: this.strings.TextInsertTooltip, "aria-label": this.strings.TextInsertTooltip });
    add.innerHTML = `<i class="bi bi-plus-lg"></i>`;
    add.addEventListener("mousedown", (event) => event.preventDefault());
    add.addEventListener("click", () => {
      let node = this.#hoverNode;
      if (!node)
        return;
      let replace = node.constructor === TextNode2 && node.content.length == 0 ? node : null;
      if (!replace) {
        this.selectNode(node);
      }
      this.showInsertionChooser(add, replace);
    });
    let grip = Utilities.element("button", "scv-gutter-button scv-gutter-grip", { type: "button", draggable: "true", title: this.strings.TextDragHandleTooltip, "aria-label": this.strings.TextDragHandleTooltip });
    grip.innerHTML = `<i class="bi bi-grip-vertical"></i>`;
    grip.addEventListener("mousedown", (event) => event.stopPropagation());
    grip.addEventListener("click", () => {
      let node = this.#hoverNode;
      if (!node)
        return;
      if (this.#selected.indexOf(node) < 0 || this.#selected.length < 2)
        this.selectNode(node);
      this.#showNodeMenu(node, grip);
    });
    grip.addEventListener("dragstart", (event) => this.#beginNodeDrag(this.#hoverNode, event));
    grip.addEventListener("dragend", () => this.#endNodeDrag());
    gutter.append(add, grip);
  }
  /** Starts dragging a node, from the gutter or from its toolbar's move grip. */
  #beginNodeDrag(node, event) {
    if (!node || this.#readOnly || node.locked) {
      event.preventDefault();
      return;
    }
    Popup2.closeAll();
    this.#dragNode = node;
    this.#dragNodes = this.#selected.length > 1 && this.#selected.indexOf(node) >= 0 ? this.inDocumentOrder(this.#selected).filter((item) => !item.locked) : [node];
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", this.#dragNodes.map((item) => item.toPlainText()).join("\n"));
    if (node.element)
      event.dataTransfer.setDragImage(node.element, 0, 0);
    this.#dragNodes.forEach((item) => item.element?.classList.add("scv-dragging"));
  }
  #endNodeDrag() {
    this.#dragNodes.forEach((item) => item.element?.classList.remove("scv-dragging"));
    this.#dragNode = null;
    this.#dragNodes = [];
    this.#dropIndicator.classList.add("d-none");
  }
  #onHover(event) {
    if (!this.isHoverInsertionEnabled || this.#readOnly || this.#dragNode)
      return;
    let target = event.target;
    if (this.#gutterElement.contains(target))
      return;
    let node = this.#nodeFromElement(target);
    while (node && node.parent && !node.parent.holdsBlocks)
      node = node.parent;
    if (!node)
      node = this.#gutterNodeAt(event.clientY);
    if (!node)
      return;
    if (node !== this.#hoverNode || this.#gutterElement.classList.contains("d-none"))
      this.#positionGutter(node);
  }
  /** The deepest block that gets a gutter whose vertical extent includes y. */
  #gutterNodeAt(y) {
    let result = null;
    this.allNodes().forEach((node) => {
      if (node.parent && !node.parent.holdsBlocks)
        return;
      let element = node.element;
      if (!element || element.offsetParent === null)
        return;
      let rect = element.getBoundingClientRect();
      let slack = parseFloat(getComputedStyle(element).marginBottom) / 2 + 2;
      if (y >= rect.top - slack && y <= rect.bottom + slack)
        result = node;
    });
    return result;
  }
  #positionGutter(node) {
    this.#hoverNode = node;
    let gutter = this.#gutterElement;
    if (!node || !node.element || !this.isHoverInsertionEnabled || this.#readOnly) {
      gutter.classList.add("d-none");
      return;
    }
    let page = this.#pageElement.getBoundingClientRect();
    let rect = node.element.getBoundingClientRect();
    let firstLine = node.primaryHost ? node.primaryHost.element.getBoundingClientRect() : rect;
    let lineHeight = parseFloat(getComputedStyle(node.primaryHost ? node.primaryHost.element : node.element).lineHeight) || 24;
    gutter.classList.remove("d-none");
    let top = firstLine.top - page.top + Math.max(0, (Math.min(lineHeight, firstLine.height) - gutter.offsetHeight) / 2);
    gutter.style.top = `${top}px`;
    let rightToLeft = getComputedStyle(this.#documentElement).direction == "rtl";
    if (rightToLeft) {
      gutter.style.left = `${rect.right - page.left + 4}px`;
    } else {
      gutter.style.left = `${rect.left - page.left - gutter.offsetWidth - 4}px`;
    }
  }
  #onDragOver(event) {
    let files = event.dataTransfer && Array.from(event.dataTransfer.types).indexOf("Files") >= 0;
    if (!this.#dragNode && !files)
      return;
    if (this.#readOnly)
      return;
    event.preventDefault();
    event.dataTransfer.dropEffect = this.#dragNode ? "move" : "copy";
    let element = document.elementFromPoint(event.clientX, event.clientY);
    let node = element ? this.#nodeFromElement(element) : null;
    while (node && node.parent && !node.parent.holdsBlocks)
      node = node.parent;
    if (!node)
      node = this.#gutterNodeAt(event.clientY);
    if (this.#dragNode && node && this.#dragNodes.some((dragged) => node === dragged || dragged.descendants().indexOf(node) >= 0))
      node = null;
    let indicator = this.#dropIndicator;
    let page = this.#pageElement.getBoundingClientRect();
    if (!node || !node.element) {
      let last = this.#nodes[this.#nodes.length - 1];
      if (!last || !last.element || event.clientY < last.element.getBoundingClientRect().bottom) {
        indicator.classList.add("d-none");
        this.#dropTarget = null;
        return;
      }
      node = last;
    }
    let list = this.listContaining(node);
    let rect = node.element.getBoundingClientRect();
    let after = event.clientY > rect.top + rect.height / 2;
    this.#dropTarget = { list, index: list.indexOf(node) + (after ? 1 : 0), owner: node.parent };
    if (this.#dragNode) {
      let detail = { node: this.#dragNode, nodes: this.#dragNodes.slice(), beforeNode: list[this.#dropTarget.index] || null, parentNode: node.parent, x: event.clientX, y: event.clientY };
      if (!this.dispatchEvent(new CustomEvent("nodeDragging", { detail, cancelable: true }))) {
        event.dataTransfer.dropEffect = "none";
        indicator.classList.add("d-none");
        this.#dropTarget = null;
        return;
      }
    }
    indicator.classList.remove("d-none");
    indicator.style.top = `${(after ? rect.bottom : rect.top) - page.top - 2}px`;
    indicator.style.left = `${rect.left - page.left}px`;
    indicator.style.width = `${rect.width}px`;
  }
  #onDrop(event) {
    let target = this.#dropTarget;
    this.#dropIndicator.classList.add("d-none");
    this.#dropTarget = null;
    if (this.#dragNode) {
      event.preventDefault();
      let node = this.#dragNode;
      let nodes2 = this.#dragNodes.slice();
      this.#endNodeDrag();
      if (!target)
        return;
      let detail = { node, nodes: nodes2, beforeNode: target.list[target.index] || null, parentNode: target.owner };
      if (!this.dispatchEvent(new CustomEvent("nodeDropped", { detail, cancelable: true })))
        return;
      this.moveNodesTo(nodes2, target.list, target.index);
      return;
    }
    let files = event.dataTransfer ? Array.from(event.dataTransfer.files) : [];
    if (files.length == 0 || this.#readOnly)
      return;
    event.preventDefault();
    let nodes = this.nodesForFiles(files);
    if (nodes.length == 0)
      return;
    if (target) {
      this.insertNodes(target.list, target.index, nodes, target.owner);
    } else {
      nodes.forEach((node) => this.addNode(node));
    }
    this.selectNode(nodes[nodes.length - 1]);
  }
  /** The registered node type that takes a file: the one with the highest import priority whose droppedFileTypes match. */
  #typeForFile(file) {
    let name = (file.name || "").toLowerCase();
    let mime = (file.type || "").toLowerCase();
    let best = null;
    let bestPriority = -Infinity;
    this.nodeTypes.items().forEach((type) => {
      let accepted = type.droppedFileTypes || [];
      let matches = accepted.some((pattern) => {
        pattern = pattern.toLowerCase();
        if (pattern == "*")
          return true;
        if (pattern.startsWith("."))
          return name.endsWith(pattern);
        if (pattern.endsWith("/*"))
          return mime.startsWith(pattern.substring(0, pattern.length - 1));
        return mime == pattern;
      });
      let priority = Number(type.droppedFileImportPriority) || 0;
      if (matches && priority > bestPriority) {
        best = type;
        bestPriority = priority;
      }
    });
    return best;
  }
  /** Nodes made from files, by the node types that accept them. Files no type accepts are skipped. */
  nodesForFiles(files) {
    let result = [];
    files.forEach((file) => {
      let type = this.#typeForFile(file);
      let importer = type ? type.importDroppedFile : null;
      let node = typeof importer == "function" ? importer.call(type, file, this) : null;
      if (node)
        result.push(node);
    });
    return result;
  }
  // Pointer events
  #pointerNode = null;
  /**
   * The top-level node under a point, or the nearest one, and the point as fractions of that
   * node's bounds. Another editor, whose layout differs, places a pointer over the same content
   * from it.
   */
  #pointerAnchor(clientX, clientY) {
    let result = null;
    let nearest = -1;
    for (let node of this.#nodes) {
      if (!node.element || !node.element.isConnected)
        continue;
      let rect = node.element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0)
        continue;
      let distance = clientY < rect.top ? rect.top - clientY : clientY > rect.bottom ? clientY - rect.bottom : 0;
      if (nearest < 0 || distance < nearest) {
        nearest = distance;
        result = { nodeID: node.nodeId, x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
      }
      if (distance == 0)
        break;
    }
    return result;
  }
  #pointerDetail(event) {
    let rect = this.#element ? this.#element.getBoundingClientRect() : new DOMRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  /** Raises nodePointerEnter, nodePointerExit and nodePointerMove for the innermost node under the pointer. */
  #notePointerNode(event) {
    let node = this.#nodeFromElement(event.target);
    this.#setPointerNode(node);
    if (node && node.element) {
      let rect = node.element.getBoundingClientRect();
      this.dispatchEvent(new CustomEvent("nodePointerMove", { detail: { node, x: event.clientX - rect.left, y: event.clientY - rect.top } }));
    }
  }
  #setPointerNode(node) {
    if (node === this.#pointerNode)
      return;
    let previous = this.#pointerNode;
    this.#pointerNode = node;
    if (previous)
      this.dispatchEvent(new CustomEvent("nodePointerExit", { detail: { node: previous } }));
    if (node)
      this.dispatchEvent(new CustomEvent("nodePointerEnter", { detail: { node } }));
  }
  // Clipboard
  #onCopy(event, cut) {
    let eventHost = TextHost.from(event.target, this.#documentElement);
    if (eventHost)
      this.#activeHost = eventHost;
    let host = this.#activeHost;
    let range = host ? host.selection() : null;
    let data = event.clipboardData;
    if (!data)
      return;
    if (host && range && range.end > range.start) {
      let slice = host.rich.slice(range.start, range.end);
      event.preventDefault();
      data.setData("text/plain", slice.text.replace(/\u2028/g, "\n"));
      data.setData("text/html", host.mode == 3 /* plain */ ? `<pre>${Utilities.escapeText(slice.text)}</pre>` : slice.htmlText());
      try {
        data.setData(ClipboardType, JSON.stringify({ kind: "text", content: slice.toJSON() }));
      } catch {
      }
      if (cut && !this.#readOnly)
        this.deleteText(host, range.start, range.end);
      return;
    }
    if (!host && this.#selected.length > 0 && this.#documentElement.contains(document.activeElement)) {
      event.preventDefault();
      let nodes = this.inDocumentOrder(this.#selected);
      data.setData("text/plain", nodes.map((node) => node.toPlainText()).join("\n"));
      data.setData("text/html", nodes.filter((node) => node.canExportHTML).map((node) => node.toHTML()).join("\n"));
      try {
        data.setData(ClipboardType, JSON.stringify({ kind: "nodes", nodes: nodes.map((node) => node.toJSON()) }));
      } catch {
      }
      if (cut && !this.#readOnly)
        this.removeNodes(nodes);
    }
  }
  /** Copies (or cuts) the selection, as the Copy and Cut commands do. */
  copyToClipboard(cut) {
    document.execCommand(cut ? "cut" : "copy");
  }
  /** Pastes from the system clipboard, when the browser allows reading it. */
  async pasteFromClipboard() {
    if (this.#readOnly)
      return;
    let state = this.captureSelection();
    let html = "";
    let text = "";
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        let items = await navigator.clipboard.read();
        for (let item of items) {
          if (item.types.indexOf("text/html") >= 0)
            html = await (await item.getType("text/html")).text();
          if (item.types.indexOf("text/plain") >= 0)
            text = await (await item.getType("text/plain")).text();
        }
      } else if (navigator.clipboard) {
        text = await navigator.clipboard.readText();
      }
    } catch {
      return;
    }
    this.restoreSelection(state);
    this.#paste({ json: "", html, text, files: [] });
  }
  #onPaste(event) {
    let data = event.clipboardData;
    if (!data)
      return;
    let target = event.target;
    if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName))
      return;
    event.preventDefault();
    if (this.#readOnly)
      return;
    let eventHost = TextHost.from(target, this.#documentElement);
    if (eventHost)
      this.#activeHost = eventHost;
    let files = Array.from(data.files || []).filter((file) => this.#typeForFile(file) !== null);
    this.#paste({ json: data.getData(ClipboardType), html: data.getData("text/html"), text: data.getData("text/plain"), files });
  }
  #paste(data) {
    let host = this.#activeHost;
    if (data.files.length > 0 && (!host || host.mode != 3 /* plain */)) {
      let nodes = this.nodesForFiles(data.files);
      if (nodes.length > 0) {
        this.#insertNodesAtCaret(nodes);
        return;
      }
    }
    if (data.json.length > 0) {
      try {
        let parsed = JSON.parse(data.json);
        if (parsed.kind == "text" && host) {
          this.#insertRich(host, RichText.fromJSON(parsed.content));
          return;
        }
        if (parsed.kind == "nodes" && Array.isArray(parsed.nodes)) {
          let nodes = parsed.nodes.map((item) => this.nodeFromJSON(_Editor.renewIDs(item))).filter((node) => node !== null);
          if (host && nodes.length == 1 && nodes[0].constructor === TextNode2) {
            this.#insertRich(host, nodes[0].content);
          } else {
            this.#insertNodesAtCaret(nodes);
          }
          return;
        }
      } catch {
      }
    }
    if (host && host.mode == 3 /* plain */) {
      this.#insertRich(host, new RichText(data.text));
      return;
    }
    if (data.html.trim().length > 0) {
      let nodes = this.importer.import(PasteCleanup.clean(data.html));
      if (nodes.length == 0 && data.text.length == 0)
        return;
      if (nodes.length > 0) {
        let single = nodes.length == 1 && nodes[0].constructor === TextNode2;
        if (host && (single || host.mode != 0 /* inline */ || host !== host.node.primaryHost)) {
          let rich = new RichText();
          nodes.forEach((node, index) => {
            if (index > 0)
              rich.insert(rich.length, host.mode == 1 /* multiline */ ? ParagraphBreak : LineBreak);
            if (node instanceof TextNode2) {
              rich.append(node.content);
            } else {
              rich.insert(rich.length, node.toPlainText().replace(/\n/g, LineBreak));
            }
          });
          this.#insertRich(host, rich);
        } else {
          this.#insertNodesAtCaret(nodes);
        }
        return;
      }
    }
    let text = data.text.replace(/\r\n?/g, "\n");
    if (text.length == 0)
      return;
    if (host && host.mode == 0 /* inline */ && host === host.node.primaryHost && host.node.constructor === TextNode2 && /\n/.test(text.trim())) {
      let paragraphs2 = text.split(/\n{2,}|\n/).map((line) => {
        let paragraph = new TextNode2();
        paragraph.content = new RichText(line, host.rich.insertionStyleAt(0));
        return paragraph;
      });
      this.#insertNodesAtCaret(paragraphs2);
      return;
    }
    if (host) {
      this.#insertRich(host, this.#textToRich(host, text));
      return;
    }
    let paragraphs = text.split(/\n/).map((line) => new TextNode2(line));
    this.#insertNodesAtCaret(paragraphs);
  }
  /** Inserts blocks where the caret is, splitting the paragraph being edited around them. */
  #insertNodesAtCaret(nodes) {
    if (nodes.length == 0)
      return;
    let host = this.#activeHost;
    this.history.checkpoint();
    this.history.suspend(() => {
      let point = host && host.node instanceof TableNode ? host.node.insertionPoint(host) : null;
      if (host && point) {
        this.insertNodes(point.list, point.index, nodes, host.node);
      } else if (host && host.node instanceof TextNode2 && host === host.node.primaryHost && host.mode == 0 /* inline */ && host.node.isTextBlock) {
        let node = host.node;
        let range = host.selection() || { start: node.content.length, end: node.content.length };
        node.content.remove(range.start, range.end);
        let tail = node.content.slice(range.start);
        node.content.remove(range.start, node.content.length);
        let additions = nodes.slice();
        if (tail.length > 0) {
          let following = node.createFollowingNode();
          following.content = tail;
          additions.push(following);
        }
        if (node.content.length == 0 && node.constructor === TextNode2) {
          this.replaceNode(node, additions);
        } else {
          host.render();
          this.insertNodesAfter(node, additions);
        }
      } else if (host || this.selectedNode) {
        let ordered = this.inDocumentOrder(this.#selected);
        this.insertNodesAfter(host ? host.node : ordered[ordered.length - 1], nodes);
      } else {
        nodes.forEach((node) => this.addNode(node));
      }
    });
    let last = nodes[nodes.length - 1];
    if (last.hosts().length > 0) {
      this.focusNode(last);
    } else {
      this.selectNode(last);
    }
  }
  // Toolbar
  #buildDefaultToolbar() {
    let strings = this.strings;
    let items = this.toolbarItems;
    let add = (identifier, caption, icon, kind = 0 /* button */, alwaysShowCaption = false) => {
      let item = new ToolbarItem(identifier, caption, icon, kind);
      item.alwaysShowCaption = alwaysShowCaption;
      items.add(item);
      return item;
    };
    add("insert", strings.TextInsertCaption, "bi bi-plus-lg", 2 /* menu */, true).tooltip = strings.TextInsertTooltip;
    items.add(this.#catalogItem("table"));
    items.add(ToolbarItem.separator());
    add("undo", strings.TextUndoCaption, "bi bi-arrow-counterclockwise");
    add("redo", strings.TextRedoCaption, "bi bi-arrow-clockwise");
    items.add(ToolbarItem.separator());
    add("blocktype", strings.TextTextCaption, "", 2 /* menu */, true).tooltip = strings.TextBlockTypeCaption;
    add("font", strings.TextDefault, "", 2 /* menu */, true).tooltip = strings.TextFontCaption;
    add("size", strings.TextDefault, "", 2 /* menu */, true).tooltip = strings.TextFontSizeMenuCaption;
    items.add(ToolbarItem.separator());
    add("bold", strings.TextBoldCaption, "bi bi-type-bold", 1 /* toggle */);
    add("italic", strings.TextItalicCaption, "bi bi-type-italic", 1 /* toggle */);
    add("underline", strings.TextUnderlineCaption, "bi bi-type-underline", 1 /* toggle */);
    add("strike", strings.TextStrikethroughCaption, "bi bi-type-strikethrough", 1 /* toggle */);
    add("inline", strings.TextInlineFormatsCaption, "bi bi-code", 2 /* menu */);
    add("textcolor", strings.TextTextColorCaption, "bi bi-fonts", 5 /* color */);
    add("background", strings.TextBackgroundColorCaption, "bi bi-highlighter", 5 /* color */);
    add("link", strings.TextHyperlinkCaption, "bi bi-link-45deg", 1 /* toggle */);
    items.add(ToolbarItem.separator());
    add("alignment", strings.TextAlignmentCaption, "bi bi-text-left", 2 /* menu */);
    add("lineheight", strings.TextLineHeightMenuCaption, "bi bi-distribute-vertical", 2 /* menu */);
    add("linespacing", strings.TextLineSpacingMenuCaption, "bi bi-arrows-vertical", 2 /* menu */);
    items.add(ToolbarItem.separator());
    add("clearformatting", strings.TextClearFormattingCaption, "bi bi-eraser");
    items.add(ToolbarItem.flexibleSpace());
    add("print", strings.TextPrintDocumentTooltip, "bi bi-printer");
    add("search", strings.TextCommandSearchCaption, "bi bi-search").tooltip = strings.TextCommandSearchTooltip;
    _Editor.#extensions.forEach((extension) => {
      let after = extension.defaultToolbarAfter ? items.indexOf(extension.defaultToolbarAfter) : -1;
      let index = after >= 0 ? after + 1 : items.lastIndex + 1;
      (extension.defaultToolbarIdentifiers || []).forEach((identifier) => {
        let item = extension.makeToolbarItem ? extension.makeToolbarItem(this, identifier) : null;
        if (!item)
          return;
        items.addAt(index, item);
        index++;
      });
    });
  }
  #catalog = /* @__PURE__ */ new Map();
  /**
   * Every built-in tool by identifier, whether or not the toolbar shows it: the
   * toolbar's own items, and those offered only in command search and the toolbar
   * customizer, such as the inline formats, Find, Replace and Add Comment.
   */
  #catalogItem(identifier) {
    let onToolbar = this.toolbarItems.item(identifier);
    if (onToolbar)
      return onToolbar;
    let existing = this.#catalog.get(identifier);
    if (existing)
      return existing;
    let strings = this.strings;
    let make = (caption, icon, kind = 0 /* button */, tooltip = "") => {
      let item = new ToolbarItem(identifier, caption, icon, kind, tooltip);
      this.#catalog.set(identifier, item);
      return item;
    };
    switch (identifier) {
      case "insert":
        return make(strings.TextInsertCaption, "bi bi-plus-lg", 2 /* menu */, strings.TextInsertTooltip);
      case "table": {
        let item = make(strings.TextTableCaption, "bi bi-table", 2 /* menu */);
        item.makePopup = (choose) => new TableSizePicker(strings, (rows, columns) => {
          let menuItem = new ToolbarMenuItem(`${rows}x${columns}`, Utilities.format(strings.TextTableSizeCaptionFormat, { rows, columns }));
          menuItem.value = { rows, columns };
          choose(menuItem);
        });
        return item;
      }
      case "undo":
        return make(strings.TextUndoCaption, "bi bi-arrow-counterclockwise");
      case "redo":
        return make(strings.TextRedoCaption, "bi bi-arrow-clockwise");
      case "blocktype":
        return make(strings.TextTextCaption, "", 2 /* menu */, strings.TextBlockTypeCaption);
      case "font":
        return make(strings.TextDefault, "", 2 /* menu */, strings.TextFontCaption);
      case "size":
        return make(strings.TextDefault, "", 2 /* menu */, strings.TextFontSizeMenuCaption);
      case "bold":
        return make(strings.TextBoldCaption, "bi bi-type-bold", 1 /* toggle */);
      case "italic":
        return make(strings.TextItalicCaption, "bi bi-type-italic", 1 /* toggle */);
      case "underline":
        return make(strings.TextUnderlineCaption, "bi bi-type-underline", 1 /* toggle */);
      case "strike":
        return make(strings.TextStrikethroughCaption, "bi bi-type-strikethrough", 1 /* toggle */);
      case "inline":
        return make(strings.TextInlineFormatsCaption, "bi bi-code", 2 /* menu */);
      case "code":
        return make(strings.TextInlineCodeCaption, "bi bi-code", 1 /* toggle */);
      case "highlight":
        return make(strings.TextHighlightCaption, "bi bi-highlights", 1 /* toggle */);
      case "keyboard":
        return make(strings.TextKeyboardKeyCaption, "bi bi-keyboard", 1 /* toggle */);
      case "superscript":
        return make(strings.TextSuperscriptCaption, "bi bi-superscript", 1 /* toggle */);
      case "subscript":
        return make(strings.TextSubscriptCaption, "bi bi-subscript", 1 /* toggle */);
      case "textcolor":
        return make(strings.TextTextColorCaption, "bi bi-fonts", 5 /* color */);
      case "background":
        return make(strings.TextBackgroundColorCaption, "bi bi-highlighter", 5 /* color */);
      case "link":
        return make(strings.TextHyperlinkCaption, "bi bi-link-45deg", 1 /* toggle */);
      case "alignment":
        return make(strings.TextAlignmentCaption, "bi bi-text-left", 2 /* menu */);
      case "lineheight":
        return make(strings.TextLineHeightMenuCaption, "bi bi-distribute-vertical", 2 /* menu */);
      case "linespacing":
        return make(strings.TextLineSpacingMenuCaption, "bi bi-arrows-vertical", 2 /* menu */);
      case "clearformatting":
        return make(strings.TextClearFormattingCaption, "bi bi-eraser");
      case "comment":
        return make(strings.TextAddCommentCaption, "bi bi-chat-left-text", 0 /* button */, strings.TextAddCommentTooltip);
      case "documentbackground":
        return make(strings.TextBackgroundToolbarCaption, "bi bi-image", 2 /* menu */, strings.TextBackgroundImageCaption);
      case "find":
        return make(strings.TextFindCaption, "bi bi-search");
      case "replace":
        return make(strings.TextReplaceCaption, "bi bi-arrow-left-right");
      case "print":
        return make(strings.TextPrintDocumentTooltip, "bi bi-printer");
      case "search":
        return make(strings.TextCommandSearchCaption, "bi bi-search", 0 /* button */, strings.TextCommandSearchTooltip);
    }
    for (let extension of _Editor.#extensions) {
      if ((extension.toolbarIdentifiers || []).indexOf(identifier) < 0 || !extension.makeToolbarItem)
        continue;
      let item = extension.makeToolbarItem(this, identifier);
      if (item)
        this.#catalog.set(identifier, item);
      return item;
    }
    return null;
  }
  /** The identifiers of every built-in tool, in the order the customizer lists them. */
  static get catalogIdentifiers() {
    let result = [
      "insert",
      "table",
      "undo",
      "redo",
      "blocktype",
      "font",
      "size",
      "bold",
      "italic",
      "underline",
      "strike",
      "inline",
      "code",
      "highlight",
      "keyboard",
      "superscript",
      "subscript",
      "textcolor",
      "background",
      "link",
      "alignment",
      "lineheight",
      "linespacing",
      "clearformatting",
      "comment",
      "documentbackground",
      "find",
      "replace",
      "print",
      "search"
    ];
    _Editor.#extensions.forEach((extension) => {
      let identifiers = (extension.toolbarIdentifiers || []).filter((identifier) => result.indexOf(identifier) < 0);
      let after = extension.defaultToolbarAfter ? result.indexOf(extension.defaultToolbarAfter) : -1;
      result.splice(after >= 0 ? after + 1 : result.length, 0, ...identifiers);
    });
    return result;
  }
  // Command search
  /**
   * Opens command search: a searchable list of every enabled tool, the selected
   * node's tools first. Node types to insert, and the choices inside menus, are
   * listed once something is typed. Choosing one performs it as the toolbar would.
   * Shift-Command-P (Shift-Control-P elsewhere) opens it too.
   */
  showCommandSearch(anchor) {
    if (this.#readOnly || !this.#element)
      return;
    Popup2.closeAll();
    this.#closeSuggestions();
    this.#applyToolbarState();
    let strings = this.strings;
    let entries = this.#commandEntries();
    let state = this.captureSelection();
    let popup = new ChoicePopup("scv-command-search", (item) => {
      this.restoreSelection(state);
      item.value.run();
      this.updateToolbarState();
    }, {
      placeholder: strings.TextCommandSearchHint,
      emptyCaption: strings.TextNoMatchingCommandsCaption,
      filter: (query) => {
        let words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 0);
        return entries.filter((entry) => words.length == 0 ? !entry.searchOnly : words.every((word) => entry.terms.indexOf(word) >= 0)).map((entry) => ({ caption: entry.caption, value: entry, icon: entry.icon, group: entry.group, detail: entry.detail }));
      }
    });
    popup.element.setAttribute("aria-label", strings.TextCommandSearchCaption);
    popup.onClose = () => {
      if (!popup.chosen)
        this.restoreSelection(state);
    };
    let searchItem = this.toolbarItems.item("search");
    let target = anchor || (searchItem && searchItem.element && searchItem.element.isConnected && searchItem.element.offsetParent ? searchItem.element : this.#toolbarElement && this.#toolbarVisible ? this.#toolbarElement : this.#element);
    popup.show(target, this.#element);
  }
  #commandEntries() {
    let strings = this.strings;
    let result = [];
    let seen = /* @__PURE__ */ new Set();
    let add = (caption, icon, group2, searchOnly, run, keywords = "", detail = "") => {
      let key = caption.toLowerCase();
      if (seen.has(key) || caption.trim().length == 0)
        return;
      seen.add(key);
      result.push({ caption, icon, group: group2, detail, searchOnly, run, terms: `${caption} ${keywords} ${group2}`.toLowerCase() });
    };
    let addMenu = (path, icon, group2, items, run, keywords) => {
      items.forEach((menuItem) => {
        if (menuItem.isSeparator || !menuItem.enabled)
          return;
        let caption = `${path} \u203A ${menuItem.caption}`;
        if (menuItem.hasChildren) {
          addMenu(caption, icon, group2, menuItem.children, run, keywords);
        } else {
          add(caption, menuItem.icon || icon, group2, true, () => run(menuItem), keywords, menuItem.checked ? "\u2713" : "");
        }
      });
    };
    let node = this.selectedNode;
    if (node && this.#nodeToolbarShown) {
      let group2 = strings.TextContextToolsCaption;
      this.#nodeToolbarItems(node).forEach((item) => {
        if (item.kind == 3 /* separator */ || item.kind == 4 /* flexibleSpace */ || !item.enabled || item.identifier == "node-count" || item.identifier == "node-move")
          return;
        let caption = item.tooltip || item.caption;
        if (item.kind == 2 /* menu */ && item.menuItems.length > 0) {
          addMenu(caption, item.icon, group2, item.menuItems, (menuItem) => this.#activateNodeToolbarItem(node, item, menuItem, null) && this.#renderNodeToolbar(), node.typeName);
        } else if (item.kind != 2 /* menu */) {
          add(caption, item.icon, group2, false, () => {
            if (this.#activateNodeToolbarItem(node, item, null, null))
              this.#renderNodeToolbar();
          }, node.typeName);
        }
      });
      let targets = this.#selected.length > 1 ? this.inDocumentOrder(this.#selected) : [node];
      if (this.canMoveNodes(targets, -1))
        add(strings.TextMoveUpCaption, "bi bi-arrow-up", group2, false, () => this.moveNodes(targets, -1));
      if (this.canMoveNodes(targets, 1))
        add(strings.TextMoveDownCaption, "bi bi-arrow-down", group2, false, () => this.moveNodes(targets, 1));
    }
    this.nodeTypes.items().filter((type) => type.insertable).forEach((type) => {
      add(type.caption, type.icon, strings.TextInsertCaption, true, () => this.insertNodeOfType(type), `${type.keywords} ${type.identifier}`);
    });
    this.insertionChoices().forEach((choice) => {
      add(choice.caption, choice.icon, strings.TextInsertCaption, true, () => choice.choose(null), choice.keywords || "");
    });
    let group = strings.TextToolbarToolsCaption;
    let identifiers = this.toolbarItems.items().map((item) => item.identifier).concat(_Editor.catalogIdentifiers);
    identifiers.forEach((identifier) => {
      if (identifier == "search" || identifier == "insert")
        return;
      let item = this.#catalogItem(identifier) || this.toolbarItems.item(identifier);
      if (!item || item.kind == 3 /* separator */ || item.kind == 4 /* flexibleSpace */ || !item.enabled || !item.visible)
        return;
      if (identifier == "comment" && !this.allowAnnotations)
        return;
      let caption = item.tooltip && item.kind != 2 /* menu */ ? item.tooltip : item.caption;
      if (item.kind == 2 /* menu */ || item.kind == 5 /* color */) {
        this.#prepareMenu(item);
        if (item.menuItems.length > 0)
          addMenu(item.caption, item.icon, group, item.menuItems, (menuItem) => this.activateToolbarItem(identifier, menuItem), identifier);
        if (item.kind == 5 /* color */ && item.element && item.element.isConnected && item.element.offsetParent) {
          add(item.caption, item.icon, group, false, () => (item.element.querySelector("button") || item.element).dispatchEvent(new MouseEvent("click", { bubbles: true })), identifier);
        }
        return;
      }
      add(caption, item.icon, group, false, () => this.activateToolbarItem(identifier), identifier);
    });
    return result;
  }
  static #paletteIcons = { blocktype: "bi bi-paragraph", font: "bi bi-fonts", size: "bi bi-type" };
  /** Rebuilds the default toolbar, removing application items. */
  resetToolbar() {
    this.toolbarItems.removeAll();
    this.#buildDefaultToolbar();
    this.#renderToolbar();
    this.dispatchEvent(new CustomEvent("toolbarReset"));
  }
  // Toolbar customization
  #customizer = null;
  #customizerChanged = false;
  #customizerDrag = null;
  #customizerIndicator = null;
  /** Application items seen on the toolbar, so the customizer can offer them again after removal. */
  #applicationItems = /* @__PURE__ */ new Map();
  get isCustomizingToolbar() {
    return !!this.#customizer;
  }
  /**
   * The toolbar's arrangement and display mode as JSON, for restoring with
   * loadToolbarState: item identifiers, with "separator" and "flexiblespace" for spaces.
   */
  saveToolbarState() {
    let items = this.toolbarItems.items().map((item) => item.kind == 3 /* separator */ ? "separator" : item.kind == 4 /* flexibleSpace */ ? "flexiblespace" : item.identifier);
    return JSON.stringify({ version: 1, displayMode: this.#toolbarDisplayMode, items });
  }
  /** Restores an arrangement from saveToolbarState. Identifiers the editor doesn't know are skipped. Returns false for invalid state. */
  loadToolbarState(state) {
    let data = state;
    try {
      if (typeof state == "string")
        data = JSON.parse(state);
    } catch {
      return false;
    }
    if (!data || typeof data != "object")
      return false;
    let identifiers = [];
    if (Array.isArray(data.items)) {
      identifiers = data.items.map((item) => String(item));
    } else if (Array.isArray(data.classic) || Array.isArray(data.contextual)) {
      ;
      (Array.isArray(data.classic) ? data.classic : data.contextual).forEach((section, index) => {
        if (index > 0)
          identifiers.push("separator");
        if (section && Array.isArray(section.items))
          section.items.forEach((item) => identifiers.push(String(item)));
      });
    } else {
      return false;
    }
    let items = [];
    identifiers.forEach((identifier) => {
      let item = this.#toolbarItemFor(identifier);
      if (item && (item.kind == 3 /* separator */ || item.kind == 4 /* flexibleSpace */ || !items.some((existing) => existing.identifier == item.identifier)))
        items.push(item);
    });
    let mode = Utilities.integer(data.displayMode, this.#toolbarDisplayMode);
    if (mode >= 0 && mode <= 2)
      this.#toolbarDisplayMode = mode;
    this.toolbarItems.setItems(items);
    return true;
  }
  /** A toolbar item for an identifier: a new space, a catalog item, or an application item seen before. */
  #toolbarItemFor(identifier) {
    if (identifier == "separator" || identifier.startsWith("separator-"))
      return ToolbarItem.separator();
    if (identifier == "flexiblespace" || identifier.startsWith("flexiblespace-") || identifier == "space") {
      let space = ToolbarItem.flexibleSpace();
      space.identifier = `flexiblespace-${Utilities.uuid()}`;
      return space;
    }
    let existing = this.toolbarItems.item(identifier);
    if (existing)
      return existing;
    let catalog = this.#catalog.get(identifier);
    if (catalog) {
      this.#catalog.delete(identifier);
      return catalog;
    }
    let made = this.#catalogItem(identifier);
    if (made) {
      this.#catalog.delete(identifier);
      if (identifier == "insert" || identifier == "blocktype" || identifier == "font" || identifier == "size")
        made.alwaysShowCaption = true;
      return made;
    }
    return this.#applicationItems.get(identifier) || null;
  }
  /**
   * Opens the customizer below the toolbar: drag items from it into the toolbar,
   * drag toolbar items to reorder them or off the toolbar to remove them, or drag
   * the default set to reset. Clicking an item in the customizer adds it at the end.
   */
  showToolbarCustomizer() {
    if (this.#customizer || this.#readOnly || !this.#toolbarElement || !this.#toolbarVisible)
      return;
    Popup2.closeAll();
    let strings = this.strings;
    this.toolbarItems.items().forEach((item) => {
      if (_Editor.catalogIdentifiers.indexOf(item.identifier) < 0 && item.kind != 3 /* separator */ && item.kind != 4 /* flexibleSpace */)
        this.#applicationItems.set(item.identifier, item);
    });
    this.#customizerChanged = false;
    let sheet = Utilities.element("div", "scv-customizer", { role: "dialog", "aria-label": strings.TextCustomizeToolbarMenuCaption });
    let instructions = Utilities.element("div", "scv-customizer-instructions");
    instructions.textContent = strings.TextCustomizeToolbarInstructions;
    sheet.append(instructions);
    let palette = Utilities.element("div", "scv-customizer-palette");
    let paletteItem = (identifier, caption, icon) => {
      let button = Utilities.element("button", "btn btn-sm scv-customizer-item", { type: "button", draggable: "true", title: caption });
      if (icon.length > 0)
        button.append(Utilities.element("i", icon));
      let label = Utilities.element("span");
      label.textContent = caption;
      button.append(label);
      button.addEventListener("dragstart", (event) => {
        this.#customizerDrag = { item: null, identifier, fromToolbar: false };
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("text/plain", identifier);
      });
      button.addEventListener("dragend", () => this.#endCustomizerDrag());
      button.addEventListener("click", () => this.#customizerInsert(identifier, this.toolbarItems.items().length));
      palette.append(button);
    };
    _Editor.catalogIdentifiers.forEach((identifier) => {
      if (identifier == "comment" && !this.#allowAnnotations)
        return;
      let item = this.#catalogItem(identifier);
      if (item)
        paletteItem(identifier, item.tooltip || item.caption, item.icon || _Editor.#paletteIcons[identifier] || "bi bi-square");
    });
    this.#applicationItems.forEach((item, identifier) => paletteItem(identifier, item.tooltip || item.caption, item.icon));
    paletteItem("separator", strings.TextSeparatorCaption, "bi bi-distribute-horizontal");
    paletteItem("flexiblespace", strings.TextFlexibleSpaceCaption, "bi bi-arrows");
    sheet.append(palette);
    let defaults = Utilities.element("div", "scv-customizer-defaults");
    let defaultsCaption = Utilities.element("div", "scv-customizer-instructions");
    defaultsCaption.textContent = strings.TextCustomizeDefaultSetInstructions;
    let defaultSet = Utilities.element("button", "btn btn-sm btn-outline-secondary scv-customizer-default-set", { type: "button", draggable: "true" });
    defaultSet.textContent = strings.TextResetCaption;
    defaultSet.addEventListener("dragstart", (event) => {
      this.#customizerDrag = { item: null, identifier: "defaultset", fromToolbar: false };
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", "defaultset");
    });
    defaultSet.addEventListener("dragend", () => this.#endCustomizerDrag());
    defaultSet.addEventListener("click", () => {
      this.resetToolbar();
      this.#customizerChanged = false;
    });
    let footer = Utilities.element("div", "scv-customizer-footer");
    let mode = Utilities.element("select", "form-select form-select-sm scv-customizer-mode", { "aria-label": strings.TextToolbarShowCaption });
    [strings.TextIconOnlyCaption, strings.TextIconAndTextCaption, strings.TextTextOnlyCaption].forEach((caption, index) => {
      let option = document.createElement("option");
      option.value = String(index);
      option.textContent = caption;
      option.selected = this.#toolbarDisplayMode == index;
      mode.append(option);
    });
    mode.addEventListener("change", () => {
      this.toolbarDisplayMode = Number(mode.value);
      this.#customizerChanged = true;
    });
    let modeLabel = Utilities.element("label", "scv-customizer-mode-label");
    modeLabel.textContent = strings.TextToolbarShowCaption;
    modeLabel.append(mode);
    let done = Utilities.element("button", "btn btn-sm btn-primary", { type: "button" });
    done.textContent = strings.TextDoneCaption;
    done.addEventListener("click", () => this.closeToolbarCustomizer());
    defaults.append(defaultsCaption, defaultSet);
    footer.append(defaults, modeLabel, done);
    sheet.append(footer);
    sheet.addEventListener("dragover", (event) => {
      if (this.#customizerDrag && this.#customizerDrag.fromToolbar) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }
    });
    sheet.addEventListener("drop", (event) => {
      event.preventDefault();
      let drag = this.#customizerDrag;
      if (drag && drag.fromToolbar && drag.item)
        this.#customizerRemove(drag.item);
      this.#endCustomizerDrag();
    });
    this.#customizer = sheet;
    this.#toolbarElement.after(sheet);
    this.#element.classList.add("scv-customizing");
    this.#customizerIndicator = Utilities.element("div", "scv-customizer-indicator d-none");
    this.#toolbarElement.append(this.#customizerIndicator);
    this.#renderToolbar();
  }
  /** Closes the customizer, raising toolbarCustomized when the arrangement changed. */
  closeToolbarCustomizer() {
    if (!this.#customizer)
      return;
    this.#customizer.remove();
    this.#customizer = null;
    this.#customizerDrag = null;
    this.#element.classList.remove("scv-customizing");
    this.#renderToolbar();
    if (this.#customizerChanged)
      this.dispatchEvent(new CustomEvent("toolbarCustomized", { detail: { state: this.saveToolbarState() } }));
    this.#customizerChanged = false;
  }
  #endCustomizerDrag() {
    this.#customizerDrag = null;
    if (this.#customizerIndicator)
      this.#customizerIndicator.classList.add("d-none");
  }
  #customizerInsert(identifier, index) {
    if (identifier == "defaultset") {
      this.resetToolbar();
      this.#customizerChanged = false;
      return;
    }
    let item = this.#toolbarItemFor(identifier);
    if (!item)
      return;
    let items = this.toolbarItems.items();
    let existing = items.indexOf(item);
    if (existing >= 0) {
      items.splice(existing, 1);
      if (existing < index)
        index--;
    }
    items.splice(Utilities.clamp(index, 0, items.length), 0, item);
    this.#customizerChanged = true;
    this.toolbarItems.setItems(items);
  }
  #customizerMove(item, index) {
    let items = this.toolbarItems.items();
    let existing = items.indexOf(item);
    if (existing < 0)
      return;
    items.splice(existing, 1);
    if (existing < index)
      index--;
    items.splice(Utilities.clamp(index, 0, items.length), 0, item);
    this.#customizerChanged = true;
    this.toolbarItems.setItems(items);
  }
  #customizerRemove(item) {
    let items = this.toolbarItems.items().filter((candidate) => candidate !== item);
    if (_Editor.catalogIdentifiers.indexOf(item.identifier) >= 0)
      this.#catalog.set(item.identifier, item);
    this.#customizerChanged = true;
    this.toolbarItems.setItems(items);
  }
  /** The insertion index nearest the pointer among the toolbar's items. */
  #customizerDropIndex(x, y) {
    let items = this.toolbarItems.items();
    let best = { index: items.length, rect: null, after: true };
    let bestDistance = Infinity;
    items.forEach((item, index) => {
      if (!item.element || !item.element.isConnected)
        return;
      let rect = item.element.getBoundingClientRect();
      let rowDistance = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      let middle = rect.left + rect.width / 2;
      let after = x > middle;
      let distance = rowDistance * 1e3 + Math.abs(x - (after ? rect.right : rect.left));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { index: after ? index + 1 : index, rect, after };
      }
    });
    return best;
  }
  /** Makes the toolbar's items draggable while the customizer is open. */
  #prepareCustomizingToolbar(toolbar) {
    if (!this.#customizer)
      return;
    this.toolbarItems.items().forEach((item) => {
      let element = item.element;
      if (!element)
        return;
      element.setAttribute("draggable", "true");
      element.classList.add("scv-customizable");
      element.addEventListener("dragstart", (event) => {
        this.#customizerDrag = { item, identifier: item.identifier, fromToolbar: true };
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.identifier);
      });
      element.addEventListener("dragend", (event) => {
        let drag = this.#customizerDrag;
        if (drag && drag.fromToolbar && drag.item && event.dataTransfer.dropEffect == "none") {
          let rect = toolbar.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
            this.#customizerRemove(drag.item);
        }
        this.#endCustomizerDrag();
      });
      let remove = Utilities.element("span", "scv-customizer-remove", { role: "button", "aria-label": `${this.strings.TextRemoveCaption} ${item.tooltip || item.caption || item.identifier}`, tabindex: "0" });
      remove.append(Utilities.element("i", "bi bi-x"));
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.#customizerRemove(item);
      });
      remove.addEventListener("keydown", (event) => {
        if (event.key == "Enter" || event.key == " ") {
          event.preventDefault();
          this.#customizerRemove(item);
        }
      });
      element.append(remove);
    });
  }
  #attachCustomizerTargets(toolbar) {
    toolbar.addEventListener("click", (event) => {
      if (this.#customizer && !event.target.closest(".scv-customizer-remove")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
    toolbar.addEventListener("dragover", (event) => {
      if (!this.#customizer || !this.#customizerDrag)
        return;
      event.preventDefault();
      event.dataTransfer.dropEffect = this.#customizerDrag.fromToolbar ? "move" : "copy";
      let target = this.#customizerDropIndex(event.clientX, event.clientY);
      let indicator = this.#customizerIndicator;
      if (indicator && target.rect) {
        let bar = toolbar.getBoundingClientRect();
        indicator.classList.remove("d-none");
        indicator.style.left = `${(target.after ? target.rect.right : target.rect.left) - bar.left - 1}px`;
        indicator.style.top = `${target.rect.top - bar.top}px`;
        indicator.style.height = `${target.rect.height}px`;
      }
    });
    toolbar.addEventListener("drop", (event) => {
      let drag = this.#customizerDrag;
      if (!this.#customizer || !drag)
        return;
      event.preventDefault();
      let target = this.#customizerDropIndex(event.clientX, event.clientY);
      if (drag.fromToolbar && drag.item) {
        this.#customizerMove(drag.item, target.index);
      } else {
        this.#customizerInsert(drag.identifier, target.index);
      }
      this.#endCustomizerDrag();
    });
  }
  #renderToolbar() {
    let toolbar = this.#toolbarElement;
    if (!toolbar)
      return;
    toolbar.textContent = "";
    this.toolbarItems.items().forEach((item) => {
      toolbar.append(ToolbarView.buildItem(item, this.#toolbarDisplayMode, this.strings, this.#element, (menuItem) => this.#prepareMenu(menuItem), (activated, menuItem) => this.activateToolbarItem(activated.identifier, menuItem)));
    });
    if (this.#customizer) {
      if (this.#customizerIndicator)
        toolbar.append(this.#customizerIndicator);
      this.#prepareCustomizingToolbar(toolbar);
    }
    this.updateToolbarState();
  }
  #prepareMenu(item) {
    let strings = this.strings;
    switch (item.identifier) {
      case "blocktype": {
        let kind = this.#currentBlockKind();
        let entries = this.#blockKindEntries(false);
        item.menuItems = entries.map(([identifier, caption, icon]) => {
          let menuItem = new ToolbarMenuItem(identifier, caption, icon);
          menuItem.checked = _Editor.#blockKindMatches(identifier, kind, entries);
          return menuItem;
        });
        break;
      }
      case "font": {
        let current = this.formatting.currentStyle().fontName;
        item.menuItems = [new ToolbarMenuItem("", strings.TextDefault)].concat(this.activeFontOptions().fontNames().map((name) => {
          let menuItem = new ToolbarMenuItem(name, name);
          menuItem.captionStyle = `font-family:${Utilities.fontFamilyCSS(name)}`;
          return menuItem;
        }));
        item.menuItems.forEach((menuItem) => menuItem.checked = menuItem.identifier == current);
        break;
      }
      case "size": {
        let current = this.formatting.currentStyle().fontSize;
        let options = this.activeFontOptions();
        item.menuItems = [0].concat(options.sizes()).map((size) => {
          let menuItem = new ToolbarMenuItem(String(size), size == 0 ? strings.TextDefault : String(size));
          menuItem.checked = size == current;
          return menuItem;
        });
        if (current > 0 && options.indexOfSize(current) < 0) {
          let shown = new ToolbarMenuItem(String(current), String(current));
          shown.checked = true;
          item.menuItems.push(shown);
        }
        if (options.allowCustomFontSize)
          item.menuItems.push(ToolbarMenuItem.separator(), new ToolbarMenuItem("custom", strings.TextCustomFontSizeMenuCaption));
        break;
      }
      case "inline": {
        let entries = [
          [4 /* code */, strings.TextInlineCodeCaption, "bi bi-code"],
          [5 /* highlight */, strings.TextHighlightCaption, "bi bi-highlights"],
          [6 /* keyboard */, strings.TextKeyboardCaption, "bi bi-keyboard"],
          [7 /* superscript */, strings.TextSuperscriptCaption, "bi bi-superscript"],
          [8 /* subscript */, strings.TextSubscriptCaption, "bi bi-subscript"]
        ];
        item.menuItems = entries.map(([style, caption, icon]) => {
          let menuItem = new ToolbarMenuItem(String(style), caption, icon);
          menuItem.checked = this.formatting.isApplied(style);
          menuItem.enabled = this.formatting.canApply(style);
          return menuItem;
        });
        break;
      }
      case "alignment": {
        let current = this.formatting.alignment;
        let entries = [
          [1 /* leading */, strings.TextStartAlignmentCaption, "bi bi-text-left"],
          [2 /* middle */, strings.TextCenterAlignmentCaption, "bi bi-text-center"],
          [3 /* trailing */, strings.TextEndAlignmentCaption, "bi bi-text-right"]
        ];
        item.menuItems = entries.map(([value, caption, icon]) => {
          let menuItem = new ToolbarMenuItem(String(value), caption, icon);
          menuItem.checked = value == current;
          return menuItem;
        });
        break;
      }
      case "insert": {
        let types = this.nodeTypes.items().filter((type) => type.insertable);
        item.menuItems = types.map((type) => new ToolbarMenuItem(type.identifier, type.caption, type.icon));
        item.makePopup = (choose) => {
          let chooser = new InsertionChooser(strings, types, (type) => choose(new ToolbarMenuItem(type.identifier, type.caption, type.icon)));
          chooser.hasSearchField = types.length >= this.insertMenuSearchThreshold;
          return chooser;
        };
        break;
      }
      case "lineheight":
      case "linespacing": {
        let nodes = this.#lineMetricNodes();
        let lineHeight = item.identifier == "lineheight";
        let current = nodes.length > 0 ? lineHeight ? nodes[0].lineHeight : nodes[0].lineSpacing : lineHeight ? 1 : 0;
        let values = lineHeight ? _Editor.lineHeights : _Editor.lineSpacings;
        item.menuItems = values.map((value) => {
          let menuItem = new ToolbarMenuItem(String(value), String(value));
          menuItem.checked = value == current;
          return menuItem;
        });
        break;
      }
      case "documentbackground":
        item.menuItems = this.#backgroundItem(null).menuItems;
        break;
    }
  }
  async #promptFontSize() {
    let strings = this.strings;
    let current = this.formatting.currentStyle().fontSize;
    let values = await this.prompt(strings.TextFontSizeMenuCaption, [{ name: "size", label: strings.TextCustomFontSizeFieldTooltip, value: current > 0 ? String(current) : "", type: "number", placeholder: strings.TextDefault }]);
    if (!values)
      return;
    let size = Number(values.size);
    if (isFinite(size) && size >= 1 && size <= 1e3)
      this.formatting.setFontSize(Math.round(size * 100) / 100);
  }
  /** Line heights offered by the Line Height menu, as multiples of the font's. */
  static lineHeights = [1, 1.15, 1.25, 1.5, 2];
  /** Extra space between lines offered by the Line Spacing menu, in pixels. */
  static lineSpacings = [0, 1, 2, 4, 8, 12, 16];
  /** The nodes the line height and spacing tools change: those selected, or the one being edited. */
  #lineMetricNodes() {
    if (this.#activeHost)
      return [this.#activeHost.node];
    return this.inDocumentOrder(this.#selected).filter((node) => !node.locked);
  }
  #setLineMetric(identifier, value) {
    let nodes = this.#lineMetricNodes();
    if (nodes.length == 0 || this.#readOnly || !isFinite(value))
      return;
    this.history.breakCoalescing();
    this.history.checkpoint();
    this.beginUpdate();
    nodes.forEach((node) => {
      if (identifier == "lineheight") {
        node.lineHeight = value;
      } else {
        node.lineSpacing = value;
      }
      this.refreshNode(node);
      node.changed();
    });
    this.endUpdate();
    this.history.breakCoalescing();
  }
  /** Performs a toolbar item's command, as clicking it does. */
  activateToolbarItem(identifier, menuItem = null) {
    let item = this.#catalogItem(identifier);
    switch (identifier) {
      case "undo":
        this.history.undo();
        break;
      case "redo":
        this.history.redo();
        break;
      case "bold":
        this.formatting.toggle(0 /* bold */);
        break;
      case "italic":
        this.formatting.toggle(1 /* italic */);
        break;
      case "underline":
        this.formatting.toggle(2 /* underline */);
        break;
      case "strike":
        this.formatting.toggle(3 /* strikethrough */);
        break;
      case "inline":
        if (menuItem)
          this.formatting.toggle(Number(menuItem.identifier));
        break;
      case "textcolor":
        if (menuItem)
          this.formatting.setTextColor(menuItem.value);
        break;
      case "background":
        if (menuItem)
          this.formatting.setBackgroundColor(menuItem.value);
        break;
      case "link":
        this.formatting.editLink();
        break;
      case "font":
        if (menuItem)
          this.formatting.setFontName(menuItem.identifier);
        break;
      case "size":
        if (menuItem && menuItem.identifier == "custom") {
          this.#promptFontSize();
        } else if (menuItem) {
          this.formatting.setFontSize(Number(menuItem.identifier));
        }
        break;
      case "alignment":
        if (menuItem)
          this.formatting.align(Number(menuItem.identifier));
        break;
      case "clearformatting":
        this.formatting.clearFormatting();
        break;
      case "search":
        this.showCommandSearch();
        break;
      case "find":
        this.search.show(false);
        break;
      case "replace":
        this.search.show(true);
        break;
      case "print":
        this.print();
        break;
      case "code":
        this.formatting.toggle(4 /* code */);
        break;
      case "highlight":
        this.formatting.toggle(5 /* highlight */);
        break;
      case "keyboard":
        this.formatting.toggle(6 /* keyboard */);
        break;
      case "superscript":
        this.formatting.toggle(7 /* superscript */);
        break;
      case "subscript":
        this.formatting.toggle(8 /* subscript */);
        break;
      case "comment":
        this.annotations.show(null, true);
        break;
      case "lineheight":
      case "linespacing":
        if (menuItem)
          this.#setLineMetric(identifier, Number(menuItem.identifier));
        break;
      case "documentbackground":
        if (menuItem)
          this.#performBackground(null, menuItem);
        break;
      case "blocktype":
        if (menuItem) {
          let [kind, value] = menuItem.identifier.split(":");
          this.setBlockType(kind, Number(value || 0));
        }
        break;
      case "insert":
        if (menuItem)
          this.insertNodeOfType(menuItem.identifier);
        break;
      case "table": {
        let size = menuItem && menuItem.value ? menuItem.value : { rows: 3, columns: 3 };
        if (this.nodeTypes.item("table"))
          this.insertNewNode(TableNode.withSize(this, size.rows, size.columns));
        break;
      }
      default:
        if (!_Editor.#extensions.some((extension) => extension.activateToolbarItem && extension.activateToolbarItem(this, identifier, menuItem))) {
          this.dispatchEvent(new CustomEvent("toolbarItemPressed", { detail: { item, menuItem } }));
        }
    }
    this.updateToolbarState();
  }
  /** Refreshes toolbar buttons for the current selection. */
  updateToolbarState() {
    if (this.#stateFrame || !this.#element)
      return;
    this.#stateFrame = requestAnimationFrame(() => {
      this.#stateFrame = 0;
      this.#applyToolbarState();
    });
  }
  #applyToolbarState() {
    let items = this.toolbarItems;
    let set = (identifier, enabled, active = false) => {
      let item = this.#catalogItem(identifier);
      if (!item)
        return;
      item.enabled = enabled && this.#enabled || !!this.#customizer;
      item.active = active;
    };
    let canFormat = this.formatting.canApply();
    let node = this.#activeHost ? this.#activeHost.node : this.selectedNode;
    let textNode = node instanceof TextNode2 && node.isTextBlock;
    set("undo", this.history.canUndo && !this.#readOnly);
    set("redo", this.history.canRedo && !this.#readOnly);
    set("bold", this.formatting.canApply(0 /* bold */), canFormat && this.formatting.isApplied(0 /* bold */));
    set("italic", this.formatting.canApply(1 /* italic */), canFormat && this.formatting.isApplied(1 /* italic */));
    set("underline", this.formatting.canApply(2 /* underline */), canFormat && this.formatting.isApplied(2 /* underline */));
    set("strike", this.formatting.canApply(3 /* strikethrough */), canFormat && this.formatting.isApplied(3 /* strikethrough */));
    set("inline", canFormat);
    set("textcolor", canFormat);
    set("background", canFormat);
    set("font", canFormat);
    set("size", canFormat);
    set("clearformatting", canFormat);
    let style = canFormat ? this.formatting.currentStyle() : null;
    set("link", this.formatting.canEditLink, !!style && style.linkURL.length > 0);
    set("alignment", this.formatting.canAlign);
    set("blocktype", !this.#readOnly && textNode);
    _Editor.#extensions.forEach((extension) => extension.updateToolbarState?.(this, set));
    set("insert", !this.#readOnly);
    set("search", !this.#readOnly);
    set("table", !this.#readOnly && !!this.nodeTypes.item("table"));
    set("find", true, this.search.visible);
    set("replace", !this.#readOnly);
    set("print", true);
    set("code", this.formatting.canApply(4 /* code */), canFormat && this.formatting.isApplied(4 /* code */));
    set("highlight", this.formatting.canApply(5 /* highlight */), canFormat && this.formatting.isApplied(5 /* highlight */));
    set("keyboard", this.formatting.canApply(6 /* keyboard */), canFormat && this.formatting.isApplied(6 /* keyboard */));
    set("superscript", this.formatting.canApply(7 /* superscript */), canFormat && this.formatting.isApplied(7 /* superscript */));
    set("subscript", this.formatting.canApply(8 /* subscript */), canFormat && this.formatting.isApplied(8 /* subscript */));
    let metricNodes = this.#lineMetricNodes();
    set("lineheight", !this.#readOnly && metricNodes.length > 0);
    set("linespacing", !this.#readOnly && metricNodes.length > 0);
    let lineHeight = items.item("lineheight");
    if (lineHeight)
      lineHeight.setTooltip(Utilities.format(this.strings.TextLineHeightTooltipFormat, { value: metricNodes.length > 0 ? metricNodes[0].lineHeight : 1 }));
    let lineSpacing = items.item("linespacing");
    if (lineSpacing)
      lineSpacing.setTooltip(Utilities.format(this.strings.TextLineSpacingTooltipFormat, { value: metricNodes.length > 0 ? metricNodes[0].lineSpacing : 0 }));
    set("comment", this.allowAnnotations && this.annotations.canAdd);
    set("documentbackground", !this.#readOnly);
    let textColor = items.item("textcolor");
    let swatch = textColor && textColor.element ? textColor.element.querySelector(".scv-toolbar-swatch") : null;
    if (swatch)
      swatch.style.backgroundColor = style && !Colors.isEmpty(style.textColor) ? Colors.toCSS(style.textColor) : "";
    let background = items.item("background");
    swatch = background && background.element ? background.element.querySelector(".scv-toolbar-swatch") : null;
    if (swatch)
      swatch.style.backgroundColor = style && style.hasBackgroundColor ? Colors.toCSS(style.backgroundColor) : "";
    let font = items.item("font");
    if (font)
      font.setDisplayCaption(style && style.fontName.length > 0 ? style.fontName : this.strings.TextDefault);
    let size = items.item("size");
    if (size)
      size.setDisplayCaption(style && style.fontSize > 0 ? String(style.fontSize) : this.strings.TextDefault);
    let blockType = items.item("blocktype");
    if (blockType) {
      let kind = this.#currentBlockKind();
      let entries = this.#blockKindEntries(false);
      let entry = entries.find((candidate) => _Editor.#blockKindMatches(candidate[0], kind, entries));
      let caption = entry ? entry[1] : "";
      blockType.setDisplayCaption(caption || (node ? node.typeName : this.strings.TextTextCaption));
    }
    let alignment = items.item("alignment");
    if (alignment && alignment.element) {
      let icon = alignment.element.querySelector(".scv-toolbar-icon");
      let current = this.formatting.alignment;
      if (icon)
        icon.className = `${["bi bi-text-left", "bi bi-text-left", "bi bi-text-center", "bi bi-text-right"][current]} scv-toolbar-icon`;
    }
  }
  // Node toolbar
  /** The items every node's toolbar starts with: the move grip, Duplicate and Delete. */
  #commonNodeActions(node) {
    let strings = this.strings;
    let move = new ToolbarItem("node-move", strings.TextMoveNodeCaption, "bi bi-grip-vertical", 0 /* button */, strings.TextMoveNodeTooltip);
    let duplicate = new ToolbarItem("node-duplicate", strings.TextDuplicateNodeCaption, "bi bi-copy");
    let remove = new ToolbarItem("node-delete", strings.TextRemoveNodeTooltip, "bi bi-trash3");
    move.enabled = duplicate.enabled = remove.enabled = !node.locked;
    return [move, duplicate, remove];
  }
  /** The Background menu: a background image for the node, or the document when node is null, its fill and its repeat. */
  #backgroundItem(node) {
    let strings = this.strings;
    let item = new ToolbarItem(node ? "node-background" : "documentbackground", strings.TextBackgroundToolbarCaption, "bi bi-image-alt", 2 /* menu */, node ? strings.TextNodeBackgroundImageCaption : strings.TextBackgroundImageCaption);
    let image = node ? node.backgroundImage : this.backgroundImage;
    let remove = new ToolbarMenuItem("remove", strings.TextRemoveImageCaption, "bi bi-x-lg");
    remove.enabled = !image.isEmpty;
    item.menuItems.push(new ToolbarMenuItem("choose", strings.TextChooseImageMenuCaption, "bi bi-folder2-open"), new ToolbarMenuItem("source", strings.TextEnterImageSourceMenuCaption, "bi bi-link-45deg"), remove, ToolbarMenuItem.separator());
    let fills = [strings.TextActualSizeCaption, strings.TextStretchCaption, strings.TextFitCaption, strings.TextFillCaption].map((caption, index) => {
      let entry = new ToolbarMenuItem(`fill:${index}`, caption);
      entry.checked = image.fill == index;
      return entry;
    });
    let repeats = [strings.TextNoRepeatCaption, strings.TextRepeatHorizontallyCaption, strings.TextRepeatVerticallyCaption, strings.TextRepeatBothCaption].map((caption, index) => {
      let entry = new ToolbarMenuItem(`repeat:${index}`, caption);
      entry.checked = image.repeat == index;
      return entry;
    });
    let fill = ToolbarMenuItem.submenu("fill", strings.TextFillCaption, "bi bi-aspect-ratio", fills);
    let repeat = ToolbarMenuItem.submenu("repeat", strings.TextRepeatCaption, "bi bi-grid-3x3", repeats);
    fill.enabled = repeat.enabled = !image.isEmpty;
    item.menuItems.push(fill, repeat);
    return item;
  }
  async #performBackground(node, menuItem) {
    let identifier = menuItem.identifier;
    let current = node ? node.backgroundImage : this.backgroundImage;
    let apply = (change) => {
      this.history.checkpoint();
      let image = current.clone();
      change(image);
      if (node) {
        node.backgroundImage = image;
        node.refresh();
        node.changed();
      } else {
        this.backgroundImage = image;
        this.nodeChanged(null);
      }
    };
    if (identifier == "choose") {
      MediaUI.pickFile("image/*", async (file) => {
        let data;
        try {
          data = await this.storeFile(file, "background", node);
        } catch {
          this.showMessage(this.strings.TextUploadFailedMessage, "danger");
          return;
        }
        apply((image) => image.source = data);
      });
    } else if (identifier == "source") {
      let values = await this.prompt(this.strings.TextBackgroundImageCaption, [{ name: "url", label: this.strings.TextURLCaption, value: current.source.startsWith("data:") ? "" : current.source, type: "url", placeholder: "https://" }]);
      if (values)
        apply((image) => image.source = String(values.url || "").trim());
    } else if (identifier == "remove") {
      apply((image) => image.clear());
    } else if (identifier.startsWith("fill:")) {
      apply((image) => image.fill = Number(identifier.substring(5)));
    } else if (identifier.startsWith("repeat:")) {
      apply((image) => image.repeat = Number(identifier.substring(7)));
    }
  }
  /** The Width and Height buttons of a resizable node. */
  #sizeItems(node) {
    let strings = this.strings;
    let size = node.toolbarSize();
    let width = new ToolbarItem("node-width", Utilities.format(strings.TextWidthCaptionFormat, { value: Math.round(size.width) }), "", 0 /* button */, strings.TextSetNodeWidthTooltip);
    let height = new ToolbarItem("node-height", Utilities.format(strings.TextHeightCaptionFormat, { value: Math.round(size.height) }), "", 0 /* button */, strings.TextSetNodeHeightTooltip);
    width.alwaysShowCaption = height.alwaysShowCaption = true;
    return node.toolbarResizesHeight ? [width, height] : [width];
  }
  async #editNodeSize(node, dimension) {
    let strings = this.strings;
    let size = node.toolbarSize();
    let values = await this.prompt(dimension == "width" ? strings.TextWidthInspectorCaption : strings.TextHeightInspectorCaption, [{ name: "value", label: dimension == "width" ? strings.TextSetNodeWidthTooltip : strings.TextSetNodeHeightTooltip, value: String(Math.round(dimension == "width" ? size.width : size.height)), type: "number", placeholder: strings.TextAutomatic }]);
    if (!values)
      return;
    let text = String(values.value || "").trim();
    let number = text.length == 0 ? 0 : Number(text);
    if (!isFinite(number) || number < 0)
      return;
    this.history.checkpoint();
    node.setToolbarSize(dimension, Math.round(number));
    node.refresh();
    node.changed();
  }
  /** Whether the selected node's floating toolbar shows. */
  get #nodeToolbarShown() {
    let node = this.selectedNode;
    return !this.#readOnly && this.#showContextualToolbars && !!node && !!node.element;
  }
  #renderNodeToolbar() {
    let toolbar = this.#nodeToolbarElement;
    if (!toolbar)
      return;
    toolbar.textContent = "";
    if (!this.#nodeToolbarShown) {
      toolbar.classList.add("d-none");
      return;
    }
    let node = this.selectedNode;
    let items = this.#nodeToolbarItems(node);
    items.forEach((item) => {
      let element = ToolbarView.buildItem(item, 0 /* iconOnly */, this.strings, this.#element, () => {
      }, (activated, menuItem) => {
        if (this.#activateNodeToolbarItem(node, activated, menuItem, activated.element))
          this.#renderNodeToolbar();
      });
      if (item.identifier == "node-move") {
        element.draggable = item.enabled;
        element.classList.add("scv-node-toolbar-grip");
        element.addEventListener("mousedown", (event) => event.stopImmediatePropagation(), true);
        element.addEventListener("dragstart", (event) => this.#beginNodeDrag(node, event));
        element.addEventListener("dragend", () => this.#endNodeDrag());
      }
      toolbar.append(element);
    });
    toolbar.classList.remove("d-none");
    this.#positionNodeToolbar();
  }
  /** The selected node's toolbar items. With several nodes selected, the commands that apply to all of them. */
  #nodeToolbarItems(node) {
    let multiple = this.#selected.length > 1;
    let items = this.#commonNodeActions(node);
    if (multiple) {
      items[0].enabled = this.#selected.some((item) => !item.locked);
      items[1].enabled = items[2].enabled = items[0].enabled;
      let count = new ToolbarItem("node-count", Utilities.format(this.strings.TextMultipleNodesFormat, { count: this.#selected.length }), "", 0 /* button */);
      count.alwaysShowCaption = true;
      count.enabled = false;
      items.unshift(count, ToolbarItem.separator());
    } else {
      let actions = node.locked ? [] : node.actions();
      if (actions.length > 0)
        items.push(ToolbarItem.separator(), ...actions);
      if (!node.locked)
        items.push(ToolbarItem.separator(), this.#backgroundItem(node));
      if (node.toolbarCanResize && !node.locked)
        items.push(...this.#sizeItems(node));
    }
    if (this.allowAnnotations) {
      let comment = this.#catalogItem("comment");
      if (comment) {
        comment.enabled = this.annotations.canAdd;
        items.push(ToolbarItem.separator(), comment);
      }
    }
    return items;
  }
  /** Performs a node toolbar item. Returns true when the node toolbar should be rebuilt. */
  #activateNodeToolbarItem(node, activated, menuItem, anchor) {
    let targets = this.#selected.length > 1 ? this.inDocumentOrder(this.#selected) : [node];
    switch (activated.identifier) {
      case "node-move":
        if (anchor)
          this.#showNodeMenu(node, anchor);
        return false;
      case "node-duplicate":
        this.duplicateNodes(targets);
        break;
      case "node-delete":
        this.removeNodes(targets);
        break;
      case "node-width":
        this.#editNodeSize(node, "width");
        return false;
      case "node-height":
        this.#editNodeSize(node, "height");
        return false;
      case "node-background":
        if (menuItem)
          this.#performBackground(node, menuItem);
        break;
      case "comment":
        this.annotations.show(null, true);
        return false;
      default:
        if (!node.performAction(activated, menuItem))
          this.dispatchEvent(new CustomEvent("toolbarItemPressed", { detail: { item: activated, menuItem, node } }));
    }
    return true;
  }
  #positionNodeToolbar() {
    let toolbar = this.#nodeToolbarElement;
    let node = this.selectedNode;
    if (!toolbar || toolbar.classList.contains("d-none") || !node || !node.element || !node.element.isConnected)
      return;
    let page = this.#pageElement.getBoundingClientRect();
    let rect = (node.body || node.element).getBoundingClientRect();
    let gap = 4;
    let top = rect.top - page.top - toolbar.offsetHeight - gap;
    top = Math.max(top, this.#scrollerElement.scrollTop + gap);
    toolbar.style.top = `${Math.max(0, top)}px`;
    let rightToLeft = getComputedStyle(this.#documentElement).direction == "rtl";
    let left = rightToLeft ? rect.left - page.left : rect.right - page.left - toolbar.offsetWidth;
    left = Math.min(left, page.width - toolbar.offsetWidth - 4);
    toolbar.style.left = `${Math.max(4, left)}px`;
    let scroller = this.#scrollerElement.getBoundingClientRect();
    toolbar.classList.toggle("scv-node-toolbar-offscreen", rect.bottom < scroller.top || rect.top > scroller.bottom);
  }
  #showNodeMenu(node, anchor) {
    let strings = this.strings;
    let items = [];
    let convertible = (this.#selected.length > 1 && this.#selected.indexOf(node) >= 0 ? this.#selected : [node]).some((item) => item instanceof TextNode2 && item.isTextBlock);
    if (convertible && !this.#readOnly) {
      let entries = this.#blockKindEntries(true);
      let current = this.#currentBlockKind();
      let turnInto = entries.map(([identifier, caption, icon]) => {
        let entry = new ToolbarMenuItem(`turn:${identifier}`, caption, icon);
        entry.checked = _Editor.#blockKindMatches(identifier, current, entries);
        return entry;
      });
      items.push(ToolbarMenuItem.submenu("turninto", strings.TextTurnIntoCaption, "bi bi-arrow-left-right", turnInto), ToolbarMenuItem.separator());
    }
    let targets = this.#selected.length > 1 && this.#selected.indexOf(node) >= 0 ? this.inDocumentOrder(this.#selected) : [node];
    let up = new ToolbarMenuItem("moveup", strings.TextMoveUpCaption, "bi bi-arrow-up");
    up.enabled = this.canMoveNodes(targets, -1);
    let down = new ToolbarMenuItem("movedown", strings.TextMoveDownCaption, "bi bi-arrow-down");
    down.enabled = this.canMoveNodes(targets, 1);
    let duplicate = new ToolbarMenuItem("duplicate", strings.TextDuplicateNodeCaption, "bi bi-copy");
    let remove = new ToolbarMenuItem("delete", strings.TextRemoveNodeTooltip, "bi bi-trash3");
    duplicate.enabled = remove.enabled = targets.some((target) => !target.locked) && !this.#readOnly;
    items.push(up, down, duplicate, remove);
    let menu = new PopupMenu(items, (menuItem) => {
      if (menuItem.identifier.startsWith("turn:")) {
        let [kind, value] = menuItem.identifier.substring(5).split(":");
        this.selectNodes(targets);
        this.setBlockType(kind, Number(value || 0));
        return;
      }
      switch (menuItem.identifier) {
        case "moveup":
          this.moveNodes(targets, -1);
          break;
        case "movedown":
          this.moveNodes(targets, 1);
          break;
        case "duplicate":
          this.duplicateNodes(targets);
          break;
        case "delete":
          this.removeNodes(targets);
          break;
      }
    });
    menu.show(anchor, this.#element);
  }
  /** Shows the searchable list of blocks. Choosing one inserts it, replacing replace when given. */
  /** What the extensions add to the insertion chooser and command search. */
  insertionChoices() {
    let result = [];
    _Editor.#extensions.forEach((extension) => {
      if (extension.insertionChoices)
        result.push(...extension.insertionChoices(this));
    });
    return result;
  }
  showInsertionChooser(anchor, replace = null) {
    if (this.#readOnly)
      return;
    let state = this.captureSelection();
    let prepare = () => {
      this.restoreSelection(state);
      if (replace && replace instanceof TextNode2 && replace.content.text == "/") {
        replace.content.remove(0, 1);
      }
      return replace && replace instanceof TextNode2 && replace.content.length == 0 ? replace : null;
    };
    let chooser = new InsertionChooser(this.strings, this.nodeTypes.items(), (type) => {
      this.insertNodeOfType(type, prepare());
    }, this.insertionChoices(), (choice) => choice.choose(prepare()));
    chooser.onClose = () => {
      if (!this.#documentElement.contains(document.activeElement))
        this.restoreSelection(state);
    };
    let target = anchor || this.#toolbarElement && this.toolbarItems.item("insert")?.element || this.#documentElement;
    chooser.show(target, this.#element);
  }
  // Messages and dialogs
  #messages = [];
  /**
   * Shows a short notification over the editor: a Notification, or text with a
   * Bootstrap color name such as "info" or "danger" and a duration in milliseconds.
   * It disappears when clicked, or after its duration; zero keeps it until clicked.
   */
  showMessage(message, indicator = "info", duration = 4e3) {
    let notification = message instanceof Notification ? message : new Notification(String(message), Notification.typeFor(indicator));
    if (!(message instanceof Notification))
      notification.duration = duration / 1e3;
    if (notification.message.trim().length == 0 && notification.title.trim().length == 0)
      return;
    let showing = new CustomEvent("messageShowing", { detail: { notification, text: notification.message, indicator: notification.indicator }, cancelable: true });
    if (!this.dispatchEvent(showing) || !this.#messagesElement)
      return;
    let element = Utilities.element("div", `alert alert-${notification.indicator} scv-message shadow-sm`, { role: notification.type == 3 /* danger */ ? "alert" : "status" });
    let text = Utilities.element("div", "scv-message-text");
    if (notification.title.length > 0) {
      let title = Utilities.element("strong", "d-block");
      title.textContent = notification.title;
      text.append(title);
    }
    text.append(document.createTextNode(notification.message));
    element.append(text);
    let close = Utilities.element("button", "btn-close", { type: "button", "aria-label": this.strings.TextDoneCaption });
    element.append(close);
    element.addEventListener("click", () => this.closeMessage(notification));
    notification.element = element;
    this.#messages.unshift(notification);
    this.#messagesElement.prepend(element);
    if (notification.duration > 0)
      setTimeout(() => this.closeMessage(notification), notification.duration * 1e3);
  }
  /** The notifications being shown, newest first. */
  messages() {
    return this.#messages.slice();
  }
  closeMessage(notification) {
    let index = this.#messages.indexOf(notification);
    if (index >= 0)
      this.#messages.splice(index, 1);
    if (notification && notification.element)
      notification.element.remove();
    if (notification)
      notification.element = null;
  }
  /** Shows a small form and resolves with its values, or null when cancelled. The selection is restored afterwards. */
  async prompt(title, fields) {
    let state = this.captureSelection();
    let result = await Dialog.prompt(this.#element, this.strings, title, fields);
    this.restoreSelection(state);
    return result;
  }
  /** Applies a locale pack and rebuilds the interface text. */
  localize(pack) {
    let count = this.strings.apply(pack);
    this.resetToolbar();
    this.renderDocument();
    return count;
  }
  // Collaboration
  #collaborationClient = null;
  #collaborationLocks = /* @__PURE__ */ new Map();
  #collaborationAnnotationsAllowed = true;
  #movedAnchorIDs = /* @__PURE__ */ new Set();
  #applyingRemote = false;
  #presenceLayer = null;
  #presenceFrame = 0;
  /** The attached collaboration client, or null. */
  get collaborationClient() {
    return this.#collaborationClient;
  }
  /** The name of the user who holds the lock on a node, or "" when no one else does. */
  collaborationLockOwner(node) {
    return node ? this.#collaborationLocks.get(node.nodeId) || "" : "";
  }
  /** @internal */
  attachCollaborationClient(client) {
    this.#collaborationClient = client;
  }
  /** @internal */
  detachCollaborationClient(client) {
    if (this.#collaborationClient === client)
      this.#collaborationClient = null;
    this.#schedulePresence();
  }
  /** @internal The locks other users hold: node IDs and their owners' names. */
  collaborationLocks() {
    return new Map(this.#collaborationLocks);
  }
  /** @internal Forgets the annotation anchors local edits moved, such as when a shared document opens or closes. */
  clearMovedAnnotationAnchors() {
    this.#movedAnchorIDs.clear();
  }
  /** @internal Draws the other users' presence again on the next frame. */
  refreshPresence() {
    this.#schedulePresence();
  }
  /** @internal True while a change is still being made, such as a drag or an input-method composition. */
  get isCollaborationBusy() {
    return this.#composing || this.#dragNode !== null;
  }
  /** @internal True when another user holds the lock on node, on a node containing it, or on a node it contains. */
  isLockedByCollaborator(node) {
    let locks = this.#collaborationLocks;
    if (locks.size == 0 || !node)
      return false;
    for (let item = node; item; item = item.parent)
      if (locks.has(item.nodeId))
        return true;
    return node.descendants().some((child) => locks.has(child.nodeId));
  }
  /** @internal The top-level node containing node, or null. */
  collaborationRootNode(node) {
    let item = node;
    while (item && item.parent)
      item = item.parent;
    return item && this.#nodes.indexOf(item) >= 0 ? item : null;
  }
  /** @internal The document-level settings of toJSON, without serializing nodes. */
  collaborationSettings() {
    let result = {
      alignment: this.#alignment,
      textAlignment: this.#textAlignment,
      direction: this.#direction,
      fontName: this.#fontName,
      fontSize: this.#fontSize,
      backgroundColor: Colors.toJSON(this.#backgroundColor)
    };
    if (!this.backgroundImage.isEmpty)
      result.backgroundImage = this.backgroundImage.toJSON();
    return result;
  }
  /** @internal The text selection being edited, in code points, or null. */
  collaborationTextSelection() {
    let host = this.#activeHost;
    let range = host && this.#editingNode ? host.selection() : null;
    if (!range)
      return null;
    let text = host.rich.text;
    return { start: CodePoints.count(text.substring(0, range.start)), length: CodePoints.count(text.substring(range.start, range.end)) };
  }
  /** @internal Comments may be added and changed; false for a collaborator with Read access. */
  get collaborationAnnotationsAllowed() {
    return this.#collaborationAnnotationsAllowed;
  }
  set collaborationAnnotationsAllowed(value) {
    if (this.#collaborationAnnotationsAllowed == value)
      return;
    this.#collaborationAnnotationsAllowed = value;
    this.annotations.refreshPopover();
    this.updateToolbarState();
    this.#renderNodeToolbar();
  }
  /** Shows each node's locked state again after node.locked changes, and stops editing a node that became locked. */
  refreshLocks() {
    if (this.#editingNode && this.#editingNode.locked)
      this.endEditing();
    this.allNodes().forEach((node) => {
      node.element?.classList.toggle("scv-locked", node.locked);
      node.hosts().forEach((host) => {
        let editable = this.isEditingNode(node);
        if (host.editable != editable)
          host.editable = editable;
      });
    });
    this.#renderNodeToolbar();
    this.updateToolbarState();
  }
  /** @internal Replaces the locks other users hold: node IDs and their owners' names. */
  setCollaborationNodeLocks(locks) {
    let next = new Map(locks || []);
    let same = next.size == this.#collaborationLocks.size && Array.from(next.entries()).every(([key, value]) => this.#collaborationLocks.get(key) === value);
    if (same)
      return;
    this.#collaborationLocks = next;
    this.refreshLocks();
    this.#schedulePresence();
  }
  /** @internal Loads a server snapshot, keeping the selection. Returns false when it can't be loaded. */
  loadCollaborationSnapshot(snapshot) {
    let state = this.captureSelection();
    let focused = !!this.#documentElement && this.#documentElement.contains(document.activeElement);
    this.#applyingRemote = true;
    let loaded = false;
    try {
      loaded = this.fromJSON(snapshot);
    } finally {
      this.#applyingRemote = false;
    }
    if (!loaded)
      return false;
    this.#movedAnchorIDs.clear();
    this.#restoreCollaborationSelection(state, focused);
    return true;
  }
  #restoreCollaborationSelection(state, focused) {
    if (!state)
      return;
    if (focused) {
      this.restoreSelection(state);
      return;
    }
    let identifiers = state.nodeId.length > 0 ? [state.nodeId] : state.nodeIds;
    let nodes = identifiers.map((identifier) => this.nodeWithID(identifier)).filter((node) => node !== null);
    if (nodes.length > 0)
      this.#setSelection(nodes, true);
  }
  /** @internal Applies another user's document.atomic operation. Not an undo step; undo won't revert it. */
  applyCollaborationOperation(operation) {
    if (!operation || operation.kind != "document.atomic")
      return false;
    let state = this.captureSelection();
    let focused = !!this.#documentElement && this.#documentElement.contains(document.activeElement);
    let editing = this.#editingNode;
    let caretHost = this.#activeHost;
    let rerender = false;
    this.#applyingRemote = true;
    try {
      if (operation.settings)
        rerender = this.#applyCollaborationSettings(operation.settings);
      if (Array.isArray(operation.removed)) {
        operation.removed.forEach((value) => {
          let index = this.#nodes.findIndex((node) => node.nodeId === Utilities.string(value));
          if (index >= 0)
            this.#nodes.splice(index, 1);
        });
      }
      if (Array.isArray(operation.nodes)) {
        for (let change of operation.nodes) {
          let data = change && change.node;
          let replacement = this.nodeFromJSON(data);
          if (!replacement)
            return false;
          let index = this.#nodes.findIndex((node) => node.nodeId === replacement.nodeId);
          if (index >= 0) {
            this.#nodes.splice(index, 1, replacement);
          } else {
            this.#nodes.splice(Utilities.clamp(Utilities.integer(change.index, this.#nodes.length), 0, this.#nodes.length), 0, replacement);
          }
        }
      }
      if (Array.isArray(operation.order)) {
        let byID = new Map(this.#nodes.map((node) => [node.nodeId, node]));
        let named = operation.order.map((value) => byID.get(Utilities.string(value))).filter((node) => !!node);
        let namedSet = new Set(named);
        let result = named.slice();
        this.#nodes.forEach((node, index) => {
          if (!namedSet.has(node))
            result.splice(Math.min(index, result.length), 0, node);
        });
        this.#nodes.splice(0, this.#nodes.length, ...result);
      }
      let present = new Set(this.allNodes());
      this.#selected = this.#selected.map((node) => present.has(node) ? node : this.nodeWithID(node.nodeId)).filter((node) => node !== null);
      let caretLost = false;
      if (editing && !present.has(editing)) {
        this.#editingNode = null;
        this.#activeHost = null;
        this.#pending = null;
        caretLost = true;
      }
      if (rerender) {
        this.renderDocument();
      } else {
        this.#placeChildren(this.#nodes);
      }
      this.#applySelectionClasses();
      if (focused && state && (caretLost || caretHost && document.activeElement !== caretHost.element && !caretHost.element.contains(document.activeElement))) {
        this.#restoreCollaborationSelection(state, true);
      }
      this.#syncAnnotations();
      if (operation.annotationAnchors && typeof operation.annotationAnchors == "object")
        this.#applyAnnotationAnchors(operation.annotationAnchors);
    } catch {
      return false;
    } finally {
      this.#applyingRemote = false;
    }
    this.history.rebase((document2) => this.#collaborationClient?.applyToDocument(document2, operation));
    this.#isChanged = true;
    this.#renderNodeToolbar();
    this.#scheduleTableOfContents();
    this.#scheduleAnnotationMarkers();
    this.#schedulePresence();
    this.updateToolbarState();
    this.dispatchEvent(new CustomEvent("contentChanged", { detail: { node: null, remote: true } }));
    return true;
  }
  /** Puts a list's nodes into its container in order, moving only those out of place, so the caret survives. */
  #placeChildren(list) {
    let container = this.#listElements.get(list);
    if (!container)
      return;
    let owner = this.#listOwners.get(list) || null;
    let expected = /* @__PURE__ */ new Set();
    list.forEach((child) => {
      child.parent = owner;
      child.editor = this;
      if (!child.element || child.element.parentElement !== container) {
        if (child.element)
          child.element.remove();
        this.renderNode(child);
      }
      expected.add(child.element);
    });
    Array.from(container.children).forEach((child) => {
      if (child.classList.contains("scv-node") && !expected.has(child))
        child.remove();
    });
    let nodes = () => Array.from(container.children).filter((child) => child.classList.contains("scv-node"));
    list.forEach((child, index) => {
      let current = nodes()[index];
      if (current !== child.element)
        container.insertBefore(child.element, current || null);
    });
    container.classList.toggle("scv-children-empty", list.length == 0);
    if (container === this.#documentElement)
      this.#updateEmptyDocument();
  }
  /** Applies document settings from an operation. Returns true when the document must be rendered again. */
  #applyCollaborationSettings(settings) {
    let previousAlignment = this.#alignment;
    let previousTextAlignment = this.#textAlignment;
    let alignment = Utilities.integer(settings.alignment, this.#alignment);
    if (alignment >= 1 /* leading */ && alignment <= 3 /* trailing */)
      this.#alignment = alignment;
    let textAlignment = Utilities.integer(settings.textAlignment, this.#textAlignment);
    if (textAlignment >= 1 /* leading */ && textAlignment <= 3 /* trailing */)
      this.#textAlignment = textAlignment;
    let direction = Utilities.integer(settings.direction, this.#direction);
    if (direction >= 0 /* automatic */ && direction <= 2 /* rightToLeft */)
      this.#direction = direction;
    if ("fontName" in settings)
      this.#fontName = Utilities.string(settings.fontName, "System") || "System";
    if ("fontSize" in settings)
      this.#fontSize = Utilities.number(settings.fontSize, DefaultFontSize) || DefaultFontSize;
    if (settings.backgroundColor)
      this.#backgroundColor = Colors.fromJSON(settings.backgroundColor, this.#backgroundColor);
    this.#backgroundImage = Utilities.boolean(settings.hasBackgroundImage, false) && settings.backgroundImage ? BackgroundImage.fromJSON(settings.backgroundImage) : new BackgroundImage();
    this.#applyDocumentAppearance();
    return previousAlignment != this.#alignment || previousTextAlignment != this.#textAlignment;
  }
  /** Places annotations where the user who made an edit put them. Offsets are in code points. */
  #applyAnnotationAnchors(anchors) {
    this.annotations.items().forEach((item) => {
      let anchor = anchors[item.id];
      if (!anchor || item.coversNode)
        return;
      let node = this.nodeWithID(item.nodeID);
      let segment = Math.max(0, Utilities.integer(anchor.segment, item.segment));
      let host = node ? node.hosts()[segment] : null;
      if (!host)
        return;
      let text = host.rich.text;
      let start = Annotation.fromCodePoints(text, Math.max(0, Utilities.integer(anchor.start, 0)));
      let end = Annotation.fromCodePoints(text, Math.max(0, Utilities.integer(anchor.start, 0)) + Math.max(0, Utilities.integer(anchor.length, 0)));
      item.setAnchor(item.nodeID, segment, start, end - start, false, item.quote, text);
    });
  }
  /** @internal The anchors local edits moved since the last call, by annotation ID, in code points. */
  collaborationAnnotationAnchors() {
    if (this.#movedAnchorIDs.size == 0)
      return null;
    this.#syncAnnotations();
    let result = {};
    this.#movedAnchorIDs.forEach((identifier) => {
      let item = this.annotations.item(identifier);
      if (!item || item.coversNode)
        return;
      let data = item.toJSON();
      result[identifier] = { segment: data.segment, start: data.start, length: data.length };
    });
    this.#movedAnchorIDs.clear();
    return result;
  }
  /** @internal Applies the server's copy of an annotation, or its deletion. Not an undo step; undo won't revert it. */
  applyCollaborationAnnotation(message) {
    if (!message)
      return;
    let identifier = Utilities.string(message.annotationId);
    let data = !Utilities.boolean(message.deleted, false) && message.annotation && typeof message.annotation == "object" ? message.annotation : null;
    this.#applyingRemote = true;
    try {
      this.annotations.applyRemote(identifier, data);
    } finally {
      this.#applyingRemote = false;
    }
    this.history.rebase((document2) => {
      let items = Array.isArray(document2.annotations) ? document2.annotations : [];
      let index = items.findIndex((item) => item && item.id === identifier);
      if (data && index >= 0)
        items[index] = JSON.parse(JSON.stringify(data));
      else if (data)
        items.push(JSON.parse(JSON.stringify(data)));
      else if (index >= 0)
        items.splice(index, 1);
      if (items.length > 0)
        document2.annotations = items;
      else
        delete document2.annotations;
    });
  }
  /** @internal The server removed this user's access: the shared content and its undo history leave the editor. */
  clearCollaborationDocument() {
    this.endEditing();
    Popup2.closeAll();
    this.annotations.load([]);
    this.#nodes.splice(0, this.#nodes.length, new TextNode2());
    this.#selected = [];
    this.#activeHost = null;
    this.renderDocument();
    this.history.reset();
    this.#isChanged = false;
    this.dispatchEvent(new CustomEvent("contentChanged", { detail: { node: null, remote: true } }));
    this.dispatchEvent(new CustomEvent("selectionChanged", { detail: { node: null } }));
  }
  #schedulePresence() {
    if (this.#presenceFrame || !this.#element)
      return;
    this.#presenceFrame = requestAnimationFrame(() => {
      this.#presenceFrame = 0;
      this.#renderPresence();
    });
  }
  /** Draws the other users' presence over the page, through the attached collaboration client. */
  #renderPresence() {
    let layer = this.#presenceLayer;
    if (!layer || !this.#pageElement)
      return;
    layer.textContent = "";
    this.#collaborationClient?.renderPresence(layer);
  }
  // Persistence
  /** The document as an object in the JSON document format. */
  toJSONObject() {
    let result = { version: CurrentDocumentVersion, documentId: this.documentID };
    if (this.#alignment != 1 /* leading */)
      result["alignment"] = this.#alignment;
    if (this.#textAlignment != 1 /* leading */)
      result["textAlignment"] = this.#textAlignment;
    if (this.#direction != 0 /* automatic */)
      result["direction"] = this.#direction;
    result["fontName"] = this.#fontName;
    result["fontSize"] = this.#fontSize;
    result["backgroundColor"] = Colors.toJSON(this.#backgroundColor);
    if (!this.backgroundImage.isEmpty)
      result["backgroundImage"] = this.backgroundImage.toJSON();
    result["nodes"] = this.#nodes.map((node) => node.toJSON());
    this.#syncAnnotations();
    let annotations = this.annotations.items();
    if (annotations.length > 0)
      result["annotations"] = annotations.map((item) => item.toJSON());
    return result;
  }
  toJSON() {
    return JSON.stringify(this.toJSONObject());
  }
  /** Checks a document without loading it. */
  validateJSON(value) {
    let issues = [];
    let source = value;
    if (typeof value == "string") {
      try {
        source = JSON.parse(value);
      } catch {
        return [new ValidationIssue(1 /* error */, "The document is not valid JSON.")];
      }
    }
    if (!source || typeof source != "object" || Array.isArray(source))
      return [new ValidationIssue(1 /* error */, "The document must be a JSON object.")];
    if (!Array.isArray(source.nodes))
      return [new ValidationIssue(1 /* error */, "The document has no nodes array.")];
    let version = Utilities.integer(source.version, 1);
    if (version > CurrentDocumentVersion)
      issues.push(new ValidationIssue(1 /* error */, `The document format ${version} is newer than this editor supports (${CurrentDocumentVersion}).`));
    if (version < CurrentDocumentVersion)
      issues.push(new ValidationIssue(0 /* warning */, `The document format ${version} will be converted to ${CurrentDocumentVersion}.`));
    let check = (nodes, path) => {
      nodes.forEach((node, index) => {
        if (!node || typeof node != "object") {
          issues.push(new ValidationIssue(0 /* warning */, `${path}[${index}] is not a node object.`));
          return;
        }
        let type = Utilities.string(node.type);
        if (type.length == 0)
          issues.push(new ValidationIssue(0 /* warning */, `${path}[${index}] has no type.`));
        else if (!this.nodeTypes.item(type))
          issues.push(new ValidationIssue(0 /* warning */, `${path}[${index}] has the unsupported type "${type}" and will be kept as it is.`));
      });
    };
    check(source.nodes, "nodes");
    return issues;
  }
  /** Converts documents saved in earlier formats. */
  #migrate(source) {
    let version = Utilities.integer(source.version, 1);
    if (version < 4) {
      if (!("fontSize" in source))
        source.fontSize = 17;
      let visit = (value) => {
        if (Array.isArray(value)) {
          value.forEach(visit);
        } else if (value && typeof value == "object") {
          ;
          ["styleTable", "styles", "captionStyles"].forEach((name) => {
            if (Array.isArray(value[name]))
              value[name].forEach((style) => {
                if (style && style.fontSize == 17)
                  delete style.fontSize;
              });
          });
          if (value.type && value.fontSize == 17)
            delete value.fontSize;
          Object.keys(value).forEach((key) => visit(value[key]));
        }
      };
      visit(source.nodes);
    }
    source.version = CurrentDocumentVersion;
  }
  /** Loads a document. Returns false, leaving the editor unchanged, when it can't be loaded; see lastValidationIssues. */
  fromJSON(value) {
    let source = value;
    if (typeof value == "string") {
      try {
        source = JSON.parse(value);
      } catch {
        this.lastValidationIssues = [new ValidationIssue(1 /* error */, "The document is not valid JSON.")];
        return false;
      }
    } else {
      source = JSON.parse(JSON.stringify(value));
    }
    this.lastValidationIssues = this.validateJSON(source);
    if (this.lastValidationIssues.some((issue) => issue.severity == 1 /* error */))
      return false;
    this.#migrate(source);
    this.#load(source);
    this.recognizeSuggestions(this.#nodes);
    this.history.reset();
    this.#isChanged = false;
    this.dispatchEvent(new CustomEvent("contentChanged", { detail: { node: null } }));
    this.#collaborationClient?.editorContentChanged(null);
    this.#schedulePresence();
    return true;
  }
  /** Replaces the document from JSON without validation or resetting undo. Used by undo and redo. */
  restoreDocument(value) {
    let source = JSON.parse(value);
    this.#restoring = true;
    try {
      this.#load(source);
    } finally {
      this.#restoring = false;
    }
    this.#isChanged = true;
    this.dispatchEvent(new CustomEvent("contentChanged", { detail: { node: null } }));
    this.#collaborationClient?.editorContentChanged(null);
    this.#schedulePresence();
  }
  #load(source) {
    Popup2.closeAll();
    let documentID = Utilities.string(source.documentId).trim();
    if (documentID.length > 0)
      this.documentID = documentID;
    let alignment = Utilities.integer(source.alignment, 1 /* leading */);
    this.#alignment = alignment >= 1 && alignment <= 3 ? alignment : 1 /* leading */;
    let textAlignment = Utilities.integer(source.textAlignment, 1 /* leading */);
    this.#textAlignment = textAlignment >= 1 && textAlignment <= 3 ? textAlignment : 1 /* leading */;
    let direction = Utilities.integer(source.direction, 0 /* automatic */);
    if (direction == 1 /* leftToRight */ || direction == 2 /* rightToLeft */)
      this.#direction = direction;
    if ("fontName" in source)
      this.#fontName = Utilities.string(source.fontName, "System") || "System";
    if ("fontSize" in source)
      this.#fontSize = Utilities.number(source.fontSize, DefaultFontSize) || DefaultFontSize;
    this.#backgroundColor = Colors.fromJSON(source.backgroundColor, Colors.make(255, 255, 255));
    this.backgroundImage = source.backgroundImage ? BackgroundImage.fromJSON(source.backgroundImage) : new BackgroundImage();
    let previousAnnotations = this.#restoring ? this.annotations.items().map((item) => ({ id: item.id, json: JSON.stringify(item.toJSON()) })) : null;
    let loadedAnnotations = [];
    if (Array.isArray(source.annotations)) {
      source.annotations.forEach((item) => {
        let annotation = Annotation.fromJSON(item);
        if (!annotation)
          return;
        let existing = this.#restoring ? this.annotations.item(annotation.id) : null;
        if (existing) {
          existing.assign(annotation);
          annotation = existing;
        }
        loadedAnnotations.push(annotation);
      });
    }
    this.annotations.load(loadedAnnotations);
    let kept = /* @__PURE__ */ new Map();
    if (this.#restoring)
      this.#nodes.forEach((node) => kept.set(node.nodeId, node));
    this.#nodes.splice(0, this.#nodes.length);
    if (Array.isArray(source.nodes)) {
      source.nodes.forEach((item) => {
        let previous = item && kept.get(item.nodeId);
        if (previous && JSON.stringify(previous.toJSON()) == JSON.stringify(item)) {
          kept.delete(item.nodeId);
          this.#nodes.push(previous);
          return;
        }
        let node = this.nodeFromJSON(item);
        if (node)
          this.#nodes.push(node);
      });
    }
    this.#selected = [];
    this.#activeHost = null;
    this.#pending = null;
    this.#applyDocumentAppearance();
    this.renderDocument();
    this.#element?.classList.remove("scv-node-mode");
    this.#syncAnnotations();
    this.#scheduleAnnotationMarkers();
    if (previousAnnotations) {
      let current = this.annotations.items();
      current.forEach((item) => {
        let before = previousAnnotations.find((entry) => entry.id == item.id);
        if (!before) {
          this.dispatchEvent(new CustomEvent("annotationAdded", { detail: { annotation: item } }));
          this.#collaborationClient?.editorAnnotationChanged(item, false);
        } else if (before.json != JSON.stringify(item.toJSON())) {
          this.dispatchEvent(new CustomEvent("annotationChanged", { detail: { annotation: item } }));
          this.#collaborationClient?.editorAnnotationChanged(item, false);
        }
      });
      previousAnnotations.forEach((entry) => {
        if (current.some((item) => item.id == entry.id))
          return;
        let removed = Annotation.fromJSON(JSON.parse(entry.json));
        this.dispatchEvent(new CustomEvent("annotationRemoved", { detail: { annotation: removed } }));
        this.#collaborationClient?.editorAnnotationChanged(removed, true);
      });
    }
  }
  #restoring = false;
  /** Replaces the document with HTML. */
  /** Replaces the document with HTML. HTML with nothing the editor can import leaves the document as it was. */
  fromHTML(html) {
    let nodes = this.importer.import(html);
    if (nodes.length == 0)
      return;
    let style = this.importer.documentStyle(html);
    this.#loadImported(nodes, style);
  }
  /** Replaces the document with Markdown. */
  fromMarkdown(markdown) {
    let html = MarkdownConverter.toHTML(markdown);
    let parsed = new DOMParser().parseFromString(html, "text/html");
    let wrapper = parsed.body.children.length == 1 && parsed.body.firstElementChild.tagName == "DIV" ? parsed.body.firstElementChild : null;
    let style = null;
    if (wrapper && /background-(color|image)/.test(wrapper.getAttribute("style") || "")) {
      style = this.importer.elementDocumentStyle(wrapper);
      html = wrapper.innerHTML;
    }
    this.#loadImported(this.importer.import(html), style);
  }
  #loadImported(nodes, style = null) {
    if (style) {
      if (style.fontName.length > 0)
        this.#fontName = style.fontName;
      if (style.fontSize > 0)
        this.#fontSize = style.fontSize;
      if (style.backgroundColor)
        this.#backgroundColor = style.backgroundColor;
      if (style.backgroundImage)
        this.backgroundImage = style.backgroundImage;
      if (style.direction !== null)
        this.#direction = style.direction;
      this.#applyDocumentAppearance();
    }
    this.#nodes.splice(0, this.#nodes.length, ...nodes);
    this.#selected = [];
    this.#activeHost = null;
    this.annotations.load([]);
    this.renderDocument();
    this.recognizeSuggestions(this.#nodes);
    this.history.reset();
    this.#isChanged = false;
    this.#scheduleTableOfContents();
    this.dispatchEvent(new CustomEvent("contentChanged", { detail: { node: null } }));
  }
  /** Inserts HTML where the user is working, or after target. */
  insertHTML(html, target) {
    let nodes = this.importer.import(html);
    if (target) {
      this.insertNodesAfter(target, nodes);
    } else {
      this.#insertNodesAtCaret(nodes);
    }
  }
  insertMarkdown(markdown, target) {
    this.insertHTML(MarkdownConverter.toHTML(markdown), target);
  }
  /** Exports with a registered format: "html", "json", "markdown" or "text", or one added to exporters. Returns "" for an unknown identifier. */
  export(identifier) {
    let exporter = this.exporters.item(identifier);
    return exporter ? exporter.export(this) : "";
  }
  /** Offers an export to the user as a download. Returns false for an unknown identifier. */
  exportToFile(identifier, fileName = "document") {
    let exporter = this.exporters.item(identifier);
    return exporter ? exporter.exportToFile(this, fileName) : false;
  }
  /** HTML for the document. With includeDocumentElements, a complete page with a stylesheet. */
  /** The document as HTML. includeAnnotations appends the comment threads in a section after the content. */
  toHTML(includeDocumentElements = false, includeAnnotations = false) {
    let body = this.#nodes.filter((node) => node.canExportHTML).map((node) => node.toHTML()).join("\n");
    if (includeAnnotations)
      body += this.#annotationsHTML();
    if (!includeDocumentElements)
      return body;
    let background = Colors.toCSS(this.#backgroundColor);
    let bodyStyle = `background-color:${background};font-family:${Utilities.fontFamilyCSS(this.#fontName).replace(/"/g, "'")};font-size:${this.#fontSize}px;`;
    if (!this.backgroundImage.isEmpty)
      bodyStyle += this.backgroundImage.toCSS();
    let direction = this.#direction == 2 /* rightToLeft */ ? ` dir="rtl"` : this.#direction == 1 /* leftToRight */ ? ` dir="ltr"` : "";
    return `<!doctype html>
<html${direction}>
<head>
<meta charset="utf-8">
<style>
${this.exportCSS()}
</style>
</head>
<body style="${Utilities.escapeAttribute(bodyStyle)}">
${body}
</body>
</html>`;
  }
  /** The stylesheet used by toHTML(true), as CSS text. */
  exportCSS() {
    return this.exportStylesheet().toString();
  }
  /**
   * The stylesheet for HTML export. Node types add their own rules with a static
   * exportStyles(stylesheet) method.
   */
  exportStylesheet() {
    let sheet = new Stylesheet8();
    sheet.addCSS(this.#baseExportCSS());
    sheet.addCSS(WebFonts.fontFaceCSS(WebFonts.used(this)));
    let exported = /* @__PURE__ */ new Set();
    this.allNodes().forEach((node) => {
      let type = node.constructor;
      if (exported.has(type))
        return;
      exported.add(type);
      if (typeof type.exportStyles == "function")
        type.exportStyles(sheet, this);
    });
    return sheet;
  }
  #baseExportCSS() {
    let background = Colors.toCSS(this.#backgroundColor);
    let rules = [
      `*, *::before, *::after { box-sizing: border-box }`,
      `html { color-scheme: light; background: ${background} }`,
      `body { margin: 0; padding: 48px; background-color: ${background}; color: ${_Editor.themeCSS(this, 8 /* text */)}; line-height: 1.5; font-family: ${Utilities.fontFamilyCSS(this.#fontName)}; font-size: ${this.#fontSize}px }`,
      `body > * { margin-top: 0; margin-bottom: 22px }`
    ];
    if (this.#direction == 0 /* automatic */)
      rules.push(`p, li, h1, h2, h3, h4, h5, h6, blockquote, figcaption, td, th, label, legend { unicode-bidi: plaintext }`);
    rules.push(
      `a { color: ${_Editor.themeCSS(this, 10 /* link */)}; text-decoration: underline }`,
      `code, kbd { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.875em }`,
      `:not(pre) > code, span > code { padding: 0.15em 0.35em; background: rgba(175,184,193,0.2); border-radius: 4px }`,
      `kbd { padding: 0.1em 0.4em; border: 1px solid ${_Editor.themeCSS(this, 11 /* border */)}; border-bottom-width: 2px; border-radius: 4px; background: ${_Editor.themeCSS(this, 13 /* surface */)} }`,
      `mark { background: ${_Editor.themeCSS(this, 16 /* highlight */)} }`,
      `@media print { body { padding: 0 } }`
    );
    return rules.join("\n");
  }
  #themeColors = /* @__PURE__ */ new Map();
  /** The default color for a theme color. */
  static defaultThemeColor(kind) {
    let values = {
      [0 /* background */]: "#ffffff",
      [1 /* primary */]: "#2563eb",
      [2 /* selection */]: "#3b82f6",
      [3 /* textSelection */]: "rgba(147,197,253,0.47)",
      [4 /* information */]: "#2563eb",
      [5 /* success */]: "#198754",
      [6 /* warning */]: "#ffc107",
      [7 /* danger */]: "#c71c22",
      [8 /* text */]: "#000000",
      [9 /* textMuted */]: "#64748b",
      [10 /* link */]: "#0066cc",
      [11 /* border */]: "#cbd5e1",
      [12 /* borderStrong */]: "#94a3b8",
      [13 /* surface */]: "#f1f5f9",
      [14 /* dark */]: "#0f172a",
      [15 /* light */]: "#e2e8f0",
      [16 /* highlight */]: "#fef08a"
    };
    return Colors.fromCSS(values[kind] || "#000000");
  }
  /** A color exported HTML is drawn with: the one set with setThemeColor, or the default. */
  themeColor(kind) {
    return Colors.clone(this.#themeColors.get(kind) || _Editor.defaultThemeColor(kind));
  }
  /** Sets a color exported HTML is drawn with; null restores the default. */
  setThemeColor(kind, value) {
    if (value) {
      this.#themeColors.set(kind, Colors.clone(value));
    } else {
      this.#themeColors.delete(kind);
    }
  }
  /** A theme color as CSS, from an editor or the defaults. alpha replaces its transparency, where 255 is fully transparent. */
  static themeCSS(editor, kind, alpha = null) {
    let color = editor ? editor.themeColor(kind) : _Editor.defaultThemeColor(kind);
    if (alpha !== null)
      color.alpha = alpha;
    return Colors.toCSS(color);
  }
  toMarkdown() {
    let parts = this.#nodes.map((node) => node.toMarkdown()).filter((value) => value.length > 0);
    let style = this.#documentAppearanceCSS();
    if (style.length > 0)
      parts = [`<div style="${Utilities.escapeAttribute(style)}">`, ...parts, "</div>"];
    return parts.join("\n\n") + "\n";
  }
  /** The background color and image CSS of a document that has either, or "". */
  #documentAppearanceCSS() {
    let white = Colors.make(255, 255, 255);
    if (Colors.equals(this.#backgroundColor, white) && this.backgroundImage.isEmpty)
      return "";
    return `background-color:${Colors.toCSS(this.#backgroundColor)};${this.backgroundImage.toCSS()}`;
  }
  toPlainText() {
    return this.#nodes.map((node) => node.toPlainText()).join("\n");
  }
  /** Prints the document. */
  print() {
    let frame = Utilities.element("iframe", "", { "aria-hidden": "true" });
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.append(frame);
    let frameDocument = frame.contentDocument;
    frameDocument.open();
    frameDocument.write(this.toHTML(true));
    frameDocument.close();
    Promise.all([WebFonts.settle(frameDocument), new Promise((resolve) => setTimeout(resolve, 100))]).then(() => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 1e3);
    });
  }
};

// inspectorsections.ts
var InspectorEditors = /* @__PURE__ */ ((InspectorEditors2) => {
  InspectorEditors2[InspectorEditors2["automatic"] = 0] = "automatic";
  InspectorEditors2[InspectorEditors2["text"] = 1] = "text";
  InspectorEditors2[InspectorEditors2["multilineText"] = 2] = "multilineText";
  InspectorEditors2[InspectorEditors2["number"] = 3] = "number";
  InspectorEditors2[InspectorEditors2["toggle"] = 4] = "toggle";
  InspectorEditors2[InspectorEditors2["menu"] = 5] = "menu";
  InspectorEditors2[InspectorEditors2["color"] = 6] = "color";
  InspectorEditors2[InspectorEditors2["image"] = 7] = "image";
  InspectorEditors2[InspectorEditors2["file"] = 8] = "file";
  InspectorEditors2[InspectorEditors2["action"] = 9] = "action";
  return InspectorEditors2;
})(InspectorEditors || {});
var InspectorItem2 = class _InspectorItem {
  identifier;
  caption;
  propertyName;
  editor;
  description = "";
  enabled = true;
  readOnly = false;
  minimumValue = -2147483648;
  maximumValue = 2147483647;
  stepValue = 1;
  /** False applies text only when the edit is committed (Return, Tab or leaving the field). */
  updatesLive = true;
  /** The button caption of an action item. */
  actionCaption = "Run";
  /** The accept attribute of a file item's chooser, such as "image/*". */
  fileFilter = "";
  /** A number item whose value is zero shows this instead, such as "Automatic". */
  zeroCaption = "";
  getter = null;
  setter = null;
  /** Returns false for targets the item doesn't apply to. */
  availability = null;
  /** Runs an action item. Without it, the target's inspectorAction handles the item. */
  action = null;
  #choices = [];
  #defaultValue = void 0;
  #hasDefaultValue = false;
  #defaultFor = null;
  constructor(identifier, caption, propertyName = "", editor = 0 /* automatic */) {
    this.identifier = identifier;
    this.caption = caption;
    this.propertyName = propertyName;
    this.editor = editor;
  }
  /** Makes an item read and written by functions. */
  static bound(identifier, caption, editor, getter, setter) {
    let result = new _InspectorItem(identifier, caption, "", editor);
    result.getter = getter;
    result.setter = setter;
    if (!setter && editor != 9 /* action */)
      result.readOnly = true;
    return result;
  }
  static menu(identifier, caption, choices, getter, setter) {
    let result = _InspectorItem.bound(identifier, caption, 5 /* menu */, getter, setter);
    choices.forEach(([choiceCaption, value]) => result.addChoice(choiceCaption, value));
    return result;
  }
  static number(identifier, caption, getter, setter, minimum = -2147483648, maximum = 2147483647, step = 1) {
    let result = _InspectorItem.bound(identifier, caption, 3 /* number */, getter, setter);
    result.minimumValue = minimum;
    result.maximumValue = maximum;
    result.stepValue = step;
    return result;
  }
  static actionItem(identifier, caption, actionCaption, run) {
    let result = new _InspectorItem(identifier, caption, "", 9 /* action */);
    result.actionCaption = actionCaption;
    result.action = run;
    return result;
  }
  addChoice(caption, value) {
    this.#choices.push({ caption, value });
    if (this.editor == 0 /* automatic */)
      this.editor = 5 /* menu */;
  }
  choices() {
    return this.#choices.slice();
  }
  get lastChoiceIndex() {
    return this.#choices.length - 1;
  }
  choiceCaptionAt(index) {
    return this.#choices[index] ? this.#choices[index].caption : "";
  }
  choiceValueAt(index) {
    return this.#choices[index] ? this.#choices[index].value : void 0;
  }
  /** Sets the value Reset to Default assigns. A function receives the target. */
  setDefaultValue(value) {
    if (typeof value == "function") {
      this.#defaultFor = value;
    } else {
      this.#defaultValue = value;
    }
    this.#hasDefaultValue = true;
  }
  get hasDefaultValue() {
    return this.#hasDefaultValue;
  }
  /** The value a reset assigns for target, or undefined when there is none. */
  defaultValueFor(target) {
    if (this.#defaultFor)
      return this.#defaultFor(target);
    if (this.#hasDefaultValue)
      return this.#defaultValue;
    let pristine = _InspectorItem.pristine(target);
    if (!pristine)
      return void 0;
    try {
      return this.value(pristine);
    } catch {
      return void 0;
    }
  }
  static #pristine = /* @__PURE__ */ new Map();
  static pristine(target) {
    if (!(target instanceof Node3))
      return null;
    let type = target.constructor;
    if (!_InspectorItem.#pristine.has(type)) {
      let instance = null;
      try {
        instance = new type();
      } catch {
        instance = null;
      }
      _InspectorItem.#pristine.set(type, instance);
    }
    return _InspectorItem.#pristine.get(type);
  }
  isAvailable(target) {
    if (this.availability)
      return this.availability(target);
    if (this.getter || this.action || this.editor == 9 /* action */ || this.editor == 8 /* file */)
      return true;
    return this.propertyName.length > 0 && target && this.propertyName in target;
  }
  value(target) {
    if (this.getter)
      return this.getter(target);
    return this.propertyName.length > 0 && target ? target[this.propertyName] : void 0;
  }
  /** Assigns value to target. Returns false when the item can't be written. */
  setValue(target, value) {
    if (this.readOnly)
      return false;
    if (this.setter) {
      this.setter(target, value);
      return true;
    }
    if (this.propertyName.length == 0 || !target)
      return false;
    target[this.propertyName] = value;
    return true;
  }
  /** Whether two values are the same, comparing colors and objects by content. */
  static same(a, b) {
    if (a === b)
      return true;
    if (a === null || b === null || a === void 0 || b === void 0)
      return false;
    if (typeof a == "object" || typeof b == "object")
      return JSON.stringify(a) == JSON.stringify(b);
    return false;
  }
};
var InspectorSection11 = class {
  identifier;
  caption;
  #items = [];
  constructor(identifier, caption) {
    this.identifier = identifier;
    this.caption = caption;
  }
  add(item) {
    this.#items.push(item);
    return item;
  }
  addAt(index, item) {
    this.#items.splice(Utilities.clamp(index, 0, this.#items.length), 0, item);
  }
  indexOf(item) {
    if (typeof item == "string")
      return this.#items.findIndex((candidate) => candidate.identifier == item);
    return this.#items.indexOf(item);
  }
  item(identifier) {
    return this.#items.find((candidate) => candidate.identifier == identifier) || null;
  }
  itemAt(index) {
    return this.#items[index] || null;
  }
  items() {
    return this.#items.slice();
  }
  get lastIndex() {
    return this.#items.length - 1;
  }
  removeAt(index) {
    this.#items.splice(index, 1);
  }
  remove(item) {
    let index = this.indexOf(item);
    if (index >= 0)
      this.removeAt(index);
  }
  removeAll() {
    this.#items = [];
  }
};
var InspectorDefaults = class _InspectorDefaults {
  static alignmentChoices(strings, automatic) {
    let result = [];
    if (automatic)
      result.push([strings.TextAutomatic, 0 /* automatic */]);
    result.push([strings.TextStartAlignmentCaption, 1 /* leading */], [strings.TextCenterAlignmentCaption, 2 /* middle */], [strings.TextEndAlignmentCaption, 3 /* trailing */]);
    return result;
  }
  static #directionChoices(strings) {
    return [[strings.TextAutomatic, 0 /* automatic */], [strings.TextLeftToRightDirectionCaption, 1 /* leftToRight */], [strings.TextRightToLeftDirectionCaption, 2 /* rightToLeft */]];
  }
  static #fontChoices(editor, strings, current, defaultValue) {
    let names = editor ? editor.fontNames.slice() : ["System"];
    if (current.length > 0 && names.indexOf(current) < 0)
      names.push(current);
    return [[strings.TextDefault, defaultValue]].concat(names.filter((name) => name !== defaultValue).map((name) => [name, name]));
  }
  static #sizeChoices(editor, strings, current, defaultValue) {
    let sizes = (editor ? editor.fontSizes : [0, 12, 14, 16, 18, 24]).filter((size) => size > 0);
    if (current > 0 && sizes.indexOf(current) < 0)
      sizes.push(current);
    sizes.sort((a, b) => a - b);
    return [[strings.TextDefault, defaultValue]].concat(sizes.filter((size) => size !== defaultValue).map((size) => [String(size), size]));
  }
  /** The Background Image section for an object with a backgroundImage property. */
  static backgroundImageSection(strings, read, write, identifier = "backgroundimage") {
    let section = new InspectorSection11(identifier, strings.TextBackgroundImageCaption);
    let update = (target, change) => {
      let image = read(target).clone();
      change(image);
      write(target, image);
    };
    let file = InspectorItem2.bound(`${identifier}:file`, strings.TextLocalFileCaption, 8 /* file */, (target) => read(target).source.startsWith("data:") ? read(target).source : "", (target, value) => update(target, (image) => image.source = String(value || "")));
    file.fileFilter = "image/*";
    section.add(file);
    let url = InspectorItem2.bound(`${identifier}:url`, strings.TextURLCaption, 1 /* text */, (target) => read(target).source.startsWith("data:") ? "" : read(target).source, (target, value) => update(target, (image) => image.source = String(value || "").trim()));
    url.updatesLive = false;
    url.setDefaultValue("");
    section.add(url);
    section.add(InspectorItem2.menu(`${identifier}:fill`, strings.TextFillCaption, [[strings.TextActualSizeCaption, 0 /* actualSize */], [strings.TextStretchCaption, 1 /* stretch */], [strings.TextFitCaption, 2 /* fit */], [strings.TextFillCaption, 3 /* fill */]], (target) => read(target).fill, (target, value) => update(target, (image) => image.fill = value)));
    section.items()[2].setDefaultValue(3 /* fill */);
    section.add(InspectorItem2.menu(`${identifier}:repeat`, strings.TextRepeatCaption, [[strings.TextNoRepeatCaption, 0 /* noRepeat */], [strings.TextRepeatHorizontallyCaption, 1 /* repeatX */], [strings.TextRepeatVerticallyCaption, 2 /* repeatY */], [strings.TextRepeatBothCaption, 3 /* repeat */]], (target) => read(target).repeat, (target, value) => update(target, (image) => image.repeat = value)));
    section.items()[3].setDefaultValue(0 /* noRepeat */);
    let remove = InspectorItem2.actionItem(`${identifier}:remove`, strings.TextImageCaption, strings.TextRemoveImageCaption, (target) => update(target, (image) => image.clear()));
    remove.availability = (target) => !read(target).isEmpty;
    section.add(remove);
    return section;
  }
  static borderItems(section, strings, prefix, read, write) {
    ;
    ["Top", "Right", "Bottom", "Left"].forEach((side) => {
      let visible = InspectorItem2.bound(`${prefix}${side.toLowerCase()}visible`, strings[`Text${side}VisibleCaption`], 4 /* toggle */, (target) => read(target, side).visible, (target, value) => write(target, side, (border) => border.visible = value === true));
      visible.setDefaultValue(false);
      section.add(visible);
      let size = InspectorItem2.number(`${prefix}${side.toLowerCase()}size`, strings[`Text${side}SizeCaption`], (target) => read(target, side).size, (target, value) => write(target, side, (border) => border.size = value), 0, 100, 0.5);
      size.setDefaultValue(1);
      section.add(size);
      let color = InspectorItem2.bound(`${prefix}${side.toLowerCase()}color`, strings[`Text${side}ColorCaption`], 6 /* color */, (target) => read(target, side).color, (target, value) => write(target, side, (border) => border.color = value ? Colors.clone(value) : Colors.empty));
      color.setDefaultValue(Colors.empty);
      section.add(color);
    });
  }
  /** Sections every node has: content, appearance, borders, corners, dimensions and background image. */
  /**
   * The sections every block shares: content, appearance, borders, corners, dimensions and
   * background image. A block leaves out the ones that can't show on it: appearance for one with
   * no text, the background image for one its content covers.
   */
  static node(node, options = {}) {
    let strings = node.strings;
    let result = [];
    let content = new InspectorSection11("content", strings.TextContentInspectorCaption);
    if (node.canAlignBlock) {
      let alignment = InspectorItem2.menu("alignment", strings.TextAlignmentCaption, _InspectorDefaults.alignmentChoices(strings, true), (target) => target.alignment, (target, value) => target.alignment = value);
      alignment.setDefaultValue(0 /* automatic */);
      content.add(alignment);
    }
    let direction = InspectorItem2.menu("direction", strings.TextDirectionInspectorCaption, _InspectorDefaults.#directionChoices(strings), (target) => target.direction, (target, value) => target.direction = value);
    direction.setDefaultValue(0 /* automatic */);
    content.add(direction);
    result.push(content);
    if (options.appearance !== false) {
      let appearance = new InspectorSection11("appearance", strings.TextAppearanceInspectorCaption);
      _InspectorDefaults.lineItems(strings).forEach((item) => appearance.add(item));
      result.push(appearance);
    }
    let borders = new InspectorSection11("borders", strings.TextBordersInspectorCaption);
    _InspectorDefaults.borderItems(borders, strings, "border", (target, side) => target[`border${side}`], (target, side, change) => {
      let border = { ...target[`border${side}`], color: Colors.clone(target[`border${side}`].color) };
      change(border);
      target[`border${side}`] = border;
    });
    result.push(borders);
    let corners = new InspectorSection11("corners", strings.TextCornersInspectorCaption);
    [["TopLeft", strings.TextTopLeftRadiusCaption], ["TopRight", strings.TextTopRightRadiusCaption], ["BottomRight", strings.TextBottomRightRadiusCaption], ["BottomLeft", strings.TextBottomLeftRadiusCaption]].forEach(([corner, caption]) => {
      let property = `border${corner}Radius`;
      let item = corners.add(InspectorItem2.number(property.toLowerCase(), caption, (target) => target[property], (target, value) => target[property] = value, 0, 500, 1));
      item.setDefaultValue(0);
    });
    result.push(corners);
    if (node.canResize) {
      let dimensions = new InspectorSection11("dimensions", strings.TextDimensionsInspectorCaption);
      let width = dimensions.add(InspectorItem2.number("width", strings.TextWidthInspectorCaption, (target) => target.width, (target, value) => target.width = Math.max(0, value), 0, 1e4, 1));
      width.zeroCaption = strings.TextAutomatic;
      width.setDefaultValue(0);
      let height = dimensions.add(InspectorItem2.number("height", strings.TextHeightInspectorCaption, (target) => target.height, (target, value) => target.height = Math.max(0, value), 0, 1e4, 1));
      height.zeroCaption = strings.TextAutomatic;
      height.setDefaultValue(0);
      if (!node.toolbarResizesHeight)
        dimensions.remove("height");
      result.push(dimensions);
    }
    if (options.backgroundImage !== false)
      result.push(_InspectorDefaults.backgroundImageSection(strings, (target) => target.backgroundImage, (target, value) => target.backgroundImage = value));
    return result;
  }
  /** Line height and line spacing, for a block's text. */
  static lineItems(strings) {
    let lineHeight = InspectorItem2.number("lineheight", strings.TextLineHeightInspectorCaption, (target) => target.lineHeight, (target, value) => target.lineHeight = value, 0.1, 10, 0.1);
    lineHeight.setDefaultValue(1);
    let lineSpacing = InspectorItem2.number("linespacing", strings.TextLineSpacingInspectorCaption, (target) => target.lineSpacing, (target, value) => target.lineSpacing = value, 0, 100, 1);
    lineSpacing.setDefaultValue(0);
    return [lineHeight, lineSpacing];
  }
  /** Replaces a text block's text, keeping the style of its first character. */
  static setPlainText(node, value) {
    let text = String(value || "").replace(/\r\n?/g, "\n");
    if (!node.keepsParagraphs)
      text = text.replace(/\n/g, LineBreak);
    let current = node.content.text.replace(/\u2028/g, "\n");
    if (current == String(value || ""))
      return;
    let style = node.content.length > 0 ? node.content.styleAt(0) : node.baseStyle();
    let replacement = new RichText(text, style);
    replacement.copyStateFrom(node.content);
    replacement.nodes = node.content.nodes;
    replacement.listLevels = node.content.listLevels.slice();
    replacement.listChecked = node.content.listChecked.slice();
    let count = text.split(ParagraphBreak).length;
    node.prepareReplacementContent(replacement, count);
    node.content = replacement;
  }
  static text(node) {
    let strings = node.strings;
    let editor = node.editor;
    let content = new InspectorSection11("content", strings.TextContentInspectorCaption);
    if (node.inspectorShowsText) {
      let text = content.add(InspectorItem2.bound("text", strings.TextTextCaption, 2 /* multilineText */, (target) => target.content.text.replace(/\u2028/g, "\n"), (target, value) => _InspectorDefaults.setPlainText(target, value)));
      text.setDefaultValue(void 0);
    }
    let color = content.add(InspectorItem2.bound("textcolor", strings.TextTextColorCaption, 6 /* color */, (target) => target.content.length > 0 ? target.content.styleAt(0).textColor : Colors.empty, (target, value) => {
      let color2 = value ? Colors.clone(value) : Colors.empty;
      target.content.styles.forEach((style) => style.textColor = Colors.clone(color2));
    }));
    color.setDefaultValue(Colors.empty);
    let alignment = content.add(InspectorItem2.menu("textalignment", strings.TextTextAlignmentInspectorCaption, _InspectorDefaults.alignmentChoices(strings, true), (target) => target.textAlignment, (target, value) => target.textAlignment = value));
    alignment.setDefaultValue(0 /* automatic */);
    let typography = new InspectorSection11("typography", strings.TextTypographyInspectorCaption);
    let applyToCharacters = (target, change) => target.content.styles.forEach(change);
    let defaultSize = (target) => target instanceof HeadingNode ? HeadingNode.fontSizeForLevel(target.level) : 0;
    let font = typography.add(InspectorItem2.menu("fontname", strings.TextFontCaption, _InspectorDefaults.#fontChoices(editor, strings, node.fontName, ""), (target) => target.fontName, (target, value) => {
      target.fontName = value;
      applyToCharacters(target, (style) => style.fontName = value);
    }));
    font.setDefaultValue("");
    let size = typography.add(InspectorItem2.menu("fontsize", strings.TextSizeCaption, _InspectorDefaults.#sizeChoices(editor, strings, node.fontSize, defaultSize(node)), (target) => target.fontSize, (target, value) => {
      target.fontSize = value;
      applyToCharacters(target, (style) => style.fontSize = value);
    }));
    size.setDefaultValue(defaultSize);
    [["bold", strings.TextBoldCaption], ["italic", strings.TextItalicCaption], ["underline", strings.TextUnderlineCaption]].forEach(([name, caption]) => {
      let item = typography.add(InspectorItem2.bound(name, caption, 4 /* toggle */, (target) => target[name], (target, value) => {
        target[name] = value === true;
        applyToCharacters(target, (style) => style[name] = value === true);
      }));
      item.setDefaultValue((target) => name == "bold" && target instanceof HeadingNode);
    });
    if (!node.inspectorShowsTypography)
      typography.removeAll();
    let result = [content];
    if (typography.lastIndex >= 0)
      result.push(typography);
    return result.concat(_InspectorDefaults.node(node));
  }
  /** A section holding items. */
  static section(identifier, caption, items) {
    let result = new InspectorSection11(identifier, caption);
    items.forEach((item) => result.add(item));
    return result;
  }
  /** The built-in sections for a node: a text block's text, typography and appearance, or another node's appearance. Node types add their own sections by overriding inspectorSections. */
  static sections(node) {
    return node instanceof TextNode2 ? _InspectorDefaults.text(node) : _InspectorDefaults.node(node);
  }
  /** The selected cell's appearance and borders. */
  static cellSections(node, caption) {
    let strings = node.strings;
    let cell = (target) => target.cells[target.currentCellIndex()] || new RichText();
    let active = new InspectorSection11("activecell", caption);
    let alignment = active.add(InspectorItem2.menu("celltextalignment", strings.TextTextAlignmentInspectorCaption, _InspectorDefaults.alignmentChoices(strings, true), (target) => cell(target).textAlignment, (target, value) => cell(target).textAlignment = value));
    alignment.setDefaultValue(0 /* automatic */);
    let vertical = active.add(InspectorItem2.menu("cellverticalalignment", strings.TextVerticalAlignmentCaption, [[strings.TextTopAlignmentCaption, 0], [strings.TextMiddleAlignmentCaption, 1], [strings.TextBottomAlignmentCaption, 2]], (target) => cell(target).verticalAlignment, (target, value) => cell(target).verticalAlignment = value));
    vertical.setDefaultValue(0);
    let hasFill = active.add(InspectorItem2.bound("cellhasbackground", strings.TextUseBackgroundColorCaption, 4 /* toggle */, (target) => cell(target).hasCellBackgroundColor, (target, value) => cell(target).hasCellBackgroundColor = value === true));
    hasFill.setDefaultValue(false);
    let fill = active.add(InspectorItem2.bound("cellbackgroundcolor", strings.TextFillColorCaption, 6 /* color */, (target) => cell(target).cellBackgroundColor, (target, value) => {
      cell(target).cellBackgroundColor = value ? Colors.clone(value) : Colors.empty;
      cell(target).hasCellBackgroundColor = value !== null;
    }));
    fill.setDefaultValue(Colors.empty);
    let borders = new InspectorSection11("cellborders", strings.TextCellBordersInspectorCaption);
    _InspectorDefaults.borderItems(borders, strings, "cellborder", (target, side) => cell(target)[`cellBorder${side}`], (target, side, change) => {
      let current = cell(target)[`cellBorder${side}`];
      let border = { ...current, color: Colors.clone(current.color) };
      change(border);
      cell(target)[`cellBorder${side}`] = border;
    });
    let image = _InspectorDefaults.backgroundImageSection(strings, (target) => cell(target).backgroundImage, (target, value) => cell(target).backgroundImage = value, "cellbackgroundimage");
    return [active, borders, image];
  }
  /** The document's sections. */
  static document(editor) {
    let strings = editor.strings;
    let section = new InspectorSection11("document", strings.TextDocumentInspectorCaption);
    let alignment = section.add(InspectorItem2.menu("alignment", strings.TextAlignmentCaption, _InspectorDefaults.alignmentChoices(strings, false), (target) => target.alignment, (target, value) => target.alignment = value));
    alignment.setDefaultValue(1 /* leading */);
    let textAlignment = section.add(InspectorItem2.menu("textalignment", strings.TextTextAlignmentInspectorCaption, _InspectorDefaults.alignmentChoices(strings, false), (target) => target.textAlignment, (target, value) => target.textAlignment = value));
    textAlignment.setDefaultValue(1 /* leading */);
    let direction = section.add(InspectorItem2.menu("direction", strings.TextDirectionInspectorCaption, _InspectorDefaults.#directionChoices(strings), (target) => target.direction, (target, value) => target.direction = value));
    direction.setDefaultValue(0 /* automatic */);
    let font = section.add(InspectorItem2.menu("fontname", strings.TextFontCaption, _InspectorDefaults.#fontChoices(editor, strings, editor.fontName, "System").map((choice) => choice[1] == "System" ? [strings.TextDefault, "System"] : choice), (target) => target.fontName, (target, value) => target.fontName = value));
    font.setDefaultValue("System");
    let size = section.add(InspectorItem2.menu("fontsize", strings.TextSizeCaption, _InspectorDefaults.#sizeChoices(editor, strings, editor.fontSize, DefaultFontSize), (target) => target.fontSize, (target, value) => target.fontSize = value));
    size.setDefaultValue(DefaultFontSize);
    let background = section.add(InspectorItem2.bound("backgroundcolor", strings.TextDocumentBackgroundCaption, 6 /* color */, (target) => target.backgroundColor, (target, value) => target.backgroundColor = value ? value : Colors.make(255, 255, 255)));
    background.setDefaultValue(Colors.make(255, 255, 255));
    return [section, _InspectorDefaults.backgroundImageSection(strings, (target) => target.backgroundImage, (target, value) => target.backgroundImage = value)];
  }
};

// index.ts
Editor2.registerNodeType(TextNode2, 10);
Editor2.registerNodeType(HeadingNode, 20);
Editor2.registerNodeType(ListNode, 30);
Editor2.registerNodeType(QuoteNode, 40);
Editor2.registerNodeType(CodeBlockNode, 60);
Editor2.registerNodeType(TableNode, 70);
Editor2.registerNodeType(ImageNode, 90);
Editor2.registerNodeType(DividerNode, 140);
Editor2.registerExtension(ListExtension);
export {
  Alignments,
  Annotation,
  AnnotationPopover,
  Annotations,
  Autosave,
  AutosaveStates,
  BackgroundFills,
  BackgroundImage,
  BackgroundRepeats,
  ChoicePopup,
  CodeBlockNode,
  CodePoints,
  ColorPalette,
  Colors,
  Comment,
  CurrentDocumentVersion,
  DefaultFontSize,
  Dialog,
  Directions,
  DividerNode,
  Editor2 as Editor,
  ExportFormats,
  Exporter,
  Exporters,
  FindResult,
  FontOptions,
  Formatting,
  FormattingStyles,
  HTMLImporter7 as HTMLImporter,
  HeadingLevels,
  HeadingNode,
  History,
  ImageFillModes,
  ImageNode,
  InsertionChooser,
  InspectorDefaults,
  InspectorEditors,
  InspectorItem2 as InspectorItem,
  InspectorSection11 as InspectorSection,
  LineBreak,
  ListExtension,
  ListNode,
  ListTypes,
  MarkdownConverter,
  MediaUI,
  Node3 as Node,
  NodeSelection,
  NodeTypes,
  NormalLineHeightRatio,
  Notification,
  NotificationTypes,
  ParagraphBreak,
  PasteCleanup,
  Popup2 as Popup,
  PopupMenu,
  QuoteNode,
  RichText,
  Search,
  Statistics,
  StatusBar,
  Strings,
  Stylesheet8 as Stylesheet,
  SuggestionProviders,
  Suggestions,
  TableNode,
  TableSizePicker,
  TextHost,
  TextHostModes,
  TextNode2 as TextNode,
  TextStyle,
  ThemeColors,
  ToolbarDisplayModes,
  ToolbarItem,
  ToolbarItemKinds,
  ToolbarItems,
  ToolbarMenuItem,
  ToolbarView,
  UnknownNode,
  Utilities,
  ValidationIssue,
  ValidationSeverities,
  VerticalAlignments,
  WebFont,
  WebFonts
};
/**
 * Scriviamo
 * @license
 * (c) 2026 GraffitiSuite Solutions
 * agcyphers[at]graffitisuite[dot]com
 * https://graffitisuite.com/
 *
 * License: MIT (see LICENSE.md)
 */
