// Document schemas: which node types and addresses a document may have, checked, cleaned and
// enforced by an editor. Also the safety check every link goes through.
"use strict"
{
  const section = "Schema validation"

  /** A document with a heading, a paragraph with a link, and a table holding a heading. */
  function sample(link = "https://example.com/") {
    let editor = new PE.Editor(null)
    editor.addNode(new PE.HeadingNode("Title", PE.HeadingLevels.heading1))
    let text = new PE.TextNode("Read more")
    text.content.applyStyle(0, 4, style => style.linkURL = link)
    editor.addNode(text)
    let table = new PE.TableNode(1, 1)
    table.cell(0, 0).insert(0, "Cell")
    table.cell(0, 0).nodes.push(new PE.HeadingNode("Inside", PE.HeadingLevels.heading2))
    editor.addNode(table)
    return editor.toJSONObject()
  }

  test(section, "links that could run script are left out of exports and lead nowhere in the editor", t => {
    for (let address of ["javascript:alert(1)", "JavaScript:alert(1)", " java\tscript:alert(1)", "vbscript:x", "data:text/html,<b>x</b>"]) {
      t.assert(!PE.Utilities.isSafeURL(address), `${JSON.stringify(address)} passed as safe.`)
    }
    for (let address of ["https://example.com/", "http://example.com", "mailto:ada@example.com", "tel:+391234", "/page", "#part", "page.html?x=1", ""]) {
      t.assert(PE.Utilities.isSafeURL(address), `${JSON.stringify(address)} didn't pass as safe.`)
    }
    let editor = t.editor()
    editor.fromJSON(sample("javascript:alert(1)"))
    let html = editor.toHTML()
    t.assert(!/javascript:/i.test(html) && html.includes("Read more"), `The export kept the unsafe link, or lost its text: ${html}`)
    t.assert(!/javascript:/i.test(editor.toMarkdown()), "The Markdown export kept the unsafe link.")
    let link = editor.element.querySelector(".scv-document a")
    t.assert(link && !link.hasAttribute("href"), "The editor's link to javascript: has an address.")
    editor.fromJSON(sample())
    t.assert(editor.toHTML().includes('href="https://example.com/"'), "A safe link was left out of the export.")
  })

  test(section, "validate reports node types, addresses and limits without changing the document", t => {
    let document = sample("javascript:alert(1)")
    let before = JSON.stringify(document)
    let schema = new PE.DocumentSchema({nodeTypes: ["heading"], maxNodes: 2, maxDepth: 0, maxTextLength: 5})
    let {valid, issues} = schema.validate(document)
    t.equal(JSON.stringify(document), before, "Validating changed the document")
    t.assert(!valid, "A document outside the schema was valid.")
    let codes = issues.map(issue => issue.code)
    t.assert(codes.includes(PE.SchemaIssueCodes.typeNotAllowed), `No issue for the table: ${codes}`)
    t.assert(codes.includes(PE.SchemaIssueCodes.unsafeAddress), `No issue for the javascript: link: ${codes}`)
    t.assert(codes.includes(PE.SchemaIssueCodes.tooDeep), `No issue for the heading inside the table: ${codes}`)
    t.assert(codes.includes(PE.SchemaIssueCodes.tooManyNodes) && codes.includes(PE.SchemaIssueCodes.textTooLong), `No issue for the limits: ${codes}`)
    let table = issues.find(issue => issue.code == PE.SchemaIssueCodes.typeNotAllowed && issue.type == "table")
    t.equal(table && table.path, "nodes[2]", "The table's path")
    t.assert(new PE.DocumentSchema().validate(sample()).valid, "A plain document didn't fit an empty schema.")
    t.equal(new PE.DocumentSchema().validate("{not json").issues[0].code, PE.SchemaIssueCodes.invalidDocument, "Text that isn't JSON")
    let unknown = {nodes: [{type: "no-such-type", id: "x"}]}
    t.equal(new PE.DocumentSchema().validate(unknown).issues.map(issue => issue.code), [PE.SchemaIssueCodes.unknownType], "A type nobody registered")
  })

  test(section, "rules of your own run on every node, nested ones too", t => {
    let schema = new PE.DocumentSchema({rules: [(node, context) => node.type == "heading" && context.depth > 0 ? "No headings in tables." : null]})
    let {issues} = schema.validate(sample())
    t.equal(issues.map(issue => [issue.code, issue.message, issue.path]), [[PE.SchemaIssueCodes.rule, "No headings in tables.", "nodes[2].cells[0].nodes[0]"]], "The rule's issues")
  })

  test(section, "clean takes out what isn't allowed, nested nodes and link addresses included", t => {
    let document = sample("javascript:alert(1)")
    let schema = new PE.DocumentSchema({excludedNodeTypes: ["table"]})
    let result = schema.clean(document)
    t.assert(result.changed && result.valid, "Cleaning didn't change the document, or left it invalid.")
    t.equal(result.document.nodes.map(node => node.type), ["heading", "text"], "The node types left")
    t.assert(!JSON.stringify(result.document).includes("javascript:"), "The unsafe link stayed.")
    t.assert(JSON.stringify(document).includes("javascript:"), "Cleaning changed the document it was given.")
    let editor = t.editor()
    t.assert(editor.fromJSON(result.document) && editor.toPlainText().includes("Read more"), "The cleaned document didn't load, or lost the link's text.")
    let nested = new PE.DocumentSchema({nodeTypes: ["table"]}).clean(sample())
    t.equal(nested.document.nodes.map(node => node.type), ["text", "table"], "Text is always allowed; the heading isn't")
    t.equal(nested.document.nodes[1].cells[0].nodes?.length ?? 0, 0, "The heading inside the table")
  })

  test(section, "an editor with a schema offers only its node types and refuses documents outside it", t => {
    let schema = new PE.DocumentSchema({nodeTypes: ["heading", "list"]})
    let editor = t.editor({schema})
    let offered = editor.nodeTypes.items().map(type => type.identifier)
    t.assert(offered.includes("heading") && offered.includes("text") && !offered.includes("table") && !offered.includes("quote"), `The node types offered: ${offered}`)
    t.assert(!editor.fromJSON(sample()), "A document with a table loaded.")
    t.assert(editor.lastValidationIssues.some(issue => issue.path == "nodes[2]"), "The issues don't say where the table is.")
    editor.insertHTML("<h2>Kept</h2><table><tr><td>Dropped</td></tr></table><blockquote>Also dropped</blockquote>")
    let types = editor.toJSONObject().nodes.map(node => node.type)
    t.assert(types.includes("heading") && !types.includes("table") && !types.includes("quote"), `Inserted HTML kept other types: ${types}`)
    t.assert(editor.validate().valid, "The editor's document doesn't fit its schema.")
    editor.schema = null
    t.assert(editor.nodeTypes.item("table") !== null, "Removing the schema didn't offer every type again.")
    t.assert(editor.fromJSON(sample()), "Without a schema, the document didn't load.")
  })
}
