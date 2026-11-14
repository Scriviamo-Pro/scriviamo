// Dividers, quotes, page breaks, checklists, the inspector, alignment, and sizes.
"use strict"
{
  const section = "Node types"

  function inspectorItem(target, identifier) {
    let sections = target instanceof PE.Editor ? target.inspectorSections() : target.inspectorSections()
    for (let section of sections) {
      for (let item of section.items()) {
        if (item && item.identifier == identifier) return item
      }
    }
    return null
  }

  function isChecked(list, item) {
    return !!list.content.listChecked[item]
  }

  test(section, "alerts import from Markdown and round-trip", t => {
    let editor = t.editor()
    editor.fromMarkdown("> Simplicity is prerequisite for reliability.\n\n> [!WARNING]\n> Check the settings.")
    let ok = editor.lastNodeIndex == 1 && editor.nodeAt(0) instanceof PE.QuoteNode && editor.nodeAt(1) instanceof PE.AlertNode
    t.assert(ok, `A Markdown alert did not import as an alert beside a quote (${editor.nodes().map(node => node.type)}).`)
    if (!ok) return
    t.equal(editor.nodeAt(1).alertType, PE.AlertTypes.warning, "A Markdown alert did not keep its type")
    let html = t.editor()
    html.fromHTML(editor.toHTML())
    t.assert(html.lastNodeIndex == 1 && html.nodeAt(0) instanceof PE.QuoteNode && html.nodeAt(1) instanceof PE.AlertNode, "Quotes and alerts did not round-trip through HTML.")
    let markdown = t.editor()
    markdown.fromMarkdown(editor.toMarkdown())
    t.assert(markdown.lastNodeIndex == 1 && markdown.nodeAt(0) instanceof PE.QuoteNode && markdown.nodeAt(1) instanceof PE.AlertNode, "Quotes and alerts did not round-trip through Markdown.")
  })
}
