import {CodePoints, Editor, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, LineBreak, Node, RichText, Stylesheet, TextHost, TextHostModes, TextStyle, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities} from "../internal"

export enum ImageFillModes {
  /** object-fit: contain */
  fit = 0,
  /** object-fit: cover */
  fill = 1,
  /** object-fit: fill */
  stretch = 2
}

/** A picture with an optional caption. Pictures chosen from files are embedded in the document. */
export class ImageNode extends Node {
  static exportStyles(sheet: Stylesheet, editor: Editor | null) {
    sheet.addRule("figure", "max-width: 100%; text-align: center")
    sheet.addRule("figure img", "display: block; max-width: 100%; margin: 0 auto")
    sheet.addRule("figcaption", `margin-top: 8px; text-align: center; color: ${Editor.themeCSS(editor, ThemeColors.textMuted)}; font-size: 14px; overflow-wrap: anywhere`)
  }

  static identifier: string = "image"
  static caption: string = "Image"
  static icon: string = "bi bi-image"
  static keywords: string = "picture photo figure illustration graphic"
  static droppedFileTypes: Array<string> = ["image/*"]

  static importDroppedFile(file: File, _editor: Editor): Node | null {
    let node = new ImageNode()
    // Loaded once inserted, so a failure can be reported by the editor.
    Promise.resolve().then(() => node.loadFile(file))
    return node
  }
  /** Largest width given to a newly loaded picture. */
  static maximumInitialWidth: number = 640

  captionText: RichText = new RichText()
  displayWidth: number = 0
  displayHeight: number = 0
  fillMode: ImageFillModes = ImageFillModes.fit
  /** Base64-encoded picture file, without a data URI prefix. */
  imageData: string = ""
  sourceURL: string = ""

  get toolbarCanResize(): boolean {
    return this.hasImage
  }

  toolbarSize(): {width: number, height: number} {
    let image = this.element ? this.element.querySelector("img") : null
    let width = this.displayWidth > 0 ? this.displayWidth : (image ? image.getBoundingClientRect().width : 0)
    let height = this.displayHeight > 0 ? this.displayHeight : (image ? image.getBoundingClientRect().height : 0)
    return {width: width, height: height}
  }

  setToolbarSize(dimension: "width" | "height", value: number) {
    let size = this.toolbarSize()
    if (dimension == "width") {
      this.displayWidth = value
      this.displayHeight = value > 0 && size.width > 0 ? Math.round(size.height * value / size.width) : 0
    } else {
      this.displayHeight = value
      this.displayWidth = value > 0 && size.height > 0 ? Math.round(size.width * value / size.height) : 0
    }
  }

  get canAlignBlock(): boolean {
    return true
  }

  get caption(): string {
    return this.captionText.text
  }

  set caption(value: string) {
    this.captionText = new RichText(value)
  }

  /** The address the picture is shown from: a data URI for embedded pictures, otherwise sourceURL. */
  get source(): string {
    if (this.imageData.length > 0) return `data:${Utilities.pictureMimeType(this.imageData)};base64,${this.imageData}`
    return this.sourceURL
  }

  get hasImage(): boolean {
    return this.source.length > 0
  }

  /** The upload in progress: a preview of the file, and how to cancel it. */
  #upload: {preview: string, controller: AbortController, bar: HTMLElement | null} | null = null

  /** True while a picture is uploading through the editor's fileUploader. */
  get isUploading(): boolean {
    return this.#upload !== null
  }

