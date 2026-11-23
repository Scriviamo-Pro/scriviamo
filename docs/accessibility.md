# Accessibility

Scriviamo aims to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA, both in
the editor itself and in the documents people write with it. This page says what is checked and
how. The conformance report at the end is a draft, from automated testing and review without
screen readers.

## In the editor

- **Keyboard.** Every toolbar tool, menu, dialog and the inspector work from the keyboard. Inside
  the document, the arrow keys move between blocks, Tab moves between table cells and columns,
  Shift-Command-P (Shift-Control-P) searches every command, and Escape closes menus and popovers.
  With the editor's `keyboardControls` option on, Tab reaches a selected picture's, video's or
  embed's resize handle, which resizes with the arrow keys, and a map, which moves with the arrow
  keys and zooms with + and −. Browsers don't say whether someone needs this, so an application
  turns it on from its own accessibility setting. Dialogs are native `<dialog>` elements, which keep
  focus inside until they close. [Keyboard shortcuts](keyboard-shortcuts.md) lists every key.
- **Names.** Toolbar buttons, menus, list boxes, checkboxes in checklists and forms, and radio
  buttons have names screen readers read. Code samples that scroll sideways can be reached with
  Tab and are named "Code".
- **Contrast.** The interface takes its colors from Bootstrap's theme variables, so it follows a
  site's light or dark mode and meets contrast in both of Bootstrap's own themes.
- **Motion.** Animations stop when the reader's system asks for reduced motion.
- **Right to left.** The editor lays out Arabic, Hebrew and other right-to-left text, and the
  interface mirrors with it.

## In documents


Exported HTML keeps the structure that assistive technology needs: real headings, lists and
tables, `alt` text on pictures, `<figure>` and `<figcaption>`, the document's language and
direction, MathML for formulas, and SVG with a name for charts and maps.


## How the editor is audited

Every test run checks the editor with axe-core against the WCAG 2.0, 2.1 and 2.2 A and AA rules: a
document holding every block type, with the inspector showing and the Insert menu open, in
Bootstrap's light and dark themes, and in Arabic, right to left. A violation fails the tests, so no
release goes out with one. axe asks for colors over pictures and gradients to be checked by eye.

## Conformance report (draft)

The format follows the WCAG section of the VPAT 2.5. "Supports" means the criterion was checked and
met; "Needs manual review" means it depends on a person checking with assistive technology.
Criteria that depend on the content people write, such as captions for their videos, are
"Supports" where the editor gives authors what they need to meet them.

| Criterion | Level | Conformance | Remarks |
|---|---|---|---|
| 1.1.1 Non-text content | A | Supports | Pictures, galleries and charts take descriptions; the checker finds missing ones; icons in the interface are hidden or named |
| 1.2.1–1.2.5 Time-based media | A, AA | Partially supports | Audio and video play with the browser's controls; the editor has no captions or transcripts of its own |
| 1.3.1 Info and relationships | A | Supports | Real headings, lists, tables and figures in the editor and in exports |
| 1.3.2 Meaningful sequence | A | Supports | Reading order is document order |
| 1.3.3 Sensory characteristics | A | Supports | |
| 1.3.4 Orientation | AA | Supports | |
| 1.3.5 Identify input purpose | AA | Needs manual review | Form blocks take `autocomplete` through their HTML |
| 1.4.1 Use of color | A | Supports | Tracked changes are underlined and struck through as well as colored |
| 1.4.2 Audio control | A | Supports | Nothing plays on its own |
| 1.4.3 Contrast (minimum) | AA | Supports | Checked with axe in both themes |
| 1.4.4 Resize text | AA | Supports | Text scales with the browser |
| 1.4.5 Images of text | AA | Supports | |
| 1.4.10 Reflow | AA | Needs manual review | |
| 1.4.11 Non-text contrast | AA | Needs manual review | |
| 1.4.12 Text spacing | AA | Needs manual review | |
| 1.4.13 Content on hover or focus | AA | Needs manual review | Tooltips and popovers |
| 2.1.1 Keyboard | A | Supports | The toolbar, menus, dialogs and inspector work from the keyboard; with `keyboardControls` on, pictures, video and embeds resize, and maps move and zoom, with keys, and the inspector's fields do the same either way; see [Keyboard shortcuts](keyboard-shortcuts.md) |
| 2.1.2 No keyboard trap | A | Supports | Escape leaves menus and popovers; dialogs close with Escape |
| 2.1.4 Character key shortcuts | A | Supports | Shortcuts use Command or Control |
| 2.2.1 Timing adjustable | A | Supports | |
| 2.2.2 Pause, stop, hide | A | Supports | |
| 2.3.1 Three flashes | A | Supports | |
| 2.4.1 Bypass blocks | A | Not applicable | The editor is part of a page |
| 2.4.2 Page titled | A | Not applicable | The application titles its page |
| 2.4.3 Focus order | A | Needs manual review | |
| 2.4.4 Link purpose | A | Supports | The checker finds unclear link text |
| 2.4.5 Multiple ways | AA | Not applicable | |
| 2.4.6 Headings and labels | AA | Supports | |
| 2.4.7 Focus visible | AA | Needs manual review | |
| 2.4.11 Focus not obscured | AA | Needs manual review | The sticky toolbar |
| 2.5.1 Pointer gestures | A | Supports | Dragging blocks has menu commands as an alternative |
| 2.5.2 Pointer cancellation | A | Supports | |
| 2.5.3 Label in name | A | Supports | |
| 2.5.4 Motion actuation | A | Supports | |
| 2.5.7 Dragging movements | AA | Supports | Blocks, outline sections, pictures and maps move by dragging; each also moves or resizes with keys, and with commands or inspector fields |
| 2.5.8 Target size | AA | Needs manual review | Small toolbar buttons are 30 pixels |
| 3.1.1 Language of page | A | Not applicable | The application sets its page's language |
| 3.1.2 Language of parts | AA | Supports | Exports carry the document's direction |
| 3.2.1–3.2.4 Predictable | A, AA | Supports | |
| 3.2.6 Consistent help | A | Not applicable | |
| 3.3.1–3.3.4 Input assistance | A, AA | Needs manual review | |
| 3.3.7 Redundant entry | A | Supports | |
| 3.3.8 Accessible authentication | AA | Not applicable | |
| 4.1.2 Name, role, value | A | Partially supports | Interface controls are named; editable blocks need testing with screen readers |
| 4.1.3 Status messages | AA | Needs manual review | Messages and the dictation bubble use live regions |
