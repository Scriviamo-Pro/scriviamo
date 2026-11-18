# Files, galleries, maps and embeds

## File attachments

The `attachments` add-on adds `AttachmentNode`, JSON type `"attachment"`: a file shown as a card
with an icon for its kind, its name, its size and a download button.

Files people drop or paste that no other block takes become attachments, so pictures still
become images and videos still become videos. Like other files, an attachment is uploaded
through the editor's [file uploader](import-export.md#files-and-uploads), as the kind `"file"`,
while the card shows its progress; without an uploader, the file is kept in the document as a
`data:` address.

| Property | Meaning |
|---|---|
| `fileName` | The name shown, and the name it downloads as |
| `fileSize` | Its size in bytes, or 0 when unknown |
| `mimeType` | Its type, such as `"application/pdf"` |
| `resourceURL`, `resourceData` | Its address, or the file itself as a `data:` address |

`loadFile(file)` attaches a file, `download()` saves it, and `AttachmentNode.formatSize(bytes)`
gives a size such as "1.2 MB". HTML is a `<div class="attachment">` holding a download link,
which imports back; Markdown is a link with the size after it.

## Image galleries

The `gallery` add-on adds `GalleryNode`, JSON type `"gallery"`: pictures as a grid, or as a
carousel that shows one at a time with arrows and dots. Each picture has a caption, typed under
it, and a description for screen readers, set in the inspector. Clicking a picture opens it full
size, with the arrow keys moving through the rest.

| Property or method | Meaning |
|---|---|
| `images` | The pictures, each a `GalleryImage` with `source`, `caption` and `alt` |
| `layout` | `GalleryLayouts.grid` (the default) or `GalleryLayouts.carousel` |
| `columns` | The grid's columns, from 1 to 6; 3 by default |
| `addFiles(files)` | Adds pictures from files, uploaded through the file uploader as `"image"` |
| `addImage(image)`, `removeImage(index)`, `moveImage(index, by)` | Change the pictures |
| `openViewer(index)` | Shows a picture full size |

HTML is a `<div class="gallery">` of `<figure>` elements, a carousel's with `gallery-carousel`,
which exported pages show as a row to scroll through; it imports back. Markdown is the pictures,
each with its caption as its title.

## Maps

The `map` add-on adds `MapNode`, JSON type `"map"`: a map of a place, with a pin and its label.
It's drawn from map tiles placed as pictures, OpenStreetMap's by default, so it needs no script
or service key, and looks the same in the editor, in exported HTML and in print.

In the editor, drag the map to move it, use its buttons to zoom, or use **Find a Place** to go
to an address, a place's name, or coordinates such as `48.8584, 2.2945`.

| Property | Meaning |
|---|---|
| `latitude`, `longitude` | The center, where the pin is |
| `zoom` | From 1, the whole world, to 19 |
| `label` | The text beside the pin |
| `showPin` | Whether the pin shows |
| `height` | The map's height in pixels; 320 by default |

`findPlace(text)` moves the map to a place and resolves whether it found one.

Three settings, for every map, choose the services it uses:

| Setting | Meaning |
|---|---|
| `MapNode.tileURL` | The tiles' address, with `{z}`, `{x}` and `{y}` |
| `MapNode.attribution` | The credit the tile service asks for, as HTML |
| `MapNode.geocoder` | A function that turns a search into `{latitude, longitude, label}`, or null |

The defaults use OpenStreetMap's tiles and its Nominatim search, which allow light use under
their usage policies. For an application with many users, set your own tile service, or one you
pay for, and your own geocoder:

```ts
MapNode.tileURL = "https://tiles.example.com/{z}/{x}/{y}.png"
MapNode.attribution = '© <a href="https://example.com">Example Maps</a>'
MapNode.geocoder = async query => {
  let response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
  return response.ok ? response.json() : null
}
```

HTML is a `<div class="map">` with the tiles, the pin and the credit, and the place in its
`data-` attributes, which imports back; Markdown is a link to the place on openstreetmap.org.

