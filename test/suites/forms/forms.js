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

  test(section, "a control outside a form exports its form owner", t => {
    let html = externalField().toHTML()
    t.assert(html.indexOf(`form="contact"`) >= 0, "A root-level form control did not export its form owner.")
    t.assert(html.indexOf("required") >= 0, "A text field did not export its required state.")
  })

  test(section, "editing text updates a field's value and a button's caption", async t => {
    let editor = t.editor()
    let field = externalField()
    let button = new PE.ButtonNode("Save")
    editor.addNode(field)
    editor.addNode(button)
    await t.tick()
    editor.focusNode(field, 0)
    editor.insertText("Default")
    t.equal(field.value, "Default", "Editing text did not update a text field's default value")
    editor.focusNode(button, 4)
    editor.insertText("!")
    t.equal(button.text, "Save!", "Editing text did not update a button caption")
  })

  test(section, "a checkbox exports its label and coalesces styles", t => {
    let checkbox = new PE.CheckboxNode("Receive updates")
    let html = checkbox.toHTML()
    t.assert(html.indexOf("<label>") >= 0 && html.indexOf("Receive updates") >= 0, "A checkbox did not export a proper accompanying label: " + html)
    t.assert(html.split("<span").length - 1 <= 1, "HTML export did not coalesce adjacent characters with identical styling: " + html)
  })

  test(section, "a radio group exports its layout", t => {
    let group = new PE.RadioGroupNode()
    group.options = [new PE.FormOption("One", "one", true), new PE.FormOption("Two", "two")]
    group.alignment = PE.Alignments.middle
    group.layout = PE.RadioGroupLayouts.horizontal
    let html = group.toHTML()
    t.assert(html.indexOf(`<fieldset role="radiogroup"`) >= 0 && html.indexOf("margin-left:auto;margin-right:auto;") >= 0, "A radio group did not apply node layout styling to its fieldset: " + html)
    t.assert(html.indexOf("<input style=") < 0, "A radio group applied node layout styling to its individual inputs.")
    t.assert(html.indexOf(`aria-orientation="horizontal"`) >= 0 && html.indexOf(`<div class="radio-options">`) >= 0, "A horizontal radio group did not export its option layout.")
    let restored = new PE.RadioGroupNode()
    t.assert(restored.fromJSON(group.toJSON()) && restored.layout == PE.RadioGroupLayouts.horizontal, "Radio-group JSON did not restore its layout.")
    t.assert(inspectorHasItem(group, "layout"), "The radio-group inspector omitted its layout control.")
    t.assert(!inspectorHasSection(group, "dropdown"), "The radio-group inspector exposed a Dropdown section.")
  })

  test(section, "line height and spacing enlarge a vertical radio group", async t => {
    let editor = t.editor()
    let group = PE.RadioGroupNode.create(editor)
    editor.addNode(group)
    await t.tick()
    let before = group.element.getBoundingClientRect().height
    group.lineHeight = 2
    group.lineSpacing = 12
    editor.refreshNode(group)
    await t.tick()
    t.assert(group.element.getBoundingClientRect().height > before, "A vertical radio group did not incorporate line height and line spacing into its layout.")
  })

  test(section, "a document with forms round-trips through JSON", t => {
    let editor = t.editor()
    let form = new PE.FormNode()
    form.id = "contact"
    form.method = "post"
    let field = new PE.TextFieldNode()
    field.name = "name"
    field.value = "Ada"
    field.inputType = PE.TextFieldTypes.email
    field.listID = "contacts"
    let datalist = new PE.DatalistNode()
    datalist.id = "contacts"
    datalist.options = [new PE.FormOption("ada@example.com", "Ada")]
    form.cell(0, 0).nodes = [field, datalist]
    editor.addNode(form)
    editor.addNode(externalField())
    let restored = t.editor()
    restored.fromJSON(editor.toJSON())
    t.assert(!hasValidationError(restored), "A document containing form nodes could not be restored from JSON.")
    let html = restored.toHTML()
    t.assert(html.indexOf("<form") >= 0 && html.indexOf(`value="Ada"`) >= 0, "Form JSON did not restore embedded controls.")
    t.assert(html.indexOf(`type="email"`) >= 0 && html.indexOf(`<datalist id="contacts"`) >= 0 && html.indexOf(`list="contacts"`) >= 0, "Form JSON did not restore the input type or datalist association.")
    t.assert(html.indexOf(`form="contact"`) >= 0, "Form JSON did not restore an external control's form owner.")
  })

  test(section, "form HTML import restores controls", t => {
    let editor = t.editor()
    editor.fromHTML(`<form id="settings" method="post"><label for="email">Email</label><input id="email" name="email" type="email" list="contacts" required><datalist id="contacts"><option value="ada@example.com" label="Ada"></option></datalist><label><input type="checkbox" name="updates" checked>Receive updates</label></form>`)
    let html = editor.toHTML()
    t.assert(html.indexOf("<form") >= 0 && html.indexOf(`type="email"`) >= 0 && html.indexOf(`type="checkbox"`) >= 0, "HTML form import did not restore its controls.")
    t.assert(html.indexOf("Receive updates") >= 0, "Checkbox HTML import did not restore its accompanying label.")
    t.assert(html.indexOf(`list="contacts"`) >= 0 && html.indexOf(`<datalist id="contacts"`) >= 0, "HTML form import did not restore an input type and its datalist.")
    t.equal(html.split(">Email<").length - 1, 1, "HTML form import duplicated a standalone label's text")
  })

  test(section, "a button round-trips through HTML", t => {
    let button = new PE.ButtonNode("Send")
    button.name = "submitter"
    button.buttonType = PE.ButtonTypes.submit
    button.formAction = "/submit"
    button.formMethod = "post"
    button.formEnctype = "multipart/form-data"
    button.formTarget = "_blank"
    button.value = "send"
    let restored = viaHTML(t, button)
    t.assert(restored instanceof PE.ButtonNode, "Button HTML could not be restored.")
    if (restored instanceof PE.ButtonNode) t.assert(restored.text == "Send" && restored.formAction == "/submit" && restored.formMethod == "post" && restored.formEnctype == "multipart/form-data" && restored.formTarget == "_blank", "Button HTML changed submission properties.")
  })

  test(section, "a text area round-trips through HTML", t => {
    let area = new PE.TextAreaNode()
    area.value = "Line one\nLine two"
    area.name = "message"
    area.columns = 42
    area.rows = 7
    area.wrap = "hard"
    area.inputMode = "text"
    let restored = viaHTML(t, area)
    t.assert(restored instanceof PE.TextAreaNode, "Text-area HTML could not be restored.")
    if (restored instanceof PE.TextAreaNode) t.assert(restored.value == area.value && restored.columns == 42 && restored.rows == 7 && restored.wrap == "hard" && restored.inputMode == "text", "Text-area HTML changed field properties.")
  })

  test(section, "a dropdown round-trips through HTML", t => {
    let dropdown = new PE.DropdownNode()
    dropdown.name = "department"
    dropdown.required = true
    dropdown.options = [new PE.FormOption("Sales", "sales"), new PE.FormOption("Support", "support", true)]
    let restored = viaHTML(t, dropdown)
    t.assert(restored instanceof PE.DropdownNode, "Dropdown HTML could not be restored.")
    if (restored instanceof PE.DropdownNode) t.assert(restored.name == "department" && restored.required && restored.options.length == 2 && restored.options[1].selected && restored.options[1].value == "support", "Dropdown HTML changed its options or field properties.")
  })

  test(section, "a label round-trips through HTML", t => {
    let label = new PE.LabelNode("Email Address")
    label.forID = "email"
    let restored = viaHTML(t, label)
    t.assert(restored instanceof PE.LabelNode && restored.forID == "email" && restored.text == "Email Address", "Label HTML changed its target or text.")
  })
}
