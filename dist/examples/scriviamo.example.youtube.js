// examples/youtube/youtubenode.ts
import { Editor, InspectorEditors, InspectorItem, InspectorSection, MediaUI, Node, Strings, Utilities } from "scriviamo";
var YouTubeStrings = {
  TextYouTubeCaption: "YouTube",
  TextYouTubeTooltip: "Add a YouTube Video",
  TextYouTubeVideoCaption: "YouTube Video",
  TextYouTubeURLCaption: "Video URL",
  TextYouTubeURLDescription: "Paste a YouTube watch, share, Shorts, live, or embed URL.",
  TextYouTubeEmptyCaption: "Set a YouTube URL in the Inspector",
  TextYouTubeVideoFormat: "YouTube - %id%",
  TextYouTubePlayCaption: "Play",
  TextYouTubePlayerTitle: "YouTube video player"
};
Strings.register(YouTubeStrings);
var DefaultWidth = 560;
var DefaultHeight = 315;
var YouTubeNode = class _YouTubeNode extends Node {
  static identifier = "youtube";
  static caption = "YouTube";
  static icon = "bi bi-youtube";
  static keywords = "video embed play";
  /** YouTube iframes are this type's, so it reads them before embeds do. */
  static importPriority = 100;
  static create(editor) {
    let result = new _YouTubeNode();
    result.editor = editor;
    return result;
  }
  static importElement(element, importer) {
    if (element.tagName != "IFRAME")
      return void 0;
    let id = _YouTubeNode.videoIDFrom(element.getAttribute("src") || "");
    if (id.length == 0)
      return void 0;
    let node = new _YouTubeNode(id);
    let width = parseFloat(element.style.width || element.getAttribute("width") || "");
    let height = parseFloat(element.style.height || element.getAttribute("height") || "");
    if (width > 0)
      node.width = width;
    if (height > 0)
      node.height = height;
    return importer.attach(node);
  }
  /** The video ID in a YouTube address, or the value itself when it is an ID, or "". */
  static videoIDFrom(value) {
    let source = String(value || "").trim();
    if (_YouTubeNode.#isVideoID(source))
      return source;
    source = source.replace(/&amp;/g, "&").replace(/^(https?:)?\/\//i, "").replace(/^www\./i, "");
    let lower = source.toLowerCase();
    let candidate = "";
    if (lower.startsWith("youtu.be/")) {
      candidate = source.slice(9);
    } else {
      let host = ["youtube.com/", "m.youtube.com/", "music.youtube.com/", "youtube-nocookie.com/"].find((prefix) => lower.startsWith(prefix));
      if (!host)
        return "";
      candidate = _YouTubeNode.#idFromPath(source.slice(host.length));
    }
    for (let delimiter of ["?", "&", "#", "/"]) {
      let index = candidate.indexOf(delimiter);
      if (index >= 0)
        candidate = candidate.slice(0, index);
    }
    return _YouTubeNode.#isVideoID(candidate) ? candidate : "";
  }
  static #idFromPath(path) {
    let prefix = ["embed/", "shorts/", "live/"].find((item) => path.toLowerCase().startsWith(item));
    if (prefix)
      return path.slice(prefix.length);
    let query = path.indexOf("?");
    if (query < 0)
      return "";
    for (let part of path.slice(query + 1).split("&")) {
      let equals = part.indexOf("=");
      if (equals > 0 && part.slice(0, equals).toLowerCase() == "v")
        return part.slice(equals + 1);
    }
    return "";
  }
  static #isVideoID(value) {
    return /^[A-Za-z0-9_-]{11}$/.test(value);
  }
  #videoID = "";
  /** True once play was pressed, until the node is drawn again. */
  #playing = false;
  constructor(source = "") {
    super();
    this.width = DefaultWidth;
    this.height = DefaultHeight;
    this.#videoID = _YouTubeNode.videoIDFrom(source);
  }
  get typeName() {
    return this.strings.TextYouTubeCaption;
  }
  get canResize() {
    return true;
  }
  /** The height follows the width, so the toolbar offers Width alone. */
  get toolbarResizesHeight() {
    return false;
  }
  /** The 11-character video ID, or "". Assigning an address keeps only its ID. */
  get videoID() {
    return this.#videoID;
  }
  set videoID(value) {
    let id = _YouTubeNode.videoIDFrom(value);
    if (id == this.#videoID)
      return;
    this.#videoID = id;
    this.#playing = false;
    if (this.element)
      this.refresh();
  }
  /** The video's watch address, or "". Accepts any YouTube address or a video ID. */
  get url() {
    return this.#videoID.length > 0 ? `https://www.youtube.com/watch?v=${this.#videoID}` : "";
  }
  set url(value) {
    this.videoID = value;
  }
  get #embedURL() {
    return this.#videoID.length > 0 ? `https://www.youtube.com/embed/${this.#videoID}?rel=0` : "";
  }
  // Drawing
  build(body) {
    let width = this.width > 0 ? this.width : DefaultWidth;
    let height = this.height > 0 ? this.height : DefaultHeight;
    let frame = Utilities.element("div", "scv-media-frame", { contenteditable: "false" });
    frame.style.cssText = `position: relative; max-width: 100%; width: ${width}px; aspect-ratio: ${width} / ${height}; border-radius: ${Math.min(width, height) / 28}px; overflow: hidden; background: rgb(15, 23, 42) center / cover no-repeat`;
    if (this.#playing && this.#videoID.length > 0) {
      frame.append(Utilities.element("iframe", "", {
        src: `${this.#embedURL}&autoplay=1`,
        title: this.strings.TextYouTubePlayerTitle,
        allowfullscreen: "true",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        referrerpolicy: "strict-origin-when-cross-origin",
        style: "position: absolute; inset: 0; width: 100%; height: 100%; border: 0"
      }));
    } else {
      if (this.#videoID.length > 0)
        frame.style.backgroundImage = `url("https://i.ytimg.com/vi/${this.#videoID}/mqdefault.jpg")`;
      let play = Utilities.element("button", "", { type: "button", title: this.strings.TextYouTubePlayCaption, "aria-label": this.strings.TextYouTubePlayCaption });
      play.style.cssText = "position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(86px, 20%); aspect-ratio: 10 / 7; border: 0; border-radius: 14px; background: rgb(255, 0, 0); color: #fff; font-size: 1.6em; display: flex; align-items: center; justify-content: center";
      play.append(Utilities.element("i", "bi bi-play-fill"));
      play.disabled = this.#videoID.length == 0;
      play.addEventListener("mousedown", (event) => event.stopPropagation());
      play.addEventListener("click", (event) => {
        event.stopPropagation();
        this.#playing = true;
        this.refresh();
      });
      frame.append(play);
      let caption = Utilities.element("div", "small");
      caption.style.cssText = "position: absolute; left: 12px; right: 12px; bottom: 10px; color: rgb(226, 232, 240); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none";
      caption.textContent = this.#videoID.length > 0 ? Utilities.format(this.strings.TextYouTubeVideoFormat, { id: this.#videoID }) : this.strings.TextYouTubeEmptyCaption;
      frame.append(caption);
    }
    let handle = Utilities.element("span", "scv-resize-handle");
    frame.append(handle);
    MediaUI.attachResize(this, handle, frame, () => height / width, (newWidth, newHeight) => {
      this.willChange();
      this.width = newWidth;
      this.height = newHeight;
      this.refresh();
      this.changed();
    });
    body.append(frame);
  }
  /** The frame carries the size and keeps the video's shape, so the node shrinks with a narrow editor. */
  applyAppearance(wrapper, body) {
    super.applyAppearance(wrapper, body);
    body.style.width = "";
    body.style.height = "";
  }
  inspectorSections() {
    let strings = this.strings;
    let section = new InspectorSection("youtube", strings.TextYouTubeVideoCaption);
    let url = section.add(new InspectorItem("youtubeurl", strings.TextYouTubeURLCaption, "url", InspectorEditors.text));
    url.description = strings.TextYouTubeURLDescription;
    return [section].concat(super.inspectorSections().filter((item) => item.identifier != "appearance" && item.identifier != "backgroundimage"));
  }
  // Persistence and export
  toJSON() {
    let result = super.toJSON();
    result["videoID"] = this.#videoID;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.#videoID = _YouTubeNode.videoIDFrom(Utilities.string(data.videoID));
    return true;
  }
  toHTML() {
    if (this.#videoID.length == 0)
      return "";
    let width = Math.round(this.width > 0 ? this.width : DefaultWidth);
    let height = Math.round(this.height > 0 ? this.height : DefaultHeight);
    return `<iframe src="${Utilities.escapeAttribute(this.#embedURL)}" title="${Utilities.escapeAttribute(this.strings.TextYouTubePlayerTitle)}" width="${width}" height="${height}" style="${this.htmlBackgroundCSS()}border:0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  }
  toMarkdown() {
    return this.toHTML();
  }
  toPlainText() {
    return this.url;
  }
};
Editor.registerNodeType(YouTubeNode, 1020);
export {
  YouTubeNode
};
