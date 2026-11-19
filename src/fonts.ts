import {FontOptions, Utilities} from "./internal"

/** One file of a font: a weight and a style. */
export interface WebFontFace {
  /** The file's address, relative to the page or absolute. */
  url: string
  /** A weight such as 400 or "bold", or a range such as "100 900" for a variable font; 400 by default. */
  weight?: string | number
  /** "normal" (the default) or "italic". */
  style?: string
  /** "woff2", "woff", "truetype" or "opentype"; read from the address's extension when left out. */
  format?: string
  /** The characters the file covers, as CSS unicode-range, such as "U+0000-00FF". */
  unicodeRange?: string
}

export interface WebFontOptions {
  /** The family used while the font loads, or where it can't: "serif", "sans-serif", "monospace", "cursive" or another font. */
  fallback?: string
  /** Whether EPUB, Word and OpenDocument files store the font's files. On by default; turn it off when the font's license doesn't allow it. */
  embed?: boolean
  /** Whether editors made after this offer the font in their Font menu. On by default. */
  addToMenu?: boolean
}

/** A font registered with WebFonts. */
export class WebFont {
  readonly family: string
  readonly faces: Array<WebFontFace>
  readonly fallback: string
  readonly embed: boolean
  #loaded: Array<any> = []

  constructor(family: string, faces: Array<WebFontFace>, fallback: string, embed: boolean) {
    this.family = family
    this.faces = faces
    this.fallback = fallback
    this.embed = embed
  }

  /** The font as a CSS font-family value, with its fallback. */
  get css(): string {
    return Utilities.fontFamilyCSS(this.family)
  }

  /** The faces whose files Word and OpenDocument can store: TrueType and OpenType. */
  get desktopFaces(): Array<WebFontFace> {
    return this.faces.filter(face => /^(truetype|opentype)$/.test(WebFonts.format(face)))
  }

  /** Adds the font to a page's fonts, without loading it until text uses it. */
  addTo(target: Document) {
    let FontFaceClass = (target.defaultView as any)?.FontFace
    if (!FontFaceClass || !(target as any).fonts) return
    this.faces.forEach(face => {
      try {
        let font = new FontFaceClass(this.family, `url(${JSON.stringify(WebFonts.absoluteURL(face.url))}) format(${JSON.stringify(WebFonts.format(face))})`, {
          weight: String(face.weight ?? 400),
          style: face.style || "normal",
          display: "swap",
          ...(face.unicodeRange ? {unicodeRange: face.unicodeRange} : {})
        })
        ;(target as any).fonts.add(font)
        if (target == globalThis.document) this.#loaded.push(font)
      } catch {
        // A face the browser can't read is skipped; the others still load.
      }
    })
  }

  /** Removes the font from the page it was added to. */
  removeFromPage() {
    let fonts = (globalThis.document as any)?.fonts
    this.#loaded.forEach(font => fonts?.delete(font))
    this.#loaded = []
  }

  /** Loads every face in the page, and resolves whether they all loaded. */
  async load(): Promise<boolean> {
    let results = await Promise.all(this.#loaded.map(font => font.load().then(() => true, () => false)))
    return results.every(result => result)
  }
}

/**
 * Fonts loaded from files, such as a brand's typeface or one from Google Fonts or Fontsource.
 * A registered font is loaded into the page, offered in the Font menu, and carried by exports:
 * HTML and PDF reference its files, and EPUB, Word and OpenDocument files store them.
 */
export class WebFonts {
  static #fonts = new Map<string, WebFont>()
  static #bytes = new Map<string, Promise<Uint8Array>>()

  /**
   * Registers a font. faces is a file's address, a face, or several, one for each weight and
   * style. Registering a family again replaces it.
   */
  static register(family: string, faces: string | WebFontFace | Array<string | WebFontFace>, options: WebFontOptions = {}): WebFont {
    family = String(family || "").trim()
    if (family.length == 0) throw new Error("A web font needs a family name.")
    let list = (Array.isArray(faces) ? faces : [faces]).map(face => typeof face == "string" ? {url: face} : {...face}).filter(face => face.url)
    if (list.length == 0) throw new Error(`The font "${family}" needs at least one file.`)
    WebFonts.remove(family)
    let font = new WebFont(family, list, String(options.fallback || "").trim(), options.embed !== false)
    WebFonts.#fonts.set(family.toLowerCase(), font)
    Utilities.webFontFallbacks.set(family.toLowerCase(), font.fallback)
    if (options.addToMenu !== false && !FontOptions.defaultFontNames.some(name => name.toLowerCase() == family.toLowerCase())) FontOptions.defaultFontNames.push(family)
    if (typeof document != "undefined") font.addTo(document)
    return font
  }

  /** Removes a registered font from the registry, the page and the Font menu of editors made after this. */
  static remove(family: string) {
    let key = String(family || "").toLowerCase()
    let font = WebFonts.#fonts.get(key)
    if (!font) return
    font.removeFromPage()
    WebFonts.#fonts.delete(key)
    Utilities.webFontFallbacks.delete(key)
    let index = FontOptions.defaultFontNames.findIndex(name => name.toLowerCase() == key)
    if (index >= 0) FontOptions.defaultFontNames.splice(index, 1)
  }

