/**
 * Scriviamo
 * @license
 * (c) 2026 GraffitiSuite Solutions
 * agcyphers[at]graffitisuite[dot]com
 * https://graffitisuite.com/
 *
 * License: MIT (see LICENSE.md)
 */

/** Identifies the saved JSON document format. */
export const CurrentDocumentVersion: number = 4

/** Default document font size for documents that do not store one. */
export const DefaultFontSize: number = 16

export enum Alignments {
  automatic = 0,
  leading = 1,
  middle = 2,
  trailing = 3
}

export enum Directions {
  automatic = 0,
  leftToRight = 1,
  rightToLeft = 2
}

export enum ToolbarDisplayModes {
  iconOnly = 0,
  iconAndText = 1,
  textOnly = 2
}

/** Paragraph separator. Separates list items, cell paragraphs, and code lines. */
export const ParagraphBreak: string = "\n"
/** A font's normal line height as a multiple of its size, which CSS line heights are converted from. */
export const NormalLineHeightRatio: number = 1.2
/** Soft line break (U+2028), inserted with Shift+Enter. */
export const LineBreak: string = "\u2028"

/**
 * A color in the document JSON form. Channels run from 0 through 255, and
 * alpha is inverted: 0 is opaque and 255 is fully transparent.
 */
export interface DocumentColor {
  red: number
  green: number
  blue: number
  alpha: number
}

/** The colors exported HTML is drawn with, read with Editor.themeColor. */
export enum ThemeColors {
  background = 0,
  primary = 1,
  selection = 2,
  textSelection = 3,
  information = 4,
  success = 5,
  warning = 6,
  danger = 7,
  text = 8,
  textMuted = 9,
  link = 10,
  border = 11,
  borderStrong = 12,
  surface = 13,
  dark = 14,
  light = 15,
  highlight = 16
}

export class Colors {
  /** Opaque black, the default color value. */
  static get empty(): DocumentColor {
    return {red: 0, green: 0, blue: 0, alpha: 0}
  }

  static make(red: number, green: number, blue: number, alpha: number = 0): DocumentColor {
    return {red: red, green: green, blue: blue, alpha: alpha}
  }

  static clone(value: DocumentColor): DocumentColor {
    if (!value) return Colors.empty
    return {red: value.red, green: value.green, blue: value.blue, alpha: value.alpha}
  }

  static equals(a: DocumentColor, b: DocumentColor): boolean {
    if (!a || !b) return a === b
    return a.red == b.red && a.green == b.green && a.blue == b.blue && a.alpha == b.alpha
  }

  static isEmpty(value: DocumentColor): boolean {
    return !value || Colors.equals(value, Colors.empty)
  }

  static fromJSON(data: any, fallback: DocumentColor): DocumentColor {
    if (!data || typeof data != "object") return Colors.clone(fallback)
    return {
      red: Colors.channel(data.red, fallback.red),
      green: Colors.channel(data.green, fallback.green),
      blue: Colors.channel(data.blue, fallback.blue),
      alpha: Colors.channel(data.alpha, fallback.alpha)
    }
  }

  static toJSON(value: DocumentColor): object {
    value = value || Colors.empty
    return {red: value.red, green: value.green, blue: value.blue, alpha: value.alpha}
  }

  private static channel(value: any, fallback: number): number {
    let result = Number(value)
    if (!isFinite(result)) return fallback
    return Math.max(0, Math.min(255, Math.round(result)))
  }

  /** CSS rgba() color string, such as rgba(12,34,56,0.5). Converts the document alpha scale to CSS opacity. */
  static toCSS(value: DocumentColor): string {
    if (!value) return "transparent"
    let opacity = (1 - (value.alpha / 255)).toFixed(6).replace(/0+$/, "").replace(/\.$/, "")
    return `rgba(${value.red},${value.green},${value.blue},${opacity})`
  }

  static toHex(value: DocumentColor): string {
    if (!value) return "#000000"
    let hex = (n: number) => n.toString(16).padStart(2, "0")
    return `#${hex(value.red)}${hex(value.green)}${hex(value.blue)}`
  }

