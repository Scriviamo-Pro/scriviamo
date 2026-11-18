// Maps: tiles, coordinates, places, and import and export.
"use strict"
{
  const section = "Map"

  test(section, "a map round-trips through HTML and JSON", t => {
    let node = new PE.MapNode()
    node.latitude = 48.8584
    node.longitude = 2.2945
    node.zoom = 16
    node.label = "Eiffel Tower"
    node.height = 400
    let html = node.toHTML()
    t.assert(html.includes("tile.openstreetmap.org/16/") && html.includes("OpenStreetMap"), "The map's HTML has no tiles or credit.")
    let editor = t.editor()
    editor.fromHTML(html)
    let back = editor.nodeAt(0)
    t.assert(back instanceof PE.MapNode, "The map didn't import as one.")
    t.equal(back && [back.latitude.toFixed(4), back.longitude.toFixed(4), back.zoom, back.label, back.height].join("|"), "48.8584|2.2945|16|Eiffel Tower|400", "The imported map")
    let copy = t.editor().nodeFromJSON(JSON.parse(JSON.stringify(node.toJSON())))
    t.equal(copy.toHTML(), html, "The map after JSON")
  })

  test(section, "positions convert to the world map and back", t => {
    let point = PE.MapNode.project(40.7128, -74.006, 12)
    let back = PE.MapNode.unproject(point.x, point.y, 12)
    t.assert(Math.abs(back.latitude - 40.7128) < 1e-6 && Math.abs(back.longitude + 74.006) < 1e-6, "A point didn't come back where it started.")
    let node = new PE.MapNode()
    node.zoom = 1
    let tiles = node.tiles(1024, 320)
    t.assert(tiles.every(tile => /\/1\/[01]\/[01]\.png$/.test(tile.url)), "Tiles past the edge of the world weren't wrapped or left out.")
  })

  test(section, "coordinates are found without a search", async t => {
    let editor = t.editor()
    let node = new PE.MapNode()
    editor.addNode(node)
    let found = await node.findPlace("35.6586, 139.7454")
    t.assert(found && Math.abs(node.latitude - 35.6586) < 1e-6 && Math.abs(node.longitude - 139.7454) < 1e-6, "Typed coordinates didn't move the map.")
    let saved = PE.MapNode.geocoder
    PE.MapNode.geocoder = async query => query == "Sydney Opera House" ? {latitude: -33.8568, longitude: 151.2153, label: "Sydney Opera House"} : null
    try {
      t.assert(await node.findPlace("Sydney Opera House"), "A place the geocoder knows wasn't found.")
      t.equal(node.label, "Sydney Opera House", "The found place's label")
      t.assert(!(await node.findPlace("Nowhere at all")), "A place the geocoder doesn't know was reported found.")
    } finally {
      PE.MapNode.geocoder = saved
    }
  })
}
