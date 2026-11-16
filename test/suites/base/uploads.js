// Files the user adds: the application's uploader, and embedding without one.
"use strict"
{
  const section = "Uploads"
  // A one-pixel PNG.
  const PixelBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

  function pixel(name = "pixel.png") {
    let bytes = Uint8Array.from(atob(PixelBase64), character => character.charCodeAt(0))
    return new File([bytes], name, {type: "image/png"})
  }

  function messages(editor) {
    let shown = []
    editor.addEventListener("messageShowing", event => shown.push(event.detail.text))
    return shown
  }

  test(section, "without an uploader, files are embedded", async t => {
    let editor = t.editor()
    let data = await editor.storeFile(pixel(), "image")
    t.assert(data.startsWith("data:image/png;base64,"), "storeFile didn't return a data URI")
    let image = new PE.ImageNode()
    editor.addNode(image)
    t.equal(await image.loadFile(pixel()), true, "loadFile failed")
    t.equal(image.imageData, PixelBase64, "The picture wasn't embedded")
  })

  test(section, "an uploader stores the picture, which is shown from its address", async t => {
    let editor = t.editor()
    let uploads = []
    let finish = null
    editor.fileUploader = upload => {
      uploads.push(upload)
      upload.progress(0.5)
      return new Promise(resolve => finish = resolve)
    }
    let image = new PE.ImageNode()
    editor.addNode(image)
    editor.history.reset()
    let loading = image.loadFile(pixel("photo.png"))
    await t.tick()
    t.assert(image.isUploading, "The node didn't say it was uploading")
    let frame = image.element.querySelector(".scv-image-uploading")
    t.assert(frame && frame.querySelector("img").src.startsWith("blob:"), "The upload didn't show a preview")
    t.equal(frame.querySelector(".progress-bar").style.width, "50%", "The progress wasn't shown")
    t.equal(uploads.length, 1, "The uploader wasn't called once")
    let upload = uploads[0]
    t.assert(upload.name == "photo.png" && upload.type == "image/png" && upload.kind == "image" && upload.node === image && upload.editor === editor, "The upload's details were wrong")
    t.assert(upload.signal instanceof AbortSignal, "The upload had no abort signal")
    finish("https://cdn.example.com/photo.png")
    t.equal(await loading, true, "loadFile didn't report success")
    t.assert(!image.isUploading, "The node still said it was uploading")
    t.equal(image.sourceURL, "https://cdn.example.com/photo.png", "The picture wasn't shown from its address")
    t.equal(image.imageData, "", "The uploaded picture was also embedded")
    t.assert(editor.toHTML().includes("https://cdn.example.com/photo.png"), "The export didn't use the address")
    editor.history.undo()
    t.assert(!editor.nodeAt(0).hasImage, "Undo didn't remove the uploaded picture in one step")
  })

  test(section, "an uploader can return null to embed a file", async t => {
    let editor = t.editor({fileUploader: () => null})
    t.equal(typeof editor.fileUploader, "function", "The fileUploader option wasn't used")
    let image = new PE.ImageNode()
    editor.addNode(image)
    t.equal(await image.loadFile(pixel()), true, "loadFile failed")
    t.equal(image.imageData, PixelBase64, "Returning null didn't embed the picture")
  })

  test(section, "a failed upload is reported and changes nothing", async t => {
    let editor = t.editor()
    let shown = messages(editor)
    editor.fileUploader = async () => { throw new Error("Server error") }
    let image = new PE.ImageNode()
    image.sourceURL = "https://example.com/before.png"
    editor.addNode(image)
    t.equal(await image.loadFile(pixel()), false, "loadFile reported success")
    t.equal(image.sourceURL, "https://example.com/before.png", "A failed upload changed the picture")
    t.assert(!image.isUploading, "The node still said it was uploading")
    t.equal(shown, ["The file couldn't be uploaded."], "The failure wasn't reported")
  })

  test(section, "cancelling an upload aborts it quietly", async t => {
    let editor = t.editor()
    let shown = messages(editor)
    let aborted = false
    editor.fileUploader = upload => new Promise((_resolve, reject) => {
      upload.signal.addEventListener("abort", () => {
        aborted = true
        reject(new DOMException("Aborted", "AbortError"))
      })
    })
    let image = new PE.ImageNode()
    editor.addNode(image)
    let loading = image.loadFile(pixel())
    await t.tick()
    image.element.querySelector(".scv-image-upload button").click()
    t.equal(await loading, false, "A cancelled upload reported success")
    t.assert(aborted, "Cancel didn't abort the upload's signal")
    t.assert(!image.hasImage && !image.isUploading, "A cancelled upload left something behind")
    t.equal(shown, [], "A cancelled upload showed an error")
  })

  test(section, "an uploader's address is used for the document background", async t => {
    let editor = t.editor({fileUploader: upload => `https://cdn.example.com/${upload.kind}.png`})
    t.equal(await editor.storeFile(pixel(), "background"), "https://cdn.example.com/background.png", "storeFile didn't return the uploader's address")
  })
}
