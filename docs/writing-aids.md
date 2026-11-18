# Outline, focus mode, readability and dictation

Four free add-ons that help people write, each its own module.

## The outline

The `outline` add-on shows the document's headings as a tree. Click a heading to go to it, and
drag one, or press Alt+Up or Alt+Down on it, to move its whole section: the heading and
everything under it, up to the next heading of the same or a higher level. The heading whose
section holds the caret is marked.

Place it anywhere, such as in a sidebar:

```ts
import {Outline} from "./dist/addons/scriviamo.outline.js"

let outline = new Outline(document.getElementById("outline"), editor)
// Later: outline.editor = otherEditor, or outline.dispose()
```

With the inspector add-on loaded too, the outline is also one of the inspector's tabs.

| Method | Meaning |
|---|---|
| `Outline.entries(editor)` | The headings, nested by level |
| `Outline.section(editor, heading)` | A heading's section, in the document's list |
| `Outline.moveSection(editor, heading, before)` | Moves a section to before another top-level block, or to the end with null; one undo step |
| `Outline.moveSectionBy(editor, heading, -1 or 1)` | Moves a section past the one before or after it |

Only sections at the top level of the document move; headings inside other blocks, such as
columns, are listed and can be gone to.

## Focus mode

The `focus` add-on adds **Focus Mode** to the toolbar: every block but the one being written in
fades, so the current paragraph stands out. **Typewriter Scrolling**, in the same menu, also
keeps the line being written at the same height, about a third of the way down, so the eyes stay
in one place.

```ts
import {FocusMode} from "./dist/addons/scriviamo.focus.js"

FocusMode.set(editor, {enabled: true, typewriter: true})
editor.addEventListener("focusModeChanged", event => console.log(event.detail))
```

`FocusMode.typewriterPosition` sets the height, as a fraction of the editor's. Focus mode is a
view setting, so it isn't saved with the document.

## Readability

The `readability` add-on adds the document's readability to the
[status bar](undo-search-statistics.md#the-status-bar): a school grade level for English text
(Flesch–Kincaid), or the words per sentence for other languages, and how many sentences are long.
Click the long sentences to select each in turn. The page's `lang` decides the language.

| Setting or method | Meaning |
|---|---|
| `Readability.longSentenceWords` | Sentences with more words than this are long; 25 by default |
| `Readability.enabled` | Whether the status bar shows it |
| `Readability.analyze(text, language)` | `{words, sentences, syllables, grade, wordsPerSentence, longSentences}` for a text |
| `Readability.showNextLongSentence(editor)` | Selects the next long sentence |

## Dictation

The `dictation` add-on adds **Dictate** to the toolbar: what's said goes into the text at the
caret, through the browser's speech recognition, in the page's language. While it listens, the
words not yet settled show in a bubble over the editor; a sentence that starts after a full stop
starts with a capital. Click **Dictate** again to stop.

Chrome, Edge and Safari can take dictation; where a browser can't, the tool is off. Browsers may
send the audio to their own speech service to recognize it, which matters for confidential
documents.

| Method | Meaning |
|---|---|
| `Dictation.isAvailable` | Whether the browser can take dictation |
| `Dictation.start(editor)`, `Dictation.toggle(editor)` | Start, or start and stop, dictating at the caret |
| `Dictation.isDictating(editor)` | Whether an editor is taking dictation |
