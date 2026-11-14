# Undo, search and statistics

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
