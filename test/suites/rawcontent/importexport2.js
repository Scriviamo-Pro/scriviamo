// Suggestions, CSS output, backgrounds, media, sizes, corners, pasted HTML,
// colors, tables, toolbars and borders.
"use strict"
{
  const section = "Import and export"
  const gif = "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
  const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

  function people() {
    let provider = new PE.Suggestions.Provider("people", "@")
    provider.add("Ada")
    provider.add("ada")
    provider.add("Alan")
    provider.textColor = PE.Colors.make(185, 28, 28)
    provider.backgroundColor = PE.Colors.make(254, 226, 226)
    provider.borderColor = PE.Colors.make(252, 165, 165)
    return provider
  }

  function diagnostics() {
    let provider = new PE.Suggestions.Provider("diagnostics", ".")
    provider.add("Error", "Error diagnostic")
    provider.textColor = PE.Colors.make(185, 28, 28)
    provider.backgroundColor = PE.Colors.make(254, 226, 226)
    provider.borderColor = PE.Colors.make(252, 165, 165)
    return provider
  }

  function inspectorItem(node, identifier) {
    for (let section of node.inspectorSections()) {
      for (let item of section.items()) {
        if (item && item.identifier == identifier) return item
      }
    }
    return null
  }

  test(section, "raw content exports unchanged", t => {
    let raw = `<aside data-example="raw">Unescaped &amp; unchanged</aside>`
    let node = new PE.RawContentNode(raw)
    t.equal(node.type, "rawcontent", "Raw content has the wrong JSON type")
    t.equal(node.toHTML(), raw, "Raw content changed its HTML export")
    t.equal(node.toMarkdown(), raw, "Raw content changed its Markdown export")
    let sections = node.inspectorSections()
    t.assert(sections.length == 1 && sections[0].identifier == "content" && sections[0].lastIndex == 0 && inspectorHasItem(node, "text"), `The raw content inspector showed more than its source (${sections.map(section => section.identifier)}).`)
    let restored = new PE.RawContentNode()
    t.assert(restored.fromJSON(node.toJSON()) && restored.text == raw, "Raw content JSON did not restore its source.")
  })
}
