// Loading older formats, compact styles, parsing, and embedded images.
"use strict"
{
  const section = "Document load"

  test(section, "format-2 per-character styles load and save identically", t => {
    let styled = new PE.TextNode("Bold italic plain Ünïcödé 😀 text")
    styled.content.applyStyle(0, 4, style => style.bold = true)
    styled.content.applyStyle(5, 11, style => style.italic = true)
    let list = new PE.ListNode("First\nSecond")
    let table = new PE.TableNode(2, 2)
    setText(table.cell(0, 0), "Cell")
    setText(table.cell(1, 1), "Ünï 😀")
    for (let original of [styled, list, table]) {
      let current = JSON.stringify(original.toJSON())
      let legacy = JSON.parse(current)
      expandStyleRuns(legacy)
      t.assert(JSON.stringify(legacy).indexOf("styleRuns") < 0, `${original.typeName} format-2 test data still contained style runs.`)
      let restored = new original.constructor()
      let loaded = restored.fromJSON(legacy)
      t.assert(loaded && JSON.stringify(restored.toJSON()) === current, `${original.typeName} did not load format-2 styles and save them identically.`)
    }
  })

  test(section, "compact styles are far smaller than per-character styles", t => {
    let text = "Lorem ipsum dolor sit amet. ".repeat(40)
    let node = new PE.TextNode(text)
    node.content.applyStyle(0, 100, style => style.bold = true)
    let compact = JSON.stringify(node.toJSON()).length
    let legacy = node.toJSON()
    expandStyleRuns(legacy)
    t.assert(compact * 20 < JSON.stringify(legacy).length, "Format-3 text content was not substantially smaller than per-character styles.")
  })

  test(section, "HTML import decodes entities, multi-byte text and attributes", t => {
    let editor = t.editor()
    let large = "data:image/png;base64," + "QUJD".repeat(50000)
    editor.fromHTML(`<!-- comment --><P class="a b" data-x=unquoted title='single'>Caf&eacute; &amp; &lt;tag&gt; &#x1F600; &#65; &bogus; 5 & 6 Ünï 😀</P><img src="${large}"/>tail`)
    let nodes = editor.nodes()
    t.assert(nodes.length >= 1 && nodes[0].toPlainText() == "Café & <tag> 😀 A &bogus; 5 & 6 Ünï 😀", "Entities and multi-byte text were not imported: " + (nodes[0] ? JSON.stringify(nodes[0].toPlainText()) : "no nodes"))
    let image = nodes.find(node => node instanceof PE.ImageNode)
    t.assert(image && image.source.length == large.length, "A large image source was not imported intact.")
    t.assert(nodes.some(node => node.toPlainText() == "tail"), "Text after a self-closing tag was not imported.")
  })

  skip(section, "HTML parser element tree and unterminated tags", "HTML is parsed by the browser's DOMParser, so the byte-scanning parser's element tree has no counterpart.")

  test(section, "Markdown inline formatting converts as before", t => {
    let html = PE.MarkdownConverter.toHTML(`**bold** and *it* \`a<b\` [link](https://x.y "T") ![alt](img.png) ~~del~~ é😀 & <u>u</u>`)
    t.equal(html, `<p><strong>bold</strong> and <em>it</em> <code>a&lt;b</code> <a href="https://x.y" title="T">link</a> <img src="img.png" alt="alt"> <del>del</del> é😀 &amp; <u>u</u></p>`, "Markdown inline formatting changed")
  })

  test(section, "Markdown blocks convert as before", t => {
    let markdown = "line one\nline two\n\n- a\n  - b\n- c\n\n```basic\na < b\n```\n\n> one\n> two"
    t.equal(PE.MarkdownConverter.toHTML(markdown), `<p>line one line two</p><ul><li>a<ul><li>b</li></ul></li><li>c</li></ul><pre><code class="language-basic">a &lt; b</code></pre><blockquote><p>one two</p></blockquote>`, "Markdown block conversion changed")
  })

  test(section, "an embedded image is saved back unchanged", t => {
    let canvas = document.createElement("canvas")
    canvas.width = 3
    canvas.height = 2
    let context = canvas.getContext("2d")
    context.fillStyle = "red"
    context.fillRect(0, 0, 3, 2)
    let encoded = canvas.toDataURL("image/png").split(",")[1]
    let data = {type: "image", nodeId: "i", image: encoded}
    let image = new PE.ImageNode()
    t.assert(image.fromJSON(data), "An image node did not load from JSON.")
    t.equal(image.toJSON().image, encoded, "An embedded image was not saved back unchanged")
  })

  skip(section, "a downloaded picture completes content without a change", "Images load in the browser's img element; there is no separate download step that could report a change.")
  skip(section, "deferred layout reports whether measurement is current", "Layout is done by the browser; nodes don't measure themselves.")
}
