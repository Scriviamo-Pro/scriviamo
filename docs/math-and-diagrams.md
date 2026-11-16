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

Formulas inside a line of text aren't supported yet.

## Diagrams

The `diagrams` add-on adds diagrams written in [Mermaid](https://mermaid.js.org/)'s language:
flowcharts, sequence diagrams, class and state diagrams, Gantt charts, pie charts and more.

```ts
import "scriviamo/dist/addons/scriviamo.diagrams.js"     // and scriviamo.diagrams.css
```

People insert one from the Insert menu or the "/" chooser, or by typing ```` ```mermaid ```` at the
start of a paragraph. Like a formula, the block shows the diagram, and its source underneath
while it is selected or being edited; the diagram redraws a moment after the source stops
changing. Diagrams use Mermaid's dark theme inside an element with `data-bs-theme="dark"`;
after switching themes, call `redraw()` on each diagram, or rebuild the document with
`editor.renderDocument()`.

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
