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

  test(section, "radio groups export their layout rules", t => {
    let editor = t.editor()
    editor.addNode(PE.RadioGroupNode.create(editor))
    let sheet = editor.exportStylesheet()
    t.equal(sheet.propertyValue("fieldset[role='radiogroup'] > .radio-options", "flex-direction"), "column", "The exported stylesheet did not stack vertical radio-group options")
    t.equal(sheet.propertyValue("fieldset[role='radiogroup']", "border"), "0", "The exported stylesheet kept borders around radio groups")
    t.equal(sheet.propertyValue("textarea", "resize"), "vertical", "A radio group did not include the form-control rules")
  })
}