  protected build(body: HTMLElement) {
    let figure = Utilities.element("figure", "scv-image")
    body.append(figure)

    if (this.#upload) {
      let upload = this.#upload
      let frame = Utilities.element("div", "scv-image-frame scv-image-uploading", {contenteditable: "false", "aria-busy": "true"})
      if (this.displayWidth > 0) frame.style.width = `${this.displayWidth}px`
      frame.append(Utilities.element("img", "", {src: upload.preview, alt: "", draggable: "false"}))
      let overlay = Utilities.element("div", "scv-image-upload")
      let label = Utilities.element("span", "scv-image-upload-label")
      label.textContent = this.strings.TextUploadingCaption
      let progress = Utilities.element("div", "progress", {role: "progressbar", "aria-label": this.strings.TextUploadingCaption, "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0"})
      upload.bar = Utilities.element("div", "progress-bar progress-bar-striped progress-bar-animated")
      upload.bar.style.width = "100%"
      progress.append(upload.bar)
      let cancel = Utilities.element("button", "btn btn-sm btn-light", {type: "button"})
      cancel.textContent = this.strings.TextCancelCaption
      cancel.addEventListener("click", event => {
        event.stopPropagation()
        upload.controller.abort()
      })
      overlay.append(label, progress, cancel)
      frame.append(overlay)
      figure.append(frame)
      return
    }

    if (!this.hasImage) {
      let placeholder = Utilities.element("div", "scv-image-placeholder", {contenteditable: "false"})
      placeholder.innerHTML = `<i class="bi bi-image"></i>`
      let buttons = Utilities.element("div", "scv-image-buttons")
      let choose = Utilities.element("button", "btn btn-sm btn-primary", {type: "button"})
      choose.textContent = this.strings.TextChooseLocalFileCaption
      choose.addEventListener("click", event => {
        event.stopPropagation()
        this.chooseFile()
      })
      let address = Utilities.element("button", "btn btn-sm btn-outline-secondary", {type: "button"})
      address.textContent = this.strings.TextEnterURLCaption
      address.addEventListener("click", event => {
        event.stopPropagation()
        this.enterURL()
      })
      buttons.append(choose, address)
      placeholder.append(buttons)
      if (this.editor && this.editor.readOnly) buttons.classList.add("d-none")
      figure.append(placeholder)
      return
    }

    let frame = Utilities.element("div", "scv-image-frame", {contenteditable: "false"})
    if (this.displayWidth > 0) frame.style.width = `${this.displayWidth}px`
    let image = Utilities.element("img", "", {src: this.source, alt: this.caption, draggable: "false"})
    image.style.objectFit = ["contain", "cover", "fill"][this.fillMode] || "contain"
    if (this.displayWidth > 0 && this.displayHeight > 0) image.style.aspectRatio = `${this.displayWidth} / ${this.displayHeight}`
    image.addEventListener("load", () => {
      if (this.displayWidth == 0 && image.naturalWidth > 0) {
        let width = Math.min(image.naturalWidth, ImageNode.maximumInitialWidth)
        this.displayWidth = width
        this.displayHeight = Math.round(image.naturalHeight * width / image.naturalWidth)
        frame.style.width = `${this.displayWidth}px`
        image.style.aspectRatio = `${this.displayWidth} / ${this.displayHeight}`
      }
    })
    frame.append(image)

    let handle = Utilities.element("span", "scv-resize-handle", {title: ""})
    handle.addEventListener("pointerdown", event => this.#beginResize(event, frame, image))
    frame.append(handle)
    figure.append(frame)

    let caption = Utilities.element("figcaption", "scv-image-caption")
    if (this.displayWidth > 0) caption.style.maxWidth = `${Math.max(this.displayWidth, 120)}px`
    figure.append(caption)
    let host = this.addHost(new TextHost(this, this.captionText, caption, TextHostModes.inline))
    host.placeholder = this.strings.TextCaptionCaption
    host.render()
  }

  #beginResize(event: PointerEvent, frame: HTMLElement, image: HTMLImageElement) {
    if (!this.editor || this.editor.readOnly || this.locked) return
    event.preventDefault()
    event.stopPropagation()
    let startX = event.clientX
    let startWidth = frame.getBoundingClientRect().width
    let ratio = this.displayWidth > 0 && this.displayHeight > 0 ? this.displayHeight / this.displayWidth : (image.naturalWidth > 0 ? image.naturalHeight / image.naturalWidth : 0.75)
    let rightToLeft = getComputedStyle(frame).direction == "rtl"
    let maximum = this.element && this.element.parentElement ? this.element.parentElement.clientWidth : 2000
    let width = startWidth
    let handle = event.target as HTMLElement
    handle.setPointerCapture(event.pointerId)
    let move = (moveEvent: PointerEvent) => {
      let delta = (moveEvent.clientX - startX) * (rightToLeft ? -1 : 1)
      width = Math.round(Utilities.clamp(startWidth + delta, 32, maximum))
      frame.style.width = `${width}px`
    }
    let up = () => {
      handle.removeEventListener("pointermove", move)
      handle.removeEventListener("pointerup", up)
      handle.removeEventListener("pointercancel", up)
      if (Math.round(width) == Math.round(startWidth)) return
      this.willChange()
      this.displayWidth = width
      this.displayHeight = Math.round(width * ratio)
      this.refresh()
      this.changed()
    }
    handle.addEventListener("pointermove", move)
    handle.addEventListener("pointerup", up)
    handle.addEventListener("pointercancel", up)
  }

