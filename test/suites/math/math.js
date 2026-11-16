// The math add-on: LaTeX formulas, their import and export, and drawing them.
"use strict"
{
  const section = "Math"
  // A stand-in for KaTeX, so the tests don't load it from the network.
  const FakeKaTeX = {
    renderToString(latex, options) {
      if (latex.includes("\\bad")) throw new Error("KaTeX parse error: Undefined control sequence: \\bad")
      if (!options.displayMode) return options.output == "mathml" ? `<math><mi>${latex}</mi></math>` : `<span class="katex">${latex}</span>`
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

  // Inline math

  function editing(t, text, offset) {
    let editor = t.editor()
    editor.addNode(new PE.TextNode(text))
    editor.history.reset()
    editor.beginEditing(editor.nodeAt(0), offset)
    return editor
  }

  function formulas(editor, index = 0) {
    return PE.InlineMath.formulas(editor.nodeAt(index).hosts()[0]).map(formula => formula.latex)
  }

  test(section, "Markdown $…$ becomes inline formulas, and prices stay text", t => {
    let editor = t.editor()
    editor.fromMarkdown("Area $\\pi r^2$ and $a_{1}$, for $5 or $10, and code `$x$`.")
    t.equal(formulas(editor), ["\\pi r^2", "a_{1}"], "The formulas weren't read")
    let text = editor.nodeAt(0).content.text
    t.assert(text.includes("for $5 or $10"), `The prices didn't stay text (${text})`)
    t.equal(editor.toMarkdown().trim(), "Area $\\pi r^2$ and $a_{1}$, for $5 or $10, and code `$x$`.", "The Markdown wasn't written back")
  })

  test(section, "HTML inline formulas are read from data-latex, MathML and tags, and exported as MathML", t => {
    let editor = t.editor()
    editor.fromHTML('<p>A <span class="math-inline" data-latex="x^2">ignored</span>, B <math><semantics><mi>y</mi><annotation encoding="application/x-tex">y_1</annotation></semantics></math>, C <span data-scriviamo-suggestion-provider="math" data-scriviamo-suggestion-id="1">z</span>.</p>')
    t.equal(formulas(editor), ["x^2", "y_1", "z"], "The formulas weren't read")
    let html = editor.nodeAt(0).toHTML()
    t.assert(html.includes('<span class="math-inline" data-latex="x^2"><math><mi>x^2</mi></math></span>'), `The export wasn't MathML (${html})`)
    PE.MathRenderer.use(null)
    try {
      t.assert(editor.nodeAt(0).toHTML().includes('<span class="math-inline" data-latex="x^2">\\(x^2\\)</span>'), "The export without a renderer wasn't the source")
    } finally {
      PE.MathRenderer.use(FakeKaTeX)
    }
    t.equal(editor.nodeAt(0).toPlainText(), "A x^2, B y_1, C z.", "The plain text wasn't the source")
  })

  test(section, "a formula is drawn as one unit, and the caret stays outside it", t => {
    let editor = editing(t, "Sum ", 4)
    let host = editor.activeHost
    PE.InlineMath.replace(editor, host, 4, 4, "a+b")
    let element = host.element.querySelector(".scv-inline-math")
    t.assert(element && element.getAttribute("contenteditable") == "false", "The formula isn't one unit")
    t.equal(element.querySelector(".scv-inline-math-drawn").innerHTML, '<span class="katex">a+b</span>', "The formula wasn't drawn")
    t.equal(host.rich.text, "Sum a+b", "The source isn't the text")
    t.equal(host.selection(), {start: 7, end: 7}, "The caret isn't after the formula")
    host.select(4)
    t.equal(host.selection(), {start: 4, end: 4}, "The caret isn't before the formula")
    host.select(5)
    let selection = host.selection()
    t.assert(selection.start == 4 || selection.start == 7, `The caret went inside the formula (${JSON.stringify(selection)})`)
    t.assert(!host.rich.styleAt(3).suggestionProviderIdentifier && host.rich.styleAt(4).suggestionProviderIdentifier == "math", "The formula's style was wrong")
  })

  test(section, "typing $…$ makes a formula, as its own undo step", t => {
    let editor = editing(t, "Let ", 4)
    let host = editor.activeHost
    let type = value => {
      for (let character of value) {
        // The editor inserts some typing itself; the browser inserts the rest.
        let before = new InputEvent("beforeinput", {inputType: "insertText", data: character, bubbles: true, cancelable: true})
        host.element.dispatchEvent(before)
        if (before.defaultPrevented) continue
        let caret = host.selection().start
        host.rich.insert(caret, character)
        host.render()
        host.select(caret + 1)
        host.element.dispatchEvent(new InputEvent("input", {inputType: "insertText", data: character, bubbles: true}))
      }
    }
    type("$x_1$")
    t.equal(formulas(editor), ["x_1"], "Typing $x_1$ didn't make a formula")
    t.equal(host.rich.text, "Let x_1", "The dollar signs weren't removed")
    type(" costs $5 and $")
    t.equal(formulas(editor), ["x_1"], "A price became a formula")
    editor.history.undo()
    editor.history.undo()
    t.assert(editor.nodeAt(0).content.text.startsWith("Let $x_1$"), `Undo didn't put the dollar signs back (${editor.nodeAt(0).content.text})`)
  })

  test(section, "Backspace removes a whole formula, and Insert Inline Math turns the selection into one", t => {
    let editor = editing(t, "Value x^2 here", 0)
    let host = editor.activeHost
    host.select(6, 9)
    PE.InlineMath.insert(editor)
    let input = editor.element.querySelector(".scv-inline-math-popup input")
    t.assert(input, "The formula popover didn't open")
    t.equal(input && input.value, "x^2", "The popover didn't hold the selected text")
    t.assert(editor.element.querySelector(".scv-inline-math-preview .katex"), "The popover didn't preview the formula")
    input.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true, cancelable: true}))
    t.equal(formulas(editor), ["x^2"], "The selection didn't become a formula")
    host = editor.activeHost
    host.select(9)
    host.element.dispatchEvent(new KeyboardEvent("keydown", {key: "Backspace", bubbles: true, cancelable: true}))
    t.equal(editor.nodeAt(0).content.text, "Value  here", "Backspace didn't remove the whole formula")
    editor.history.undo()
    t.equal(formulas(editor), ["x^2"], "Undo didn't bring the formula back")
  })

  test(section, "clicking a formula edits it, and JSON keeps it", async t => {
    let editor = editing(t, "See ", 4)
    PE.InlineMath.replace(editor, editor.activeHost, 4, 4, "e^x")
    let element = editor.element.querySelector(".scv-inline-math")
    element.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}))
    let input = editor.element.querySelector(".scv-inline-math-popup input")
    t.assert(input && input.value == "e^x", "Clicking didn't open the formula's source")
    input.value = "e^{ix}"
    input.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true, cancelable: true}))
    t.equal(formulas(editor), ["e^{ix}"], "The edit wasn't applied")
    let copy = t.editor()
    copy.fromJSON(editor.toJSON())
    t.equal(formulas(copy), ["e^{ix}"], "The formula didn't survive JSON")
  })
}
