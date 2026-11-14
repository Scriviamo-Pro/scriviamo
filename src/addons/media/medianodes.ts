import {Editor, HTMLImporter, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, MediaUI, Node, Strings, Stylesheet, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities} from "scriviamo"

/** This add-on's interface text. A locale pack applied to an editor replaces any of it. */
const MediaStrings = {
  TextEnterMediaURLPrompt: "Media address",
  TextChoosePreviewImageCaption: "Choose Preview Image…",
  TextPreviewFromFrameCaption: "Use Current Frame as Preview",
  TextRemovePreviewCaption: "Remove Preview",
  TextMediaUnavailableCaption: "This media can't be played here.",
  TextReplaceMediaCaption: "Replace"
}

type MediaStringsTable = typeof MediaStrings

declare module "scriviamo" {
  interface Strings extends MediaStringsTable {}
}

Strings.register(MediaStrings)

/**
 * Audio or video from a file embedded in the document (a data: URI) or from
 * an address. The base class of AudioNode and VideoNode.
 */
export class MediaNode extends Node {
  /** Reads a media node's source, size and preview picture from an audio or video element. */
  static readElement(media: MediaNode, element: HTMLElement, importer: HTMLImporter): MediaNode {
    let isVideo = media instanceof VideoNode
    let sourceElement = element.querySelector("source")
    let source = element.getAttribute("src") || (sourceElement ? sourceElement.getAttribute("src") || "" : "")
    if (source.toLowerCase().startsWith("data:")) {
      media.resourceData = source
    } else {
      media.resourceURL = source
    }
    let width = parseFloat(element.style.width || element.getAttribute("width") || "0")
    let height = parseFloat(element.style.height || element.getAttribute("height") || "0")
    if (width > 0) media.width = width
    if (isVideo && height > 0) media.height = height
    let poster = element.getAttribute("poster") || ""
    if (isVideo && poster.startsWith("data:")) (media as VideoNode).previewImage = poster.substring(poster.indexOf(",") + 1)
    return importer.attach(media)
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let file = InspectorItem.bound("localfile", strings.TextLocalFileCaption, InspectorEditors.file, target => target.resourceData.length > 0 ? "data" : "", (target, value) => {
      if (typeof value == "string" && value.startsWith("data:")) {
        target.resourceData = value
        target.resourceURL = ""
        target.resourcePath = ""
      }
    })
    file.fileFilter = this instanceof AudioNode ? "audio/*" : "video/*"
    let url = InspectorItem.bound("url", strings.TextURLCaption, InspectorEditors.text, target => target.resourceURL, (target, value) => {
      target.resourceURL = String(value || "").trim()
      if (target.resourceURL.length > 0) target.resourceData = ""
    })
    url.updatesLive = false
    return [InspectorDefaults.section("media", this.typeName, [file, url])].concat(InspectorDefaults.node(this))
  }

  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    sheet.addRule("audio, video", `display: block; max-width: 100%; border-radius: 8px; background: ${Editor.themeCSS(editor, ThemeColors.dark)}`)
  }

  static insertable: boolean = false

  /** A data: URI holding the media, kept in the document so it travels with it. */
  resourceData: string = ""
  /** A remote address for the media. */
  resourceURL: string = ""
  /** A local file path saved with the document. Kept so saving doesn't lose it; browsers can't open it. */
  resourcePath: string = ""

  protected get defaultWidth(): number {
    return 480
  }

  protected get defaultHeight(): number {
    return 270
  }

  protected get accept(): string {
    return "audio/*,video/*"
  }

  get canResize(): boolean {
    return true
  }

  /** The address the media plays from. */
  get source(): string {
    return this.resourceData.length > 0 ? this.resourceData : this.resourceURL
  }

  get hasResource(): boolean {
    return this.source.length > 0
  }

  /** Sets the media from a data: URI or an address. */
  setResource(value: string) {
    let source = (value || "").trim()
    this.willChange()
    if (source.toLowerCase().startsWith("data:")) {
      this.resourceData = source
      this.resourceURL = ""
    } else {
      this.resourceData = ""
      this.resourceURL = source
    }
    this.resourcePath = ""
    this.refresh()
    this.changed()
  }

  /** Embeds a media file. */
  async loadFile(file: Blob) {
    try {
      this.setResource(await MediaUI.readDataURI(file))
    } catch {
      if (this.editor) this.editor.showMessage(this.strings.TextMediaUnavailableCaption, "danger")
    }
  }

  chooseFile() {
    MediaUI.pickFile(this.accept, file => this.loadFile(file))
  }

  async enterURL() {
    if (!this.editor) return
    let values = await this.editor.prompt(this.typeName, [{name: "url", label: this.strings.TextEnterMediaURLPrompt, value: this.resourceURL, type: "url", placeholder: "https://"}])
    if (values && String(values.url).trim().length > 0) this.setResource(String(values.url))
  }

  /** Creates the playing element. */
  protected mediaElement(): HTMLMediaElement {
    return document.createElement("video")
  }

  protected build(body: HTMLElement) {
    if (!this.hasResource) {
      body.append(MediaUI.placeholder(this, (this.constructor as typeof Node).icon, this.typeName, () => this.chooseFile(), () => this.enterURL()))
      return
    }
    let frame = Utilities.element("div", "scv-media-frame", {contenteditable: "false"})
    frame.style.width = `${this.width > 0 ? this.width : this.defaultWidth}px`
    let media = this.mediaElement()
    media.controls = true
    media.preload = "metadata"
    media.src = this.source
    media.addEventListener("error", () => frame.classList.add("scv-media-error"))
    frame.append(media)
    let error = Utilities.element("div", "scv-media-error-message small")
    error.textContent = this.strings.TextMediaUnavailableCaption
    frame.append(error)
    let handle = Utilities.element("span", "scv-resize-handle")
    frame.append(handle)
    this.configureFrame(frame, media, handle)
    body.append(frame)
  }

  protected configureFrame(frame: HTMLElement, _media: HTMLMediaElement, handle: HTMLElement) {
    MediaUI.attachResize(this, handle, frame, () => 0, width => {
      this.willChange()
      this.width = width
      this.refresh()
      this.changed()
    })
  }

  actions(): Array<ToolbarItem> {
    let replace = new ToolbarItem("replace", this.strings.TextReplaceMediaCaption, "bi bi-arrow-repeat", ToolbarItemKinds.menu)
    replace.menuItems.push(new ToolbarMenuItem("file", this.strings.TextChooseLocalFileCaption, "bi bi-folder2-open"))
    replace.menuItems.push(new ToolbarMenuItem("url", this.strings.TextEnterURLCaption, "bi bi-link-45deg"))
    return [replace]
  }

  performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean {
    if (item.identifier == "replace" && menuItem) {
      if (menuItem.identifier == "file") this.chooseFile()
      if (menuItem.identifier == "url") this.enterURL()
      return true
    }
    return false
  }

  toJSON(): object {
    let result = super.toJSON()
    if (this.resourcePath.length > 0) result["resourcePath"] = this.resourcePath
    result["resourceURL"] = this.resourceURL
    if (this.resourceData.length > 0) result["resourceData"] = this.resourceData
    return result
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.resourcePath = Utilities.string(data.resourcePath)
    this.resourceURL = ""
    this.resourceData = ""
    let portable = Utilities.string(data.resourceData).trim()
    let url = Utilities.string(data.resourceURL).trim()
    if (portable.length > 0) {
      if (portable.toLowerCase().startsWith("data:")) {
        this.resourceData = portable
      } else {
        this.resourceURL = portable
      }
    } else {
      this.resourceURL = url
    }
    return true
  }

  toPlainText(): string {
    return this.resourceURL
  }
}

