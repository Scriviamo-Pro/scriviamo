// Selection, history, search, JSON defaults, change tracking, notifications and collaborators.
"use strict"
{
  const section = "Core"

  function threeNodes(t) {
    let editor = t.editor()
    editor.addNode(new PE.TextNode("First selectable node"))
    editor.addNode(new PE.TextNode("Second selectable node"))
    editor.addNode(new PE.TextNode("Third selectable node"))
    return editor
  }

  test(section, "a new editor and an empty document have no nodes", t => {
    let editor = t.editor(undefined, true)
    t.equal(editor.nodes().length, 0, "A new editor has nodes")
    editor.fromJSON({version: PE.CurrentDocumentVersion, nodes: []})
    t.equal(editor.nodes().length, 0, "Loading an empty document added nodes")
  })

  test(section, "selection, delete, undo and read-only", t => {
    let editor = threeNodes(t)
    let selection = editor.selection
    selection.selectAll()
    t.equal(selection.nodes().length, 3, "SelectAll did not select every node outside a text-editing session")
    selection.deselectAll()
    t.assert(selection.nodes().length == 0 && selection.node == null, "DeselectAll did not clear the node selection outside a text-editing session.")

    selection.selectAll()
    editor.readOnly = true
    selection.delete()
    t.equal(editor.lastNodeIndex, 2, "Delete removed nodes from a read-only editor")
    editor.readOnly = false
    selection.selectNode(editor.nodeAt(1))
    selection.delete()
    t.assert(editor.lastNodeIndex == 1 && editor.nodeAt(1).toPlainText() == "Third selectable node", "Delete did not remove only the selected node outside a text-editing session.")

    t.assert(editor.history.canUndo && !editor.history.canRedo, "CanUndo or CanRedo was wrong after deleting a node.")
    selection.clear()
    t.assert(!selection.canCopy && !selection.canCut && !selection.canDelete, "Copy, Cut, or Delete reported it could act with nothing selected.")
    t.assert(selection.canSelectAll, "CanSelectAll was False for a document with nodes.")

    editor.readOnly = true
    t.assert(!(editor.history.canUndo || selection.canPaste), "CanUndo or CanPaste was True in a read-only editor.")
    editor.history.undo()
    t.equal(editor.lastNodeIndex, 1, "Undo changed a read-only editor")
    editor.readOnly = false
    editor.history.undo()
    t.assert(editor.lastNodeIndex == 2 && editor.nodeAt(1).toPlainText() == "Second selectable node", "Undo did not restore the deleted node.")
    t.assert(editor.history.canRedo, "CanRedo was False after an undo.")
    editor.history.redo()
    t.equal(editor.lastNodeIndex, 1, "Redo did not delete the node again")
    selection.selectNode(editor.nodeAt(0))
    t.assert(selection.canCopy && selection.canCut && selection.canDelete, "Copy, Cut, or Delete reported it could not act on a selected node.")
  })

  test(section, "selection members, duplicate and move", t => {
    let editor = threeNodes(t)
    editor.removeNodeAt(1)
    let selection = editor.selection
    let first = editor.nodeAt(0)
    let second = editor.nodeAt(1)
    selection.selectNode(first)
    t.assert(selection.isSelected(first) && !selection.isSelected(second) && selection.lastNodeIndex == 0, "IsSelected or LastNodeIndex did not match a single selected node.")
    t.assert(selection.description.startsWith("1 selected: "), `Description did not describe a single selected node: "${selection.description}"`)
    selection.selectNode(second, true)
    t.assert(selection.lastNodeIndex == 1 && selection.isSelected(second), "SelectNode did not add a node to the selection.")
    t.assert(selection.canDuplicate, "CanDuplicate was False with duplicable nodes selected.")
    selection.duplicate()
    t.assert(editor.lastNodeIndex == 3 && selection.lastNodeIndex == 1 && !selection.isSelected(first), "Duplicate did not insert and select a copy of each selected node.")
    selection.deleteNodes()
    t.assert(editor.lastNodeIndex == 1 && selection.node == null, "DeleteNodes did not remove the selected copies.")
    selection.selectNode(second)
    t.assert(selection.node == second && selection.lastNodeIndex == 0, "Selecting a node did not replace the selection.")
    editor.readOnly = true
    t.assert(!selection.canDuplicate, "CanDuplicate was True in a read-only editor.")
    editor.readOnly = false

    selection.selectNode(second)
    t.assert(selection.canMoveUp && !selection.canMoveDown, "CanMoveUp or CanMoveDown did not match the last node.")
    selection.moveUp()
    t.assert(editor.nodeAt(0) == second && editor.nodeAt(1) == first && !selection.canMoveUp, "MoveUp did not move the node before its neighbor.")
    editor.history.undo()
    t.assert(editor.nodeAt(0) == first && editor.nodeAt(1) == second, "Undo did not put a moved node back.")
    editor.history.redo()
    t.assert(editor.nodeAt(0) == second, "Redo did not move the node again.")
    selection.selectNode(editor.nodeAt(0))
    selection.moveDown()
    t.assert(editor.nodeAt(1) == editor.nodeWithID(second.nodeId), "MoveDown did not move the node after its neighbor.")
    selection.selectAllNodes()
    t.equal(selection.lastNodeIndex, 1, "SelectAllNodes did not select every node")
    selection.clear()
    t.assert(selection.node == null, "Clear did not empty the selection.")
    t.equal(selection.description, "No Selection", "An empty selection's description is not the No Selection caption")
    t.assert(!selection.selectText(0, 1), "SelectText accepted a range with no node being edited.")
  })

  test(section, "search options, navigation and replacement", t => {
    let editor = t.editor()
    editor.addNode(new PE.TextNode("Cat catalog cat"))
    editor.addNode(new PE.TextNode("The cat sat"))
    let finder = editor.search
    t.equal(finder.findAll("cat").length, 4, "Search did not find case-insensitive matches")
    finder.caseSensitive = true
    t.equal(finder.findAll().length, 3, "CaseSensitive did not exclude a match with different letter case")
    finder.wholeWord = true
    finder.findAll()
    t.equal(finder.matchCount, 2, "WholeWord did not exclude a match inside a word")
    finder.caseSensitive = false
    finder.wholeWord = false
    finder.useRegEx = true
    t.assert(finder.findAll("c(a)t\\b").length == 3 && finder.patternError == "", "A regular expression did not find the expected matches.")

    editor.selection.clear()
    let first = finder.find("c(a)t\\b")
    t.assert(first && first.node == editor.nodeAt(0) && first.start == 0 && finder.currentIndex == 0, "Find did not select the first match.")
    let next = finder.findNext()
    t.assert(next && next.node == editor.nodeAt(0) && next.start == 12 && finder.currentIndex == 1, "FindNext did not select the next match in the same node.")
    next = finder.findNext()
    t.assert(next && next.node == editor.nodeAt(1) && finder.currentIndex == 2, "FindNext did not continue into the next node.")
    next = finder.findNext()
    t.assert(next && finder.currentIndex == 0, "FindNext did not wrap to the first match.")
    next = finder.findPrevious()
    t.assert(next && finder.currentIndex == 2, "FindPrevious did not wrap to the last match.")
    t.assert(finder.replace("d$1g") && editor.nodeAt(1).toPlainText() == "The dag sat", "Replace did not expand a group in the replacement: " + editor.nodeAt(1).toPlainText())
    t.assert(finder.current && finder.current.node == editor.nodeAt(0) && finder.current.start == 0, "Replace did not select the next match.")
    finder.useRegEx = false
    t.assert(finder.replaceAll("cat", "dog") == 3 && editor.nodeAt(0).toPlainText() == "dog dogalog dog", "ReplaceAll did not replace every match: " + editor.nodeAt(0).toPlainText())
    editor.readOnly = true
    t.assert(finder.replaceAll("dog", "cat") == 0 && finder.matchCount == 3, "A read-only editor allowed replacing, or stopped finding.")
  })


  test(section, "JSON leaves out default values and restores them when missing", t => {
    let plain = new PE.TextNode("Plain")
    let json = plain.toJSON()
    t.assert(!("borderTopVisible" in json) && !("borderLeftColor" in json) && !("lineHeight" in json) && !("alignment" in json) && !("bold" in json), "A text node with default values wrote them to JSON: " + JSON.stringify(json))
    let content = json.content
    t.assert(content && "text" in content && !("styleRuns" in content) && !("listType" in content) && !("nodes" in content), "Default text content wrote default values to JSON: " + JSON.stringify(content))

    let styled = new PE.TextNode("Styled")
    styled.borderTop = {visible: true, size: 3, color: PE.Colors.make(0x33, 0x66, 0x99)}
    styled.lineHeight = 1.5
    styled.bold = true
    let restored = new PE.TextNode("")
    t.assert(restored.fromJSON(styled.toJSON()) && restored.borderTop.visible && restored.borderTop.size == 3 && PE.Colors.equals(restored.borderTop.color, PE.Colors.make(0x33, 0x66, 0x99)) && restored.lineHeight == 1.5 && restored.bold && restored.text == "Styled", "Changed values did not survive a JSON round trip.")

    let target = new PE.TextNode("")
    target.borderLeft = {visible: true, size: 1, color: PE.Colors.empty}
    target.lineHeight = 2
    target.bold = true
    t.assert(target.fromJSON(json) && !target.borderLeft.visible && target.lineHeight == 1 && !target.bold, "Missing JSON values did not restore their defaults.")

    let table = new PE.TableNode(2, 2)
    setText(table.cell(0, 0), "A")
    let restoredTable = new PE.TableNode(1, 1)
    t.assert(restoredTable.fromJSON(table.toJSON()) && restoredTable.rows == 2 && restoredTable.columns == 2 && restoredTable.cell(0, 0).text == "A" && restoredTable.hasHeader == table.hasHeader, "A table did not survive a compact JSON round trip.")
  })

  test(section, "an image from a file is saved as the file's own bytes", async t => {
    let canvas = document.createElement("canvas")
    canvas.width = 32
    canvas.height = 32
    let context = canvas.getContext("2d")
    context.fillStyle = "#3366CC"
    context.fillRect(0, 0, 32, 32)
    let blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"))
    let bytes = new Uint8Array(await blob.arrayBuffer())
    let base64 = btoa(String.fromCharCode(...bytes))
    let image = new PE.ImageNode()
    await image.loadFile(blob)
    let json = image.toJSON()
    t.equal(json.image, base64, "An image from a file was not saved as the file's own bytes in base64")
    let restored = new PE.ImageNode()
    t.assert(restored.fromJSON(json) && restored.hasImage && restored.toJSON().image === json.image, "A saved image file did not survive a JSON round trip unchanged.")
  })

  test(section, "IsChanged follows changes, saving and loading", t => {
    let editor = t.editor()
    editor.addNode(new PE.TextNode("First"))
    t.assert(editor.isChanged, "Adding a node did not mark the document changed.")
    editor.isChanged = false
    t.assert(!editor.isChanged, "IsChanged could not be cleared after saving.")
    let saved = editor.toJSON()
    editor.addNode(new PE.TextNode("Second"))
    t.assert(editor.isChanged, "A change after saving did not mark the document changed.")
    editor.fromJSON(saved)
    t.assert(!editor.isChanged, "Loading a document left it marked changed.")
    editor.fromMarkdown("# Title")
    t.assert(!editor.isChanged, "Loading Markdown left the document marked changed.")
  })

  skip(section, "refreshed node content and nested change groups", "There is no BeginChanges/EndChanges grouping; metadata that arrives while loading is checked by the link card tests.")

  test(section, "notifications stack newest first", t => {
    let editor = t.editor()
    let first = new PE.Notification("First", PE.NotificationTypes.info)
    let second = new PE.Notification("Second", PE.NotificationTypes.danger, "Problem")
    editor.showMessage(first)
    editor.showMessage(second)
    editor.showMessage(new PE.Notification(" "))
    let shown = editor.messages()
    t.assert(shown.length == 2 && shown[0] == second && shown[1] == first && first.duration == 15, `Notifications were not shown newest first, or an empty one was shown (${shown.map(item => JSON.stringify(item.message)).join(", ")}).`)
    editor.closeMessage(second)
    shown = editor.messages()
    t.assert(shown.length >= 1 && shown.indexOf(second) < 0 && shown.indexOf(first) >= 0, "Dismissing a notification did not leave the others.")
  })

  skip(section, "offscreen picture limits", "Drawing to offscreen pictures is specific to the desktop implementation.")

  test(section, "font options allow custom sizes by default", t => {
    let options = new PE.FontOptions(false, false)
    t.assert(options.allowCustomFontSize, "Custom font sizes are not enabled by default.")
    t.equal(options.lastSizeIndex, -1, "An empty FontOptions contains predefined sizes")
    options.allowCustomFontSize = false
    t.assert(!options.allowCustomFontSize, "Custom font sizes could not be disabled.")
  })
}
