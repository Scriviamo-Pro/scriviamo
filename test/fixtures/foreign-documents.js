// Documents as other editors save them, for the importer add-ons' suites: Editor.js, TipTap and
// ProseMirror, Quill, Lexical, SunEditor and CKEditor.
"use strict"

const ForeignDocuments = {
  editorjs: {time: 1732300000000, version: "2.28.0", blocks: [
    {id: "1", type: "header", data: {text: "Heading", level: 2}},
    {id: "2", type: "paragraph", data: {text: 'Some <b>bold</b>, <i>italic</i>, a <a href="https://e.com">link</a>, <mark class="cdx-marker">marked</mark> and <code class="inline-code">code</code>.'}, tunes: {alignment: {alignment: "center"}}},
    {id: "3", type: "list", data: {style: "unordered", meta: {}, items: [{content: "One", meta: {}, items: [{content: "Nested", meta: {}, items: []}]}, {content: "Two", meta: {}, items: []}]}},
    {id: "4", type: "list", data: {style: "ordered", items: ["First", "Second"]}},
    {id: "5", type: "checklist", data: {items: [{text: "Done", checked: true}, {text: "Todo", checked: false}]}},
    {id: "6", type: "quote", data: {text: "Quoted", caption: "Someone", alignment: "left"}},
    {id: "7", type: "code", data: {code: "let x = 1 < 2"}},
    {id: "8", type: "delimiter", data: {}},
    {id: "9", type: "table", data: {withHeadings: true, content: [["A", "B"], ["1", "2"]]}},
    {id: "10", type: "image", data: {file: {url: "https://e.com/a.png"}, caption: "Cat", withBorder: false}},
    {id: "11", type: "warning", data: {title: "Careful", message: "Hot"}},
    {id: "12", type: "embed", data: {service: "youtube", source: "https://www.youtube.com/watch?v=abc", embed: "https://www.youtube.com/embed/abc", caption: "Video"}},
    {id: "13", type: "custom", data: {text: "Custom text"}}
  ]},
  tiptap: {type: "doc", content: [
    {type: "heading", attrs: {level: 1, textAlign: "center"}, content: [{type: "text", text: "Title"}]},
    {type: "paragraph", content: [{type: "text", text: "Plain "}, {type: "text", marks: [{type: "bold"}], text: "bold"}, {type: "text", text: " "}, {type: "text", marks: [{type: "italic"}, {type: "link", attrs: {href: "https://e.com", target: "_blank"}}], text: "italic link"}, {type: "hardBreak"}, {type: "text", marks: [{type: "textStyle", attrs: {color: "#ff0000"}}], text: "red"}, {type: "text", text: " and "}, {type: "text", marks: [{type: "highlight"}], text: "lit"}, {type: "text", text: " "}, {type: "mention", attrs: {id: "7", label: "ada"}}]},
    {type: "bulletList", content: [{type: "listItem", content: [{type: "paragraph", content: [{type: "text", text: "One"}]}, {type: "bulletList", content: [{type: "listItem", content: [{type: "paragraph", content: [{type: "text", text: "Nested"}]}]}]}]}]},
    {type: "orderedList", attrs: {start: 1}, content: [{type: "listItem", content: [{type: "paragraph", content: [{type: "text", text: "First"}]}]}]},
    {type: "taskList", content: [{type: "taskItem", attrs: {checked: true}, content: [{type: "paragraph", content: [{type: "text", text: "Done"}]}]}, {type: "taskItem", attrs: {checked: false}, content: [{type: "paragraph", content: [{type: "text", text: "Todo"}]}]}]},
    {type: "blockquote", content: [{type: "paragraph", content: [{type: "text", text: "Quoted"}]}]},
    {type: "codeBlock", attrs: {language: "js"}, content: [{type: "text", text: "a < b\nc"}]},
    {type: "horizontalRule"},
    {type: "table", content: [{type: "tableRow", content: [{type: "tableHeader", attrs: {colspan: 1, rowspan: 1}, content: [{type: "paragraph", content: [{type: "text", text: "H1"}]}]}, {type: "tableHeader", content: [{type: "paragraph", content: [{type: "text", text: "H2"}]}]}]}, {type: "tableRow", content: [{type: "tableCell", attrs: {colspan: 2}, content: [{type: "paragraph", content: [{type: "text", text: "Wide"}]}]}]}]},
    {type: "image", attrs: {src: "https://e.com/b.png", alt: "Bee", title: null}},
    {type: "youtube", attrs: {src: "https://www.youtube.com/embed/xyz"}}
  ]},
  prosemirror: {type: "doc", content: [
    {type: "heading", attrs: {level: 2}, content: [{type: "text", text: "PM"}]},
    {type: "bullet_list", content: [{type: "list_item", content: [{type: "paragraph", content: [{type: "text", marks: [{type: "strong"}, {type: "em"}], text: "both"}]}]}]},
    {type: "code_block", attrs: {params: "py"}, content: [{type: "text", text: "x=1"}]},
    {type: "horizontal_rule"}
  ]},
  quill: {ops: [
    {insert: "Title"}, {insert: "\n", attributes: {header: 1}},
    {insert: "Plain "}, {insert: "bold", attributes: {bold: true}}, {insert: " and "}, {insert: "link", attributes: {link: "https://e.com", italic: true}}, {insert: " "}, {insert: "big red", attributes: {color: "#e60000", size: "large"}}, {insert: "\n", attributes: {align: "center"}},
    {insert: "One"}, {insert: "\n", attributes: {list: "bullet"}}, {insert: "Nested"}, {insert: "\n", attributes: {list: "bullet", indent: 1}}, {insert: "Two"}, {insert: "\n", attributes: {list: "bullet"}},
    {insert: "First"}, {insert: "\n", attributes: {list: "ordered"}},
    {insert: "Done"}, {insert: "\n", attributes: {list: "checked"}}, {insert: "Todo"}, {insert: "\n", attributes: {list: "unchecked"}},
    {insert: "Quoted"}, {insert: "\n", attributes: {blockquote: true}},
    {insert: "a < b"}, {insert: "\n", attributes: {"code-block": "javascript"}}, {insert: "c"}, {insert: "\n", attributes: {"code-block": "javascript"}},
    {insert: {image: "https://e.com/c.png"}}, {insert: "\n"},
    {insert: {video: "https://www.youtube.com/embed/q"}}, {insert: "\n"},
    {insert: "Formula "}, {insert: {formula: "x^2"}}, {insert: " inline\n"}
  ]},
  lexical: {root: {type: "root", version: 1, direction: "ltr", format: "", indent: 0, children: [
    {type: "heading", tag: "h2", format: "center", direction: "ltr", indent: 0, version: 1, children: [{type: "text", text: "Lexical", format: 0, style: "", mode: "normal", detail: 0, version: 1}]},
    {type: "paragraph", format: "", direction: "ltr", indent: 0, version: 1, children: [{type: "text", text: "bold", format: 1, style: "", mode: "normal", detail: 0, version: 1}, {type: "text", text: " italic-under", format: 10, style: "color: #ff0000;", mode: "normal", detail: 0, version: 1}, {type: "linebreak", version: 1}, {type: "link", url: "https://e.com", children: [{type: "text", text: "link", format: 0, style: "", version: 1}], version: 1}]},
    {type: "list", listType: "bullet", start: 1, tag: "ul", version: 1, children: [{type: "listitem", value: 1, version: 1, children: [{type: "text", text: "One", format: 0}]}, {type: "listitem", value: 2, version: 1, children: [{type: "list", listType: "bullet", start: 1, tag: "ul", version: 1, children: [{type: "listitem", value: 1, children: [{type: "text", text: "Nested", format: 0}]}, {type: "listitem", value: 2, children: [{type: "list", listType: "bullet", children: [{type: "listitem", children: [{type: "text", text: "Deeper", format: 0}]}]}]}]}]}, {type: "listitem", value: 2, children: [{type: "text", text: "Two", format: 0}]}]},
    {type: "list", listType: "check", children: [{type: "listitem", checked: true, children: [{type: "text", text: "Done", format: 0}]}, {type: "listitem", checked: false, children: [{type: "text", text: "Todo", format: 0}]}]},
    {type: "quote", children: [{type: "text", text: "Quoted", format: 0}]},
    {type: "code", language: "python", children: [{type: "code-highlight", text: "x = 1"}, {type: "linebreak"}, {type: "code-highlight", text: "y < 2"}]},
    {type: "horizontalrule", version: 1},
    {type: "table", children: [{type: "tablerow", children: [{type: "tablecell", headerState: 1, children: [{type: "paragraph", children: [{type: "text", text: "H", format: 0}]}]}, {type: "tablecell", headerState: 1, children: [{type: "paragraph", children: [{type: "text", text: "H2", format: 0}]}]}]}, {type: "tablerow", children: [{type: "tablecell", headerState: 0, children: [{type: "paragraph", children: [{type: "text", text: "1", format: 0}]}]}, {type: "tablecell", headerState: 0, children: [{type: "paragraph", children: [{type: "text", text: "2", format: 0}]}]}]}]},
    {type: "paragraph", children: [{type: "equation", equation: "a+b", inline: true}]},
    {type: "image", src: "https://e.com/d.png", altText: "Dee"}
  ]}},
  suneditor: `<h2 style="text-align: center;">Sun</h2><p>Text with <strong>bold</strong>, <em>italic</em>, <u>under</u>, <del>gone</del> and <span style="color: rgb(255, 0, 0);">red</span>.</p><div>A div line</div><p><br></p><ul><li>One</li><li>Two</li></ul><blockquote><p>Quoted</p></blockquote><pre>let a = 1;<br>let b = 2;</pre><div class="se-component se-image-container __se__float-none" contenteditable="false"><figure style="margin: auto;"><img src="https://e.com/s.png" alt="Sun pic" data-proportion="true" data-align="none" data-index="0" data-file-name="s.png" data-file-size="0" data-origin="," data-size="," style=""><figcaption><p>Caption</p></figcaption></figure></div><div class="se-component se-video-container __se__float-none" contenteditable="false"><figure style="height: 56.25%; padding-bottom: 56.25%;"><iframe src="https://www.youtube.com/embed/sv" frameborder="0" allowfullscreen="true" data-proportion="true" data-align="none" data-index="0" style=""></iframe></figure></div><table class="se-table-size-auto"><tbody><tr><th><div>H</div></th><th><div>H2</div></th></tr><tr><td><div>1</div></td><td><div>2</div></td></tr></tbody></table><hr class="__se__solid">`,
  ckeditor: `<h2>CK</h2><p>Text with <strong>bold</strong>, <i>italic</i>, <span class="text-big">big</span>, <mark class="marker-yellow">marked</mark>, <code>code</code> and <a href="https://e.com">a link</a>.</p><p style="text-align:right;">Right</p><figure class="image image-style-side"><img src="https://e.com/k.png" alt="Kay"><figcaption>Caption</figcaption></figure><figure class="table"><table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table><figcaption>Table caption</figcaption></figure><ul class="todo-list"><li><label class="todo-list__label"><input type="checkbox" disabled="disabled" checked="checked"><span class="todo-list__label__description">Done</span></label></li><li><label class="todo-list__label"><input type="checkbox" disabled="disabled"><span class="todo-list__label__description">Todo</span></label></li></ul><ol><li>One<ol><li>Nested</li></ol></li></ol><blockquote><p>Quoted</p></blockquote><pre><code class="language-javascript">a &lt; b</code></pre><figure class="media"><oembed url="https://www.youtube.com/watch?v=aBcDeFgHiJk"></oembed></figure><p><span class="math-tex">\\(x^2\\)</span> inline</p><div class="page-break" style="page-break-after:always;"><span style="display:none;">&nbsp;</span></div><hr>`
}

