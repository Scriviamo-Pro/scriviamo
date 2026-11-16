import {Utilities} from "./internal"

/**
 * User-visible text. A locale pack ({"language": ..., "strings": {"Editor": {...}}}) applies
 * unchanged through Strings.apply.
 *
 * The base package defines its own text here. An add-on adds its text with Strings.register
 * when it is imported. Localized text always wins over these defaults, in this order:
 *
 * 1. a locale pack applied to one editor (the strings option or Editor.localize);
 * 2. the application's locale (Strings.useLocale), for every editor created after it is set;
 * 3. the text built into the base package or registered by an add-on.
 *
 * A locale pack may hold text for an add-on that has not been imported yet. That text is
 * kept, and used when the add-on is imported.
 */
export class Strings {
  TextUndoCaption: string = "Undo"
  TextRedoCaption: string = "Redo"
  TextBoldCaption: string = "Bold"
  TextItalicCaption: string = "Italic"
  TextUnderlineCaption: string = "Underline"
  TextStrikethroughCaption: string = "Strikethrough"
  TextInlineCodeCaption: string = "Inline Code"
  TextKeyboardCaption: string = "Keyboard Key"
  TextHighlightCaption: string = "Highlight"
  TextSuperscriptCaption: string = "Superscript"
  TextSubscriptCaption: string = "Subscript"
  TextClearFormattingCaption: string = "Clear Formatting"
  TextHyperlinkCaption: string = "Link"
  TextHyperlinkDialogPrompt: string = "Address"
  TextLinkTitleCaption: string = "Title"
  TextLinkTargetCaption: string = "Open in new window"
  TextRemoveLinkCaption: string = "Remove Link"
  TextTextColorCaption: string = "Text Color"
  TextBackgroundColorCaption: string = "Text Background"
  TextCustomColorCaption: string = "Custom…"
  TextDefault: string = "Default"
  TextAutomatic: string = "Automatic"
  TextFontCaption: string = "Font"
  TextFontSizeMenuCaption: string = "Size"
  TextAlignmentCaption: string = "Alignment"
  TextStartAlignmentCaption: string = "Align Start"
  TextCenterAlignmentCaption: string = "Align Center"
  TextEndAlignmentCaption: string = "Align End"
  TextJustifyAlignmentCaption: string = "Justify"
  TextInsertCaption: string = "Insert"
  TextInsertTooltip: string = "Insert content"
  TextInsertNodeSearchHint: string = "Search blocks"
  TextBlockTypeCaption: string = "Block Type"
  TextTextCaption: string = "Text"
  TextHeadingCaption: string = "Heading"
  TextHeadingLevelCaption: string = "Heading %level%"
  TextQuoteCaption: string = "Quote"
  TextDividerCaption: string = "Divider"
  TextLineThicknessCaption: string = "Thickness"
  TextLineColorCaption: string = "Color"
  TextCitationCaption: string = "Citation"
  TextDefaultQuote: string = "Quote"
  TextListInspectorCaption: string = "List"
  TextBulletedListCaption: string = "Bulleted List"
  TextNumberedListCaption: string = "Numbered List"
  TextChecklistCaption: string = "Checklist"
  TextIndentCaption: string = "Indent"
  TextOutdentCaption: string = "Outdent"
  TextCodeInspectorCaption: string = "Code"
  TextLanguageCaption: string = "Language"
  TextCopyCodeTooltip: string = "Copy"
  TextImageCaption: string = "Image"
  TextImageURLDialogTitle: string = "Image"
  TextImageURLDialogPrompt: string = "Image address"
  TextChooseLocalFileCaption: string = "Choose File…"
  TextEnterURLCaption: string = "Enter Address…"
  TextCaptionCaption: string = "Caption"
  TextFitCaption: string = "Fit"
  TextFillCaption: string = "Fill"
  TextStretchCaption: string = "Stretch"
  TextActualSizeCaption: string = "Actual Size"
  TextImageOpenErrorMessage: string = "The image could not be opened."
  TextUploadingCaption: string = "Uploading…"
  TextUploadFailedMessage: string = "The file couldn't be uploaded."
  TextTableCaption: string = "Table"
  TextTableSizeCaptionFormat: string = "%rows% × %columns%"
  TextDefaultTableHeadingFormat: string = "Heading %number%"
  TextDefaultTableCellText: string = "Cell"
  TextAddRowCaption: string = "Add Row"
  TextAddColumnCaption: string = "Add Column"
  TextInsertRowAboveCaption: string = "Insert Row Above"
  TextInsertRowBelowCaption: string = "Insert Row Below"
  TextInsertColumnBeforeCaption: string = "Insert Column Before"
  TextInsertColumnAfterCaption: string = "Insert Column After"
  TextRemoveRowCaption: string = "Delete Row"
  TextRemoveColumnCaption: string = "Delete Column"
  TextMergeCellsCaption: string = "Merge Cells"
  TextSplitCellCaption: string = "Split Cell"
  TextHeaderCaption: string = "Header Row"
  TextFooterCaption: string = "Footer Row"
  TextUnsupportedContentFormat: string = "Unsupported content: %type%"
  TextMoveUpCaption: string = "Move Up"
  TextMoveDownCaption: string = "Move Down"
  TextDuplicateNodeCaption: string = "Duplicate"
  TextRemoveNodeTooltip: string = "Delete"
  TextDragHandleTooltip: string = "Drag to move, click for options"
  TextTurnIntoCaption: string = "Turn Into"
  TextDefaultTextCaption: string = "Type / for blocks"
  TextDefaultListItemCaption: string = "List item"
  TextFindHint: string = "Find"
  TextReplaceHint: string = "Replace"
  TextReplaceCaption: string = "Replace"
  TextFindCaption: string = "Find"
  TextInlineFormatsCaption: string = "Inline Formats"
  TextDeleteCaption: string = "Delete"
  TextRemoveCaption: string = "Remove"
  TextReplaceAllCaption: string = "Replace All"
  TextFindNextCaption: string = "Next"
  TextFindPreviousCaption: string = "Previous"
  TextMatchCaseCaption: string = "Match Case"
  TextWholeWordCaption: string = "Whole Word"
  TextRegularExpressionCaption: string = "Regular Expression"
  TextMatchCountFormat: string = "%count% matches"
  TextMatchPositionFormat: string = "%index% of %count%"
  TextNoMatchesCaption: string = "No matches"
  TextSearchCaption: string = "Find and Replace"
  TextPrintCaption: string = "Print"
  TextOKCaption: string = "OK"
  TextCancelCaption: string = "Cancel"
  TextDoneCaption: string = "Done"
  TextWordsCountFormat: string = "%count% words"
  TextCharactersCountFormat: string = "%count% characters"
  TextOneWordCaption: string = "1 word"
  TextOneCharacterCaption: string = "1 character"
  TextSelectedWordsFormat: string = "%selected% of %count% words"
  TextSelectedCharactersFormat: string = "%selected% of %count% characters"
  TextReadingTimeFormat: string = "%count% min read"
  TextSavedCaption: string = "Saved"
  TextSavingCaption: string = "Saving…"
  TextUnsavedCaption: string = "Unsaved changes"
  TextSaveFailedCaption: string = "Couldn't save"
  TextTryAgainCaption: string = "Try again"
  TextStatusBarCaption: string = "Document status"

