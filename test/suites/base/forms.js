// Form controls, columns, and HTML round trips of single nodes.
"use strict"
{
  const section = "Forms and layout"

  /** Exports a node to HTML, imports it into a new editor, and returns the first node. */
  function viaHTML(t, node) {
    let editor = t.editor()
    editor.fromHTML(node.toHTML())
    return editor.nodeAt(0)
  }

  function externalField() {
    let field = new PE.TextFieldNode()
    field.id = "reference"
    field.name = "reference"
    field.formID = "contact"
    field.placeholder = "Reference"
    field.required = true
    return field
  }

  skip(section, "drop and hover insertion indicators", "Drop and insertion indicators are placed by the browser's layout during a drag; there is no pointer-geometry API to test.")

  skip(section, "dragging a columns divider", "Dividers are dragged with pointer events in the page; the stored percentages are checked above.")

  test(section, "a future document version is an error", t => {
    let editor = t.editor()
    editor.fromJSON(`{"version":${PE.CurrentDocumentVersion + 1},"nodes":[]}`)
    t.assert(hasValidationError(editor), "A future document version was loaded without an error.")
  })
}
