# Math and diagrams

## Math

The `math` add-on adds formulas, written in LaTeX and drawn with [KaTeX](https://katex.org/).

```ts
import "scriviamo/dist/addons/scriviamo.math.js"     // and scriviamo.math.css
```

People insert a formula from the Insert menu or the "/" chooser, or by typing `$$` at the start
of a paragraph. The block shows the formula; while it is selected or being edited, its LaTeX
source shows underneath, and the formula redraws as it changes. The inspector edits the source
too.

```ts
import {MathNode} from "scriviamo/dist/addons/scriviamo.math.js"

let formula = new MathNode()
formula.latex = "e^{i\\pi} + 1 = 0"
editor.addNode(formula)
```

### Loading KaTeX

KaTeX is loaded the first time a formula is shown, from jsDelivr, along with its stylesheet. To
load it from somewhere else, or to bundle it with your application, such as when your content
security policy doesn't allow the CDN:

```ts
import katex from "katex"
import "katex/dist/katex.min.css"
import {MathRenderer} from "scriviamo/dist/addons/scriviamo.math.js"

MathRenderer.use(katex)
```

Or point `MathRenderer.moduleURL` and `MathRenderer.stylesheetURL` at your own copies.
`MathRenderer.load()` resolves with KaTeX once it has loaded.

### Import and export

| Format | Formulas are |
|---|---|
| JSON | `{"type": "math", "content": …}`, the source as the node's text |
| HTML | `<div class="math-display" data-latex="…">` holding MathML, which every current browser draws without KaTeX. Before KaTeX has loaded, the source between `\[` and `\]`, which MathJax and KaTeX's auto-render read. |
| Markdown | A `$$` block, as GitHub, Obsidian and Pandoc write them |
| Plain text | The source |

Reading HTML, a formula comes from `<pre><code class="language-math">` (also `latex` and `tex`),
an element with class `math-display` and `data-latex`, or `<math display="block">` with a TeX
annotation, as KaTeX and MathJax write. Reading Markdown, `$$` blocks and `$$ … $$` on one line
are formulas.

Without the add-on, a `$$` block stays a code block in the `math` language, so nothing is lost.

### Formulas in a line of text

Formulas can also sit inside a paragraph, such as $\pi r^2$. Type `$x^2$`, and the closing `$`
turns it into a formula, as its own undo step, so Undo puts the dollar signs back. Prices stay
text: the opening `$` must be followed by something other than a space, and the closing one
must follow something other than a space and can't be followed by a digit, so `$5 and $10` is
left alone. Markdown shortcuts turn this off with the rest (`markdownShortcuts: false`).

The Insert Inline Math tool, or Ctrl+Shift+E (⌘⇧E on a Mac), starts a formula at the caret, or
turns the selected text into one. Both show a box for the LaTeX source with a preview; Enter
finishes, Escape cancels, and leaving it empty removes the formula. Clicking a formula opens the
same box to edit it, as does the key with the caret beside one.

In the text a formula is one character: the caret steps over it, and Backspace or Delete removes
it whole. It is a tag in the text, marked with the `math` provider, whose text is its LaTeX
source, so search, word counts and plain text see the source. Formulas read left to right, in
right-to-left text too.

```ts
import {InlineMath} from "scriviamo/dist/addons/scriviamo.math.js"

let host = editor.activeHost
InlineMath.replace(editor, host, 4, 4, "a^2 + b^2")    // a formula at offset 4, as one undo step
InlineMath.formulas(host)                              // [{start, end, id, latex, host}]
```

| Format | Inline formulas are |
|---|---|
| JSON | The tag, in the text's styles |
| HTML | `<span class="math-inline" data-latex="…">` holding MathML, or the source between `\(` and `\)` before KaTeX has loaded |
| Markdown | `$…$` |
| Plain text | The source |

Reading HTML, an inline formula comes from an element with class `math-inline` and `data-latex`,
or `<math>` that isn't `display="block"` with a TeX annotation.

## Diagrams

The `diagrams` add-on adds diagrams written in [Mermaid](https://mermaid.js.org/)'s language:
flowcharts, sequence diagrams, class and state diagrams, Gantt charts, pie charts and more.

```ts
import "scriviamo/dist/addons/scriviamo.diagrams.js"     // and scriviamo.diagrams.css
```

People insert one from the Insert menu or the "/" chooser, or by typing ```` ```mermaid ```` at the
start of a paragraph. Like a formula, the block shows the diagram, and its source underneath
while it is selected or being edited; the diagram redraws a moment after the source stops
changing.

Diagrams follow the page's theme. Inside an element with `data-bs-theme="dark"` they use
Mermaid's dark theme, and when `data-bs-theme` changes on the editor or anything around it, as
when the page switches between light and dark, they're redrawn in the new theme.
`DiagramRenderer.themes` names the Mermaid theme for each, `{light: "default", dark: "dark"}`;
a `theme` in `DiagramRenderer.settings` takes precedence over both.

```ts
import {DiagramNode} from "scriviamo/dist/addons/scriviamo.diagrams.js"

let diagram = new DiagramNode()
diagram.source = "graph LR\n  Draft --> Review --> Publish"
editor.addNode(diagram)
```

### Loading Mermaid

Mermaid is loaded the first time a diagram is shown, from jsDelivr. To bundle it with your
application instead:

```ts
import mermaid from "mermaid"
import {DiagramRenderer} from "scriviamo/dist/addons/scriviamo.diagrams.js"

DiagramRenderer.use(mermaid)
```

Or point `DiagramRenderer.moduleURL` at your own copy. `DiagramRenderer.settings` is passed to
`mermaid.initialize`; its `securityLevel` is `"strict"`, which keeps scripts and click handlers
out of diagrams.

### Import and export

| Format | Diagrams are |
|---|---|
| JSON | `{"type": "diagram", "content": …}`, the source as the node's text |
| HTML | `<figure class="diagram" data-mermaid="…">` holding the drawn SVG. A diagram that hasn't been drawn yet, such as one exported before Mermaid loaded, is `<pre class="mermaid">`, which a page that loads Mermaid draws. |
| Markdown | A ```` ```mermaid ```` fence, which GitHub, GitLab and many other sites draw |
| Plain text | The source |

Reading HTML, a diagram comes from `<pre><code class="language-mermaid">`, `<pre class="mermaid">`
or an element with `data-mermaid`. Without the add-on, a mermaid fence stays a code block in the
`mermaid` language.

`node.redraw()` draws a diagram now and resolves once it is shown, and `node.svg` is its drawing,
for exporting straight after loading a document.
