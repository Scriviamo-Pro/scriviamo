// The math add-on: LaTeX formulas, their import and export, and drawing them.
"use strict"
{
  const section = "Math"
  // A stand-in for KaTeX, so the tests don't load it from the network.
  const FakeKaTeX = {
    renderToString(latex, options) {
      if (latex.includes("\\bad")) throw new Error("KaTeX parse error: Undefined control sequence: \\bad")
      return options.output == "mathml" ? `<math display="block"><mi>${latex}</mi></math>` : `<span class="katex-display">${latex}</span>`
    }
  }
  PE.MathRenderer.use(FakeKaTeX)

  test(section, "Markdown $$ blocks become formulas and are written back", t => {
    let editor = t.editor()
    editor.fromMarkdown("Before\n\n$$\nE = mc^2\n$$\n\n$$a^2 + b^2 = c^2$$\n\nAfter")
    let types = editor.nodes().map(node => node.constructor.identifier)
    t.equal(types, ["text", "math", "math", "text"], "The $$ blocks weren't read as formulas")
    t.equal(editor.nodeAt(1).latex, "E = mc^2", "The multi-line formula's source was wrong")
    t.equal(editor.nodeAt(2).latex, "a^2 + b^2 = c^2", "The one-line formula's source was wrong")
    t.equal(editor.nodeAt(1).toMarkdown(), "$$\nE = mc^2\n$$", "The formula wasn't written back as a $$ block")
  })

  test(section, "HTML formulas are read from code, data-latex and MathML", t => {
    let editor = t.editor()
    editor.fromHTML([
      '<pre><code class="language-math">x^2</code></pre>',
      '<div class="math-display" data-latex="\\frac{1}{2}"></div>',
      '<math display="block"><semantics><mi>y</mi><annotation encoding="application/x-tex">y = 2x</annotation></semantics></math>',
      '<pre><code class="language-js">let x = 1</code></pre>'
    ].join(""))
    t.equal(editor.nodes().map(node => node.constructor.identifier), ["math", "math", "math", "codeblock"], "The formulas weren't recognized")
    t.equal(editor.nodes().slice(0, 3).map(node => node.latex), ["x^2", "\\frac{1}{2}", "y = 2x"], "The sources were wrong")
  })

  test(section, "the formula is drawn, and errors are shown", async t => {
    let editor = t.editor()
    let node = new PE.MathNode()
    node.latex = "x + y"
    editor.addNode(node)
    let output = node.element.querySelector(".scv-math-output")
    t.equal(output.innerHTML, '<span class="katex-display">x + y</span>', "The formula wasn't drawn")
    node.latex = "\\bad"
    node.refresh()
    output = node.element.querySelector(".scv-math-output")
    t.assert(output.classList.contains("scv-math-error"), "An error wasn't marked")
    t.equal(output.textContent, "Undefined control sequence: \\bad", "The error message wasn't shown")
  })

  test(section, "exports hold MathML, or the source without a renderer", t => {
    let node = new PE.MathNode()
    node.latex = "a < b"
    let html = node.toHTML()
    t.assert(html.startsWith('<div class="math-display" data-latex="a &lt; b">') && html.includes('<math display="block">'), `The HTML export wasn't MathML (${html})`)
    PE.MathRenderer.use(null)
    try {
      t.equal(node.toHTML(), '<div class="math-display" data-latex="a &lt; b">\\[a &lt; b\\]</div>', "The export without a renderer wasn't the source")
    } finally {
      PE.MathRenderer.use(FakeKaTeX)
    }
    t.equal(node.toPlainText(), "a < b", "The plain text wasn't the source")
  })

  test(section, "JSON keeps the source, and $$ typed in a paragraph makes a formula", t => {
    let editor = t.editor()
    let node = new PE.MathNode()
    node.latex = "\\sqrt{2}"
    editor.addNode(node)
    let data = JSON.parse(editor.toJSON())
    t.equal(data.nodes[0].type, "math", "The JSON type was wrong")
    let copy = t.editor()
    copy.fromJSON(data)
    t.equal(copy.nodeAt(0).latex, "\\sqrt{2}", "The source didn't survive JSON")
    t.assert(PE.MathNode.markdownShortcuts.some(shortcut => shortcut.pattern.test("$$")), "$$ isn't a shortcut")
  })
}