  /** Asks for a picture file and embeds it. */
  inserted() {
    if (!this.hasImage) this.chooseFile()
  }

  inspectorSections(): Array<InspectorSection> {
    let strings = this.strings
    let file = InspectorItem.bound("localfile", strings.TextLocalFileCaption, InspectorEditors.file, target => target.imageData.length > 0 ? "data" : "", (target, value) => {
      if (typeof value == "string" && value.startsWith("data:")) {
        target.imageData = value.substring(value.indexOf(",") + 1)
        target.sourceURL = ""
        target.displayWidth = 0
        target.displayHeight = 0
      }
    })
    file.fileFilter = "image/*"
    let url = InspectorItem.bound("url", strings.TextURLCaption, InspectorEditors.text, target => target.sourceURL, (target, value) => {
      target.sourceURL = String(value || "").trim()
      if (target.sourceURL.length > 0) target.imageData = ""
      target.displayWidth = 0
      target.displayHeight = 0
    })
    url.updatesLive = false
    let fill = InspectorItem.menu("fillmode", strings.TextFillCaption, [[strings.TextFitCaption, ImageFillModes.fit], [strings.TextFillCaption, ImageFillModes.fill], [strings.TextStretchCaption, ImageFillModes.stretch]], target => target.fillMode, (target, value) => target.fillMode = value)
    let width = InspectorItem.number("displaywidth", strings.TextWidthInspectorCaption, target => target.displayWidth, (target, value) => {
      let ratio = target.displayWidth > 0 ? target.displayHeight / target.displayWidth : 0
      target.displayWidth = Math.max(0, Math.round(value))
      if (ratio > 0) target.displayHeight = Math.round(target.displayWidth * ratio)
    }, 0, 10000, 1)
    width.zeroCaption = strings.TextAutomatic
    let caption: InspectorItem = InspectorItem.bound("caption", strings.TextTextCaption, InspectorEditors.multilineText, target => target.caption, (target, value) => {
      let style = target.captionText.length > 0 ? target.captionText.styleAt(0) : new TextStyle()
      if (target.caption != value) target.captionText = new RichText(String(value || "").replace(/\n/g, LineBreak), style)
    })
    caption.setDefaultValue(undefined)
    return [InspectorDefaults.section("image", strings.TextImageCaption, [file, url, fill, width]), InspectorDefaults.section("caption", strings.TextCaptionCaption, [caption])].concat(InspectorDefaults.node(this))
  }

  chooseFile() {
    let input = Utilities.element("input", "", {type: "file", accept: "image/*"})
    input.addEventListener("change", () => {
      if (input.files && input.files.length > 0) this.loadFile(input.files[0])
    })
    input.click()
  }

