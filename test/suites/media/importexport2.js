// Suggestions, CSS output, backgrounds, media, sizes, corners, pasted HTML,
// colors, tables, toolbars and borders.
"use strict"
{
  const section = "Import and export"
  const gif = "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
  const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

  function people() {
    let provider = new PE.Suggestions.Provider("people", "@")
    provider.add("Ada")
    provider.add("ada")
    provider.add("Alan")
    provider.textColor = PE.Colors.make(185, 28, 28)
    provider.backgroundColor = PE.Colors.make(254, 226, 226)
    provider.borderColor = PE.Colors.make(252, 165, 165)
    return provider
  }

  function diagnostics() {
    let provider = new PE.Suggestions.Provider("diagnostics", ".")
    provider.add("Error", "Error diagnostic")
    provider.textColor = PE.Colors.make(185, 28, 28)
    provider.backgroundColor = PE.Colors.make(254, 226, 226)
    provider.borderColor = PE.Colors.make(252, 165, 165)
    return provider
  }

  function inspectorItem(node, identifier) {
    for (let section of node.inspectorSections()) {
      for (let item of section.items()) {
        if (item && item.identifier == identifier) return item
      }
    }
    return null
  }

  test(section, "embedded audio and video are portable", t => {
    let editor = t.editor()
    let audio = new PE.AudioNode()
    audio.setResource("data:audio/wav;base64,UklGRg==")
    let restoredAudio = new PE.AudioNode()
    t.assert(restoredAudio.fromJSON(audio.toJSON()), "Embedded audio JSON could not be restored.")
    t.assert(restoredAudio.toHTML().indexOf("data:audio/wav;base64,UklGRg==") >= 0, "Embedded audio was not portable through JSON and HTML export.")
    t.assert(editor.cloneNode(restoredAudio).toHTML().indexOf("data:audio/wav;base64,UklGRg==") >= 0, "Duplicating embedded audio discarded its resource.")
    let video = new PE.VideoNode()
    video.setResource("data:video/mp4;base64,AAAA")
    let restoredVideo = new PE.VideoNode()
    t.assert(restoredVideo.fromJSON(video.toJSON()) && restoredVideo.toHTML().indexOf("data:video/mp4;base64,AAAA") >= 0, "Embedded video was not portable through JSON and HTML export.")
    let audioJSON = restoredAudio.toJSON()
    t.assert(!("width" in audioJSON) && !("height" in audioJSON), "Audio JSON wrote a natural size as width and height.")
    video.width = 400
    video.height = 225
    let sized = new PE.VideoNode()
    t.assert(sized.fromJSON(video.toJSON()) && sized.width == 400 && sized.height == 225, "Video JSON did not restore its explicit size.")
  })
}
