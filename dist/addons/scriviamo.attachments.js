// addons/attachments/attachmentnode.ts
import { Editor, InspectorDefaults, InspectorEditors, InspectorItem, MediaUI, Node, Strings, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities } from "scriviamo";
var AttachmentsStrings = {
  TextAttachmentCaption: "File",
  TextAttachmentToolbarTooltip: "Attach a File",
  TextAttachmentNameCaption: "File Name",
  TextDownloadAttachmentCaption: "Download",
  TextReplaceAttachmentCaption: "Replace",
  TextAttachmentAddressPrompt: "File address",
  TextAttachmentUploadingCaption: "Uploading\u2026",
  TextAttachmentUnavailableCaption: "This file couldn't be attached."
};
Strings.register(AttachmentsStrings);
var FileIcons = [
  [/\.pdf$/i, "bi-file-earmark-pdf"],
  [/\.(docx?|odt|rtf|pages)$/i, "bi-file-earmark-word"],
  [/\.(xlsx?|ods|numbers|csv|tsv)$/i, "bi-file-earmark-spreadsheet"],
  [/\.(pptx?|odp|key)$/i, "bi-file-earmark-slides"],
  [/\.(zip|tar|gz|tgz|rar|7z|bz2|xz)$/i, "bi-file-earmark-zip"],
  [/\.(png|jpe?g|gif|webp|svg|heic|avif|bmp|tiff?)$/i, "bi-file-earmark-image"],
  [/\.(mp3|wav|m4a|aac|ogg|flac)$/i, "bi-file-earmark-music"],
  [/\.(mp4|mov|webm|mkv|avi)$/i, "bi-file-earmark-play"],
  [/\.(txt|md|markdown|log)$/i, "bi-file-earmark-text"],
  [/\.(js|ts|json|html?|css|xml|ya?ml|py|rb|php|java|c|cpp|h|cs|go|rs|swift|sh)$/i, "bi-file-earmark-code"]
];
var AttachmentNode = class _AttachmentNode extends Node {
  static exportStyles(sheet, editor) {
    sheet.addRule(".attachment", `display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid ${Editor.themeCSS(editor, ThemeColors.border)}; border-radius: 8px`);
    sheet.addRule(".attachment a", "font-weight: 600; text-decoration: none");
    sheet.addRule(".attachment .attachment-size", `color: ${Editor.themeCSS(editor, ThemeColors.textMuted)}; font-size: 0.875em`);
  }
  static identifier = "attachment";
  static caption = "File";
  static captionString = "TextAttachmentCaption";
  static icon = "bi bi-paperclip";
  static keywords = "attachment file download upload document pdf zip";
  /** Any file no other type takes. */
  static droppedFileTypes = ["*"];
  static droppedFileImportPriority = -100;
  static importDroppedFile(file, _editor) {
    let node = new _AttachmentNode();
    node.fileName = file.name || "";
    node.fileSize = file.size;
    node.mimeType = file.type || "";
    Promise.resolve().then(() => node.loadFile(file));
    return node;
  }
  static importElement(element, importer) {
    if (!/^(DIV|P)$/.test(element.tagName) || !element.classList.contains("attachment"))
      return void 0;
    let link = element.querySelector("a[href]");
    if (!link)
      return void 0;
    let node = new _AttachmentNode();
    node.setSource(link.getAttribute("href") || "");
    node.fileName = link.getAttribute("download") || (link.textContent || "").trim();
    node.fileSize = Math.max(0, Utilities.integer(link.dataset.size, 0));
    node.mimeType = link.getAttribute("type") || "";
    return importer.attach(node);
  }
  /** The file's name, as shown and as it downloads. */
  fileName = "";
  /** The file's size in bytes, or 0 when unknown. */
  fileSize = 0;
  mimeType = "";
  /** A data: URI holding the file, kept in the document so it travels with it. */
  resourceData = "";
  /** A remote address for the file. */
  resourceURL = "";
  /** While the file uploads, how far along it is, from 0 to 1; -1 otherwise. Not saved. */
  uploadProgress = -1;
  get source() {
    return this.resourceData.length > 0 ? this.resourceData : this.resourceURL;
  }
  get hasResource() {
    return this.source.length > 0;
  }
  /** The name to show: the file's name, or the last part of its address. */
  get displayName() {
    if (this.fileName.length > 0)
      return this.fileName;
    if (this.resourceURL.length > 0) {
      let path = this.resourceURL.split(/[?#]/)[0];
      let last = decodeURIComponent(path.substring(path.lastIndexOf("/") + 1) || "");
      if (last.length > 0)
        return last;
    }
    return this.strings.TextAttachmentCaption;
  }
  /** The Bootstrap Icons class for the file's kind. */
  get fileIcon() {
    let name = this.displayName;
    let match = FileIcons.find(([pattern]) => pattern.test(name));
    return `bi ${match ? match[1] : "bi-file-earmark"}`;
  }
  /** A size such as "1.2 MB", or "" when unknown. */
  static formatSize(bytes) {
    if (!(bytes > 0))
      return "";
    let units = ["bytes", "KB", "MB", "GB", "TB"];
    let unit = 0;
    let value = bytes;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return unit == 0 ? `${bytes} bytes` : `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
  }
  /** The file's kind and size, such as "PDF · 1.2 MB". */
  get details() {
    let extension = this.displayName.includes(".") ? this.displayName.substring(this.displayName.lastIndexOf(".") + 1).toUpperCase() : "";
    return [extension.length > 0 && extension.length <= 5 ? extension : "", _AttachmentNode.formatSize(this.fileSize)].filter((part) => part.length > 0).join(" \xB7 ");
  }
  /** Points the attachment at a data: URI or an address, without recording a change. */
  setSource(value) {
    let source = (value || "").trim();
    if (source.toLowerCase().startsWith("data:")) {
      this.resourceData = source;
      this.resourceURL = "";
      let type = source.match(/^data:([^;,]+)/i);
      if (type && this.mimeType.length == 0)
        this.mimeType = type[1];
    } else {
      this.resourceData = "";
      this.resourceURL = source;
    }
  }
  /** Attaches a file: uploads it through the editor, or embeds it. */
  async loadFile(file) {
    this.uploadProgress = 0;
    this.refresh();
    try {
      let source = this.editor ? await this.editor.storeFile(file, "file", this, (fraction) => {
        this.uploadProgress = fraction;
        let bar = this.element ? this.element.querySelector(".scv-attachment-progress > div") : null;
        if (bar)
          bar.style.width = `${Math.round(fraction * 100)}%`;
      }) : await MediaUI.readDataURI(file);
      this.uploadProgress = -1;
      this.willChange();
      if (typeof file.name == "string" && file.name.length > 0)
        this.fileName = file.name;
      this.fileSize = file.size;
      this.mimeType = file.type || this.mimeType;
      this.setSource(source);
      this.refresh();
      this.changed();
    } catch (error) {
      this.uploadProgress = -1;
      this.refresh();
      if (this.editor && !(error instanceof DOMException && error.name == "AbortError"))
        this.editor.showMessage(this.editor.fileUploader ? this.strings.TextUploadFailedMessage : this.strings.TextAttachmentUnavailableCaption, "danger");
    }
  }
  chooseFile() {
    MediaUI.pickFile("", (file) => this.loadFile(file));
  }
  async enterURL() {
    if (!this.editor)
      return;
    let values = await this.editor.prompt(this.strings.TextAttachmentCaption, [{ name: "url", label: this.strings.TextAttachmentAddressPrompt, value: this.resourceURL, type: "url", placeholder: "https://" }]);
    if (!values || String(values.url).trim().length == 0)
      return;
    this.willChange();
    this.setSource(String(values.url));
    this.fileSize = 0;
    this.refresh();
    this.changed();
  }
  /** Saves the file through the browser. */
  download() {
    if (!this.hasResource)
      return;
    let link = Utilities.element("a", "", { href: this.source, download: this.displayName, rel: "noopener" });
    if (!this.resourceData)
      link.target = "_blank";
    document.body.append(link);
    link.click();
    link.remove();
  }
  build(body) {
    if (!this.hasResource && this.uploadProgress < 0) {
      body.append(MediaUI.placeholder(this, _AttachmentNode.icon, this.strings.TextAttachmentCaption, () => this.chooseFile(), () => this.enterURL()));
      return;
    }
    let card = Utilities.element("div", "scv-attachment", { contenteditable: "false" });
    let icon = Utilities.element("i", `${this.fileIcon} scv-attachment-icon`, { "aria-hidden": "true" });
    let text = Utilities.element("div", "scv-attachment-text");
    let name = Utilities.element("div", "scv-attachment-name");
    name.textContent = this.displayName;
    let details = Utilities.element("div", "scv-attachment-details");
    details.textContent = this.uploadProgress >= 0 ? this.strings.TextAttachmentUploadingCaption : this.details;
    text.append(name, details);
    if (this.uploadProgress >= 0) {
      let progress = Utilities.element("div", "scv-attachment-progress", { role: "progressbar" });
      let bar = Utilities.element("div", "");
      bar.style.width = `${Math.round(this.uploadProgress * 100)}%`;
      progress.append(bar);
      text.append(progress);
    }
    card.append(icon, text);
    if (this.hasResource) {
      let button = Utilities.element("button", "btn btn-sm btn-outline-secondary scv-attachment-download", { type: "button", title: this.strings.TextDownloadAttachmentCaption, "aria-label": `${this.strings.TextDownloadAttachmentCaption} ${this.displayName}` });
      button.innerHTML = '<i class="bi bi-download" aria-hidden="true"></i>';
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.download();
      });
      card.append(button);
    }
    body.append(card);
  }
  inspectorSections() {
    let strings = this.strings;
    let name = InspectorItem.bound("filename", strings.TextAttachmentNameCaption, InspectorEditors.text, (target) => target.fileName, (target, value) => target.fileName = String(value || "").trim());
    name.updatesLive = false;
    let file = InspectorItem.bound("localfile", strings.TextLocalFileCaption, InspectorEditors.file, (target) => target.resourceData.length > 0 ? "data" : "", (target, value) => {
      if (typeof value == "string" && value.startsWith("data:"))
        target.setSource(value);
    });
    let url = InspectorItem.bound("url", strings.TextURLCaption, InspectorEditors.text, (target) => target.resourceURL, (target, value) => {
      let address = String(value || "").trim();
      if (address.length > 0)
        target.setSource(address);
    });
    url.updatesLive = false;
    return [InspectorDefaults.section("attachment", strings.TextAttachmentCaption, [name, file, url])].concat(InspectorDefaults.node(this, { appearance: false, backgroundImage: false }));
  }
  actions() {
    let download = new ToolbarItem("download", this.strings.TextDownloadAttachmentCaption, "bi bi-download");
    download.enabled = this.hasResource;
    let replace = new ToolbarItem("replace", this.strings.TextReplaceAttachmentCaption, "bi bi-arrow-repeat", ToolbarItemKinds.menu);
    replace.menuItems.push(new ToolbarMenuItem("file", this.strings.TextChooseLocalFileCaption, "bi bi-folder2-open"));
    replace.menuItems.push(new ToolbarMenuItem("url", this.strings.TextEnterURLCaption, "bi bi-link-45deg"));
    return [download, replace];
  }
  performAction(item, menuItem) {
    if (item.identifier == "download") {
      this.download();
      return true;
    }
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
    if (this.fileName.length > 0)
      result["fileName"] = this.fileName;
    if (this.fileSize > 0)
      result["fileSize"] = this.fileSize;
    if (this.mimeType.length > 0)
      result["mimeType"] = this.mimeType;
    result["resourceURL"] = this.resourceURL;
    if (this.resourceData.length > 0)
      result["resourceData"] = this.resourceData;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.fileName = Utilities.string(data.fileName);
    this.fileSize = Math.max(0, Utilities.integer(data.fileSize, 0));
    this.mimeType = Utilities.string(data.mimeType);
    this.resourceData = "";
    this.resourceURL = "";
    let data64 = Utilities.string(data.resourceData).trim();
    this.setSource(data64.length > 0 ? data64 : Utilities.string(data.resourceURL));
    return true;
  }
  toHTML() {
    let size = _AttachmentNode.formatSize(this.fileSize);
    let type = this.mimeType.length > 0 ? ` type="${Utilities.escapeAttribute(this.mimeType)}"` : "";
    let sizeData = this.fileSize > 0 ? ` data-size="${this.fileSize}"` : "";
    return `<div class="attachment" style="${this.htmlBackgroundCSS()}"><a href="${Utilities.escapeAttribute(this.source)}" download="${Utilities.escapeAttribute(this.displayName)}"${type}${sizeData}>${Utilities.escapeText(this.displayName)}</a>${size.length > 0 ? ` <span class="attachment-size">(${size})</span>` : ""}</div>`;
  }
  toMarkdown() {
    let size = _AttachmentNode.formatSize(this.fileSize);
    let label = this.displayName.replace(/([\[\]\\])/g, "\\$1");
    return `[${label}](${this.source.replace(/ /g, "%20").replace(/\)/g, "%29")})${size.length > 0 ? ` (${size})` : ""}`;
  }
  toPlainText() {
    let size = _AttachmentNode.formatSize(this.fileSize);
    return size.length > 0 ? `${this.displayName} (${size})` : this.displayName;
  }
};
Editor.registerNodeType(AttachmentNode, 115);
export {
  AttachmentNode
};
