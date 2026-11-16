// Autosave and the status bar.
"use strict"
{
  const section = "Autosave"

  function quick(editor, save) {
    editor.autosave.delay = 20
    editor.autosave.maximumWait = 1000
    editor.autosave.retryDelay = 60
    editor.autosave.warnBeforeLeaving = false
    editor.autosave.save = save
  }

  test(section, "saves once after a burst of changes, and marks the document saved", async t => {
    let editor = t.editor()
    let saves = []
    let states = []
    editor.addEventListener("autosaveStateChanged", event => states.push(event.detail.state))
    quick(editor, current => { saves.push(current.toPlainText()) })
    t.equal(editor.autosave.state, "saved", "A new editor wasn't saved")
    editor.addNode(new PE.TextNode("One"))
    editor.addNode(new PE.TextNode("Two"))
    t.equal(editor.autosave.state, "unsaved", "A change didn't make the document unsaved")
    await t.tick(80)
    t.equal(saves.length, 1, "Two quick changes weren't saved together")
    t.equal(saves[0], "One\nTwo", "The save didn't see the latest content")
    t.equal(editor.autosave.state, "saved", "A successful save didn't mark the document saved")
    t.assert(!editor.isChanged, "A successful save left isChanged true")
    t.assert(editor.autosave.lastSaved instanceof Date, "lastSaved wasn't set")
    t.equal(states, ["unsaved", "saving", "saved"], "The state events were wrong")
  })

  test(section, "loading a document isn't a change to save", async t => {
    let editor = t.editor()
    let saves = 0
    quick(editor, () => { saves++ })
    editor.fromMarkdown("# Loaded\n\nText")
    await t.tick(60)
    t.equal(saves, 0, "Loading a document started a save")
    t.equal(editor.autosave.state, "saved", "Loading a document left it unsaved")
  })

  test(section, "a failed save is reported and tried again", async t => {
    let editor = t.editor()
    let attempts = 0
    let errors = []
    editor.addEventListener("autosaveStateChanged", event => { if (event.detail.state == "failed") errors.push(event.detail.error) })
    quick(editor, async () => {
      attempts++
      if (attempts == 1) throw new Error("offline")
    })
    editor.addNode(new PE.TextNode("Text"))
    await t.tick(45)
    t.equal(editor.autosave.state, "failed", "A failed save wasn't reported")
    t.assert(errors.length == 1 && errors[0].message == "offline", "The failure's error wasn't passed on")
    t.assert(editor.isChanged, "A failed save cleared isChanged")
    await t.tick(120)
    t.equal(attempts, 2, "The failed save wasn't tried again")
    t.equal(editor.autosave.state, "saved", "The retry didn't save")
  })

  test(section, "changes made while saving are saved afterwards", async t => {
    let editor = t.editor()
    let saves = []
    let release = null
    quick(editor, current => {
      saves.push(current.toPlainText())
      if (saves.length == 1) return new Promise(resolve => release = resolve)
    })
    editor.addNode(new PE.TextNode("First"))
    await t.tick(40)
    t.equal(editor.autosave.state, "saving", "The first save didn't start")
    editor.addNode(new PE.TextNode("Second"))
    release()
    await t.tick(80)
    t.equal(saves, ["First", "First\nSecond"], "The change made during a save wasn't saved after it")
    t.equal(editor.autosave.state, "saved", "The document wasn't saved in the end")
  })

  test(section, "saveNow saves without waiting, and the option sets it up", async t => {
    let saves = 0
    let editor = t.editor({autosave: {save: () => { saves++ }, delay: 5000, warnBeforeLeaving: false}})
    t.equal(editor.autosave.delay, 5000, "The autosave option's delay wasn't used")
    editor.addNode(new PE.TextNode("Now"))
    t.equal(await editor.autosave.saveNow(), true, "saveNow didn't report success")
    t.equal(saves, 1, "saveNow didn't save")
    editor.autosave.save = null
    t.assert(!editor.autosave.enabled, "Clearing save didn't turn autosave off")
  })

  test(section, "the status bar counts words, characters, the selection and the save state", async t => {
    let editor = t.editor({statusBar: true})
    let bar = editor.element.querySelector(".scv-statusbar")
    t.assert(bar && !bar.classList.contains("d-none"), "The statusBar option didn't show the bar")
    editor.addNode(new PE.TextNode("Hello brave new world"))
    await t.tick(200)
    let counts = bar.querySelector(".scv-status-counts").textContent
    t.equal(counts, "4 words · 21 characters · 1 min read", "The counts were wrong")
    t.equal(bar.querySelector(".scv-status-save").textContent, "", "The save state showed without autosave")

    editor.beginEditing(editor.nodeAt(0), 0)
    editor.activeHost.select(0, 11)
    editor.statusBar.update()
    t.equal(bar.querySelector(".scv-status-counts").textContent, "2 of 4 words · 11 of 21 characters · 1 min read", "The selection's counts were wrong")
    editor.endEditing()

    quick(editor, () => {})
    editor.statusBar.update()
    t.assert(bar.querySelector(".scv-status-save").textContent.includes("Unsaved changes"), "The unsaved state didn't show")
    await t.tick(250)
    t.assert(bar.querySelector(".scv-status-save").textContent.includes("Saved"), "The saved state didn't show")

    editor.statusBarVisible = false
    t.assert(bar.classList.contains("d-none"), "statusBarVisible didn't hide the bar")
  })
}
