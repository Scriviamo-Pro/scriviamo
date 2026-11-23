# Scriviamo

Scriviamo is a block-based rich text editor for the web. Its name is Italian for "we write"
and "let's write", for an editor several people can write in at once.

A document is an ordered list of blocks, called *nodes*: paragraphs, headings, lists, tables,
images, and any node types you add. Each node edits its own content. The editor saves documents as JSON and also reads and
writes HTML, Markdown and plain text.

Scriviamo is written in TypeScript and ships as ES modules. A free base package holds the
editor and the common node types. Add-ons add more node types and features, such as forms,
media and real-time collaboration.

Its interface uses Bootstrap 5's styles and Bootstrap Icons, which a page loads alongside it;
see [Getting started](getting-started.md#requirements).

## Contents

| Page | What it covers |
|---|---|
| [Getting started](getting-started.md) | Building the package, loading it in a page, and creating an editor |
| [Packages and add-ons](packages.md) | What the base package and each add-on contain, and how they load |
| [React and Next.js](react.md) | The React component, saving documents, and server rendering with Next.js |
| [Vue and Nuxt](vue.md) | The Vue component, `v-model`, saving documents, and server rendering with Nuxt |
| [Angular](angular.md) | The Angular component, forms, saving documents, and server rendering |
| [The web component](web-component.md) | `<scriviamo-editor>`, for any framework or none, and in forms |
| [The editor](editor.md) | Options, properties, working with nodes and the selection, commands, and events |
| [Node types](node-types.md) | The built-in node types, their JSON names, and the properties every node has |
| [Text and formatting](text-and-formatting.md) | Rich text, text styles, formatting commands, and font choices |
| [The toolbar](toolbar.md) | The built-in tools, adding your own, and saving each user's arrangement |
| [Undo, search, statistics and autosave](undo-search-statistics.md) | Undo and redo, find and replace, word counts, the status bar, and autosave |
| [Comments and suggestions](comments-and-suggestions.md) | Comment threads, and suggestions such as @-mentions |
| [Math and diagrams](math-and-diagrams.md) | Formulas in LaTeX, drawn with KaTeX, as blocks or inside text, and diagrams in Mermaid |
| [Steps, timelines and tabs](steps-and-tabs.md) | Numbered steps, timelines and tabbed panels that hold blocks |
| [Files, galleries, maps and embeds](media-and-embeds.md) | File attachments, image galleries, maps, and the sites embeds play from |
| [Dates and statuses in text](dates-and-statuses.md) | Date chips in the reader's language, and status pills from your own set |
| [Outline, focus mode, readability and dictation](writing-aids.md) | Aids for writing: a heading tree, focus mode, readability in the status bar, and voice typing |
| [Keyboard shortcuts](keyboard-shortcuts.md) | Every key the editor responds to, by block type, on macOS and Windows |
| [Accessibility](accessibility.md) | How the editor and its documents meet WCAG 2.2, the audit, and the accessibility checker |
| [Pickers, menus and dialogs](pickers.md) | Popups that open from the toolbar or a node, the ready-made pickers, and dialogs |
| [Writing node types](custom-node-types.md) | Adding your own node types and editor extensions |
| [Schema validation](schema.md) | Which node types and content documents may have, checked in the browser and on the server |
| [Server rendering](server-rendering.md) | Turning saved documents into HTML, Markdown or text on a server, with no browser |
| [Import and export](import-export.md) | JSON, HTML, Markdown and plain text; uploading files; exporters, stylesheets and theme colors |
| [Node settings](node-settings.md) | How node types describe their settings, and adding your own |
| [Localization](localization.md) | Interface text, the built-in languages, locale packs, and add-on strings |
