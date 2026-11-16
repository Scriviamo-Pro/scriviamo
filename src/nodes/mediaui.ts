import {Editor, Node, Utilities} from "../internal"

/** Shared pieces for blocks that show media: the empty-state chooser and the resize handle. */
export class MediaUI {
  /** An empty-state panel with buttons to choose a file or enter an address. */
  static placeholder(node: Node, icon: string, caption: string, chooseFile: (() => void) | null, enterURL: () => void): HTMLElement {
    let panel = Utilities.element("div", "scv-image-placeholder scv-media-placeholder", {contenteditable: "false"})
    panel.innerHTML = `<i class="${icon}"></i>`
    let label = Utilities.element("div", "small")
    label.textContent = caption
    panel.append(label)
    let buttons = Utilities.element("div", "scv-image-buttons")
    if (chooseFile) {
      let choose = Utilities.element("button", "btn btn-sm btn-primary", {type: "button"})
      choose.textContent = node.strings.TextChooseLocalFileCaption
      choose.addEventListener("click", event => {
        event.stopPropagation()
        chooseFile()
      })
      buttons.append(choose)
    }
    let address = Utilities.element("button", `btn btn-sm ${chooseFile ? "btn-outline-secondary" : "btn-primary"}`, {type: "button"})
    address.textContent = node.strings.TextEnterURLCaption
    address.addEventListener("click", event => {
      event.stopPropagation()
      enterURL()
    })
    buttons.append(address)
    if (node.editor && node.editor.readOnly) buttons.classList.add("d-none")
    panel.append(buttons)
    return panel
  }

  /** Lets the user drag handle to resize frame. ratio is height / width, or 0 to keep the height. */
  static attachResize(node: Node, handle: HTMLElement, frame: HTMLElement, ratio: () => number, done: (width: number, height: number) => void) {
    handle.addEventListener("pointerdown", event => {
      if (!node.editor || node.editor.readOnly || node.locked) return
      event.preventDefault()
      event.stopPropagation()
      let startX = event.clientX
      let startWidth = frame.getBoundingClientRect().width
      let startHeight = frame.getBoundingClientRect().height
      let rightToLeft = getComputedStyle(frame).direction == "rtl"
      let maximum = node.element && node.element.parentElement ? node.element.parentElement.clientWidth : 2000
      let width = startWidth
      handle.setPointerCapture(event.pointerId)
      let move = (moveEvent: PointerEvent) => {
        let delta = (moveEvent.clientX - startX) * (rightToLeft ? -1 : 1)
        width = Math.round(Utilities.clamp(startWidth + delta, 48, maximum))
        frame.style.width = `${width}px`
        let factor = ratio()
        if (factor > 0) frame.style.height = `${Math.round(width * factor)}px`
      }
      let up = () => {
        handle.removeEventListener("pointermove", move)
        handle.removeEventListener("pointerup", up)
        handle.removeEventListener("pointercancel", up)
        if (Math.round(width) == Math.round(startWidth)) return
        let factor = ratio()
        done(width, factor > 0 ? Math.round(width * factor) : Math.round(startHeight))
      }
      handle.addEventListener("pointermove", move)
      handle.addEventListener("pointerup", up)
      handle.addEventListener("pointercancel", up)
    })
  }

  /** Reads a file as a data: URI. */
  static readDataURI(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      let reader = new FileReader()
      reader.addEventListener("load", () => resolve(String(reader.result || "")))
      reader.addEventListener("error", () => reject(reader.error))
      reader.readAsDataURL(file)
    })
  }

  static pickFile(accept: string, handler: (file: File) => void) {
    let input = Utilities.element("input", "", {type: "file", accept: accept})
    input.addEventListener("change", () => {
      if (input.files && input.files.length > 0) handler(input.files[0])
    })
    input.click()
  }
}

/** What a file is being stored for. */
export type FileUploadKind = "image" | "audio" | "video" | "background" | "file"

/** One file for an application's uploader to store. */
export interface FileUpload {
  file: Blob
  /** The file's name, or "" for pasted content without one. */
  name: string
  /** The file's MIME type, such as "image/png", or "". */
  type: string
  kind: FileUploadKind
  /** The node the file is for, or null for the document's background and the inspector. */
  node: Node | null
  editor: Editor
  /** Reports progress, from 0 to 1, for the editor to show. */
  progress(fraction: number): void
  /** Aborted when the user cancels; pass it to fetch. */
  signal: AbortSignal
}

/**
 * The application's uploader: stores a file and returns the address to show it from. Returning
 * null or "" embeds the file in the document as data instead; throwing or rejecting reports a
 * failed upload.
 */
export type FileUploader = (upload: FileUpload) => Promise<string | null | undefined> | string | null | undefined