  /**
   * Adds a picture file, such as one chosen, dropped or pasted. With the editor's fileUploader,
   * it is uploaded and shown from its address; otherwise it is embedded in the document.
   */
  loadFile(file: Blob): Promise<boolean> {
    if (this.editor && this.editor.fileUploader) return this.#uploadFile(file, this.editor)
    return new Promise(resolve => {
      let reader = new FileReader()
      reader.addEventListener("load", () => {
        let value = String(reader.result || "")
        let comma = value.indexOf(",")
        if (comma < 0) {
          resolve(false)
          return
        }
        this.willChange()
        this.imageData = value.substring(comma + 1)
        this.sourceURL = ""
        this.displayWidth = 0
        this.displayHeight = 0
        this.refresh()
        this.changed()
        resolve(true)
      })
      reader.addEventListener("error", () => {
        if (this.editor) this.editor.showMessage(this.strings.TextImageOpenErrorMessage, "danger")
        resolve(false)
      })
      reader.readAsDataURL(file)
    })
  }

  async #uploadFile(file: Blob, editor: Editor): Promise<boolean> {
    if (this.#upload) this.#upload.controller.abort()
    let upload = {preview: URL.createObjectURL(file), controller: new AbortController(), bar: null as HTMLElement | null}
    this.#upload = upload
    this.refresh()
    let finish = () => {
      if (this.#upload !== upload) return false
      this.#upload = null
      URL.revokeObjectURL(upload.preview)
      return true
    }
    let address: string
    try {
      address = await editor.storeFile(file, "image", this, fraction => {
        if (!upload.bar) return
        upload.bar.classList.remove("progress-bar-striped", "progress-bar-animated")
        upload.bar.style.width = `${Math.round(fraction * 100)}%`
        upload.bar.parentElement?.setAttribute("aria-valuenow", String(Math.round(fraction * 100)))
      }, upload.controller.signal)
    } catch (error) {
      if (!finish()) return false
      this.refresh()
      let cancelled = upload.controller.signal.aborted || (error instanceof DOMException && error.name == "AbortError")
      if (!cancelled) editor.showMessage(this.strings.TextUploadFailedMessage, "danger")
      return false
    }
    if (!finish()) return false
    if (address.toLowerCase().startsWith("data:")) {
      let comma = address.indexOf(",")
      this.willChange()
      this.imageData = comma >= 0 ? address.substring(comma + 1) : ""
      this.sourceURL = ""
      this.displayWidth = 0
      this.displayHeight = 0
      this.refresh()
      this.changed()
    } else {
      this.setURL(address)
    }
    return true
  }

  /** Asks for a picture address. */
  async enterURL() {
    if (!this.editor) return
    let values = await this.editor.prompt(this.strings.TextImageURLDialogTitle, [{name: "url", label: this.strings.TextImageURLDialogPrompt, value: this.sourceURL, type: "url"}])
    if (!values) return
    this.setURL(values.url.trim())
  }

  setURL(url: string) {
    this.willChange()
    this.sourceURL = url
    this.imageData = ""
    this.displayWidth = 0
    this.displayHeight = 0
    this.refresh()
    this.changed()
  }

  actions(): Array<ToolbarItem> {
    let strings = this.strings
    let replace = new ToolbarItem("replace", strings.TextImageCaption, "bi bi-arrow-repeat", ToolbarItemKinds.menu)
    replace.menuItems.push(new ToolbarMenuItem("file", strings.TextChooseLocalFileCaption, "bi bi-folder2-open"))
    replace.menuItems.push(new ToolbarMenuItem("url", strings.TextEnterURLCaption, "bi bi-link-45deg"))
    let fill = new ToolbarItem("fillmode", [strings.TextFitCaption, strings.TextFillCaption, strings.TextStretchCaption][this.fillMode], "bi bi-aspect-ratio", ToolbarItemKinds.menu)
    ;[strings.TextFitCaption, strings.TextFillCaption, strings.TextStretchCaption].forEach((caption, index) => {
      let menuItem = new ToolbarMenuItem(String(index), caption)
      menuItem.checked = index == this.fillMode
      fill.menuItems.push(menuItem)
    })
    let actual = new ToolbarItem("actualsize", strings.TextActualSizeCaption, "bi bi-arrows-angle-expand")
    actual.enabled = this.hasImage
    return [replace, fill, actual]
  }

  performAction(item: ToolbarItem, menuItem: ToolbarMenuItem | null): boolean {
    switch (item.identifier) {
      case "replace":
        if (menuItem && menuItem.identifier == "file") this.chooseFile()
        if (menuItem && menuItem.identifier == "url") this.enterURL()
        return true
      case "fillmode":
        if (!menuItem) return false
        this.willChange()
        this.fillMode = Number(menuItem.identifier)
        this.refresh()
        this.changed()
        return true
      case "actualsize": {
        let image = this.element ? this.element.querySelector("img") : null
        if (!image || image.naturalWidth == 0) return true
        this.willChange()
        this.displayWidth = image.naturalWidth
        this.displayHeight = image.naturalHeight
        this.refresh()
        this.changed()
        return true
      }
    }
    return false
  }

  toJSON(): object {
    let result = super.toJSON()
    if (this.caption.length > 0) result["caption"] = this.caption
    if (this.displayHeight != 0) result["displayHeight"] = this.displayHeight
    if (this.displayWidth != 0) result["displayWidth"] = this.displayWidth
    if (this.fillMode != 0) result["fillMode"] = this.fillMode
    if (this.imageData.length > 0) result["image"] = this.imageData
    if (this.sourceURL.length > 0) result["sourceURL"] = this.sourceURL
    // Caption styles are positional, one per character.
    let styles: Array<object> = []
    let allDefault = true
    let text = this.captionText.text
    for (let index = 0; index < text.length; index++) {
      let style = this.captionText.styleAt(index)
      if (!style.isDefault()) allDefault = false
      styles.push(style.toCompactJSON())
      index += CodePoints.widthAt(text, index) - 1
    }
    if (!allDefault) result["captionStyles"] = styles
    return result
  }

  fromJSON(data: any): boolean {
    if (!super.fromJSON(data)) return false
    this.captionText = RichText.fromJSON({text: Utilities.string(data.caption), styles: Array.isArray(data.captionStyles) ? data.captionStyles : undefined})
    this.displayHeight = Math.max(0, Utilities.number(data.displayHeight, 0))
    this.displayWidth = Math.max(0, Utilities.number(data.displayWidth, 0))
    this.fillMode = Utilities.clamp(Utilities.integer(data.fillMode, 0), 0, 2)
    this.imageData = Utilities.string(data.image).replace(/^data:[^,]*,/, "")
    this.sourceURL = Utilities.string(data.sourceURL)
    return true
  }

  toHTML(): string {
    let fit = ["contain", "cover", "fill"][this.fillMode] || "contain"
    let size = this.displayWidth > 0 ? `width:${this.displayWidth}px;height:${this.displayHeight}px;` : "max-width:100%;"
    let result = `<figure style="width:fit-content;max-width:100%;${this.htmlBackgroundCSS()}"><img src="${Utilities.escapeAttribute(this.source)}" alt="${Utilities.escapeAttribute(this.caption)}" style="${size}object-fit:${fit}">`
    if (this.caption.length > 0) result += `<figcaption style="text-align:center">${this.captionText.htmlText()}</figcaption>`
    return result + "</figure>"
  }

  toMarkdown(): string {
    let source = this.source.replace(/\\/g, "\\\\").replace(/\)/g, "\\)")
    let alternate = this.caption.replace(/[\r\n\u2028]/g, " ").replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]")
    return this.markdownWithBackground(`![${alternate}](${source})`)
  }

  toPlainText(): string {
    return this.caption
  }
}