export class AudioNode extends MediaNode {
  static identifier: string = "audio"
  static caption: string = "Audio"
  static icon: string = "bi bi-music-note-beamed"
  static keywords: string = "sound music podcast recording mp3"

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    return element.tagName == "AUDIO" ? MediaNode.readElement(new AudioNode(), element, importer) : undefined
  }
  static droppedFileTypes: Array<string> = ["audio/*"]

  static importDroppedFile(file: File, _editor: Editor): Node | null {
    let node = new AudioNode()
    Promise.resolve().then(() => node.loadFile(file))
    return node
  }
  static insertable: boolean = true

  protected get defaultWidth(): number {
    return 360
  }

  get toolbarResizesHeight(): boolean {
    return false
  }

  protected get accept(): string {
    return "audio/*"
  }

  protected mediaElement(): HTMLMediaElement {
    return document.createElement("audio")
  }

  toHTML(): string {
    let width = this.width > 0 ? this.width : this.defaultWidth
    return `<audio controls src="${Utilities.escapeAttribute(this.source)}" style="${this.htmlBackgroundCSS()}width:${width}px"></audio>`
  }
}

export class VideoNode extends MediaNode {
  static identifier: string = "video"
  static caption: string = "Video"
  static icon: string = "bi bi-film"
  static keywords: string = "movie clip film mp4 player"

