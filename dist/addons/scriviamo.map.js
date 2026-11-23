// addons/map/mapnode.ts
import { Editor, InspectorDefaults, InspectorEditors, InspectorItem, Node, Strings, ToolbarItem, Utilities } from "scriviamo";
var MapStrings = {
  TextMapCaption: "Map",
  TextMapToolbarTooltip: "Add a Map",
  TextFindPlaceCaption: "Find a Place\u2026",
  TextFindPlacePrompt: "Address, place or coordinates",
  TextPlaceNotFoundMessage: "That place couldn't be found.",
  TextMapLabelCaption: "Pin Label",
  TextMapLatitudeCaption: "Latitude",
  TextMapLongitudeCaption: "Longitude",
  TextMapZoomCaption: "Zoom",
  TextMapHeightCaption: "Height",
  TextZoomInCaption: "Zoom In",
  TextZoomOutCaption: "Zoom Out",
  TextOpenMapCaption: "Open in OpenStreetMap",
  TextShowPinCaption: "Show Pin",
  TextMapKeysHint: "Arrow keys move the map, + and \u2212 zoom"
};
Strings.register(MapStrings);
var TileSize = 256;
var ExportWidth = 1024;
var MapNode = class _MapNode extends Node {
  /** The tile pictures' address, with {z}, {x} and {y}. Follow the tile service's usage policy. */
  static tileURL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  /** The credit the tile service asks for, as HTML. */
  static attribution = '\xA9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  /**
   * Finds places for "Find a Place". By default it asks OpenStreetMap's Nominatim, which allows
   * light use; set your own for heavier use or another service.
   */
  static geocoder = async (query) => {
    let response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, { headers: { Accept: "application/json" } });
    if (!response.ok)
      return null;
    let results = await response.json();
    if (!Array.isArray(results) || results.length == 0)
      return null;
    let first = results[0];
    return { latitude: Number(first.lat), longitude: Number(first.lon), label: String(first.name || first.display_name || "").split(",")[0] };
  };
  static exportStyles(sheet, _editor) {
    sheet.addRule(".map", "position: relative; overflow: hidden; max-width: 100%; border-radius: 8px; background: #e5e3df");
    sheet.addRule(".map > img", "position: absolute; width: 256px; height: 256px; max-width: none");
    sheet.addRule(".map .map-pin", "position: absolute; left: 50%; top: 50%; transform: translate(-50%, -100%); font-size: 32px; line-height: 1; color: #d63384");
    sheet.addRule(".map .map-label", "position: absolute; left: 50%; top: calc(50% + 4px); transform: translateX(-50%); padding: 2px 8px; border-radius: 4px; background: #fff; color: #111; font-size: 13px; white-space: nowrap");
    sheet.addRule(".map .map-attribution", "position: absolute; right: 0; bottom: 0; padding: 1px 6px; background: rgba(255,255,255,0.8); color: #333; font-size: 11px");
  }
  static identifier = "map";
  static caption = "Map";
  static captionString = "TextMapCaption";
  static icon = "bi bi-geo-alt";
  static keywords = "map location address place pin directions openstreetmap";
  static importElement(element, importer) {
    if (!/^(DIV|FIGURE)$/.test(element.tagName) || !element.classList.contains("map") || element.dataset.latitude === void 0)
      return void 0;
    let node = new _MapNode();
    node.latitude = _MapNode.#clampLatitude(Number(element.dataset.latitude) || 0);
    node.longitude = _MapNode.#wrapLongitude(Number(element.dataset.longitude) || 0);
    node.zoom = Utilities.clamp(Utilities.integer(element.dataset.zoom, 13), 1, 19);
    node.label = element.dataset.label || "";
    node.showPin = element.dataset.pin != "false";
    let height = parseFloat(element.style.height || "0");
    if (height > 0)
      node.height = height;
    return importer.attach(node);
  }
  latitude = 51.5074;
  longitude = -0.1278;
  zoom = 13;
  /** The text beside the pin, such as the place's name. */
  label = "";
  showPin = true;
  get canResize() {
    return false;
  }
  get defaultHeight() {
    return 320;
  }
  get mapHeight() {
    return this.height > 0 ? this.height : this.defaultHeight;
  }
  static #clampLatitude(value) {
    return Utilities.clamp(value, -85.05112878, 85.05112878);
  }
  static #wrapLongitude(value) {
    return ((value + 180) % 360 + 360) % 360 - 180;
  }
  /** A point's position on the whole world map at a zoom, in pixels. */
  static project(latitude, longitude, zoom) {
    let scale = TileSize * Math.pow(2, zoom);
    let radians = _MapNode.#clampLatitude(latitude) * Math.PI / 180;
    return {
      x: (longitude + 180) / 360 * scale,
      y: (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2 * scale
    };
  }
  /** The point at a position on the whole world map at a zoom. */
  static unproject(x, y, zoom) {
    let scale = TileSize * Math.pow(2, zoom);
    let n = Math.PI - 2 * Math.PI * y / scale;
    return { latitude: _MapNode.#clampLatitude(180 / Math.PI * Math.atan(Math.sinh(n))), longitude: _MapNode.#wrapLongitude(x / scale * 360 - 180) };
  }
  /** The tiles covering a width and height around the center: each tile's address and its offset from the center. */
  tiles(width, height, centerX, centerY) {
    let center = _MapNode.project(this.latitude, this.longitude, this.zoom);
    let cx = centerX ?? center.x;
    let cy = centerY ?? center.y;
    let count = Math.pow(2, this.zoom);
    let result = [];
    let firstX = Math.floor((cx - width / 2) / TileSize);
    let lastX = Math.floor((cx + width / 2) / TileSize);
    let firstY = Math.max(0, Math.floor((cy - height / 2) / TileSize));
    let lastY = Math.min(count - 1, Math.floor((cy + height / 2) / TileSize));
    for (let ty = firstY; ty <= lastY; ty++) {
      for (let tx = firstX; tx <= lastX; tx++) {
        let wrapped = (tx % count + count) % count;
        let url = _MapNode.tileURL.replace("{z}", String(this.zoom)).replace("{x}", String(wrapped)).replace("{y}", String(ty));
        result.push({ url, left: Math.round(tx * TileSize - cx), top: Math.round(ty * TileSize - cy) });
      }
    }
    return result;
  }
  /** The place on openstreetmap.org. */
  get mapURL() {
    let lat = this.latitude.toFixed(5);
    let lon = this.longitude.toFixed(5);
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${this.zoom}/${lat}/${lon}`;
  }
  /** Moves the map to a place; coordinates such as "48.8584, 2.2945" are read without a search. */
  async findPlace(query) {
    let text = query.trim();
    let coordinates = text.match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
    let place = null;
    if (coordinates) {
      place = { latitude: Number(coordinates[1]), longitude: Number(coordinates[2]), label: "" };
    } else if (text.length > 0) {
      try {
        place = await _MapNode.geocoder(text);
      } catch {
        place = null;
      }
    }
    if (!place || !isFinite(place.latitude) || !isFinite(place.longitude))
      return false;
    this.willChange();
    this.latitude = _MapNode.#clampLatitude(place.latitude);
    this.longitude = _MapNode.#wrapLongitude(place.longitude);
    if (place.label.length > 0)
      this.label = place.label;
    if (this.zoom < 13)
      this.zoom = 15;
    this.refresh();
    this.changed();
    return true;
  }
  async promptForPlace() {
    if (!this.editor)
      return;
    let values = await this.editor.prompt(this.strings.TextMapCaption, [{ name: "place", label: this.strings.TextFindPlacePrompt, value: this.label, type: "text", placeholder: "" }]);
    if (!values || String(values.place).trim().length == 0)
      return;
    if (!await this.findPlace(String(values.place)) && this.editor)
      this.editor.showMessage(this.strings.TextPlaceNotFoundMessage, "warning");
  }
  setZoom(zoom) {
    let value = Utilities.clamp(Math.round(zoom), 1, 19);
    if (value == this.zoom)
      return;
    this.willChange();
    this.zoom = value;
    this.refresh();
    this.changed();
  }
  build(body) {
    let frame = Utilities.element("div", "scv-map", { contenteditable: "false" });
    frame.style.height = `${this.mapHeight}px`;
    let layer = Utilities.element("div", "scv-map-tiles");
    frame.append(layer);
    let center = _MapNode.project(this.latitude, this.longitude, this.zoom);
    let offset = { x: 0, y: 0 };
    let draw = () => {
      layer.replaceChildren();
      let width = Math.max(frame.clientWidth, 320);
      for (let tile of this.tiles(width + TileSize, this.mapHeight + TileSize, center.x - offset.x, center.y - offset.y)) {
        let image = Utilities.element("img", "", { src: tile.url, alt: "", draggable: "false" });
        image.style.left = `calc(50% + ${tile.left}px)`;
        image.style.top = `calc(50% + ${tile.top}px)`;
        layer.append(image);
      }
    };
    if (this.showPin) {
      let pin = Utilities.element("i", "bi bi-geo-alt-fill scv-map-pin", { "aria-hidden": "true" });
      frame.append(pin);
      if (this.label.length > 0) {
        let label = Utilities.element("div", "scv-map-label");
        label.textContent = this.label;
        frame.append(label);
      }
    }
    let attribution = Utilities.element("div", "scv-map-attribution");
    attribution.innerHTML = _MapNode.attribution;
    frame.append(attribution);
    let controls = Utilities.element("div", "scv-map-controls");
    controls.append(this.#button("bi-plus-lg", this.strings.TextZoomInCaption, () => this.setZoom(this.zoom + 1)), this.#button("bi-dash-lg", this.strings.TextZoomOutCaption, () => this.setZoom(this.zoom - 1)));
    frame.append(controls);
    frame.tabIndex = this.editor && this.editor.keyboardControls ? 0 : -1;
    frame.dataset.scvKeyboard = "";
    frame.setAttribute("role", "group");
    frame.setAttribute("aria-label", `${this.typeName}. ${this.strings.TextMapKeysHint}`);
    frame.addEventListener("keydown", (event) => {
      if (event.target !== frame || !this.editor || this.editor.readOnly || this.locked || event.metaKey || event.ctrlKey || event.altKey)
        return;
      let step = event.shiftKey ? 256 : 64;
      let moves = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
      if (event.key in moves) {
        let [dx, dy] = moves[event.key];
        let point = _MapNode.unproject(center.x + dx, center.y + dy, this.zoom);
        this.willChange();
        this.latitude = Number(_MapNode.#clampLatitude(point.latitude).toFixed(6));
        this.longitude = Number(point.longitude.toFixed(6));
        this.refresh();
        this.changed();
      } else if (event.key == "+" || event.key == "=" || event.code == "NumpadAdd") {
        this.setZoom(this.zoom + 1);
      } else if (event.key == "-" || event.key == "_" || event.key == "\u2212" || event.code == "NumpadSubtract") {
        this.setZoom(this.zoom - 1);
      } else {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      let again = this.element ? this.element.querySelector(".scv-map") : null;
      again?.focus();
    });
    frame.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button, a") || !this.editor || this.editor.readOnly || this.locked)
        return;
      event.preventDefault();
      frame.setPointerCapture(event.pointerId);
      frame.classList.add("scv-map-dragging");
      let start = { x: event.clientX, y: event.clientY };
      let move = (moveEvent) => {
        offset = { x: moveEvent.clientX - start.x, y: moveEvent.clientY - start.y };
        layer.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
      };
      let up = () => {
        frame.removeEventListener("pointermove", move);
        frame.removeEventListener("pointerup", up);
        frame.removeEventListener("pointercancel", up);
        frame.classList.remove("scv-map-dragging");
        if (Math.abs(offset.x) < 2 && Math.abs(offset.y) < 2) {
          offset = { x: 0, y: 0 };
          layer.style.transform = "";
          return;
        }
        let point = _MapNode.unproject(center.x - offset.x, center.y - offset.y, this.zoom);
        this.willChange();
        this.latitude = point.latitude;
        this.longitude = point.longitude;
        this.refresh();
        this.changed();
      };
      frame.addEventListener("pointermove", move);
      frame.addEventListener("pointerup", up);
      frame.addEventListener("pointercancel", up);
    });
    body.append(frame);
    draw();
    requestAnimationFrame(() => {
      if (frame.isConnected)
        draw();
    });
  }
  #button(icon, label, action) {
    let button = Utilities.element("button", "scv-map-button", { type: "button", title: label, "aria-label": label });
    button.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i>`;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.editor && !this.editor.readOnly)
        action();
    });
    return button;
  }
  inspectorSections() {
    let strings = this.strings;
    let label = InspectorItem.bound("maplabel", strings.TextMapLabelCaption, InspectorEditors.text, (target) => target.label, (target, value) => target.label = String(value || ""));
    label.updatesLive = false;
    let pin = InspectorItem.bound("mappin", strings.TextShowPinCaption, InspectorEditors.toggle, (target) => target.showPin, (target, value) => target.showPin = !!value);
    let latitude = InspectorItem.number("maplatitude", strings.TextMapLatitudeCaption, (target) => Number(target.latitude.toFixed(6)), (target, value) => target.latitude = _MapNode.#clampLatitude(value), -85, 85, 1e-4);
    let longitude = InspectorItem.number("maplongitude", strings.TextMapLongitudeCaption, (target) => Number(target.longitude.toFixed(6)), (target, value) => target.longitude = _MapNode.#wrapLongitude(value), -180, 180, 1e-4);
    let zoom = InspectorItem.number("mapzoom", strings.TextMapZoomCaption, (target) => target.zoom, (target, value) => target.zoom = Utilities.clamp(Math.round(value), 1, 19), 1, 19, 1);
    zoom.setDefaultValue(13);
    let height = InspectorItem.number("mapheight", strings.TextMapHeightCaption, (target) => target.mapHeight, (target, value) => target.height = Utilities.clamp(Math.round(value), 120, 1200), 120, 1200, 10);
    height.setDefaultValue(320);
    return [InspectorDefaults.section("map", strings.TextMapCaption, [label, pin, latitude, longitude, zoom, height])].concat(InspectorDefaults.node(this, { appearance: false, backgroundImage: false }));
  }
  actions() {
    let find = new ToolbarItem("findplace", this.strings.TextFindPlaceCaption, "bi bi-search");
    find.alwaysShowCaption = true;
    let open = new ToolbarItem("openmap", this.strings.TextOpenMapCaption, "bi bi-box-arrow-up-right");
    return [find, open];
  }
  performAction(item, _menuItem) {
    if (item.identifier == "findplace") {
      this.promptForPlace();
      return true;
    }
    if (item.identifier == "openmap") {
      window.open(this.mapURL, "_blank", "noopener");
      return true;
    }
    return false;
  }
  toJSON() {
    let result = super.toJSON();
    result["latitude"] = Number(this.latitude.toFixed(6));
    result["longitude"] = Number(this.longitude.toFixed(6));
    result["zoom"] = this.zoom;
    if (this.label.length > 0)
      result["label"] = this.label;
    if (!this.showPin)
      result["showPin"] = false;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.latitude = _MapNode.#clampLatitude(Number(data.latitude) || 0);
    this.longitude = _MapNode.#wrapLongitude(Number(data.longitude) || 0);
    this.zoom = Utilities.clamp(Utilities.integer(data.zoom, 13), 1, 19);
    this.label = Utilities.string(data.label);
    this.showPin = Utilities.boolean(data.showPin, true);
    return true;
  }
  /** The map as tile pictures around its center, so it shows without a script and prints. */
  toHTML() {
    let tiles = this.tiles(ExportWidth, this.mapHeight).map((tile) => `<img src="${Utilities.escapeAttribute(tile.url)}" alt="" style="left:calc(50% + ${tile.left}px);top:calc(50% + ${tile.top}px)">`).join("");
    let pin = this.showPin ? `<span class="map-pin" aria-hidden="true">\u{1F4CD}</span>${this.label.length > 0 ? `<span class="map-label">${Utilities.escapeText(this.label)}</span>` : ""}` : "";
    let description = this.label.length > 0 ? this.label : `${this.latitude.toFixed(5)}, ${this.longitude.toFixed(5)}`;
    let data = `data-latitude="${this.latitude.toFixed(6)}" data-longitude="${this.longitude.toFixed(6)}" data-zoom="${this.zoom}"${this.label.length > 0 ? ` data-label="${Utilities.escapeAttribute(this.label)}"` : ""}${this.showPin ? "" : ' data-pin="false"'}`;
    return `<div class="map" role="img" aria-label="${Utilities.escapeAttribute(description)}" ${data} style="${this.htmlBackgroundCSS()}height:${this.mapHeight}px">${tiles}${pin}<a class="map-attribution" href="${Utilities.escapeAttribute(this.mapURL)}">${_MapNode.attribution.replace(/<[^>]+>/g, "")}</a></div>`;
  }
  toMarkdown() {
    let text = this.label.length > 0 ? this.label : `${this.latitude.toFixed(5)}, ${this.longitude.toFixed(5)}`;
    return `[${text.replace(/([\[\]\\])/g, "\\$1")}](${this.mapURL})`;
  }
  toPlainText() {
    let coordinates = `${this.latitude.toFixed(5)}, ${this.longitude.toFixed(5)}`;
    return this.label.length > 0 ? `${this.label} (${coordinates})` : coordinates;
  }
};
Editor.registerNodeType(MapNode, 112);
export {
  MapNode
};
