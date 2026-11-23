// addons/gallery/gallerynode.ts
import { Editor, InspectorDefaults, InspectorEditors, InspectorItem, MediaUI, Node, Strings, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities } from "scriviamo";
var GalleryStrings = {
  TextGalleryCaption: "Gallery",
  TextGalleryToolbarTooltip: "Add a Gallery",
  TextGalleryLayoutCaption: "Layout",
  TextGalleryGridCaption: "Grid",
  TextGalleryCarouselCaption: "Carousel",
  TextGalleryColumnsCaption: "Columns",
  TextAddImagesCaption: "Add Images\u2026",
  TextAddImageAddressCaption: "Add Image from Address\u2026",
  TextRemoveImageCaption: "Remove Image",
  TextMoveImageBackCaption: "Move Image Back",
  TextMoveImageForwardCaption: "Move Image Forward",
  TextImageCaptionPlaceholder: "Caption",
  TextImageDescriptionCaption: "Description (Alt Text)",
  TextSelectedImageCaption: "Selected Image",
  TextViewImageCaption: "View Full Size",
  TextPreviousImageCaption: "Previous Image",
  TextNextImageCaption: "Next Image",
  TextCloseViewerCaption: "Close",
  TextImageAddressPrompt: "Image address",
  TextGalleryEmptyCaption: "Add images to the gallery"
};
Strings.register(GalleryStrings);
var GalleryLayouts = /* @__PURE__ */ ((GalleryLayouts2) => {
  GalleryLayouts2[GalleryLayouts2["grid"] = 0] = "grid";
  GalleryLayouts2[GalleryLayouts2["carousel"] = 1] = "carousel";
  return GalleryLayouts2;
})(GalleryLayouts || {});
var GalleryImage = class _GalleryImage {
  /** A data: URI or an address. */
  source = "";
  caption = "";
  /** The description screen readers read, and that shows when the picture can't. */
  alt = "";
  constructor(source = "", caption = "", alt = "") {
    this.source = source;
    this.caption = caption;
    this.alt = alt;
  }
  toJSON() {
    let result = { source: this.source };
    if (this.caption.length > 0)
      result.caption = this.caption;
    if (this.alt.length > 0)
      result.alt = this.alt;
    return result;
  }
  static fromJSON(data) {
    return new _GalleryImage(Utilities.string(data && data.source), Utilities.string(data && data.caption), Utilities.string(data && data.alt));
  }
};
var GalleryNode = class _GalleryNode extends Node {
  static exportStyles(sheet, _editor) {
    sheet.addRule(".gallery", "display: grid; gap: 8px; margin: 0");
    sheet.addRule(".gallery figure", "margin: 0");
    sheet.addRule(".gallery img", "display: block; width: 100%; height: auto; border-radius: 6px");
    sheet.addRule(".gallery figcaption", "margin-top: 4px; font-size: 0.875em; opacity: 0.75");
    sheet.addRule(".gallery-carousel", "display: flex; overflow-x: auto; scroll-snap-type: x mandatory");
    sheet.addRule(".gallery-carousel > figure", "flex: 0 0 100%; scroll-snap-align: center");
  }
  static identifier = "gallery";
  static caption = "Gallery";
  static captionString = "TextGalleryCaption";
  static icon = "bi bi-images";
  static keywords = "images photos pictures carousel slideshow grid album";
  static create(editor) {
    let result = new _GalleryNode();
    result.editor = editor;
    return result;
  }
  static importElement(element, importer) {
    if (!/^(DIV|SECTION)$/.test(element.tagName) || !element.classList.contains("gallery"))
      return void 0;
    let node = new _GalleryNode();
    node.layout = element.classList.contains("gallery-carousel") ? 1 /* carousel */ : 0 /* grid */;
    node.columns = Utilities.clamp(Utilities.integer(element.dataset.columns, 3), 1, 6);
    element.querySelectorAll("img").forEach((image) => {
      let figure = image.closest("figure");
      let caption = figure ? figure.querySelector("figcaption") : null;
      node.images.push(new GalleryImage(image.getAttribute("src") || "", caption ? (caption.textContent || "").trim() : "", image.getAttribute("alt") || ""));
    });
    return importer.attach(node);
  }
  images = [];
  layout = 0 /* grid */;
  /** The grid's number of columns. */
  columns = 3;
  /** The picture the toolbar and inspector work on, and the carousel shows. Not saved. */
  selectedImage = 0;
  get typeName() {
    return this.strings.TextGalleryCaption;
  }
  /** Adds pictures from files, uploaded through the editor or embedded. */
  async addFiles(files) {
    let images = files.filter((file) => (file.type || "").startsWith("image/"));
    for (let file of images) {
      try {
        let source = this.editor ? await this.editor.storeFile(file, "image", this) : await MediaUI.readDataURI(file);
        this.addImage(new GalleryImage(source, "", ""));
      } catch (error) {
        if (this.editor && !(error instanceof DOMException && error.name == "AbortError"))
          this.editor.showMessage(this.strings.TextUploadFailedMessage, "danger");
      }
    }
  }
  addImage(image) {
    this.willChange();
    this.images.push(image);
    this.selectedImage = this.images.length - 1;
    this.refresh();
    this.changed();
  }
  removeImage(index) {
    if (index < 0 || index >= this.images.length)
      return;
    this.willChange();
    this.images.splice(index, 1);
    this.selectedImage = Utilities.clamp(index, 0, Math.max(0, this.images.length - 1));
    this.refresh();
    this.changed();
  }
  moveImage(index, by) {
    let target = index + by;
    if (index < 0 || index >= this.images.length || target < 0 || target >= this.images.length)
      return;
    this.willChange();
    let [image] = this.images.splice(index, 1);
    this.images.splice(target, 0, image);
    this.selectedImage = target;
    this.refresh();
    this.changed();
  }
  chooseFiles() {
    let input = Utilities.element("input", "", { type: "file", accept: "image/*", multiple: "multiple" });
    input.addEventListener("change", () => {
      if (input.files && input.files.length > 0)
        this.addFiles(Array.from(input.files));
    });
    input.click();
  }
  async enterURL() {
    if (!this.editor)
      return;
    let values = await this.editor.prompt(this.strings.TextGalleryCaption, [{ name: "url", label: this.strings.TextImageAddressPrompt, value: "", type: "url", placeholder: "https://" }]);
    if (values && String(values.url).trim().length > 0)
      this.addImage(new GalleryImage(String(values.url).trim()));
  }
  #select(index) {
    this.selectedImage = Utilities.clamp(index, 0, Math.max(0, this.images.length - 1));
    if (this.element) {
      this.element.querySelectorAll(".scv-gallery-item").forEach((item, itemIndex) => item.classList.toggle("scv-gallery-selected", itemIndex == this.selectedImage));
    }
    if (this.editor)
      this.editor.updateToolbarState();
  }
  build(body) {
    if (this.images.length == 0) {
      body.append(MediaUI.placeholder(this, _GalleryNode.icon, this.strings.TextGalleryEmptyCaption, () => this.chooseFiles(), () => this.enterURL()));
      return;
    }
    this.selectedImage = Utilities.clamp(this.selectedImage, 0, this.images.length - 1);
    let carousel = this.layout == 1 /* carousel */;
    let frame = Utilities.element("div", `scv-gallery ${carousel ? "scv-gallery-carousel" : "scv-gallery-grid"}`, { contenteditable: "false" });
    let track = Utilities.element("div", "scv-gallery-track");
    if (!carousel)
      track.style.gridTemplateColumns = `repeat(${this.columns}, minmax(0, 1fr))`;
    this.images.forEach((image, index) => track.append(this.#item(image, index)));
    frame.append(track);
    if (carousel) {
      track.style.setProperty("--scv-slide", String(this.selectedImage));
      let previous = this.#navButton("bi-chevron-left", this.strings.TextPreviousImageCaption, "scv-gallery-previous", () => this.#showSlide(this.selectedImage - 1, track, dots));
      let next = this.#navButton("bi-chevron-right", this.strings.TextNextImageCaption, "scv-gallery-next", () => this.#showSlide(this.selectedImage + 1, track, dots));
      let dots = Utilities.element("div", "scv-gallery-dots");
      this.images.forEach((_image, index) => {
        let dot = Utilities.element("button", `scv-gallery-dot${index == this.selectedImage ? " active" : ""}`, { type: "button", "aria-label": String(index + 1) });
        dot.addEventListener("click", (event) => {
          event.stopPropagation();
          this.#showSlide(index, track, dots);
        });
        dots.append(dot);
      });
      frame.append(previous, next, dots);
    }
    body.append(frame);
  }
  #showSlide(index, track, dots) {
    let count = this.images.length;
    this.#select((index % count + count) % count);
    track.style.setProperty("--scv-slide", String(this.selectedImage));
    Array.from(dots.children).forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex == this.selectedImage));
  }
  #navButton(icon, label, className, action) {
    let button = Utilities.element("button", `scv-gallery-nav ${className}`, { type: "button", "aria-label": label, title: label });
    button.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i>`;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      action();
    });
    return button;
  }
  #item(image, index) {
    let figure = Utilities.element("figure", `scv-gallery-item${index == this.selectedImage ? " scv-gallery-selected" : ""}`);
    let picture = Utilities.element("img", "", { src: image.source, alt: image.alt, loading: "lazy", draggable: "false" });
    picture.addEventListener("click", (event) => {
      event.stopPropagation();
      if (this.selectedImage == index || !this.editor || this.editor.readOnly)
        this.openViewer(index);
      this.#select(index);
    });
    figure.append(picture);
    let readOnly = !!(this.editor && this.editor.readOnly);
    if (readOnly) {
      if (image.caption.length > 0) {
        let caption2 = Utilities.element("figcaption", "scv-gallery-caption");
        caption2.textContent = image.caption;
        figure.append(caption2);
      }
      return figure;
    }
    let caption = Utilities.element("input", "scv-gallery-caption", { type: "text", placeholder: this.strings.TextImageCaptionPlaceholder, "aria-label": this.strings.TextImageCaptionPlaceholder });
    caption.value = image.caption;
    caption.addEventListener("focus", () => this.#select(index));
    caption.addEventListener("change", () => {
      if (caption.value == image.caption)
        return;
      this.willChange();
      image.caption = caption.value;
      this.changed();
    });
    figure.append(caption);
    return figure;
  }
  /** Shows a picture full size over the page, with arrows to the others. */
  openViewer(index) {
    if (this.images.length == 0)
      return;
    let current = Utilities.clamp(index, 0, this.images.length - 1);
    let dialog = Utilities.element("dialog", "scv-gallery-viewer", { "aria-label": this.strings.TextGalleryCaption });
    let picture = Utilities.element("img", "scv-gallery-viewer-image");
    let caption = Utilities.element("div", "scv-gallery-viewer-caption");
    let show = (at) => {
      current = (at % this.images.length + this.images.length) % this.images.length;
      let image = this.images[current];
      picture.src = image.source;
      picture.alt = image.alt;
      caption.textContent = image.caption.length > 0 ? `${image.caption} \xB7 ${current + 1} / ${this.images.length}` : `${current + 1} / ${this.images.length}`;
    };
    let close = this.#navButton("bi-x-lg", this.strings.TextCloseViewerCaption, "scv-gallery-viewer-close", () => dialog.close());
    dialog.append(picture, caption, close);
    if (this.images.length > 1) {
      dialog.append(this.#navButton("bi-chevron-left", this.strings.TextPreviousImageCaption, "scv-gallery-previous", () => show(current - 1)));
      dialog.append(this.#navButton("bi-chevron-right", this.strings.TextNextImageCaption, "scv-gallery-next", () => show(current + 1)));
    }
    dialog.addEventListener("keydown", (event) => {
      let forward = getComputedStyle(dialog).direction == "rtl" ? "ArrowLeft" : "ArrowRight";
      if (event.key == "ArrowLeft" || event.key == "ArrowRight")
        show(event.key == forward ? current + 1 : current - 1);
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog)
        dialog.close();
    });
    dialog.addEventListener("close", () => dialog.remove());
    show(current);
    document.body.append(dialog);
    dialog.showModal();
  }
  inspectorSections() {
    let strings = this.strings;
    let layout = InspectorItem.menu("gallerylayout", strings.TextGalleryLayoutCaption, [[strings.TextGalleryGridCaption, 0 /* grid */], [strings.TextGalleryCarouselCaption, 1 /* carousel */]], (target) => target.layout, (target, value) => target.layout = value == 1 /* carousel */ ? 1 /* carousel */ : 0 /* grid */);
    layout.setDefaultValue(0 /* grid */);
    let columns = InspectorItem.number("gallerycolumns", strings.TextGalleryColumnsCaption, (target) => target.columns, (target, value) => target.columns = Utilities.clamp(Math.round(value), 1, 6), 1, 6, 1);
    columns.setDefaultValue(3);
    let selected = (target) => target.images[target.selectedImage];
    let alt = InspectorItem.bound("imagealt", strings.TextImageDescriptionCaption, InspectorEditors.text, (target) => selected(target) ? selected(target).alt : "", (target, value) => {
      if (selected(target))
        selected(target).alt = String(value || "");
    });
    alt.updatesLive = false;
    let caption = InspectorItem.bound("imagecaption", strings.TextImageCaptionPlaceholder, InspectorEditors.text, (target) => selected(target) ? selected(target).caption : "", (target, value) => {
      if (selected(target))
        selected(target).caption = String(value || "");
    });
    caption.updatesLive = false;
    let sections = [InspectorDefaults.section("gallery", strings.TextGalleryCaption, [layout, columns])];
    if (this.images.length > 0)
      sections.push(InspectorDefaults.section("galleryimage", strings.TextSelectedImageCaption, [caption, alt]));
    return sections.concat(InspectorDefaults.node(this, { appearance: false, backgroundImage: false }));
  }
  actions() {
    let strings = this.strings;
    let add = new ToolbarItem("addimages", strings.TextAddImagesCaption, "bi bi-plus-square", ToolbarItemKinds.menu);
    add.menuItems.push(new ToolbarMenuItem("file", strings.TextAddImagesCaption, "bi bi-folder2-open"));
    add.menuItems.push(new ToolbarMenuItem("url", strings.TextAddImageAddressCaption, "bi bi-link-45deg"));
    let layout = new ToolbarItem("gallerylayout", this.layout == 1 /* carousel */ ? strings.TextGalleryCarouselCaption : strings.TextGalleryGridCaption, this.layout == 1 /* carousel */ ? "bi bi-collection-play" : "bi bi-grid-3x3-gap", ToolbarItemKinds.menu, strings.TextGalleryLayoutCaption);
    layout.alwaysShowCaption = true;
    let grid = new ToolbarMenuItem(String(0 /* grid */), strings.TextGalleryGridCaption, "bi bi-grid-3x3-gap");
    grid.checked = this.layout == 0 /* grid */;
    let carousel = new ToolbarMenuItem(String(1 /* carousel */), strings.TextGalleryCarouselCaption, "bi bi-collection-play");
    carousel.checked = this.layout == 1 /* carousel */;
    layout.menuItems.push(grid, carousel);
    let has = this.images.length > 0;
    let back = new ToolbarItem("moveback", strings.TextMoveImageBackCaption, "bi bi-arrow-left");
    back.enabled = has && this.selectedImage > 0;
    let forward = new ToolbarItem("moveforward", strings.TextMoveImageForwardCaption, "bi bi-arrow-right");
    forward.enabled = has && this.selectedImage < this.images.length - 1;
    let remove = new ToolbarItem("removeimage", strings.TextRemoveImageCaption, "bi bi-trash");
    remove.enabled = has;
    let view = new ToolbarItem("view", strings.TextViewImageCaption, "bi bi-arrows-fullscreen");
    view.enabled = has;
    return [add, layout, back, forward, remove, view];
  }
  performAction(item, menuItem) {
    switch (item.identifier) {
      case "addimages":
        if (menuItem && menuItem.identifier == "url")
          this.enterURL();
        else
          this.chooseFiles();
        return true;
      case "gallerylayout":
        if (!menuItem)
          return true;
        this.willChange();
        this.layout = Number(menuItem.identifier) == 1 /* carousel */ ? 1 /* carousel */ : 0 /* grid */;
        this.refresh();
        this.changed();
        return true;
      case "moveback":
        this.moveImage(this.selectedImage, -1);
        return true;
      case "moveforward":
        this.moveImage(this.selectedImage, 1);
        return true;
      case "removeimage":
        this.removeImage(this.selectedImage);
        return true;
      case "view":
        this.openViewer(this.selectedImage);
        return true;
    }
    return false;
  }
  toJSON() {
    let result = super.toJSON();
    result["images"] = this.images.map((image) => image.toJSON());
    if (this.layout != 0 /* grid */)
      result["layout"] = this.layout;
    if (this.columns != 3)
      result["columns"] = this.columns;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.images = Array.isArray(data.images) ? data.images.map((item) => GalleryImage.fromJSON(item)).filter((image) => image.source.length > 0) : [];
    this.layout = Utilities.integer(data.layout, 0) == 1 /* carousel */ ? 1 /* carousel */ : 0 /* grid */;
    this.columns = Utilities.clamp(Utilities.integer(data.columns, 3), 1, 6);
    return true;
  }
  toHTML() {
    let carousel = this.layout == 1 /* carousel */;
    let style = carousel ? "" : `grid-template-columns:repeat(${this.columns},minmax(0,1fr));`;
    let figures = this.images.map((image) => {
      let caption = image.caption.length > 0 ? `<figcaption>${Utilities.escapeText(image.caption)}</figcaption>` : "";
      return `<figure><img src="${Utilities.escapeAttribute(image.source)}" alt="${Utilities.escapeAttribute(image.alt)}" loading="lazy">${caption}</figure>`;
    }).join("");
    return `<div class="gallery${carousel ? " gallery-carousel" : ""}" data-columns="${this.columns}" style="${this.htmlBackgroundCSS()}${style}">${figures}</div>`;
  }
  toMarkdown() {
    return this.images.map((image) => {
      let title = image.caption.length > 0 ? ` "${image.caption.replace(/"/g, '\\"')}"` : "";
      return `![${image.alt.replace(/([\[\]\\])/g, "\\$1")}](${image.source.replace(/ /g, "%20").replace(/\)/g, "%29")}${title})`;
    }).join("\n");
  }
  toPlainText() {
    return this.images.map((image) => image.caption).filter((caption) => caption.length > 0).join("\n");
  }
};
Editor.registerNodeType(GalleryNode, 95);
export {
  GalleryImage,
  GalleryLayouts,
  GalleryNode
};
