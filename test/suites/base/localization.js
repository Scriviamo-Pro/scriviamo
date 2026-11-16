// Interface text and locale packs.
"use strict"
{
  const section = "Localization"

  skip(section, "text-service language tags", "Spelling and text input are provided by the browser, which has no language override to set.")
  skip(section, "native spell checking", "Spelling is checked by the browser.")

  test(section, "a JSON locale pack applies the editor's strings", t => {
    let editor = t.editor()
    let pack = `{"language":"fr-CA","strings":{"Editor":{"TextBoldCaption":"Gras","TextSpellingMenuCaption":"Orthographe"}}}`
    t.equal(editor.localize(pack), 2, "The locale pack did not apply both of its strings")
    t.equal(editor.strings.TextBoldCaption, "Gras", "The locale pack did not apply the bold caption")
  })

  test(section, "an invalid locale pack is rejected whole", t => {
    let editor = t.editor()
    editor.localize(`{"language":"fr-CA","strings":{"Editor":{"TextBoldCaption":"Gras"}}}`)
    let applied = editor.localize(`{"language":"not a locale!","strings":{"Editor":{"TextBoldCaption":42,"TextItalicCaption":"Italique"}}}`)
    t.assert(applied == 0 && editor.strings.TextBoldCaption == "Gras" && editor.strings.TextItalicCaption != "Italique", "A locale pack with an invalid language and a non-string value was partly applied.")
  })

  test(section, "applying a pack updates the toolbar and node buttons", t => {
    let editor = t.editor()
    let values = {}
    for (let name of Object.keys(new PE.Strings())) {
      if (name.startsWith("Text") && typeof editor.strings[name] == "string") values[name] = "fr:" + name
    }
    let count = editor.localize({strings: {Editor: values}})
    t.equal(count, Object.keys(values).length, "A locale pack did not apply every editor string")
    let bold = editor.toolbarItems.item("bold")
    t.assert(bold && (bold.tooltip == "fr:TextBoldCaption" || bold.caption == "fr:TextBoldCaption"), "Applying a locale pack did not update the toolbar.")
  })

  test(section, "nodes read interface text from their editor", t => {
    let editor = t.editor()
    editor.strings.TextTypographyInspectorCaption = "Typographie"
    let detached = new PE.TextNode("Detached")
    let localized = new PE.TextNode("Localized")
    editor.addNode(localized)
    let captions = node => node.inspectorSections().map(section => section.caption)
    t.assert(captions(localized).indexOf("Typographie") >= 0 && captions(detached).indexOf("Typography") >= 0, "Nodes did not read their interface text from their editor, or from the built-in text without one.")
    let applied = editor.localize({strings: {Editor: {Text: "Document content"}}})
    t.equal(applied, 0, "Localization accepted the document-content Text property")
  })

  test(section, "add-ons register their own text", t => {
    PE.Strings.register({TextParityAddOnCaption: "Add-on", TextBoldCaption: "Changed"})
    let editor = t.editor()
    t.equal(editor.strings.TextParityAddOnCaption, "Add-on", "Registered text did not reach a new editor")
    t.equal(new PE.Strings().TextBoldCaption, "Bold", "Registered text replaced the base package's text")
    t.assert(PE.Strings.registeredNames.includes("TextParityAddOnCaption"), "The registered name was not listed")
  })

  test(section, "localized text wins over registered text in either order", t => {
    let early = t.editor()
    t.equal(early.localize({TextParityLateCaption: "Tard"}), 0, "Text for a name not registered yet was counted")
    PE.Strings.register({TextParityLateCaption: "Late"})
    let late = t.editor()
    late.localize({TextParityLateCaption: "Tard"})
    t.equal(early.strings.TextParityLateCaption, "Tard", "Text localized before its add-on registered was lost")
    t.equal(late.strings.TextParityLateCaption, "Tard", "Text localized after its add-on registered was not used")
  })

  test(section, "the application locale applies to new editors", t => {
    try {
      t.equal(PE.Strings.useLocale({language: "fr", strings: {Editor: {TextBoldCaption: "Gras", TextItalicCaption: "Italique"}}}), 2, "The application locale did not report both strings")
      PE.Strings.register({TextParityLocaleCaption: "English"})
      t.equal(PE.Strings.useLocale({TextBoldCaption: "Gras", TextParityLocaleCaption: "Français"}), 2, "The application locale did not count registered text")
      let editor = t.editor()
      t.equal(editor.strings.TextBoldCaption, "Gras", "A new editor did not use the application locale")
      t.equal(editor.strings.TextParityLocaleCaption, "Français", "The application locale did not replace registered text")
      let own = t.editor({strings: {TextBoldCaption: "Fett"}})
      t.equal(own.strings.TextBoldCaption, "Fett", "An editor's own locale pack did not win over the application locale")
      t.equal(PE.Strings.useLocale(`{"language":"not a locale!","strings":{}}`), 0, "An invalid application locale was accepted")
      t.equal(t.editor().strings.TextBoldCaption, "Gras", "An invalid application locale replaced the previous one")
    } finally {
      PE.Strings.useLocale(null)
    }
    t.equal(t.editor().strings.TextBoldCaption, "Bold", "Clearing the application locale did not restore the built-in text")
  })

  test(section, "a list of locale packs applies in order, and a bad one rejects the list", t => {
    let editor = t.editor()
    let first = {language: "fr", strings: {Editor: {TextBoldCaption: "Gras", TextItalicCaption: "Italique"}}}
    let second = {language: "fr", strings: {Editor: {TextItalicCaption: "En italique"}}}
    t.equal(editor.localize([first, second]), 2, "The packs' two names weren't applied")
    t.equal(editor.strings.TextBoldCaption, "Gras", "The first pack wasn't applied")
    t.equal(editor.strings.TextItalicCaption, "En italique", "The later pack didn't win")
    t.equal(editor.localize([first, {language: "not a locale!", strings: {}}]), 0, "A list with a bad pack was applied")
    t.equal(t.editor({strings: JSON.stringify([first])}).strings.TextBoldCaption, "Gras", "A list as JSON text wasn't applied")
  })

  test(section, "the built-in locale packs translate the editor", async t => {
    let response = await fetch("../dist/locales/scriviamo.de.json")
    t.assert(response.ok, "The German pack wasn't found")
    let pack = await response.json()
    let names = Object.keys(pack.strings.Editor)
    let editor = t.editor({strings: pack})
    t.equal(editor.strings.TextBoldCaption, "Fett", "The German pack wasn't used")
    // The toolbar is built in the editor's language too.
    t.equal(editor.toolbarItems.item("bold").tooltip, "Fett", "The toolbar wasn't translated by the strings option")
    t.equal(names.filter(name => editor.strings[name] !== pack.strings.Editor[name]), [], "Some text in the pack wasn't used")
    t.assert(names.length > 200, `The pack has only ${names.length} strings`)
  })
}
