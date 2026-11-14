// HTML output, stylesheets, document JSON, and the picture and PDF outputs.
"use strict"
{
  const section = "Rendering"
  const gif = "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="

  function documentEditor(t) {
    let editor = t.editor()
    let background = new PE.BackgroundImage()
    background.source = "data:image/gif;base64," + gif
    background.repeat = PE.BackgroundRepeats.repeat
    editor.backgroundImage = background
    editor.addNode(new PE.TextNode("Searchable content"))
    return editor
  }

  test(section, "export uses the theme's alert colors", t => {
    let editor = t.editor()
    let alert = new PE.AlertNode("Themed")
    alert.alertType = PE.AlertTypes.success
    editor.addNode(alert)
    let sheet = editor.exportStylesheet()
    t.assert(sheet.propertyValue(".alert-success", "border-inline-start-color") != "", "Alert export has no success border color.")
    t.assert(sheet.propertyValue(".alert-success", "background") != "", "Alert export has no success background.")
  })
}