  TextAddCaption: string = "Add"
  TextPropertiesCaption: string = "Properties…"
  TextResetCaption: string = "Reset"

  TextPropertiesTabCaption: string = "Properties"
  TextDocumentInspectorCaption: string = "Document"
  TextContentInspectorCaption: string = "Content"
  TextAppearanceInspectorCaption: string = "Appearance"
  TextBordersInspectorCaption: string = "Borders"
  TextCornersInspectorCaption: string = "Corners"
  TextDimensionsInspectorCaption: string = "Dimensions"
  TextBackgroundImageCaption: string = "Background Image"
  TextTypographyInspectorCaption: string = "Typography"
  TextDirectionInspectorCaption: string = "Direction"
  TextLeftToRightDirectionCaption: string = "Left to Right"
  TextRightToLeftDirectionCaption: string = "Right to Left"
  TextLineHeightInspectorCaption: string = "Line Height"
  TextLineSpacingInspectorCaption: string = "Line Spacing"
  TextTopVisibleCaption: string = "Top"
  TextTopSizeCaption: string = "Top Width"
  TextTopColorCaption: string = "Top Color"
  TextRightVisibleCaption: string = "Right"
  TextRightSizeCaption: string = "Right Width"
  TextRightColorCaption: string = "Right Color"
  TextBottomVisibleCaption: string = "Bottom"
  TextBottomSizeCaption: string = "Bottom Width"
  TextBottomColorCaption: string = "Bottom Color"
  TextLeftVisibleCaption: string = "Left"
  TextLeftSizeCaption: string = "Left Width"
  TextLeftColorCaption: string = "Left Color"
  TextTopLeftRadiusCaption: string = "Top Left"
  TextTopRightRadiusCaption: string = "Top Right"
  TextBottomRightRadiusCaption: string = "Bottom Right"
  TextBottomLeftRadiusCaption: string = "Bottom Left"
  TextWidthInspectorCaption: string = "Width"
  TextHeightInspectorCaption: string = "Height"
  TextLocalFileCaption: string = "File"
  TextURLCaption: string = "Address"
  TextRepeatCaption: string = "Repeat"
  TextNoRepeatCaption: string = "Don't Repeat"
  TextRepeatHorizontallyCaption: string = "Horizontally"
  TextRepeatVerticallyCaption: string = "Vertically"
  TextRepeatBothCaption: string = "Both"
  TextRemoveImageCaption: string = "Remove Image"
  TextTextAlignmentInspectorCaption: string = "Text Alignment"
  TextSizeCaption: string = "Size"
  TextLevelCaption: string = "Level"
  TextTypeCaption: string = "Type"
  TextTabWidthInspectorCaption: string = "Tab Width"
  TextActiveCellCaption: string = "Selected Cell"
  TextVerticalAlignmentCaption: string = "Vertical Alignment"
  TextTopAlignmentCaption: string = "Top"
  TextMiddleAlignmentCaption: string = "Middle"
  TextBottomAlignmentCaption: string = "Bottom"
  TextUseBackgroundColorCaption: string = "Fill"
  TextFillColorCaption: string = "Fill Color"
  TextDocumentBackgroundCaption: string = "Background"
  TextCellBordersInspectorCaption: string = "Cell Borders"
  TextNoSelectionCaption: string = "No Selection"
  TextMultipleNodesFormat: string = "%count% blocks"

