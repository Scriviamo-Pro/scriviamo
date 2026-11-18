// The outline: the heading tree, sections, and moving them.
"use strict"
{
  const section = "Outline"
  const markdown = "# Guide\n\nIntro.\n\n## Install\n\nRun it.\n\n### Details\n\nMore.\n\n## Use\n\nType.\n\n## Share\n\nSend."

  test(section, "headings nest by level", t => {
    let editor = t.editor()
    editor.fromMarkdown(markdown)
    let entries = PE.Outline.entries(editor)
    t.equal(entries.map(entry => entry.text).join("|"), "Guide", "The top level")
    t.equal(entries[0].children.map(entry => entry.text).join("|"), "Install|Use|Share", "The second level")
    t.equal(entries[0].children[0].children.map(entry => entry.text).join("|"), "Details", "The third level")
  })

  test(section, "a section runs to the next heading of its level or higher", t => {
    let editor = t.editor()
    editor.fromMarkdown(markdown)
    let install = editor.nodes().find(node => node.text == "Install")
    t.equal(PE.Outline.section(editor, install).map(node => node.text).join("|"), "Install|Run it.|Details|More.", "The Install section")
  })

  test(section, "sections move whole, as one undo step", t => {
    let editor = t.editor()
    editor.fromMarkdown(markdown)
    let share = editor.nodes().find(node => node.text == "Share")
    t.assert(PE.Outline.moveSectionBy(editor, share, -1), "Share didn't move up.")
    let headings = () => editor.nodes().filter(node => node instanceof PE.HeadingNode).map(node => node.text).join("|")
    t.equal(headings(), "Guide|Install|Details|Share|Use", "Headings after moving Share up")
    let install = editor.nodes().find(node => node.text == "Install")
    t.assert(PE.Outline.moveSectionBy(editor, install, 1), "Install didn't move down.")
    t.equal(headings(), "Guide|Share|Install|Details|Use", "Headings after moving Install down")
    t.equal(editor.nodes().map(node => node.text).join("|"), "Guide|Intro.|Share|Send.|Install|Run it.|Details|More.|Use|Type.", "Every block after the moves")
    editor.history.undo()
    t.equal(headings(), "Guide|Install|Details|Share|Use", "Headings after undo")
  })

  test(section, "the outline panel lists headings and follows changes", async t => {
    let editor = t.editor()
    editor.fromMarkdown(markdown)
    let element = document.createElement("div")
    let outline = new PE.Outline(element, editor)
    t.equal(Array.from(element.querySelectorAll(".scv-outline-link")).map(link => link.textContent).join("|"), "Guide|Install|Details|Use|Share", "The listed headings")
    let use = editor.nodes().find(node => node.text == "Use")
    use.willChange()
    use.content = new PE.RichText("Using it")
    use.changed()
    await t.tick(100)
    t.assert(element.textContent.includes("Using it"), "The outline didn't follow a renamed heading.")
    outline.dispose()
    t.assert(PE.Editor.panels().some(panel => panel.identifier == "outline"), "The outline isn't a registered panel.")
  })
}