  /** A registered font by its family name, ignoring case, or null. */
  static item(family: string): WebFont | null {
    return WebFonts.#fonts.get(String(family || "").toLowerCase()) || null
  }

  /** Every registered font, in the order registered. */
  static all(): Array<WebFont> {
    return Array.from(WebFonts.#fonts.values())
  }

  /** The registered fonts a document uses: the editor's font, and any block's or text's. */
  static used(editor: {fontName: string, toJSONObject(): any}): Array<WebFont> {
    if (WebFonts.#fonts.size == 0) return []
    let names = new Set<string>([String(editor.fontName || "").toLowerCase()])
    let collect = (value: any) => {
      if (Array.isArray(value)) {
        value.forEach(collect)
      } else if (value && typeof value == "object") {
        for (let key in value) {
          if (key == "fontName" && typeof value[key] == "string") names.add(value[key].toLowerCase())
          else collect(value[key])
        }
      }
    }
    collect(editor.toJSONObject())
    return WebFonts.all().filter(font => names.has(font.family.toLowerCase()))
  }

  /** Loads a registered font's files in the page, and resolves whether they all loaded. */
  static async load(family: string): Promise<boolean> {
    let font = WebFonts.item(family)
    return font ? font.load() : false
  }

  /** @font-face rules for fonts. url gives each file's address in the result; by default its absolute address. */
  static fontFaceCSS(fonts: Array<WebFont>, url: (face: WebFontFace, font: WebFont) => string = face => WebFonts.absoluteURL(face.url)): string {
    return fonts.flatMap(font => font.faces.map(face => {
      let declarations = [
        `font-family: ${JSON.stringify(font.family)}`,
        `src: url(${JSON.stringify(url(face, font))}) format(${JSON.stringify(WebFonts.format(face))})`,
        `font-weight: ${face.weight ?? 400}`,
        `font-style: ${face.style || "normal"}`,
        `font-display: swap`
      ]
      if (face.unicodeRange) declarations.push(`unicode-range: ${face.unicodeRange}`)
      return `@font-face { ${declarations.join("; ")} }`
    })).join("\n")
  }

  /** The font a CSS font-family value names first, or "" for the system font and generic families. */
  static familyName(css: string): string {
    let first = String(css || "").split(",")[0].trim().replace(/^["']|["']$/g, "").trim()
    if (/^(system|system-ui|-apple-system|blinkmacsystemfont|serif|sans-serif|monospace|cursive|fantasy|ui-[a-z-]+|inherit|initial|unset)$/i.test(first)) return ""
    return first
  }

  /** A face's format: its own, or read from its address. */
  static format(face: WebFontFace): string {
    if (face.format) return face.format.toLowerCase()
    let extension = (face.url.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i) || ["", ""])[1].toLowerCase()
    return ({ttf: "truetype", otf: "opentype", woff: "woff", woff2: "woff2"} as {[key: string]: string})[extension] || "woff2"
  }

  /** A face's file extension, from its format. */
  static extension(face: WebFontFace): string {
    return ({truetype: "ttf", opentype: "otf", woff: "woff", woff2: "woff2"} as {[key: string]: string})[WebFonts.format(face)] || "woff2"
  }

  /** A face's media type, as EPUB and OpenDocument packages list it. */
  static mediaType(face: WebFontFace): string {
    return ({truetype: "font/ttf", opentype: "font/otf", woff: "font/woff", woff2: "font/woff2"} as {[key: string]: string})[WebFonts.format(face)] || "font/woff2"
  }

  /** Whether a face is bold: its weight, or the start of its range, is 600 or more. */
  static isBold(face: WebFontFace): boolean {
    let weight = String(face.weight ?? 400).trim().toLowerCase()
    if (weight == "bold" || weight == "bolder") return true
    return (parseFloat(weight) || 400) >= 600
  }

  /** Whether a face is italic or oblique. */
  static isItalic(face: WebFontFace): boolean {
    return /italic|oblique/i.test(face.style || "")
  }

  /** An address as an absolute one, against the page's. */
  static absoluteURL(url: string): string {
    try {
      return typeof document != "undefined" ? new URL(url, document.baseURI).href : url
    } catch {
      return url
    }
  }

  /** A face's file, fetched once and kept. Rejects when it can't be fetched. */
  static bytes(face: WebFontFace): Promise<Uint8Array> {
    let url = WebFonts.absoluteURL(face.url)
    if (!WebFonts.#bytes.has(url)) {
      let request = fetch(url).then(response => {
        if (!response.ok) throw new Error(`${url}: ${response.status}`)
        return response.arrayBuffer()
      }).then(buffer => new Uint8Array(buffer))
      request.catch(() => WebFonts.#bytes.delete(url))
      WebFonts.#bytes.set(url, request)
    }
    return WebFonts.#bytes.get(url)!
  }

  /** Loads the fonts a page's text uses, such as a printing frame's, and resolves when they're ready, or after timeout milliseconds. */
  static async settle(target: Document, timeout: number = 3000): Promise<void> {
    let fonts = (target as any).fonts
    if (!fonts) return
    let loads: Array<Promise<any>> = []
    fonts.forEach((font: any) => {
      if (font.status == "unloaded") loads.push(font.load().catch(() => null))
    })
    await Promise.race([Promise.all(loads).then(() => fonts.ready), new Promise(resolve => setTimeout(resolve, timeout))])
  }
}