  TextMoveNodeCaption: string = "Move"
  TextMoveNodeTooltip: string = "Drag to move, click for options"
  TextBackgroundToolbarCaption: string = "Background"
  TextNodeBackgroundImageCaption: string = "Background Image"
  TextChooseImageMenuCaption: string = "Choose Image…"
  TextEnterImageSourceMenuCaption: string = "Enter Image Address…"
  TextWidthCaptionFormat: string = "W %value%"
  TextHeightCaptionFormat: string = "H %value%"
  TextSetNodeWidthTooltip: string = "Width"
  TextSetNodeHeightTooltip: string = "Height"

  TextCommandSearchCaption: string = "Search"
  TextCommandSearchHint: string = "Search tools and commands"
  TextCommandSearchTooltip: string = "Search tools and commands"
  TextNoMatchingCommandsCaption: string = "No matching tools"
  TextCutMenuCaption: string = "Cut"
  TextCopyMenuCaption: string = "Copy"
  TextPasteMenuCaption: string = "Paste"
  TextSelectAllMenuCaption: string = "Select All"
  TextUndoMenuCaption: string = "Undo"
  TextRedoMenuCaption: string = "Redo"
  TextAddHyperlinkMenuCaption: string = "Add Hyperlink…"
  TextEditHyperlinkMenuCaption: string = "Edit Hyperlink…"
  TextRemoveHyperlinkMenuCaption: string = "Remove Hyperlink"
  TextAddCommentCaption: string = "Add Comment"
  TextAddCommentTooltip: string = "Comment on the Selection"
  TextDefaultAuthorCaption: string = "Author"
  TextCommentHint: string = "Add a comment"
  TextCommentPositionFormat: string = "%index% of %count%"
  TextCommentsCaption: string = "Comments"
  TextDeleteCommentThreadCaption: string = "Delete"
  TextNewCommentCaption: string = "New Comment"
  TextNextCommentTooltip: string = "Next Comment"
  TextPreviousCommentTooltip: string = "Previous Comment"
  TextReopenCaption: string = "Reopen"
  TextReplyHint: string = "Reply"
  TextResolveCaption: string = "Resolve"
  TextResolvedCaption: string = "Resolved"
  TextNewCommentThreadCaption: string = "New"
  TextNewCommentThreadTooltip: string = "Start Another Discussion Here"
  TextOpenStatusCaption: string = "Open"
  TextPrintDocumentTooltip: string = "Print Document"
  TextLineHeightMenuCaption: string = "Line Height"
  TextLineSpacingMenuCaption: string = "Line Spacing"
  TextLineHeightTooltipFormat: string = "Line height: %value%"
  TextLineSpacingTooltipFormat: string = "Line spacing: %value%"
  TextCustomizeToolbarMenuCaption: string = "Customize Toolbar…"
  TextCustomizeToolbarInstructions: string = "Drag your favorite items into the toolbar…"
  TextCustomizeDefaultSetInstructions: string = "…or drag the default set into the toolbar."
  TextFlexibleSpaceCaption: string = "Flexible Space"
  TextSeparatorCaption: string = "Separator"
  TextContextToolsCaption: string = "Selection Tools"
  TextApplicationToolsCaption: string = "Application Tools"
  TextToolbarToolsCaption: string = "Toolbar"
  TextKeyboardKeyCaption: string = "Keyboard Key"
  TextToolbarShowCaption: string = "Show"
  TextIconAndTextCaption: string = "Icon and Text"
  TextIconOnlyCaption: string = "Icon Only"
  TextTextOnlyCaption: string = "Text Only"
  TextCustomFontSizeMenuCaption: string = "Custom…"
  TextCustomFontSizeFieldTooltip: string = "Enter a font size from 1 to 1000"
  TextSuggestionsCaption: string = "Suggestions"

