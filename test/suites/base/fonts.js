// Web fonts: registering them, the Font menu, loading, and the @font-face rules HTML export writes.
// Loads a font from the CDN.
"use strict"
{
  const section = "Web fonts"
  const woff2 = "https://cdn.jsdelivr.net/npm/@fontsource/lobster@5.0.8/files/lobster-latin-400-normal.woff2"

  /** Runs body with Lobster registered, and removes it after. */
  async function withLobster(options, body) {
    PE.WebFonts.register("Lobster", woff2, options)
    try {
      await body()
    } finally {
      PE.WebFonts.remove("Lobster")
    }
  }

  test(section, "a registered font is offered, falls back, and is removed cleanly", async t => {
    await withLobster({fallback: "cursive"}, async () => {
      t.assert(PE.WebFonts.item("lobster") !== null, "The font wasn't found by its name in another case.")
      let editor = t.editor()
      t.assert(editor.fontNames.includes("Lobster"), "A new editor's Font menu doesn't offer the font.")
      t.equal(PE.Utilities.fontFamilyCSS("Lobster"), "'Lobster', cursive", "The font's CSS")
      t.equal(PE.WebFonts.format({url: "a/b.TTF?v=2"}), "truetype", "A format read from the address")
      t.equal(PE.WebFonts.familyName(`"Lobster", cursive`), "Lobster", "The first family")
      t.equal(PE.WebFonts.familyName("system-ui, sans-serif"), "", "The system font names no font")
    })
    t.assert(PE.WebFonts.item("Lobster") === null, "The font is still registered.")
    t.assert(!t.editor().fontNames.includes("Lobster"), "The Font menu still offers the removed font.")
    t.equal(PE.Utilities.fontFamilyCSS("Lobster"), "'Lobster'", "The removed font's CSS")
  })

  test(section, "a registered font loads in the page", async t => {
    await withLobster({}, async () => {
      t.assert(await PE.WebFonts.load("Lobster"), "The font didn't load (is the CDN reachable?).")
      t.assert(document.fonts.check(`16px "Lobster"`), "The page can't use the font.")
    })
  })

  test(section, "HTML export writes @font-face rules for the fonts the document uses", async t => {
    await withLobster({fallback: "cursive"}, async () => {
      let editor = t.editor()
      editor.fromHTML(`<p>Plain text only.</p>`)
      t.assert(!editor.toHTML(true).includes("@font-face"), "A document that doesn't use the font has its rule.")

      editor.fromHTML(`<p><span style="font-family: Lobster">Fancy</span> and plain.</p>`)
      t.equal(PE.WebFonts.used(editor).map(font => font.family).join(), "Lobster", "The fonts used")
      let html = editor.toHTML(true)
      t.assert(html.includes(`@font-face { font-family: "Lobster"; src: url("${woff2}") format("woff2")`), "The @font-face rule wasn't written.")
      t.assert(/font-family:\s*'Lobster', cursive/.test(html), "The text doesn't name the font with its fallback.")

      let other = t.editor()
      other.fontName = "Lobster"
      other.fromHTML(`<p>All in the document's font.</p>`)
      t.assert(other.toHTML(true).includes("@font-face"), "The document's own font has no rule.")
    })
  })

  test(section, "a relative address becomes absolute in exports", async t => {
    PE.WebFonts.register("Local Test Font", "fonts/local.woff2")
    try {
      let editor = t.editor()
      editor.fontName = "Local Test Font"
      t.assert(editor.toHTML(true).includes(`url("${new URL("fonts/local.woff2", document.baseURI).href}")`), "The address wasn't made absolute.")
    } finally {
      PE.WebFonts.remove("Local Test Font")
    }
  })
}
