# Framework wrappers

Components that put a Scriviamo editor into an app built with a framework.

| Folder | Package | For |
|---|---|---|
| [react/](react/README.md) | `scriviamo-react` | React 18 and later |
| [vue/](vue/README.md) | `scriviamo-vue` | Vue 3.3 and later |
| [angular/](angular/README.md) | `scriviamo-angular` | Angular 17 and later |

Every wrapper offers the same things:

- an editor component, with the editor's settings as properties, and the document as a value in
  JSON, HTML or Markdown that updates as people edit;
- access to the `Editor` itself, for everything the components don't cover.

Each framework's README shows how to use its components. Like Scriviamo itself, the components need Bootstrap 5's CSS
and Bootstrap Icons on the page.

## Settings

Every editor component takes these:

| Setting | Meaning |
|---|---|
| value | The document, in `format`. Changing it from outside replaces the document; the editor's own changes come back as the value, and passing them back in doesn't reload anything. |
| `format` | `"json"` (the default, which keeps everything), `"html"` or `"markdown"` |
| `readOnly`, `toolbarVisible`, `toolbarDisplayMode`, `showContextualToolbars`, `markdownShortcuts`, `allowAnnotations`, `adaptiveHeight`, `fontName`, `fontSize` | The editor's settings of the same names |
| `hoverInsertion` | The add and drag buttons beside the block under the pointer |
| `locale` | A locale pack, or an object of localized strings |
| `editorClass` | Extra classes for the editor element |
| `changeDelay` | Milliseconds to wait after typing stops before reporting a change; 0, the default, reports every change |
| `events` | Editor events to listen to, by name, such as `{linkPressed: event => …}` |

A setting that isn't given keeps the editor's default.

## Add-ons

Add-ons register their node types when they are imported, so import the add-on modules you use,
from Scriviamo's `dist/addons/`, before the first editor is created, such as at the top of your
app's entry module.

Load Scriviamo's stylesheet, `dist/scriviamo.css`, and those of the add-ons you use, like any
other CSS. See [Getting started](../docs/getting-started.md) for Bootstrap and the icons the editor
uses.

## Layout

```
shared/editorbinding.ts   keeps an editor in step with a component's settings; all three wrappers use it
sync-shared.mjs           copies the binding into each package before it builds, so each builds on its own
tsconfig.base.json        compiler settings the packages share
react/, vue/, angular/    one package each
smoke/                    browser smoke tests for the built packages
```

Edit `shared/editorbinding.ts`, never the copies in the packages' `src/` folders, which are
generated and not committed.

## Building

Build Scriviamo first (`npm run build` in `src/`), since the packages type-check against its
declarations in `dist/types/`. Then, in each package's folder:

```bash
npm install
npm run build
```

`npm run check` type-checks without building. The Angular package builds with `ng-packagr`,
which needs Node.js 20.19 or later.

Scriviamo isn't published to npm yet, so each package's `.npmrc` stops npm from trying to install
it as a peer dependency.

## Smoke tests

`smoke/` has a page for each framework that shows a live editor from its components, and checks
them: loading a value, reporting an edit, ignoring a value passed back, replacing the document,
read-only, and tearing down. The Angular test also checks two-way binding and Angular forms.
```bash
node smoke/build.mjs
```

Then serve the repository root, open `/wrappers/smoke/react.html`, `vue.html` or `angular.html`,
and press "Run the smoke test", or run `await runSmoke()` in the browser console.