  static importElement(element: HTMLElement, importer: HTMLImporter): Node | undefined {
    return element.tagName == "VIDEO" ? MediaNode.readElement(new VideoNode(), element, importer) : undefined
  }
  static droppedFileTypes: Array<string> = ["video/*"]

  static importDroppedFile(file: File, _editor: Editor): Node | null {
    let node = new VideoNode()
    Promise.resolve().then(() => node.loadFile(file))
    return node
  }
  static insertable: boolean = true

  /** A poster picture as base64 PNG data, without a data URI prefix. */
  previewImage: string = ""

  protected get accept(): string {
    return "video/*"
  }

  get #ratio(): number {
    if (this.width > 0 && this.height > 0) return this.height / this.width
    return this.defaultHeight / this.defaultWidth
  }

  protected mediaElement(): HTMLMediaElement {
    let video = document.createElement("video")
    if (this.previewImage.length > 0) video.poster = `data:image/png;base64,${this.previewImage}`
    video.playsInline = true
    return video
  }

  protected configureFrame(frame: HTMLElement, media: HTMLMediaElement, handle: HTMLElement) {
    let width = this.width > 0 ? this.width : this.defaultWidth
    frame.style.height = `${Math.round(width * this.#ratio)}px`
    media.addEventListener("loadedmetadata", () => {
      let video = media as HTMLVideoElement
      if (this.width == 0 && this.height == 0 && video.videoWidth > 0) {
        frame.style.height = `${Math.round(width * video.videoHeight / video.videoWidth)}px`
      }
    })
    MediaUI.attachResize(this, handle, frame, () => this.#ratio, (newWidth, newHeight) => {
      this.willChange()
      this.width = newWidth
      this.height = newHeight
      this.refresh()
      this.changed()
    })
  }

  actions(): Array<ToolbarItem> {
    let preview = new ToolbarItem("preview", this.strings.TextChoosePreviewImageCaption, "bi bi-card-image", ToolbarItemKinds.menu)
    preview.menuItems.push(new ToolbarMenuItem("frame", this.strings.TextPreviewFromFrameCaption, "bi bi-camera"))
    preview.menuItems.push(new ToolbarMenuItem("file", this.strings.TextChoosePreviewImageCaption, "bi bi-folder2-open"))
    let remove = new ToolbarMenuItem("remove", this.strings.TextRemovePreviewCaption, "bi bi-x-lg")
    remove.enabled = this.previewImage.length > 0
    preview.menuItems.push(remove)
    preview.enabled = this.hasResource
    return super.actions().concat([preview])
  }

  performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean {
    if (item.identifier != "preview" || !menuItem) return super.performAction(item, menuItem)
    switch (menuItem.identifier) {
      case "frame": {
        let video = this.element ? this.element.querySelector("video") : null
        if (video && video.videoWidth > 0) this.#setPreview(video, video.videoWidth, video.videoHeight)
        break
      }
      case "file":
        MediaUI.pickFile("image/*", async file => {
          let image = new Image()
          image.addEventListener("load", () => this.#setPreview(image, image.naturalWidth, image.naturalHeight))
          image.src = await MediaUI.readDataURI(file)
        })
        break
      case "remove":
        this.willChange()
        this.previewImage = ""
        this.refresh()
        this.changed()
        break
    }
    return true
  }

  /** Stores a picture of source as the preview, as PNG. */
  #setPreview(source: CanvasImageSource, width: number, height: number) {
    let canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    try {
      canvas.getContext("2d").drawImage(source, 0, 0, width, height)
      let data = canvas.toDataURL("image/png")
      this.willChange()
      this.previewImage = data.substring(data.indexOf(",") + 1)
      this.refresh()
      this.changed()
    } catch {
      // Pictures from other sites can't be read back.
      if (this.editor) this.editor.showMessage(this.strings.TextMediaUnavailableCaption, "warning")
    }
  }

  toJSON(): object {
    let result = super.toJSON()
    if (this.previewImage.length > 0) result["previewImage"] = this.previewImage
    return result
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.previewImage = Utilities.string(data.previewImage).replace(/^data:[^,]*,/, "")
    return true
  }

  toHTML(): string {
    let width = this.width > 0 ? this.width : this.defaultWidth
    let height = this.height > 0 ? this.height : Math.round(width * this.#ratio)
    let poster = this.previewImage.length > 0 ? ` poster="data:image/png;base64,${this.previewImage}"` : ""
    return `<video controls src="${Utilities.escapeAttribute(this.source)}"${poster} style="${this.htmlBackgroundCSS()}width:${width}px;height:${height}px"></video>`
  }
}

Editor.registerNodeType(AudioNode, 100)
Editor.registerNodeType(VideoNode, 110)