/**
 * What an importer made of a document: each block's type (lists with their kind), and the
 * document as Markdown, to compare text and formatting. Embeds are left out of the types, as they
 * need the premium linkcards add-on.
 */
function foreignSummary(editor) {
  let nodes = editor.toJSONObject().nodes
  return {
    types: nodes.filter(node => node.type != "embed").map(node => node.type == "list" ? `list:${["bullets", "numbers", "checks"][node.content.listType || 0]}` : node.type),
    embeds: nodes.filter(node => node.type == "embed").map(node => node.url),
    markdown: editor.toMarkdown()
  }
}

/** Checks the parts every importer shares: recognizing its format, refusing others, and embeds becoming links without the embed block. */
function foreignCommon(t, importer, document, others, embedText) {
  t.assert(importer.recognizes(document), "Its own format wasn't recognized.")
  if (typeof document != "string") t.assert(importer.recognizes(JSON.stringify(document)), "Its own format, as JSON text, wasn't recognized.")
  for (let other of others) t.assert(!importer.recognizes(other), `Another format was taken for its own: ${JSON.stringify(other).slice(0, 60)}`)
  let editor = t.editor()
  t.assert(!importer.load(editor, typeof document == "string" ? "" : {nope: true}), "Something that isn't a document loaded.")
  if (embedText) {
    let plain = t.editor()
    plain.nodeTypes.remove("embed")
    importer.load(plain, document)
    t.assert(plain.toJSONObject().nodes.every(node => node.type != "embed") && plain.toMarkdown().includes(embedText), `Without the embed block, the embed didn't become a link:\n${plain.toMarkdown()}`)
  }
}