  /**
   * Parses a CSS color: #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba() or a name,
   * also when it is part of a shorthand value such as "1px solid #ccc". Returns
   * null when there is no color.
   */
  static fromCSS(value: string): DocumentColor | null {
    if (!value) return null
    value = value.trim().toLowerCase()
    let important = value.indexOf("!important")
    if (important >= 0) value = value.substring(0, important).trim()
    if (value == "" || value == "initial" || value == "inherit" || value == "currentcolor") return null
    if (value == "transparent") return Colors.make(0, 0, 0, 255)

    // A functional color inside a shorthand is read on its own.
    let functional = value.search(/rgba?\(/)
    if (functional > 0) {
      let closing = value.indexOf(")", functional)
      if (closing >= 0) value = value.substring(functional, closing + 1)
    }

    let hash = value.indexOf("#")
    if (hash >= 0) {
      let hex = (value.substring(hash + 1).match(/^[0-9a-f]*/) || [""])[0]
      if (hex.length == 3 || hex.length == 4) hex = hex.split("").map(c => c + c).join("")
      if (hex.length == 6 || hex.length == 8) {
        let alpha = hex.length == 8 ? 255 - parseInt(hex.substring(6, 8), 16) : 0
        return Colors.make(parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16), alpha)
      }
    }

    if (value.startsWith("rgb(") || value.startsWith("rgba(")) {
      let closing = value.indexOf(")")
      if (closing > 0) {
        let components = value.substring(value.indexOf("(") + 1, closing).split(/[\s,\/]+/).filter(part => part.length > 0)
        if (components.length >= 3) {
          let channel = (part: string) => {
            let number = parseFloat(part)
            if (!isFinite(number)) return 0
            if (part.endsWith("%")) return Math.round(Math.max(0, Math.min(100, number)) * 2.55)
            return Math.round(Math.max(0, Math.min(255, number)))
          }
          let alpha = 0
          if (components.length >= 4) {
            let opacity = parseFloat(components[3])
            if (!isFinite(opacity)) opacity = 1
            if (components[3].endsWith("%")) opacity = opacity / 100
            alpha = Math.round((1 - Math.max(0, Math.min(1, opacity))) * 255)
          }
          return Colors.make(channel(components[0]), channel(components[1]), channel(components[2]), alpha)
        }
      }
    }

    let named: {[key: string]: string} = {
      black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000", blue: "#0000ff",
      yellow: "#ffff00", orange: "#ffa500", purple: "#800080", gray: "#808080", grey: "#808080"
    }
    if (named[value]) return Colors.fromCSS(named[value])
    // A named color may end a shorthand declaration.
    let tokens = value.split(/\s+/)
    if (tokens.length > 1) {
      for (let index = tokens.length - 1; index >= 0; index--) {
        let color = tokens[index].length > 0 ? Colors.fromCSS(tokens[index]) : null
        if (color) return color
      }
    }
    return null
  }
}

export class Utilities {
  /** The pixel size of base64 PNG, GIF or JPEG data, read from its header, or null. */
  static imageDataSize(base64: string): {width: number, height: number} | null {
    try {
      // Only the start is decoded, in whole four-character groups.
      let clean = base64.substring(0, 262144).replace(/[^A-Za-z0-9+/]/g, "")
      let bytes = atob(clean.substring(0, clean.length - clean.length % 4))
      let byte = (index: number) => bytes.charCodeAt(index)
      if (bytes.startsWith("\x89PNG")) return {width: (byte(16) << 24 | byte(17) << 16 | byte(18) << 8 | byte(19)) >>> 0, height: (byte(20) << 24 | byte(21) << 16 | byte(22) << 8 | byte(23)) >>> 0}
      if (bytes.startsWith("GIF8")) return {width: byte(6) | byte(7) << 8, height: byte(8) | byte(9) << 8}
      if (byte(0) == 0xFF && byte(1) == 0xD8) {
        let offset = 2
        while (offset + 9 < bytes.length) {
          if (byte(offset) != 0xFF) return null
          let marker = byte(offset + 1)
          let length = byte(offset + 2) << 8 | byte(offset + 3)
          if (marker >= 0xC0 && marker <= 0xCF && marker != 0xC4 && marker != 0xC8 && marker != 0xCC) {
            return {width: byte(offset + 7) << 8 | byte(offset + 8), height: byte(offset + 5) << 8 | byte(offset + 6)}
          }
          offset += 2 + length
        }
      }
    } catch {
      // Not readable as an image header.
    }
    return null
  }

  /** True when text's first strong character is written right to left, as in Hebrew or Arabic. */
  static isRightToLeftText(value: string): boolean {
    let match = (value || "").match(/[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]|\p{L}/u)
    return !!match && /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(match[0])
  }

