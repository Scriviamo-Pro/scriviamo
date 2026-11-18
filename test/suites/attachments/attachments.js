// File attachments: export, import, sizes and dropped files.
"use strict"
{
  const section = "Attachments"
  const pdf = "data:application/pdf;base64,JVBERi0xLjQK"

  test(section, "an attachment exports as a download link and imports back", t => {
    let node = new PE.AttachmentNode()
    node.fileName = "Report.pdf"
    node.fileSize = 2048
    node.setSource(pdf)
    let html = node.toHTML()
    t.assert(html.includes('download="Report.pdf"') && html.includes("(2.0 KB)"), `The attachment's HTML: ${html}`)
    let editor = t.editor()
    editor.fromHTML(html)
    let back = editor.nodeAt(0)
    t.assert(back instanceof PE.AttachmentNode, "The attachment didn't import as one.")
    t.equal(back && [back.fileName, back.fileSize, back.mimeType, back.resourceData.length > 0].join("|"), "Report.pdf|2048|application/pdf|true", "The imported attachment")
    let copy = t.editor().nodeFromJSON(JSON.parse(JSON.stringify(node.toJSON())))
    t.equal(copy.toHTML(), html, "The attachment after JSON")
  })

  test(section, "sizes, kinds and names read well", t => {
    t.equal(PE.AttachmentNode.formatSize(0), "", "An unknown size")
    t.equal(PE.AttachmentNode.formatSize(900), "900 bytes", "Bytes")
    t.equal(PE.AttachmentNode.formatSize(5 * 1024 * 1024), "5.0 MB", "Megabytes")
    let node = new PE.AttachmentNode()
    node.setSource("https://example.com/files/Plan%20B.xlsx?v=2")
    t.equal(node.displayName, "Plan B.xlsx", "A name from the address")
    t.assert(node.fileIcon.includes("spreadsheet"), "A spreadsheet's icon")
    t.equal(node.toMarkdown(), "[Plan B.xlsx](https://example.com/files/Plan%20B.xlsx?v=2)", "The attachment's Markdown")
  })

  test(section, "dropped files no other type takes become attachments", t => {
    let editor = t.editor()
    let nodes = editor.nodesForFiles([new File(["x"], "notes.zip", {type: "application/zip"})])
    t.assert(nodes.length == 1 && nodes[0] instanceof PE.AttachmentNode, "A dropped zip file didn't become an attachment.")
    t.equal(nodes[0] && nodes[0].fileName, "notes.zip", "The dropped file's name")
    let image = editor.nodesForFiles([new File(["x"], "photo.png", {type: "image/png"})])
    t.assert(image.length == 1 && !(image[0] instanceof PE.AttachmentNode), "A dropped picture became an attachment instead of an image.")
  })
}
