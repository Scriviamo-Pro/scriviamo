# Comments and suggestions

## Comments

Users can comment on selected text, or on a whole node. Each comment starts a thread, an
`Annotation`, which others can answer, resolve and reopen. Threads are saved with the document,
are shared while collaborating, and follow their text as it is edited.

Comments are on unless `allowAnnotations` is false. Users add them with the Comment tool, the
context menu or the margin markers. `editor.annotations` works with them in code.

```ts
let comments = editor.annotations
comments.authorName = "Ada Lovelace"     // recorded on new comments
comments.authorID = "ada"

let thread = comments.add("Check this figure")      // on the selected text, or the selected node
if (thread) comments.reply(thread, "Done")
```

| Member | Meaning |
|---|---|
| `authorName`, `authorID` | Recorded on new comments. While collaborating, they come from the signed-in user. |
| `add(text)` | Comments on the selected text while a node is being edited, or on the one selected node |
| `add(node, text)` | Comments on a whole node |
| `add(node, start, length, text, segment)` | Comments on a range of a node's text; `segment` is a table cell's index, or 0 |
| `canAdd`, `canChange` | Whether `add(text)` has something to comment on, and whether comments can be changed at all |
| `reply(annotation, text)` | Adds a reply by the current author |
| `resolve(annotation)`, `reopen(annotation)` | Resolved threads stay visible, muted |
| `removeComment(annotation, comment)` | Removes a comment, and the thread when it was the last |
| `remove(annotation)`, `removeAll()` | |
| `items()`, `item(id)`, `annotationsAt(node)` | The threads, one by ID, and those on a node |
| `show(annotation)`, `close()`, `visible` | The comment popover; `show(null)` starts a thread on the selection |
| `selected` | The thread whose text is highlighted |

Each change is an undo step, and raises `annotationAdded`, `annotationChanged` or
`annotationRemoved` on the editor. Clicking a margin marker raises `annotationSelected`; call
`preventDefault` on it to show the thread in your own interface.

### Threads and comments

An `Annotation` has:
- its `id`, the `nodeID` it is on, and `coversNode` for a comment on a whole node;
- the `start` and `length` of its text, and `quote`, the text it was made on;
- `resolved`, and `orphaned`, which is true when its text or node was deleted;
- its comments, from `comments()`.

Each `Comment` has an `id`, `authorID`, `authorName`, `created` date and `text`.

`editor.toHTML(true, true)` exports the threads in a section after the content.

## Text suggestions

Suggestions offer choices as the user types after a trigger character, such as `@` for people
or `:` for emoji. A chosen suggestion becomes a *tag*: text marked with the provider's and the
suggestion's identifiers, drawn with the provider's colors. Tags survive JSON, HTML and
Markdown, so they can be recognized again after loading.

Each editor starts with an emoji provider, `"emoji"`, triggered by `:`.

```ts
import {Suggestions} from "scriviamo"

let people = new Suggestions.Provider("people", "@")
people.add("ada", "Ada Lovelace")
people.add("grace", "Grace Hopper")
editor.suggestionProviders.add(people)

editor.addEventListener("suggestionCommitted", event => {
  console.log(event.detail.provider.identifier, event.detail.suggestion.identifier)
})
```

`add("ada", "Ada Lovelace")` shows "Ada Lovelace" in the popup and inserts `@ada`. For more
control, add a `Suggestions.Suggestion` with a `caption`, the `insertText` it inserts (including
the trigger), an `identifier`, and an optional `icon` (a Bootstrap Icons class or an image
URL), `detail` text and `tag` data.

`editor.suggestionProviders` holds the providers, asked in order: `add`, `addAt`, `item`,
`remove` and `removeAll`. A node's own `suggestionProvider` is asked before them.

### Writing a provider

Subclass `Suggestions.Provider` and override what you need:

| Override | For |
|---|---|
| `suggestions(request, maximumResults)` | Choices from your own source. It may return a Promise. `request.query` is the text typed after the trigger. |
| `match(textBeforeCaret, caretPosition, host)` | Syntax other than a trigger character followed by a word |
| `commitSuggestion(host, request, suggestion, style)` | Inserting the choice differently; the emoji provider inserts plain text instead of a tag |

```ts
class UserProvider extends Suggestions.Provider {
  constructor() {
    super("users", "@")
  }

  async suggestions(request) {
    let response = await fetch(`/api/users?q=${encodeURIComponent(request.query)}`)
    let users = await response.json()
    return users.map(user => new Suggestions.Suggestion(user.name, `@${user.handle}`, user.id))
  }
}
```

A provider's `textColor`, `backgroundColor` and `borderColor` color its tags.

`editor.recognizeSuggestions(nodes)` turns plain trigger text that exactly matches a
suggestion into a tag, as when the text was loaded or pasted.
