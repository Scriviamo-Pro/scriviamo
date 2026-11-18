// Image galleries: layouts, captions, order, and import and export.
"use strict"
{
  const section = "Gallery"

  function gallery() {
    let node = new PE.GalleryNode()
    node.images = [new PE.GalleryImage("a.png", "First", "A"), new PE.GalleryImage("b.png", "", "B"), new PE.GalleryImage("c.png", "Third", "")]
    return node
  }

  test(section, "a gallery round-trips through HTML and JSON", t => {
    let node = gallery()
    node.columns = 2
    let editor = t.editor()
    editor.fromHTML(node.toHTML())
    let back = editor.nodeAt(0)
    t.assert(back instanceof PE.GalleryNode, "The gallery didn't import as one.")
    t.equal(back && back.images.map(image => `${image.source}:${image.caption}:${image.alt}`).join("|"), "a.png:First:A|b.png::B|c.png:Third:", "The imported pictures")
    t.equal(back && back.columns, 2, "The imported column count")
    let copy = t.editor().nodeFromJSON(JSON.parse(JSON.stringify(node.toJSON())))
    t.equal(copy.toHTML(), node.toHTML(), "The gallery after JSON")
  })

  test(section, "a carousel keeps its layout", t => {
    let node = gallery()
    node.layout = PE.GalleryLayouts.carousel
    let editor = t.editor()
    editor.fromHTML(node.toHTML())
    t.equal(editor.nodeAt(0) && editor.nodeAt(0).layout, PE.GalleryLayouts.carousel, "The imported layout")
  })

  test(section, "pictures move and are removed with their captions", t => {
    let editor = t.editor()
    let node = gallery()
    editor.addNode(node)
    node.moveImage(0, 1)
    t.equal(node.images.map(image => image.caption).join("|"), "|First|Third", "Captions after moving a picture")
    node.removeImage(1)
    t.equal(node.images.map(image => image.source).join("|"), "b.png|c.png", "Pictures after removing one")
    t.equal(node.toMarkdown(), '![B](b.png)\n![](c.png "Third")', "The gallery's Markdown")
  })
}
