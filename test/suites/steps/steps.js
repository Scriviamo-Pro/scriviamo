// Steps and timelines: structure, labels, and import and export.
"use strict"
{
  const section = "Steps"

  function steps(t, texts, style = PE.StepsStyles.numbered) {
    let editor = t.editor()
    let node = new PE.StepsNode(texts.length)
    node.stepsStyle = style
    editor.addNode(node)
    texts.forEach((text, index) => node.cells[index].append(new PE.RichText(text)))
    return {editor, node}
  }

  test(section, "steps export as a numbered list and import back", t => {
    let {node} = steps(t, ["Install it", "Configure it"])
    let html = node.toHTML()
    t.assert(html.startsWith('<ol class="steps"'), `Steps didn't export as an ordered steps list: ${html}`)
    let editor = t.editor()
    editor.fromHTML(html)
    let back = editor.nodeAt(0)
    t.assert(back instanceof PE.StepsNode && back.count == 2 && back.cells[1].text == "Configure it", "Exported steps didn't import as the same steps.")
    t.equal(node.toMarkdown(), "1. Install it\n2. Configure it", "Steps' Markdown")
  })

  test(section, "a timeline keeps its labels through HTML and JSON", t => {
    let {node} = steps(t, ["Founded", "First release"], PE.StepsStyles.timeline)
    node.labels = ["2024", "March 2026"]
    let editor = t.editor()
    editor.fromHTML(node.toHTML())
    let back = editor.nodeAt(0)
    t.assert(back instanceof PE.StepsNode && back.stepsStyle == PE.StepsStyles.timeline, "A timeline didn't import as a timeline.")
    t.equal(back && back.labels.join("|"), "2024|March 2026", "The timeline's labels after HTML")
    t.equal(back && back.cells[0].text, "Founded", "A label leaked into the entry's text")
    let copy = t.editor().nodeFromJSON(JSON.parse(JSON.stringify(node.toJSON())))
    t.equal(copy.labels.join("|"), "2024|March 2026", "The timeline's labels after JSON")
    t.assert(node.toMarkdown().startsWith("- **2024**"), `A timeline's Markdown didn't lead with its label: ${node.toMarkdown()}`)
  })

  test(section, "adding, removing and moving steps keeps labels with their steps", t => {
    let {node} = steps(t, ["A", "B", "C"], PE.StepsStyles.timeline)
    node.labels = ["1", "2", "3"]
    node.insertRow(1)
    t.equal(node.labels.join("|"), "1||2|3", "Labels after adding a step")
    node.removeRow(0)
    t.equal(node.labels.join("|"), "|2|3", "Labels after removing a step")
    node.moveStep(2, -1)
    t.equal(node.cells.map(cell => cell.text).join("|"), "|C|B", "Steps after moving one up")
    t.equal(node.labels.join("|"), "|3|2", "Labels after moving a step up")
  })

  test(section, "a step holds blocks", t => {
    let {node} = steps(t, ["Run this:"])
    let code = new PE.CodeBlockNode()
    code.content = new PE.RichText("npm install")
    node.cells[0].nodes.push(code)
    let editor = t.editor()
    editor.fromHTML(node.toHTML())
    let back = editor.nodeAt(0)
    t.assert(back && back.cells[0].nodes.length == 1 && back.cells[0].nodes[0] instanceof PE.CodeBlockNode, "A step's code block didn't survive HTML.")
    t.assert(node.toMarkdown().includes("\n   ```"), `A step's block wasn't indented under it in Markdown: ${node.toMarkdown()}`)
  })
}