  /** True for a language tag such as he-IL or ar_SA whose language is written right to left. */
  static isRightToLeftLanguage(tag: string): boolean {
    let language = (tag || "").trim().toLowerCase().split(/[-_]/)[0]
    return ["ar", "arc", "ckb", "dv", "fa", "ha", "he", "iw", "khw", "ks", "ku", "nqo", "ps", "sd", "syr", "ug", "ur", "yi"].indexOf(language) >= 0
  }


  static uuid(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      let r = Math.random() * 16 | 0
      return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16)
    })
  }

  static escapeText(value: string): string {
    return (value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  }

  static escapeAttribute(value: string): string {
    return Utilities.escapeText(value).replace(/"/g, "&quot;")
  }

  static number(value: any, fallback: number): number {
    let result = Number(value)
    return isFinite(result) && value !== null && value !== "" && value !== undefined ? result : fallback
  }

  static integer(value: any, fallback: number): number {
    return Math.trunc(Utilities.number(value, fallback))
  }

  static boolean(value: any, fallback: boolean): boolean {
    if (value === undefined || value === null) return fallback
    return value === true || value === "true" || value === 1
  }

  static string(value: any, fallback: string = ""): string {
    if (value === undefined || value === null) return fallback
    return String(value)
  }

  static clamp(value: number, minimum: number, maximum: number): number {
    return Math.max(minimum, Math.min(maximum, value))
  }

  /** Builds a CSS font-family list from a document font name. */
  static fontFamilyCSS(fontName: string): string {
    if (!fontName || fontName.toLowerCase() == "system") return `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
    if (fontName.toLowerCase() == "smallsystem") return `system-ui, sans-serif`
    let fallback = Utilities.webFontFallbacks.get(fontName.toLowerCase())
    return `'${fontName.replace(/'/g, "\\'")}'${fallback ? `, ${fallback}` : ""}`
  }

  /** Each registered web font's fallback, by its family in lowercase; WebFonts keeps it. */
  static webFontFallbacks = new Map<string, string>()

  /** Converts a heading's text into a URL fragment. */
  static slug(value: string): string {
    return (value || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-")
  }

  /** Detects the MIME type of base64-encoded picture data from its leading bytes. */
  static pictureMimeType(base64: string): string {
    if (!base64) return "image/png"
    if (base64.startsWith("/9j/")) return "image/jpeg"
    if (base64.startsWith("iVBOR")) return "image/png"
    if (base64.startsWith("R0lG")) return "image/gif"
    if (base64.startsWith("UklGR")) return "image/webp"
    if (base64.startsWith("PHN2Zy") || base64.startsWith("PD94bW")) return "image/svg+xml"
    if (base64.startsWith("Qk")) return "image/bmp"
    if (base64.startsWith("AAAA")) return "image/heic"
    return "image/png"
  }

  static element<K extends keyof HTMLElementTagNameMap>(tag: K, classes: string = "", attributes?: {[name: string]: string}): HTMLElementTagNameMap[K] {
    let result = document.createElement(tag)
    if (classes.length > 0) classes.split(" ").forEach(name => { if (name.length > 0) result.classList.add(name) })
    if (attributes) Object.keys(attributes).forEach(name => result.setAttribute(name, attributes[name]))
    return result
  }

  /** Replaces %token% placeholders in a localized format string. */
  static format(value: string, tokens: {[name: string]: string | number}): string {
    let result = value
    Object.keys(tokens).forEach(name => {
      result = result.split(`%${name}%`).join(String(tokens[name]))
    })
    return result
  }
}

/** Converts between JavaScript (UTF-16) string indexes and document character (code point) indexes. */
export class CodePoints {
  /** Number of code points in the string, the character count used by the JSON format. */
  static count(value: string): number {
    let result = 0
    for (let index = 0; index < value.length; index++) {
      let code = value.charCodeAt(index)
      if (code >= 0xD800 && code <= 0xDBFF && index + 1 < value.length) {
        let next = value.charCodeAt(index + 1)
        if (next >= 0xDC00 && next <= 0xDFFF) index++
      }
      result++
    }
    return result
  }

  /** Returns the UTF-16 width (1 or 2) of the character starting at index. */
  static widthAt(value: string, index: number): number {
    let code = value.charCodeAt(index)
    if (code >= 0xD800 && code <= 0xDBFF && index + 1 < value.length) {
      let next = value.charCodeAt(index + 1)
      if (next >= 0xDC00 && next <= 0xDFFF) return 2
    }
    return 1
  }
}
