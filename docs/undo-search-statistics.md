# Undo, search, statistics and autosave

## Undo and redo

`editor.history` holds the undo steps. Each step is a snapshot of the document, so undo
restores content, settings and comments together.

```ts
if (editor.history.canUndo) editor.history.undo()
```

| Member | Meaning |
|---|---|
| `undo()`, `redo()` | |
| `canUndo`, `canRedo`, `undoCount`, `redoCount` | |
| `checkpoint()` | Records the document as an undo step, before a change. `node.willChange()` calls it. |
| `breakCoalescing()` | Makes the next change a step of its own |
| `suspend(work)` | Runs `work` without recording steps |
| `reset()` | Removes every step, such as after loading a document |
| `limit` | The most steps kept; 200 by default |
| `coalesceInterval` | Typing in one place within this many milliseconds is one step; 1500 by default |

History raises `changed` when its steps change, which is a good time to update your own Undo
and Redo buttons.

While collaborating, other users' changes aren't undo steps, and undo never reverts them.

## Find and replace

`editor.search` finds and replaces text across every text in the document, including table
cells, captions and form controls. It has its own search bar, or you can drive it from code.

```ts
let search = editor.search
search.caseSensitive = false
search.wholeWord = true

let results = search.findAll("colour")
search.replaceAll("colour", "color")    // returns the number replaced
```

| Member | Meaning |
|---|---|
| `show(replace)`, `close()`, `visible` | The search bar; `show(true)` includes the replace field |
| `query`, `replacement` | |
| `caseSensitive`, `wholeWord`, `useRegEx` | Search options |
| `patternError` | Why a regular expression is invalid, or "" |
| `findAll(query)` | Every match |
| `find(query)` | The first match at or after the caret, which it selects |
| `findNext()`, `findPrevious()`, `selectResult(result)` | Move through the matches |
| `current`, `currentIndex`, `matchCount` | |
| `replace(replacement)`, `replace(result, replacement)` | Replaces the current match, or one match |
| `replaceAll(query, replacement)` | Replaces every match, as one undo step |

A match is a `FindResult`, with the `node`, the `hostIndex` of the text it is in, its `start`
and `length`, and the matched `text`.

Ctrl/Command+F opens the search bar while the editor has focus, and Ctrl/Command+Option+F,
or Ctrl+H outside macOS, opens it with the replace field. Search raises `changed` when
its results change.

## Statistics

`editor.statistics` counts the document's content:

| Member | Meaning |
|---|---|
| `words`, `characters`, `charactersExcludingSpaces`, `paragraphs` | For the whole document |
| `selectedWords`, `selectedCharacters` | For the selection |
| `readingMinutes` | The reading time, at `wordsPerMinute` (200 by default) |

```ts
editor.addEventListener("contentChanged", () => {
  status.textContent = `${editor.statistics.words} words`
})
```

## The status bar

The status bar under the document shows the word and character counts and the reading time,
and, with autosave, whether everything is saved. While text is selected, the counts show the
selection's share, such as "12 of 300 words".

```ts
let editor = new Editor(element, {statusBar: true})
editor.statusBarVisible = false            // hides it again
editor.statusBar.showReadingTime = false   // also showWords, showCharacters, showSaveState
```

Add-ons and applications can add to it with `StatusBar.registerItem(identifier, item)`: `item` is
called with the editor and its plain text as the bar updates, and returns the element to show, or
null. The [readability](writing-aids.md#readability) add-on is one.

```ts
StatusBar.registerItem("paragraphs", (editor, text) => {
  let element = document.createElement("span")
  element.textContent = `${editor.statistics.paragraphs} paragraphs`
  return element
})
```

## Autosave

Give the editor a save function, and it saves the document a moment after the user stops
changing it:

```ts
let editor = new Editor(element, {
  statusBar: true,
  autosave: async editor => {
    let response = await fetch("/documents/42", {method: "PUT", body: editor.toJSON()})
    if (!response.ok) throw new Error(`Saving failed: ${response.status}`)
  }
})
```

The function may return a Promise. A rejection or exception is a failed save: autosave reports
it, and tries again after `retryDelay` or at the next change. After a successful save,
`editor.isChanged` is false.

Only the user's own changes start a save. Loading a document doesn't, and neither do changes
from other people while collaborating, since the person who made a change saves it.

| Member | Meaning |
|---|---|
| `save` | The save function, or null to turn autosave off. The `autosave` option sets it. |
| `delay` | Milliseconds after the last change before saving (1500) |
| `maximumWait` | The longest it waits while changes keep coming, so long typing is still saved (10000) |
| `retryDelay` | Milliseconds before a failed save is tried again (10000) |
| `warnBeforeLeaving` | Asks the browser to warn before the page closes with changes unsaved (true) |
| `state` | `AutosaveStates.saved`, `unsaved`, `saving` or `failed` |
| `lastSaved`, `lastError` | When it last saved, and what the last failed save threw |
| `saveNow()` | Saves straight away; resolves true once everything is saved |

The `autosave` option also takes the settings: `{save, delay, maximumWait, retryDelay,
warnBeforeLeaving}`. Each change of state raises `autosaveStateChanged` on the editor, with
`{state, error}`. When the page is hidden, such as when the user switches tabs or closes it on
a phone, unsaved changes are saved straight away.
