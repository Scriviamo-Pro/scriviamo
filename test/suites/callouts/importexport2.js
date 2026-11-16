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

  test(section, "the alert inspector offers its type", t => {
    t.assert(inspectorHasItem(new PE.AlertNode(), "alerttype"), "The inspector omitted the alert type.")
  })

  test(section, "the alert's toolbar offers each type", t => {
    let editor = t.editor()
    let alert = new PE.AlertNode()
    editor.addNode(alert)
    let item = alert.actions().find(entry => entry.identifier == "alerttype")
    t.assert(item && item.kind == PE.ToolbarItemKinds.menu && item.menuItems.length == 4, "The alert's type menu didn't offer all four types.")
    if (item && item.menuItems.length == 4) {
      alert.performAction(item, item.menuItems[PE.AlertTypes.warning])
      t.assert(alert.alertType == PE.AlertTypes.warning && editor.toHTML().indexOf("alert-warning") >= 0, "Choosing Warning didn't make a warning.")
    }
  })
}
