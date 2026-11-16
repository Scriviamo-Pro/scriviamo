// The diagrams add-on: Mermaid diagrams, their import and export, and drawing them.
"use strict"
{
  const section = "Diagrams"
  // A stand-in for Mermaid, so the tests don't load it from the network.
  const FakeMermaid = {
    themes: [],
    initialize(settings) { this.themes.push(settings.theme) },
    async render(id, source) {
      if (source.includes("bad")) throw new Error("Parse error on line 1")
      return {svg: `<svg id="${id}"><text>${source}</text></svg>`}
    }
  }
  PE.DiagramRenderer.use(FakeMermaid)

  test(section, "Markdown mermaid fences become diagrams and are written back", t => {
    let editor = t.editor()
    editor.fromMarkdown("```mermaid\ngraph LR\n  A --> B\n```\n\n```js\nlet x = 1\n```")
    t.equal(editor.nodes().map(node => node.constructor.identifier), ["diagram", "codeblock"], "The fence wasn't read as a diagram")
    t.equal(editor.nodeAt(0).source, "graph LR\n  A --> B", "The diagram's source was wrong")
    t.equal(editor.nodeAt(0).toMarkdown(), "```mermaid\ngraph LR\n  A --> B\n```", "The diagram wasn't written back as a fence")
  })

  test(section, "HTML diagrams are read from code, pre.mermaid and data-mermaid", t => {
    let editor = t.editor()
    editor.fromHTML('<pre><code class="language-mermaid">graph TD</code></pre><pre class="mermaid">pie</pre><figure class="diagram" data-mermaid="sequenceDiagram"><svg></svg></figure>')
    t.equal(editor.nodes().map(node => node.constructor.identifier + ":" + node.source), ["diagram:graph TD", "diagram:pie", "diagram:sequenceDiagram"], "The diagrams weren't recognized")
  })

  test(section, "the diagram is drawn, exported as SVG, and errors are shown", async t => {
    let editor = t.editor()
    let node = new PE.DiagramNode()
    node.source = "graph LR; A-->B"
    t.equal(node.toHTML(), '<pre class="mermaid">graph LR; A--&gt;B</pre>', "The export before drawing wasn't Mermaid's own form")
    editor.addNode(node)
    await node.redraw()
    let output = node.element.querySelector(".scv-diagram-output")
    t.assert(output.querySelector("svg"), "The diagram wasn't drawn")
    t.assert(node.toHTML().startsWith('<figure class="diagram" data-mermaid="graph LR; A--&gt;B"><svg'), "The export wasn't the drawn SVG")
    t.equal(FakeMermaid.themes[FakeMermaid.themes.length - 1], "default", "The light theme wasn't used")

    node.source = "bad"
    t.equal(node.svg, "", "A drawing of the old source was kept for the new one")
    node.refresh()
    await node.redraw()
    output = node.element.querySelector(".scv-diagram-output")
    t.assert(output.classList.contains("scv-diagram-error") && output.textContent == "Parse error on line 1", "The error wasn't shown")
  })

  test(section, "JSON keeps the source", t => {
    let editor = t.editor()
    let node = new PE.DiagramNode()
    node.source = "graph TD; X-->Y"
    editor.addNode(node)
    let copy = t.editor()
    copy.fromJSON(editor.toJSON())
    t.assert(copy.nodeAt(0) instanceof PE.DiagramNode && copy.nodeAt(0).source == "graph TD; X-->Y", "The diagram didn't survive JSON")
    t.equal(JSON.parse(editor.toJSON()).nodes[0].language, undefined, "The JSON kept a code language")
  })
}