  // Collaboration

  constructor() {
    if (Strings.#locale) this.#assign(Strings.#locale)
  }

  static #builtInNames: Set<string> | null = null
  static #registered: Set<string> = new Set()
  static #locale: {[name: string]: string} | null = null

  /**
   * Adds interface text, normally an add-on's, as {name: text}. Each name must start with
   * "Text". A name that already has text keeps it, so an add-on cannot change the base
   * package's text or another add-on's.
   */
  static register(defaults: {[name: string]: string}) {
    if (!Strings.#builtInNames) {
      let locale = Strings.#locale
      Strings.#locale = null
      Strings.#builtInNames = new Set(Object.keys(new Strings()))
      Strings.#locale = locale
    }
    for (let name of Object.keys(defaults)) {
      if (!name.startsWith("Text") || name == "Text" || typeof defaults[name] != "string") continue
      if (Strings.#builtInNames.has(name) || Strings.#registered.has(name)) continue
      Strings.#registered.add(name)
      Object.defineProperty(Strings.prototype, name, {value: defaults[name], writable: true, enumerable: true, configurable: true})
    }
  }

  /** The names of the text add-ons have registered. */
  static get registeredNames(): Array<string> {
    return Array.from(Strings.#registered)
  }

  /**
   * Sets the application's locale: a locale pack, an object of strings, or a list of either, such
   * as the base package's pack and its add-ons' for one language, used by every
   * Strings object created afterwards, including each new editor's. An editor's own locale
   * pack still wins. Pass null to go back to the built-in text. Returns the number of values
   * that apply to text known now, or 0 for a pack that is rejected.
   */
  static useLocale(pack: string | object | null): number {
    Strings.#shared = null
    if (pack === null) {
      Strings.#locale = null
      return 0
    }
    let values = Strings.#values(pack)
    if (!values) return 0
    Strings.#locale = null
    let known = new Strings()
    Strings.#locale = values
    return Object.keys(values).filter(name => typeof known[name] == "string").length
  }

  static #shared: Strings | null = null
  static get shared(): Strings {
    if (!Strings.#shared) Strings.#shared = new Strings()
    return Strings.#shared
  }

  // Accepted from locale packs so a pack written for any edition applies in full. Text that
  // belongs to an add-on's blocks, such as the form fields', is registered by that add-on.
  TextAccessibilityHintInspectorCaption: string = "Hint"
  TextAccessibilityInspectorCaption: string = "Accessibility"
  TextAccessibilityRoleInspectorCaption: string = "Role"
  TextAddHeadingCaption: string = "Add Heading"
  TextAddTableCaption: string = "Add Table"
  TextAlignmentInspectorDescription: string = "Positions the node within its container. Visible only when the node is narrower than the container. Automatic follows the container, then the document."
  TextBackgroundColorTooltip: string = "Text Background Color"
  TextBackgroundImageDialogPrompt: string = "Enter an image URL, data URI, or BASE64 value:"
  TextCellBackgroundColorCaption: string = "Cell Background Color"
  TextCellBackgroundImageCaption: string = "Cell Background Image"
  TextChangeImageCaption: string = "Change Image"
  TextCheckSpellingMenuCaption: string = "Check Spelling"
  TextChooseBackgroundImageDialogTitle: string = "Choose a Background Image"
  TextChooseCellBackgroundColorDialogTitle: string = "Choose Cell Background Color"
  TextChooseCellBackgroundImageDialogTitle: string = "Choose a Cell Background Image"
  TextChooseColorCaption: string = "Choose Color…"
  TextChooseImageDialogTitle: string = "Choose an Image"
  TextChooseTextBackgroundColorDialogTitle: string = "Choose Text Background Color"
  TextChooseTextColorDialogTitle: string = "Choose Text Color"
  TextCodeToolbarTooltip: string = "Add Code Block"
  TextCorrectSpellingAutomaticallyMenuCaption: string = "Correct Spelling Automatically"
  TextDefaultImageCaption: string = "Image Caption"
  TextDividerToolbarTooltip: string = "Add Divider"
  TextDuplicateNodeTooltip: string = "Duplicate Node"
  TextEmojiAndSymbolsMenuCaption: string = "Emoji & Symbols…"
  TextExternalIDCaption: string = "External ID"
  TextFontFamilyMenuCaption: string = "Font Family"
  TextFontSearchHint: string = "Search fonts"
  TextFontSearchTooltip: string = "Search available fonts"
  TextIgnoreSpellingMenuCaption: string = "Ignore Spelling"
  TextImageDownloadErrorMessage: string = "The image could not be downloaded."
  TextImageFillModeCaption: string = "Image Fill Mode"
  TextImageRequestErrorMessage: string = "The image request could not be started."
  TextImageToolbarTooltip: string = "Add Image"
  TextInsertNodeSearchTooltip: string = "Search registered node types"
  TextLanguageInspectorCaption: string = "Language"
  TextLearnSpellingMenuCaption: string = "Learn Spelling"
  TextLineHeightInspectorDescription: string = "Text line-height multiplier."
  TextLineSpacingInspectorDescription: string = "Additional spacing between text lines."
  TextLinkTitleHint: string = "Optional link title"
  TextListToolbarTooltip: string = "Add List"
  TextListTypeCaption: string = "List Type"
  TextMatchCaseTooltip: string = "Match Case"
  TextNoHighlightCaption: string = "No Highlight"
  TextNoMatchingFontsCaption: string = "No matching fonts"
  TextNoMatchingNodeTypesCaption: string = "No matching node types"
  TextNodeHeightFieldTooltip: string = "Enter a height from 1 to 10000"
  TextNodeWidthFieldTooltip: string = "Enter a width from 1 to 10000"
  TextOneMatchCaption: string = "1 match"
  TextOrderedCaption: string = "Ordered"
  TextPlainTextCaption: string = "Plain Text"
  TextPreviewCaption: string = "Preview"
  TextQuoteToolbarTooltip: string = "Add Quote"
  TextRegExTooltip: string = "Regular Expression"
  TextRemoveColorCaption: string = "Remove Color"
  TextRemoveFormattingTooltip: string = "Remove Formatting"
  TextRemoveSelectedNodeTooltip: string = "Remove Selected Node"
  TextRemoveSourceCaption: string = "Remove Source"
  TextSelectCaption: string = "Select…"
  TextSourceCaption: string = "Source"
  TextSpellingMenuCaption: string = "Spelling"
  TextStrikethroughTooltip: string = "Strikethrough"
  TextTableCellCaption: string = "Table Cell"
  TextTargetCaption: string = "Target"
  TextTextAlignmentInspectorDescription: string = "Aligns the text inside this node. Automatic is left-aligned and does not follow the node or document alignment."
  TextTextToolbarTooltip: string = "Add Text"
  TextToggleFooterRowCaption: string = "Toggle Footer Row"
  TextToggleHeaderRowCaption: string = "Toggle Header Row"
  TextUnmergeCellsCaption: string = "Unmerge Cells"
  TextUnorderedCaption: string = "Unordered"
  TextUnsupportedDownloadedImageMessage: string = "The downloaded resource is not a supported image."
  TextWholeWordTooltip: string = "Whole Word"


  /**
   * Applies a locale pack. Accepts the locale pack format, an object of strings, a list of
   * either, or JSON text of any of these. Returns the number of values applied.
   */
  apply(pack: string | object): number {
    let values = Strings.#values(pack)
    return values ? this.#assign(values) : 0
  }

  /**
   * Sets text by name. Text for a name that isn't known yet is kept for the add-on that
   * registers it later, but only known names are counted.
   */
  #assign(values: {[name: string]: string}): number {
    let count = 0
    for (let name of Object.keys(values)) {
      if (typeof this[name] == "string") count++
      this[name] = values[name]
    }
    return count
  }

  /** The text in a locale pack, an object of strings, or JSON text of either, or null when it is rejected. */
  static #values(pack: string | object): {[name: string]: string} | null {
    let data: any = pack
    if (typeof pack == "string") {
      if (pack.length == 0 || pack.length > Strings.#maximumPackLength) return null
      try {
        data = JSON.parse(pack)
      } catch {
        return null
      }
    }
    // Several packs, such as the base package's and its add-ons', apply in order.
    if (Array.isArray(data)) {
      let merged: {[name: string]: string} = {}
      for (let item of data) {
        let values = item && typeof item == "object" ? Strings.#values(item) : null
        if (!values) return null
        Object.assign(merged, values)
      }
      return merged
    }
    if (!data || typeof data != "object") return null
    let values: {[name: string]: string} = {}
    if ("strings" in data || "language" in data) {
      // A locale pack: a BCP 47 language and strings keyed by class name. A pack
      // with an invalid language or a value that isn't text is rejected whole.
      if (!Strings.isValidLanguageTag(Utilities.string(data.language))) return null
      let sections = data.strings
      if (!sections || typeof sections != "object" || Array.isArray(sections)) return null
      for (let section of Object.keys(sections)) {
        let entries = sections[section]
        if (section.trim().length == 0 || section.length > 128) return null
        if (!entries || typeof entries != "object") continue
        if (Array.isArray(entries)) return null
        for (let name of Object.keys(entries)) {
          if (name == "Text" || !name.startsWith("Text")) continue
          if (name.length > 128 || typeof entries[name] != "string" || entries[name].length > 65536) return null
          let type = section.trim().split(".").pop().toLowerCase()
          if (type == "editor" || type == "inspector") values[name] = entries[name]
        }
      }
    } else {
      for (let name of Object.keys(data)) {
        if (name.startsWith("Text") && name != "Text" && typeof data[name] == "string") values[name] = data[name]
      }
    }
    return values
  }

  static readonly #maximumPackLength: number = 1048576

  /** True for an empty tag or letters, digits and single hyphens, such as fr-CA; underscores count as hyphens. */
  static isValidLanguageTag(value: string): boolean {
    value = value.trim().replace(/_/g, "-")
    if (value.length == 0) return true
    return value.length <= 64 && /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/.test(value)
  }
}
