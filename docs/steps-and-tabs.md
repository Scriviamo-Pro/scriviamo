# Steps, timelines and tabs

Blocks that hold other blocks, for content in parts: numbered steps or a timeline, and tabbed
panels.

## Steps and timelines

The `steps` add-on adds `StepsNode`, JSON type `"steps"`: a numbered procedure, or a timeline
whose entries each have a label such as a date. Each step holds text and blocks, the way a table
cell does, so a step can have a code sample, a picture or a list under its text.

```ts
import {StepsNode, StepsStyles} from "./dist/addons/scriviamo.steps.js"

let steps = new StepsNode(3)
steps.cells[0].append(new RichText("Install the package."))
editor.addNode(steps)

let history = new StepsNode(2)
history.stepsStyle = StepsStyles.timeline
history.labels = ["2024", "March 2026"]
```

| Property | Meaning |
|---|---|
| `stepsStyle` | `StepsStyles.numbered` (the default) or `StepsStyles.timeline` |
| `labels` | Each entry's label, shown on a timeline |
| `count` | How many steps there are |
| `cells` | Each step's content: its text and, in `nodes`, its blocks |

`insertRow(at)` adds an empty step, `removeRow(index)` removes one with its label and blocks, and
`moveStep(index, by)` moves one up (negative) or down. The toolbar offers the same, and switches
between steps and a timeline. Tab moves to the next step, and adds one after the last.

Steps export as `<ol class="steps">` and timelines as `<ol class="timeline">`, each step an
`<li class="step">`, a timeline's label a `<p class="step-label">` inside it; both import back.
Markdown is a numbered list for steps, and a bulleted list with each label in bold for a
timeline, with each step's blocks indented under it.

