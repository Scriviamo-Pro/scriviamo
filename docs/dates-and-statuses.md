# Dates and statuses in text

Two kinds of chip that sit inside a line of text, each from its own add-on. Each chip moves and
is removed as one character: Backspace after it, or Delete before it, removes it whole.

## Dates

The `dates` add-on puts dates in text, drawn as chips in the reader's language, such as
"Dec 24, 2026" or "24 déc. 2026". **Insert Date** on the toolbar puts today's date at the caret
and opens a date picker; clicking a date changes it, with buttons for today and tomorrow.

A date is kept in the text as its ISO date, such as `2026-12-24`, marked as a date, so it
compares, sorts and searches the same in every language. The page's `lang` decides how it reads,
and `DateChips.format` holds the `Intl.DateTimeFormat` options for every editor:

```ts
import {DateChips} from "./dist/addons/scriviamo.dates.js"

DateChips.format = {weekday: "short", year: "numeric", month: "short", day: "numeric"}
```

HTML has a `<time class="date-chip" datetime="2026-12-24">` element, which imports back. Markdown
and plain text have the date as it reads.

| Method | Meaning |
|---|---|
| `DateChips.insert(editor)` | Changes the date beside the caret, or inserts today's |
| `DateChips.dates(host)` | The dates in one text, with their offsets |
| `DateChips.replace(editor, host, start, end, date)` | Puts a date in place of a range, or removes it with `""` |
| `DateChips.display(date, language)` | A date as it reads in a language |

## Statuses

The `status` add-on puts statuses in text, such as "Draft", "In Review" or "Approved", drawn as
pills in their color. **Insert Status** on the toolbar puts the first status at the caret and
lists the rest; clicking a pill changes it, or removes it.

The application chooses the statuses, for every editor or for one:

```ts
import {StatusPills} from "./dist/addons/scriviamo.status.js"

StatusPills.statuses = [
  {name: "Proposed", color: "#7950f2"},
  {name: "Accepted", color: "#1fa774"},
  {name: "Rejected", color: "#e03131"}
]
StatusPills.setStatuses(editor, [{name: "Shipped", color: "#0c8599"}])
```

Without either, editors offer Draft, In Progress, In Review, Approved, Blocked and Done, in their
language. A status is kept in the text as its name, and takes its color from the status of the
same name, ignoring case, or gray when there's none.

HTML has a `<span class="status-pill" data-status="Approved">` with the pill's colors, and Markdown
the same span without them; both import back.
