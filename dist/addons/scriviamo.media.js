// addons/media/medianodes.ts
import { Editor, InspectorDefaults, InspectorEditors, InspectorItem, MediaUI, Node, Strings, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities } from "scriviamo";
var MediaStrings = {
  TextEnterMediaURLPrompt: "Media address",
  TextChoosePreviewImageCaption: "Choose Preview Image\u2026",
  TextPreviewFromFrameCaption: "Use Current Frame as Preview",
  TextRemovePreviewCaption: "Remove Preview",
  TextMediaUnavailableCaption: "This media can't be played here.",
  TextReplaceMediaCaption: "Replace"
};
Strings.register(MediaStrings);
var MediaNode = class extends Node {
  /** Reads a media node's source, size and preview picture from an audio or video element. */
  static readElement(media, element, importer) {
    let isVideo = media instanceof VideoNode;
    let sourceElement = element.querySelector("source");
    let source = element.getAttribute("src") || (sourceElement ? sourceElement.getAttribute("src") || "" : "");
    if (source.toLowerCase().startsWith("data:")) {
      media.resourceData = source;
    } else {
      media.resourceURL = source;
    }
    let width = parseFloat(element.style.width || element.getAttribute("width") || "0");
    let height = parseFloat(element.style.height || element.getAttribute("height") || "0");
    if (width > 0)
      media.width = width;
    if (isVideo && height > 0)
      media.height = height;
    let poster = element.getAttribute("poster") || "";
    if (isVideo && poster.startsWith("data:"))
      media.previewImage = poster.substring(poster.indexOf(",") + 1);
    return importer.attach(media);
  }
  inspectorSections() {
    let strings = this.strings;
    let file = InspectorItem.bound("localfile", strings.TextLocalFileCaption, InspectorEditors.file, (target) => target.resourceData.length > 0 ? "data" : "", (target, value) => {
      if (typeof value == "string" && value.startsWith("data:")) {
        target.resourceData = value;
        target.resourceURL = "";
        target.resourcePath = "";
      }
    });
    file.fileFilter = this instanceof AudioNode ? "audio/*" : "video/*";
    let url = InspectorItem.bound("url", strings.TextURLCaption, InspectorEditors.text, (target) => target.resourceURL, (target, value) => {
      target.resourceURL = String(value || "").trim();
      if (target.resourceURL.length > 0)
        target.resourceData = "";
    });
    url.updatesLive = false;
    return [InspectorDefaults.section("media", this.typeName, [file, url])].concat(InspectorDefaults.node(this));
  }
  static exportStyles(sheet, editor) {
    sheet.addRule("audio, video", `display: block; max-width: 100%; border-radius: 8px; background: ${Editor.themeCSS(editor, ThemeColors.dark)}`);
  }
  static insertable = false;
  /** A data: URI holding the media, kept in the document so it travels with it. */
  resourceData = "";
  /** A remote address for the media. */
  resourceURL = "";
  /** A local file path saved with the document. Kept so saving doesn't lose it; browsers can't open it. */
  resourcePath = "";
  get defaultWidth() {
    return 480;
  }
  get defaultHeight() {
    return 270;
  }
  get accept() {
    return "audio/*,video/*";
  }
  get canResize() {
    return true;
  }
  /** The address the media plays from. */
  get source() {
    return this.resourceData.length > 0 ? this.resourceData : this.resourceURL;
  }
  get hasResource() {
    return this.source.length > 0;
  }
  /** Sets the media from a data: URI or an address. */
  setResource(value) {
    let source = (value || "").trim();
    this.willChange();
    if (source.toLowerCase().startsWith("data:")) {
      this.resourceData = source;
      this.resourceURL = "";
    } else {
      this.resourceData = "";
      this.resourceURL = source;
    }
    this.resourcePath = "";
    this.refresh();
    this.changed();
  }
  /** Embeds a media file. */
  async loadFile(file) {
    try {
      this.setResource(this.editor ? await this.editor.storeFile(file, (file.type || this.accept).startsWith("video") ? "video" : "audio", this) : await MediaUI.readDataURI(file));
    } catch (error) {
      if (this.editor && !(error instanceof DOMException && error.name == "AbortError"))
        this.editor.showMessage(this.editor.fileUploader ? this.strings.TextUploadFailedMessage : this.strings.TextMediaUnavailableCaption, "danger");
    }
  }
  chooseFile() {
    MediaUI.pickFile(this.accept, (file) => this.loadFile(file));
  }
  async enterURL() {
    if (!this.editor)
      return;
    let values = await this.editor.prompt(this.typeName, [{ name: "url", label: this.strings.TextEnterMediaURLPrompt, value: this.resourceURL, type: "url", placeholder: "https://" }]);
    if (values && String(values.url).trim().length > 0)
      this.setResource(String(values.url));
  }
  /** Creates the playing element. */
  mediaElement() {
    return document.createElement("video");
  }
  build(body) {
    if (!this.hasResource) {
      body.append(MediaUI.placeholder(this, this.constructor.icon, this.typeName, () => this.chooseFile(), () => this.enterURL()));
      return;
    }
    let frame = Utilities.element("div", "scv-media-frame", { contenteditable: "false" });
    frame.style.width = `${this.width > 0 ? this.width : this.defaultWidth}px`;
    let media = this.mediaElement();
    media.controls = true;
    media.preload = "metadata";
    media.src = this.source;
    media.addEventListener("error", () => frame.classList.add("scv-media-error"));
    frame.append(media);
    let error = Utilities.element("div", "scv-media-error-message small");
    error.textContent = this.strings.TextMediaUnavailableCaption;
    frame.append(error);
    let handle = Utilities.element("span", "scv-resize-handle");
    frame.append(handle);
    this.configureFrame(frame, media, handle);
    body.append(frame);
  }
  configureFrame(frame, _media, handle) {
    MediaUI.attachResize(this, handle, frame, () => 0, (width) => {
      this.willChange();
      this.width = width;
      this.refresh();
      this.changed();
    });
  }
  actions() {
    let replace = new ToolbarItem("replace", this.strings.TextReplaceMediaCaption, "bi bi-arrow-repeat", ToolbarItemKinds.menu);
    replace.menuItems.push(new ToolbarMenuItem("file", this.strings.TextChooseLocalFileCaption, "bi bi-folder2-open"));
    replace.menuItems.push(new ToolbarMenuItem("url", this.strings.TextEnterURLCaption, "bi bi-link-45deg"));
    return [replace];
  }
  performAction(item, menuItem) {
    if (item.identifier == "replace" && menuItem) {
      if (menuItem.identifier == "file")
        this.chooseFile();
      if (menuItem.identifier == "url")
        this.enterURL();
      return true;
    }
    return false;
  }
  toJSON() {
    let result = super.toJSON();
    if (this.resourcePath.length > 0)
      result["resourcePath"] = this.resourcePath;
    result["resourceURL"] = this.resourceURL;
    if (this.resourceData.length > 0)
      result["resourceData"] = this.resourceData;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.resourcePath = Utilities.string(data.resourcePath);
    this.resourceURL = "";
    this.resourceData = "";
    let portable = Utilities.string(data.resourceData).trim();
    let url = Utilities.string(data.resourceURL).trim();
    if (portable.length > 0) {
      if (portable.toLowerCase().startsWith("data:")) {
        this.resourceData = portable;
      } else {
        this.resourceURL = portable;
      }
    } else {
      this.resourceURL = url;
    }
    return true;
  }
  toPlainText() {
    return this.resourceURL;
  }
};
var AudioNode = class _AudioNode extends MediaNode {
  static identifier = "audio";
  static caption = "Audio";
  static icon = "bi bi-music-note-beamed";
  static keywords = "sound music podcast recording mp3";
  static importElement(element, importer) {
    return element.tagName == "AUDIO" ? MediaNode.readElement(new _AudioNode(), element, importer) : void 0;
  }
  static droppedFileTypes = ["audio/*"];
  static importDroppedFile(file, _editor) {
    let node = new _AudioNode();
    Promise.resolve().then(() => node.loadFile(file));
    return node;
  }
  static insertable = true;
  get defaultWidth() {
    return 360;
  }
  get toolbarResizesHeight() {
    return false;
  }
  get accept() {
    return "audio/*";
  }
  mediaElement() {
    return document.createElement("audio");
  }
  toHTML() {
    let width = this.width > 0 ? this.width : this.defaultWidth;
    return `<audio controls src="${Utilities.escapeAttribute(this.source)}" style="${this.htmlBackgroundCSS()}width:${width}px"></audio>`;
  }
};
var VideoNode = class _VideoNode extends MediaNode {
  static identifier = "video";
  static caption = "Video";
  static icon = "bi bi-film";
  static keywords = "movie clip film mp4 player";
  static importElement(element, importer) {
    return element.tagName == "VIDEO" ? MediaNode.readElement(new _VideoNode(), element, importer) : void 0;
  }
  static droppedFileTypes = ["video/*"];
  static importDroppedFile(file, _editor) {
    let node = new _VideoNode();
    Promise.resolve().then(() => node.loadFile(file));
    return node;
  }
  static insertable = true;
  /** A poster picture as base64 PNG data, without a data URI prefix. */
  previewImage = "";
  get accept() {
    return "video/*";
  }
  get #ratio() {
    if (this.width > 0 && this.height > 0)
      return this.height / this.width;
    return this.defaultHeight / this.defaultWidth;
  }
  mediaElement() {
    let video = document.createElement("video");
    if (this.previewImage.length > 0)
      video.poster = `data:image/png;base64,${this.previewImage}`;
    video.playsInline = true;
    return video;
  }
  configureFrame(frame, media, handle) {
    let width = this.width > 0 ? this.width : this.defaultWidth;
    frame.style.height = `${Math.round(width * this.#ratio)}px`;
    media.addEventListener("loadedmetadata", () => {
      let video = media;
      if (this.width == 0 && this.height == 0 && video.videoWidth > 0) {
        frame.style.height = `${Math.round(width * video.videoHeight / video.videoWidth)}px`;
      }
    });
    MediaUI.attachResize(this, handle, frame, () => this.#ratio, (newWidth, newHeight) => {
      this.willChange();
      this.width = newWidth;
      this.height = newHeight;
      this.refresh();
      this.changed();
    });
  }
  actions() {
    let preview = new ToolbarItem("preview", this.strings.TextChoosePreviewImageCaption, "bi bi-card-image", ToolbarItemKinds.menu);
    preview.menuItems.push(new ToolbarMenuItem("frame", this.strings.TextPreviewFromFrameCaption, "bi bi-camera"));
    preview.menuItems.push(new ToolbarMenuItem("file", this.strings.TextChoosePreviewImageCaption, "bi bi-folder2-open"));
    let remove = new ToolbarMenuItem("remove", this.strings.TextRemovePreviewCaption, "bi bi-x-lg");
    remove.enabled = this.previewImage.length > 0;
    preview.menuItems.push(remove);
    preview.enabled = this.hasResource;
    return super.actions().concat([preview]);
  }
  performAction(item, menuItem) {
    if (item.identifier != "preview" || !menuItem)
      return super.performAction(item, menuItem);
    switch (menuItem.identifier) {
      case "frame": {
        let video = this.element ? this.element.querySelector("video") : null;
        if (video && video.videoWidth > 0)
          this.#setPreview(video, video.videoWidth, video.videoHeight);
        break;
      }
      case "file":
        MediaUI.pickFile("image/*", async (file) => {
          let image = new Image();
          image.addEventListener("load", () => this.#setPreview(image, image.naturalWidth, image.naturalHeight));
          image.src = await MediaUI.readDataURI(file);
        });
        break;
      case "remove":
        this.willChange();
        this.previewImage = "";
        this.refresh();
        this.changed();
        break;
    }
    return true;
  }
  /** Stores a picture of source as the preview, as PNG. */
  #setPreview(source, width, height) {
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    try {
      canvas.getContext("2d").drawImage(source, 0, 0, width, height);
      let data = canvas.toDataURL("image/png");
      this.willChange();
      this.previewImage = data.substring(data.indexOf(",") + 1);
      this.refresh();
      this.changed();
    } catch {
      if (this.editor)
        this.editor.showMessage(this.strings.TextMediaUnavailableCaption, "warning");
    }
  }
  toJSON() {
    let result = super.toJSON();
    if (this.previewImage.length > 0)
      result["previewImage"] = this.previewImage;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.previewImage = Utilities.string(data.previewImage).replace(/^data:[^,]*,/, "");
    return true;
  }
  toHTML() {
    let width = this.width > 0 ? this.width : this.defaultWidth;
    let height = this.height > 0 ? this.height : Math.round(width * this.#ratio);
    let poster = this.previewImage.length > 0 ? ` poster="data:image/png;base64,${this.previewImage}"` : "";
    return `<video controls src="${Utilities.escapeAttribute(this.source)}"${poster} style="${this.htmlBackgroundCSS()}width:${width}px;height:${height}px"></video>`;
  }
};
Editor.registerNodeType(AudioNode, 100);
Editor.registerNodeType(VideoNode, 110);
export {
  AudioNode,
  MediaNode,
  VideoNode
};
