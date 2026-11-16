// addons/forms/formnodes.ts
import { Editor, InspectorDefaults, InspectorEditors, InspectorItem, InspectorSection, Node, RichText, Strings, TableNode, TextHost, TextHostModes, TextNode, TextStyle, ThemeColors, ToolbarItem, ToolbarItemKinds, ToolbarMenuItem, Utilities } from "scriviamo";
var FormsStrings = {
  TextFormCaption: "Form",
  TextAreaCaption: "Text Area",
  TextCheckboxCaption: "Checkbox",
  TextRadioGroupCaption: "Radio Group",
  TextDropdownCaption: "Dropdown",
  TextDatalistCaption: "Datalist",
  TextButtonCaption: "Button",
  TextLabelCaption: "Label",
  TextDefaultRadioGroupLegend: "Choose one",
  TextFirstOptionCaption: "First option",
  TextSecondOptionCaption: "Second option",
  TextOptionNumberFormat: "Option %number%",
  TextAddOptionCaption: "Add Option",
  TextRemoveOptionCaption: "Remove Option",
  TextOptionsCaption: "Options\u2026",
  TextOptionsDialogPrompt: "One option per line. Start a line with * to select it, and write value | caption to give it a separate value.",
  TextInputTypeCaption: "Input Type",
  TextButtonTypeCaption: "Button Type",
  TextSubmitCaption: "Submit",
  TextLayoutCaption: "Layout",
  TextHorizontalCaption: "Horizontal",
  TextVerticalCaption: "Vertical",
  TextNameCaption: "Name",
  TextIDCaption: "ID",
  TextPlaceholderCaption: "Placeholder",
  TextRequiredCaption: "Required",
  TextReadOnlyCaption: "Read only",
  TextDisabledCaption: "Disabled",
  TextAutofocusCaption: "Autofocus",
  TextValueCaption: "Value",
  TextForControlIDCaption: "For control ID",
  TextFormIDCaption: "Form ID",
  TextFormActionCaption: "Action",
  TextFormMethodCaption: "Method",
  TextFormTargetCaption: "Target",
  TextEncodingCaption: "Encoding",
  TextNoValidateCaption: "Skip validation",
  TextAutocompleteCaption: "Autocomplete",
  TextMultipleCaption: "Allow multiple selections",
  TextVisibleRowsCaption: "Visible rows",
  TextRowsCaption: "Rows",
  TextColumnsWidthCaption: "Columns",
  TextWrapCaption: "Wrap",
  TextMaxLengthCaption: "Maximum length",
  TextMinLengthCaption: "Minimum length",
  TextPatternCaption: "Pattern",
  TextDatalistIDCaption: "Suggestions list ID",
  TextDatalistLabelFormat: "Suggestions: %id%",
  TextCheckedCaption: "Checked",
  TextIndeterminateCaption: "Indeterminate",
  TextFieldInspectorCaption: "Field",
  TextInputCaption: "Input",
  TextInputModeCaption: "Input Mode",
  TextDirectionNameCaption: "Direction Name",
  TextSpellCheckCaption: "Spell Check",
  TextNoneCaption: "None",
  TextCommandCaption: "Command",
  TextCommandForCaption: "Command For",
  TextPopoverTargetCaption: "Popover Target",
  TextPopoverActionCaption: "Popover Action",
  TextRelationshipCaption: "Relationship",
  TextAcceptCharsetCaption: "Character Sets",
  TextLegendCaption: "Legend",
  TextOptionLabelCaption: "Option Label",
  TextOptionValueCaption: "Option Value",
  TextDefaultSelectionCaption: "Selected by Default",
  TextOptionDisabledCaption: "Option Disabled",
  TextOptionCaption: "Option",
  TextAddBeforeCaption: "Add Before",
  TextAddAfterCaption: "Add After",
  TextOnCaption: "On",
  TextOffCaption: "Off",
  TextSoftCaption: "Soft",
  TextHardCaption: "Hard",
  TextTextFieldCaption: "Text Field",
  TextDefaultTextFieldPlaceholder: "Text field",
  TextAcceptedCharacterSetsCaption: "Accepted Character Sets",
  TextAcceptedCharacterSetsDialogPrompt: "Enter space-separated character encodings:",
  TextActionCaption: "Action",
  TextAddOptionDialogPrompt: "Enter the option caption:",
  TextAddRadioOptionDialogTitle: "Add Radio Option",
  TextAllowMultipleSelectionsCaption: "Allow Multiple Selections",
  TextAssociatedFormDialogPrompt: "Enter the owning form's ID, or leave empty:",
  TextAssociatedFormDialogTitle: "Associated Form",
  TextAssociatedFormIDCaption: "Associated Form ID",
  TextAutocompleteDialogPrompt: "Enter the autocomplete token or leave empty:",
  TextButtonCommandDialogPrompt: "Enter the command keyword:",
  TextButtonCommandDialogTitle: "Button Command",
  TextButtonFormActionDialogPrompt: "Enter the submission URL override:",
  TextButtonPropertiesCaption: "Button Properties",
  TextButtonToolbarTooltip: "Add Button",
  TextButtonValueDialogTitle: "Button Value",
  TextCheckboxPropertiesCaption: "Checkbox Properties",
  TextCheckboxToolbarTooltip: "Add Checkbox",
  TextCheckboxValueDialogTitle: "Checkbox Value",
  TextColorTypeCaption: "Color",
  TextControlIDDialogPrompt: "Enter the HTML element ID:",
  TextControlIDDialogTitle: "Control ID",
  TextControlNameDialogPrompt: "Enter the form submission name:",
  TextControlNameDialogTitle: "Control Name",
  TextDatalistDialogPrompt: "Enter the associated datalist ID:",
  TextDatalistIDDialogPrompt: "Enter the ID referenced by text fields:",
  TextDatalistIDDialogTitle: "Datalist ID",
  TextDatalistOptionDialogPrompt: "Enter the option value:",
  TextDatalistPropertiesCaption: "Datalist Properties",
  TextDatalistToolbarTooltip: "Add Datalist",
  TextDateTimeTypeCaption: "Date and Time",
  TextDateTypeCaption: "Date",
  TextDialogCaption: "Dialog",
  TextDropdownPropertiesCaption: "Dropdown Properties",
  TextDropdownToolbarTooltip: "Add Dropdown",
  TextEmailTypeCaption: "Email",
  TextEncodingTypeCaption: "Encoding Type",
  TextFileTypeCaption: "File",
  TextFormActionDialogPrompt: "Enter the form submission URL:",
  TextFormEncodingCaption: "Form Encoding",
  TextFormIDDialogPrompt: "Enter the form element ID:",
  TextFormIDDialogTitle: "Form ID",
  TextFormNameDialogPrompt: "Enter the form name:",
  TextFormNameDialogTitle: "Form Name",
  TextFormPropertiesCaption: "Form Properties",
  TextFormRelationshipDialogPrompt: "Enter the relationship tokens:",
  TextFormRelationshipDialogTitle: "Form Relationship",
  TextFormTargetDialogPrompt: "Enter the browsing-context target:",
  TextFormToolbarTooltip: "Add Form",
  TextGetCaption: "GET",
  TextGroupCaption: "Group",
  TextGroupLegendDialogPrompt: "Enter the group legend:",
  TextHiddenTypeCaption: "Hidden",
  TextInputModeDialogPrompt: "Enter the inputmode value:",
  TextInvalidPatternCaption: "Invalid pattern",
  TextLabelPropertiesCaption: "Label Properties",
  TextLabelTargetDialogPrompt: "Enter the ID of the labeled control:",
  TextLabelTargetDialogTitle: "Label Target",
  TextLabelToolbarTooltip: "Add Label",
  TextMaximumLengthCaption: "Maximum Length",
  TextMethodCaption: "Method",
  TextMinimumLengthCaption: "Minimum Length",
  TextMonthTypeCaption: "Month",
  TextMultipartFormDataCaption: "Multipart Form Data",
  TextNewOptionCaption: "New Option",
  TextNoIDCaption: "(no ID)",
  TextNumberTypeCaption: "Number",
  TextOptionCaptionDialogPrompt: "Enter the visible option caption:",
  TextOptionCaptionDialogTitle: "Option Caption",
  TextOptionValueDialogPrompt: "Enter the submitted option value:",
  TextOptionValueDialogTitle: "Option Value",
  TextPOSTCaption: "POST",
  TextPasswordTypeCaption: "Password",
  TextPlaceholderDialogPrompt: "Enter the placeholder text:",
  TextRadioGroupLegendDialogTitle: "Radio Group Legend",
  TextRadioGroupPropertiesCaption: "Radio Group Properties",
  TextRadioGroupToolbarTooltip: "Add Radio Group",
  TextRadioLabelDialogPrompt: "Enter the accompanying label:",
  TextRadioLabelDialogTitle: "Radio Label",
  TextRadioValueDialogTitle: "Radio Value",
  TextRangeTypeCaption: "Range",
  TextSearchTypeCaption: "Search",
  TextSkipValidationCaption: "Skip Validation",
  TextSubmissionValueCaption: "Submission Value",
  TextSubmittedValueDialogPrompt: "Enter the submitted value:",
  TextSuggestionLabelDialogPrompt: "Enter the optional display label:",
  TextSuggestionLabelDialogTitle: "Suggestion Label",
  TextSuggestionValueDialogPrompt: "Enter the suggested value:",
  TextSuggestionValueDialogTitle: "Suggestion Value",
  TextTelephoneTypeCaption: "Telephone",
  TextTextAreaToolbarTooltip: "Add Text Area",
  TextTextFieldToolbarTooltip: "Add Text Field",
  TextTimeTypeCaption: "Time",
  TextURLEncodedCaption: "URL Encoded",
  TextValidationPatternCaption: "Validation Pattern",
  TextValidationPatternDialogPrompt: "Enter the regular-expression pattern:",
  TextWeekTypeCaption: "Week"
};
Strings.register(FormsStrings);
var FormOption = class _FormOption {
  captionContent = new RichText();
  disabled = false;
  selected = false;
  value = "";
  constructor(caption = "", value = "", selected = false) {
    this.captionContent = new RichText(caption);
    this.value = value;
    this.selected = selected;
  }
  get caption() {
    return this.captionContent.text.replace(/[\n\u2028]/g, " ");
  }
  set caption(value) {
    this.captionContent = new RichText(value);
  }
  static fromJSON(data) {
    if (!data || typeof data != "object")
      return null;
    let result = new _FormOption(Utilities.string(data.caption));
    if (data.captionContent)
      result.captionContent = RichText.fromJSON(data.captionContent);
    result.disabled = Utilities.boolean(data.disabled, false);
    result.selected = Utilities.boolean(data.selected, false);
    result.value = Utilities.string(data.value);
    return result;
  }
  toJSON() {
    let result = {};
    if (this.caption.length > 0)
      result["caption"] = this.caption;
    result["captionContent"] = this.captionContent.toJSON();
    if (this.disabled)
      result["disabled"] = true;
    if (this.selected)
      result["selected"] = true;
    if (this.value.length > 0)
      result["value"] = this.value;
    return result;
  }
  clone() {
    return _FormOption.fromJSON(this.toJSON());
  }
  /** Options as editable text: one per line, "*" marks a selected option, "value | caption" sets a value. */
  static toLines(options) {
    return options.map((option) => {
      let line = option.value.length > 0 && option.value != option.caption ? `${option.value} | ${option.caption}` : option.caption;
      return (option.selected ? "* " : "") + line;
    }).join("\n");
  }
  static fromLines(text, previous) {
    return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0).map((line) => {
      let selected = line.startsWith("*");
      if (selected)
        line = line.substring(1).trim();
      let value = "";
      let caption = line;
      let bar = line.indexOf("|");
      if (bar >= 0) {
        value = line.substring(0, bar).trim();
        caption = line.substring(bar + 1).trim();
      }
      let existing = previous.find((option2) => option2.caption == caption);
      let option = existing ? existing.clone() : new _FormOption(caption);
      option.value = value;
      option.selected = selected;
      return option;
    });
  }
};
var FormSupport = class _FormSupport {
  static optionSections(node, prefix, withSelection) {
    let strings = node.strings;
    let result = [];
    let insert = (target, at) => {
      target.options.splice(at, 0, new FormOption(Utilities.format(strings.TextOptionNumberFormat, { number: at + 1 }), ""));
    };
    node.options.forEach((_option, index) => {
      let section = new InspectorSection(`${prefix}option${index}`, `${strings.TextOptionCaption} ${index + 1}`);
      let optionOf = (target) => target.options[index] || new FormOption();
      section.add(InspectorItem.bound(`optioncaption${index}`, strings.TextLabelCaption, InspectorEditors.text, (target) => optionOf(target).caption, (target, value) => optionOf(target).caption = String(value || "")));
      section.add(InspectorItem.bound(`optionvalue${index}`, strings.TextValueCaption, InspectorEditors.text, (target) => optionOf(target).value, (target, value) => optionOf(target).value = String(value || "")));
      if (withSelection) {
        section.add(InspectorItem.bound(`optionselected${index}`, strings.TextDefaultSelectionCaption, InspectorEditors.toggle, (target) => optionOf(target).selected, (target, value) => {
          if (value === true && !target.multiple)
            target.options.forEach((other) => other.selected = false);
          optionOf(target).selected = value === true;
        }));
      }
      section.add(InspectorItem.bound(`optiondisabled${index}`, strings.TextDisabledCaption, InspectorEditors.toggle, (target) => optionOf(target).disabled, (target, value) => optionOf(target).disabled = value === true));
      section.add(InspectorItem.actionItem(`${prefix}:insertbefore:${index}`, "", strings.TextAddBeforeCaption, (target) => insert(target, index)));
      section.add(InspectorItem.actionItem(`${prefix}:insertafter:${index}`, "", strings.TextAddAfterCaption, (target) => insert(target, index + 1)));
      let remove = section.add(InspectorItem.actionItem(`${prefix}:remove:${index}`, "", strings.TextRemoveOptionCaption, (target) => target.options.splice(index, 1)));
      remove.enabled = node.options.length > 1;
      section.items().forEach((item) => item.setDefaultValue(void 0));
      section.item(`optioncaption${index}`)?.setDefaultValue(Utilities.format(strings.TextOptionNumberFormat, { number: index + 1 }));
      section.item(`optionvalue${index}`)?.setDefaultValue("");
      section.item(`optionselected${index}`)?.setDefaultValue(false);
      section.item(`optiondisabled${index}`)?.setDefaultValue(false);
      result.push(section);
    });
    return result;
  }
  static formControl(node) {
    let strings = node.strings;
    let field = new InspectorSection("field", strings.TextFieldInspectorCaption);
    field.add(new InspectorItem("name", strings.TextNameCaption, "name", InspectorEditors.text));
    field.add(new InspectorItem("id", strings.TextIDCaption, "id", InspectorEditors.text));
    field.add(new InspectorItem("formid", strings.TextFormIDCaption, "formID", InspectorEditors.text));
    field.add(new InspectorItem("autofocus", strings.TextAutofocusCaption, "autoFocus", InspectorEditors.toggle));
    field.add(new InspectorItem("disabled", strings.TextDisabledCaption, "disabled", InspectorEditors.toggle));
    return [field].concat(InspectorDefaults.text(node));
  }
  /** Reads the attributes every form control has. */
  static readControl(element, node) {
    node.id = element.id;
    node.name = element.getAttribute("name") || "";
    node.formID = element.getAttribute("form") || "";
    node.disabled = element.hasAttribute("disabled");
    node.autoFocus = element.hasAttribute("autofocus");
  }
  /** Reads a text field's or text area's attributes. */
  static readField(element, field) {
    _FormSupport.readControl(element, field);
    field.placeholder = element.getAttribute("placeholder") || "";
    field.required = element.hasAttribute("required");
    field.readOnly = element.hasAttribute("readonly");
    field.autoComplete = element.getAttribute("autocomplete") || "";
    field.listID = element.getAttribute("list") || "";
    field.pattern = element.getAttribute("pattern") || "";
    field.inputMode = element.getAttribute("inputmode") || "";
    field.dirName = element.getAttribute("dirname") || "";
    field.spellCheck = element.getAttribute("spellcheck") || "";
    field.maxLength = Utilities.integer(element.getAttribute("maxlength"), -1);
    field.minLength = Utilities.integer(element.getAttribute("minlength"), -1);
    field.size = Utilities.integer(element.getAttribute("size"), 0);
  }
  static item(identifier, caption, propertyName, editor) {
    return new InspectorItem(identifier, caption, propertyName, editor);
  }
};
var FormControlNode = class extends TextNode {
  get inspectorShowsText() {
    return false;
  }
  inspectorSections() {
    return FormSupport.formControl(this);
  }
  static exportStyles(sheet, editor) {
    super.exportStyles(sheet, editor);
    sheet.addRule("input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']):not([type='reset']), textarea, select", `width: 100%; max-width: 100%; padding: 10px 12px; border: 1px solid ${Editor.themeCSS(editor, ThemeColors.borderStrong)}; border-radius: 5px; background: ${Editor.themeCSS(editor, ThemeColors.background)}; color: ${Editor.themeCSS(editor, ThemeColors.text)}; font: inherit`);
    sheet.addRule("textarea", "min-height: 96px; resize: vertical");
    sheet.addRule("button, input[type='button'], input[type='submit'], input[type='reset']", `padding: 10px 16px; border: 0; border-radius: 6px; background: ${Editor.themeCSS(editor, ThemeColors.primary)}; color: #ffffff; font: inherit; font-weight: 600; cursor: pointer`);
    sheet.addRule("button:disabled, input:disabled, textarea:disabled, select:disabled", "cursor: default; opacity: 0.6");
    sheet.addRule("label > input[type='checkbox'], label > input[type='radio']", "margin-right: 8px; vertical-align: middle");
  }
  static insertable = false;
  autoFocus = false;
  disabled = false;
  formID = "";
  id = "";
  name = "";
  /** Fields for the Properties dialog. */
  propertyFields() {
    let strings = this.strings;
    return [
      { name: "name", label: strings.TextNameCaption, value: this.name },
      { name: "id", label: strings.TextIDCaption, value: this.id },
      { name: "formID", label: strings.TextFormIDCaption, value: this.formID },
      { name: "disabled", label: strings.TextDisabledCaption, value: this.disabled, type: "checkbox" },
      { name: "autoFocus", label: strings.TextAutofocusCaption, value: this.autoFocus, type: "checkbox" }
    ];
  }
  /** Applies values from the Properties dialog. */
  applyProperties(values) {
    this.name = String(values.name || "").trim();
    this.id = String(values.id || "").trim();
    this.formID = String(values.formID || "").trim();
    this.disabled = values.disabled === true;
    this.autoFocus = values.autoFocus === true;
  }
  async editProperties() {
    if (!this.editor || this.editor.readOnly)
      return;
    let values = await this.editor.prompt(this.typeName, this.propertyFields());
    if (!values)
      return;
    this.willChange();
    this.applyProperties(values);
    this.refresh();
    this.changed();
  }
  propertiesItem() {
    return new ToolbarItem("properties", this.strings.TextPropertiesCaption, "bi bi-sliders");
  }
  actions() {
    return [this.propertiesItem()];
  }
  performAction(item, _menuItem) {
    if (item.identifier == "properties") {
      this.editProperties();
      return true;
    }
    return false;
  }
  applyAppearance(wrapper, body) {
    super.applyAppearance(wrapper, body);
    wrapper.classList.toggle("scv-control-disabled", this.disabled);
  }
  htmlFormAttributes(includeID = true, includeStyle = true) {
    let result = "";
    if (includeID && this.id.length > 0)
      result += ` id="${Utilities.escapeAttribute(this.id)}"`;
    if (this.name.length > 0)
      result += ` name="${Utilities.escapeAttribute(this.name)}"`;
    if (this.formID.length > 0)
      result += ` form="${Utilities.escapeAttribute(this.formID)}"`;
    if (this.autoFocus)
      result += " autofocus";
    if (this.disabled)
      result += " disabled";
    let css = this.htmlBackgroundCSS();
    if (includeStyle && css.length > 0)
      result += ` style="${Utilities.escapeAttribute(css)}"`;
    return result;
  }
  toJSON() {
    let result = super.toJSON();
    if (this.autoFocus)
      result["autoFocus"] = true;
    if (this.disabled)
      result["disabled"] = true;
    if (this.formID.length > 0)
      result["formID"] = this.formID;
    if (this.id.length > 0)
      result["id"] = this.id;
    if (this.name.length > 0)
      result["name"] = this.name;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.autoFocus = Utilities.boolean(data.autoFocus, false);
    this.disabled = Utilities.boolean(data.disabled, false);
    this.formID = Utilities.string(data.formID);
    this.id = Utilities.string(data.id);
    this.name = Utilities.string(data.name);
    return true;
  }
  createFollowingNode() {
    return new TextNode();
  }
  toMarkdown() {
    return this.toHTML();
  }
};
var TextFieldTypes = /* @__PURE__ */ ((TextFieldTypes2) => {
  TextFieldTypes2[TextFieldTypes2["text"] = 0] = "text";
  TextFieldTypes2[TextFieldTypes2["search"] = 1] = "search";
  TextFieldTypes2[TextFieldTypes2["telephone"] = 2] = "telephone";
  TextFieldTypes2[TextFieldTypes2["url"] = 3] = "url";
  TextFieldTypes2[TextFieldTypes2["email"] = 4] = "email";
  TextFieldTypes2[TextFieldTypes2["password"] = 5] = "password";
  TextFieldTypes2[TextFieldTypes2["number"] = 6] = "number";
  TextFieldTypes2[TextFieldTypes2["range"] = 7] = "range";
  TextFieldTypes2[TextFieldTypes2["date"] = 8] = "date";
  TextFieldTypes2[TextFieldTypes2["dateTimeLocal"] = 9] = "dateTimeLocal";
  TextFieldTypes2[TextFieldTypes2["month"] = 10] = "month";
  TextFieldTypes2[TextFieldTypes2["week"] = 11] = "week";
  TextFieldTypes2[TextFieldTypes2["time"] = 12] = "time";
  TextFieldTypes2[TextFieldTypes2["color"] = 13] = "color";
  TextFieldTypes2[TextFieldTypes2["file"] = 14] = "file";
  TextFieldTypes2[TextFieldTypes2["hidden"] = 15] = "hidden";
  return TextFieldTypes2;
})(TextFieldTypes || {});
var TextFieldNode = class _TextFieldNode extends FormControlNode {
  static identifier = "textfield";
  static caption = "Text Field";
  static icon = "bi bi-input-cursor-text";
  static keywords = "form input field textbox email password number date";
  static importElement(element, importer) {
    if (element.tagName != "INPUT")
      return void 0;
    let type = (element.getAttribute("type") || "text").toLowerCase();
    if (/^(checkbox|radio|submit|reset|button|image)$/.test(type))
      return void 0;
    let field = new _TextFieldNode(element.getAttribute("value") || "");
    field.inputType = Math.max(0, _TextFieldNode.typeNames.indexOf(type));
    FormSupport.readField(element, field);
    return importer.attach(field);
  }
  get inspectorShowsTypography() {
    return false;
  }
  inspectorSections() {
    let strings = this.strings;
    let item = FormSupport.item;
    let isArea = this instanceof TextAreaNode;
    let items = [];
    if (!isArea) {
      let type = InspectorItem.menu("inputtype", strings.TextTypeCaption, _TextFieldNode.typeNames.map((name, index) => [name, index]), (target) => target.inputType, (target, value) => target.inputType = value);
      type.setDefaultValue(0 /* text */);
      items.push(type);
    }
    items.push(InspectorItem.bound("value", strings.TextValueCaption, isArea ? InspectorEditors.multilineText : InspectorEditors.text, (target) => target.value, (target, value) => InspectorDefaults.setPlainText(target, String(value || ""))));
    let placeholder = item("placeholder", strings.TextPlaceholderCaption, "placeholder", InspectorEditors.text);
    placeholder.setDefaultValue("Text field");
    items.push(placeholder, item("autocomplete", strings.TextAutocompleteCaption, "autoComplete", InspectorEditors.text), item("inputmode", strings.TextInputModeCaption, "inputMode", InspectorEditors.text), item("dirname", strings.TextDirectionNameCaption, "dirName", InspectorEditors.text));
    if (!isArea) {
      items.push(item("pattern", strings.TextPatternCaption, "pattern", InspectorEditors.text));
      let datalists = this.editor ? this.editor.allNodes().filter((other) => other instanceof DatalistNode && other.id.length > 0) : [];
      let choices = [[strings.TextNoneCaption, ""]];
      datalists.forEach((list2) => choices.push([list2.id, list2.id]));
      if (this.listID.length > 0 && !datalists.some((list2) => list2.id == this.listID))
        choices.push([this.listID, this.listID]);
      let list = InspectorItem.menu("listid", strings.TextDatalistCaption, choices, (target) => target.listID, (target, value) => target.listID = value);
      list.setDefaultValue("");
      list.availability = (target) => target.supportsDatalist;
      items.push(list);
    }
    let minimum = InspectorItem.number("minlength", strings.TextMinLengthCaption, (target) => target.minLength, (target, value) => target.minLength = Math.round(value), -1, 1e5, 1);
    let maximum = InspectorItem.number("maxlength", strings.TextMaxLengthCaption, (target) => target.maxLength, (target, value) => target.maxLength = Math.round(value), -1, 1e5, 1);
    minimum.setDefaultValue(-1);
    maximum.setDefaultValue(-1);
    items.push(minimum, maximum);
    if (!isArea) {
      let size = InspectorItem.number("size", strings.TextSizeCaption, (target) => target.size, (target, value) => target.size = Math.max(0, Math.round(value)), 0, 1e3, 1);
      size.zeroCaption = strings.TextAutomatic;
      size.setDefaultValue(0);
      items.push(size);
    }
    items.push(item("readonly", strings.TextReadOnlyCaption, "readOnly", InspectorEditors.toggle), item("required", strings.TextRequiredCaption, "required", InspectorEditors.toggle), item("spellcheck", strings.TextSpellCheckCaption, "spellCheck", InspectorEditors.text));
    let result = [InspectorDefaults.section("input", strings.TextInputCaption, items)];
    if (isArea) {
      let columns = InspectorItem.number("columns", strings.TextColumnsWidthCaption, (target) => target.columns, (target, value) => target.columns = Math.max(0, Math.round(value)), 0, 1e3, 1);
      columns.zeroCaption = strings.TextAutomatic;
      columns.setDefaultValue(0);
      let rows = InspectorItem.number("rows", strings.TextRowsCaption, (target) => target.rows, (target, value) => target.rows = Math.max(1, Math.round(value)), 1, 1e3, 1);
      rows.setDefaultValue(4);
      let wrap = InspectorItem.menu("wrap", strings.TextWrapCaption, [[strings.TextSoftCaption, "soft"], [strings.TextHardCaption, "hard"], [strings.TextOffCaption, "off"]], (target) => target.wrap, (target, value) => target.wrap = value);
      wrap.setDefaultValue("soft");
      result.push(InspectorDefaults.section("textarea", strings.TextAreaCaption, [columns, rows, wrap]));
    }
    return result.concat(FormSupport.formControl(this));
  }
  static insertable = true;
  static typeNames = ["text", "search", "tel", "url", "email", "password", "number", "range", "date", "datetime-local", "month", "week", "time", "color", "file", "hidden"];
  inputType = 0 /* text */;
  autoComplete = "";
  dirName = "";
  inputMode = "";
  listID = "";
  maxLength = -1;
  minLength = -1;
  pattern = "";
  placeholder = "Text field";
  readOnly = false;
  required = false;
  size = 0;
  spellCheck = "";
  get value() {
    return this.content.text;
  }
  set value(text) {
    this.text = text;
  }
  get hostMode() {
    return TextHostModes.plain;
  }
  get placeholderText() {
    return this.placeholder;
  }
  get supportsDatalist() {
    return [0 /* text */, 1 /* search */, 2 /* telephone */, 3 /* url */, 4 /* email */, 6 /* number */, 7 /* range */, 8 /* date */, 9 /* dateTimeLocal */, 10 /* month */, 11 /* week */, 12 /* time */, 13 /* color */].indexOf(this.inputType) >= 0;
  }
  build(body) {
    let field = Utilities.element("div", `form-control scv-field scv-field-${_TextFieldNode.typeNames[this.inputType] || "text"}`);
    if (this.size > 0)
      field.style.maxWidth = `${this.size * 0.6 + 1.5}em`;
    body.append(field);
    let text = Utilities.element("div", "scv-field-text");
    field.append(text);
    let host = this.addHost(new TextHost(this, this.content, text, this.hostMode));
    host.placeholder = this.placeholderText;
    this.applyTextAppearance(text);
    host.render();
    let badge = Utilities.element("span", "scv-field-badge", { contenteditable: "false" });
    badge.textContent = _TextFieldNode.typeNames[this.inputType] || "text";
    if (this.required)
      badge.textContent += " *";
    field.append(badge);
  }
  textChanged(_host) {
    if (/[\n\u2028]/.test(this.content.text) && this.constructor === _TextFieldNode) {
      this.content.text = this.content.text.replace(/[\n\u2028]/g, " ");
    }
  }
  handleKeyDown(event, host) {
    if (host === this.primaryHost && event.key == "Enter" && this.constructor === _TextFieldNode && this.editor) {
      event.preventDefault();
      let paragraph = new TextNode();
      this.editor.insertNodesAfter(this, [paragraph]);
      this.editor.focusNode(paragraph, 0);
      return true;
    }
    return false;
  }
  propertyFields() {
    let strings = this.strings;
    return [
      { name: "placeholder", label: strings.TextPlaceholderCaption, value: this.placeholder },
      ...super.propertyFields(),
      { name: "listID", label: strings.TextDatalistIDCaption, value: this.listID },
      { name: "pattern", label: strings.TextPatternCaption, value: this.pattern },
      { name: "minLength", label: strings.TextMinLengthCaption, value: this.minLength >= 0 ? String(this.minLength) : "", type: "number" },
      { name: "maxLength", label: strings.TextMaxLengthCaption, value: this.maxLength >= 0 ? String(this.maxLength) : "", type: "number" },
      { name: "autoComplete", label: strings.TextAutocompleteCaption, value: this.autoComplete },
      { name: "required", label: strings.TextRequiredCaption, value: this.required, type: "checkbox" },
      { name: "readOnly", label: strings.TextReadOnlyCaption, value: this.readOnly, type: "checkbox" }
    ];
  }
  applyProperties(values) {
    super.applyProperties(values);
    this.placeholder = String(values.placeholder || "");
    this.listID = String(values.listID || "").trim();
    this.pattern = String(values.pattern || "");
    this.minLength = String(values.minLength).trim().length > 0 ? Math.max(-1, Utilities.integer(values.minLength, -1)) : -1;
    this.maxLength = String(values.maxLength).trim().length > 0 ? Math.max(-1, Utilities.integer(values.maxLength, -1)) : -1;
    this.autoComplete = String(values.autoComplete || "").trim();
    this.required = values.required === true;
    this.readOnly = values.readOnly === true;
  }
  actions() {
    if (this.constructor !== _TextFieldNode)
      return super.actions();
    let type = new ToolbarItem("inputtype", _TextFieldNode.typeNames[this.inputType], "bi bi-input-cursor", ToolbarItemKinds.menu, this.strings.TextInputTypeCaption);
    type.alwaysShowCaption = true;
    _TextFieldNode.typeNames.forEach((name, index) => {
      let menuItem = new ToolbarMenuItem(String(index), name);
      menuItem.checked = index == this.inputType;
      type.menuItems.push(menuItem);
    });
    return [type, this.propertiesItem()];
  }
  performAction(item, menuItem) {
    if (item.identifier == "inputtype" && menuItem) {
      this.willChange();
      this.inputType = Number(menuItem.identifier);
      this.refresh();
      this.changed();
      return true;
    }
    return super.performAction(item, menuItem);
  }
  toJSON() {
    let result = super.toJSON();
    if (this.autoComplete.length > 0)
      result["autoComplete"] = this.autoComplete;
    if (this.dirName.length > 0)
      result["dirName"] = this.dirName;
    if (this.inputMode.length > 0)
      result["inputMode"] = this.inputMode;
    if (this.listID.length > 0)
      result["listID"] = this.listID;
    if (this.maxLength != -1)
      result["maxLength"] = this.maxLength;
    if (this.minLength != -1)
      result["minLength"] = this.minLength;
    if (this.pattern.length > 0)
      result["pattern"] = this.pattern;
    if (this.placeholder !== "Text field")
      result["placeholder"] = this.placeholder;
    if (this.readOnly)
      result["readOnly"] = true;
    if (this.required)
      result["required"] = true;
    if (this.size != 0)
      result["size"] = this.size;
    if (this.spellCheck.length > 0)
      result["spellCheck"] = this.spellCheck;
    if (this.inputType != 0 /* text */)
      result["inputType"] = this.inputType;
    if (this.value.length > 0)
      result["value"] = this.value;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.autoComplete = Utilities.string(data.autoComplete);
    this.dirName = Utilities.string(data.dirName);
    this.inputMode = Utilities.string(data.inputMode);
    this.listID = Utilities.string(data.listID);
    this.maxLength = Utilities.integer(data.maxLength, -1);
    this.minLength = Utilities.integer(data.minLength, -1);
    this.pattern = Utilities.string(data.pattern);
    this.placeholder = Utilities.string(data.placeholder, "Text field");
    this.readOnly = Utilities.boolean(data.readOnly, false);
    this.required = Utilities.boolean(data.required, false);
    this.size = Utilities.integer(data.size, 0);
    this.spellCheck = Utilities.string(data.spellCheck);
    this.inputType = Utilities.clamp(Utilities.integer(data.inputType, 0), 0, 15);
    if (this.content.length == 0 && Utilities.string(data.value).length > 0)
      this.content = new RichText(Utilities.string(data.value));
    this.content.styles = this.content.styles.map(() => new TextStyle());
    return true;
  }
  toHTML() {
    let result = `<input${this.htmlFormAttributes()} type="${_TextFieldNode.typeNames[this.inputType] || "text"}"`;
    if (this.autoComplete.length > 0)
      result += ` autocomplete="${Utilities.escapeAttribute(this.autoComplete)}"`;
    if (this.dirName.length > 0)
      result += ` dirname="${Utilities.escapeAttribute(this.dirName)}"`;
    if (this.inputMode.length > 0)
      result += ` inputmode="${Utilities.escapeAttribute(this.inputMode)}"`;
    if (this.supportsDatalist && this.listID.length > 0)
      result += ` list="${Utilities.escapeAttribute(this.listID)}"`;
    if (this.maxLength >= 0)
      result += ` maxlength="${this.maxLength}"`;
    if (this.minLength >= 0)
      result += ` minlength="${this.minLength}"`;
    if (this.pattern.length > 0)
      result += ` pattern="${Utilities.escapeAttribute(this.pattern)}"`;
    if (this.placeholder.length > 0)
      result += ` placeholder="${Utilities.escapeAttribute(this.placeholder)}"`;
    if (this.readOnly)
      result += " readonly";
    if (this.required)
      result += " required";
    if (this.size > 0 && this.size != 20)
      result += ` size="${this.size}"`;
    if (this.spellCheck.length > 0)
      result += ` spellcheck="${Utilities.escapeAttribute(this.spellCheck)}"`;
    if (this.value.length > 0)
      result += ` value="${Utilities.escapeAttribute(this.value)}"`;
    return result + ">";
  }
  toPlainText() {
    return this.value;
  }
};
var TextAreaNode = class _TextAreaNode extends TextFieldNode {
  static identifier = "textarea";
  static caption = "Text Area";
  static icon = "bi bi-textarea-resize";
  static keywords = "form input multiline comments message";
  static importElement(element, importer) {
    if (element.tagName != "TEXTAREA")
      return void 0;
    let area = new _TextAreaNode(element.textContent || "");
    FormSupport.readField(element, area);
    area.rows = Utilities.integer(element.getAttribute("rows"), 4);
    area.columns = Utilities.integer(element.getAttribute("cols"), 0);
    area.wrap = element.getAttribute("wrap") || "soft";
    return importer.attach(area);
  }
  get keepsParagraphs() {
    return true;
  }
  columns = 0;
  rows = 4;
  wrap = "soft";
  build(body) {
    super.build(body);
    let field = body.querySelector(".scv-field");
    field.classList.add("scv-field-area");
    field.style.minHeight = `${Math.max(1, this.rows) * 1.5 + 0.75}em`;
    if (this.columns > 0)
      field.style.maxWidth = `${this.columns * 0.6 + 1.5}em`;
    let badge = field.querySelector(".scv-field-badge");
    if (badge)
      badge.textContent = "textarea" + (this.required ? " *" : "");
  }
  propertyFields() {
    return super.propertyFields().filter((field) => field.name != "listID" && field.name != "pattern").concat([
      { name: "rows", label: this.strings.TextRowsCaption, value: String(this.rows), type: "number" },
      { name: "columns", label: this.strings.TextColumnsWidthCaption, value: this.columns > 0 ? String(this.columns) : "", type: "number" },
      { name: "wrap", label: this.strings.TextWrapCaption, value: this.wrap, type: "select", options: [{ value: "soft", caption: "soft" }, { value: "hard", caption: "hard" }, { value: "off", caption: "off" }] }
    ]);
  }
  applyProperties(values) {
    super.applyProperties(values);
    this.rows = Math.max(1, Utilities.integer(values.rows, 4));
    this.columns = Math.max(0, Utilities.integer(values.columns, 0));
    this.wrap = String(values.wrap || "soft");
  }
  toJSON() {
    let result = super.toJSON();
    if (this.columns != 0)
      result["columns"] = this.columns;
    if (this.rows != 4)
      result["rows"] = this.rows;
    if (this.wrap !== "soft")
      result["wrap"] = this.wrap;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.columns = Utilities.integer(data.columns, 0);
    this.rows = Utilities.integer(data.rows, 4);
    this.wrap = Utilities.string(data.wrap, "soft");
    return true;
  }
  toHTML() {
    let result = `<textarea${this.htmlFormAttributes()}`;
    if (this.autoComplete.length > 0)
      result += ` autocomplete="${Utilities.escapeAttribute(this.autoComplete)}"`;
    if (this.columns > 0 && this.columns != 20)
      result += ` cols="${this.columns}"`;
    if (this.dirName.length > 0)
      result += ` dirname="${Utilities.escapeAttribute(this.dirName)}"`;
    if (this.inputMode.length > 0)
      result += ` inputmode="${Utilities.escapeAttribute(this.inputMode)}"`;
    if (this.maxLength >= 0)
      result += ` maxlength="${this.maxLength}"`;
    if (this.minLength >= 0)
      result += ` minlength="${this.minLength}"`;
    if (this.placeholder.length > 0)
      result += ` placeholder="${Utilities.escapeAttribute(this.placeholder)}"`;
    if (this.readOnly)
      result += " readonly";
    if (this.required)
      result += " required";
    if (this.rows != 4)
      result += ` rows="${Math.max(1, this.rows)}"`;
    if (this.spellCheck.length > 0)
      result += ` spellcheck="${Utilities.escapeAttribute(this.spellCheck)}"`;
    if (this.wrap.length > 0 && this.wrap.toLowerCase() != "soft")
      result += ` wrap="${Utilities.escapeAttribute(this.wrap)}"`;
    return result + `>${Utilities.escapeText(this.value)}</textarea>`;
  }
};
var LabelNode = class _LabelNode extends TextNode {
  static identifier = "label";
  static caption = "Label";
  static icon = "bi bi-tag";
  static keywords = "form caption";
  static importElement(element, importer) {
    if (element.tagName != "LABEL" || element.querySelector("input, select, textarea"))
      return void 0;
    let label = new _LabelNode("");
    label.content = importer.trimmed(importer.richText(Array.from(element.childNodes)));
    label.forID = element.getAttribute("for") || "";
    return importer.attach(label);
  }
  inspectorSections() {
    let strings = this.strings;
    return [InspectorDefaults.section("label", strings.TextLabelCaption, [FormSupport.item("forid", strings.TextForControlIDCaption, "forID", InspectorEditors.text)])].concat(InspectorDefaults.text(this));
  }
  static create(editor) {
    let result = new _LabelNode(editor.strings.TextLabelCaption);
    result.editor = editor;
    return result;
  }
  forID = "";
  get tagName() {
    return "label";
  }
  get placeholderText() {
    return this.strings.TextLabelCaption;
  }
  actions() {
    return [new ToolbarItem("properties", this.strings.TextPropertiesCaption, "bi bi-sliders")];
  }
  performAction(item, _menuItem) {
    if (item.identifier != "properties" || !this.editor)
      return false;
    this.editor.prompt(this.typeName, [{ name: "forID", label: this.strings.TextForControlIDCaption, value: this.forID }]).then((values) => {
      if (!values)
        return;
      this.willChange();
      this.forID = String(values.forID || "").trim();
      this.changed();
    });
    return true;
  }
  toJSON() {
    let result = super.toJSON();
    if (this.forID.length > 0)
      result["forID"] = this.forID;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.forID = Utilities.string(data.forID);
    return true;
  }
  toHTML() {
    let attribute = this.forID.length > 0 ? ` for="${Utilities.escapeAttribute(this.forID)}"` : "";
    return `<label${attribute} style="${this.htmlBackgroundCSS()}${this.htmlTextAlignmentCSS()}${this.htmlLineHeightCSS()}">${this.content.htmlText()}</label>`;
  }
  toMarkdown() {
    return this.toHTML();
  }
};
var CheckboxNode = class _CheckboxNode extends FormControlNode {
  static identifier = "checkbox";
  static caption = "Checkbox";
  static icon = "bi bi-check2-square";
  static keywords = "form toggle tick option agree";
  /** A checkbox input, or a label holding one, whose other content becomes the caption. */
  static importElement(element, importer) {
    let input = null;
    let captionNodes = [];
    if (element.tagName == "INPUT" && (element.getAttribute("type") || "").toLowerCase() == "checkbox") {
      input = element;
    } else if (element.tagName == "LABEL") {
      input = element.querySelector("input[type=checkbox]");
      if (input)
        captionNodes = Array.from(element.childNodes).filter((child) => child !== input);
    }
    if (!input)
      return void 0;
    let node = new _CheckboxNode("");
    if (captionNodes.length > 0)
      node.content = importer.trimmed(importer.richText(captionNodes));
    FormSupport.readControl(input, node);
    node.checked = input.hasAttribute("checked");
    node.required = input.hasAttribute("required");
    node.value = input.getAttribute("value") || "on";
    return importer.attach(node);
  }
  inspectorSections() {
    let strings = this.strings;
    let item = FormSupport.item;
    return [InspectorDefaults.section("checkbox", strings.TextCheckboxCaption, [
      InspectorItem.bound("caption", strings.TextLabelCaption, InspectorEditors.text, (target) => target.captionText, (target, value) => InspectorDefaults.setPlainText(target, String(value || ""))),
      item("value", strings.TextValueCaption, "value", InspectorEditors.text),
      item("checked", strings.TextCheckedCaption, "checked", InspectorEditors.toggle),
      item("indeterminate", strings.TextIndeterminateCaption, "indeterminate", InspectorEditors.toggle),
      item("required", strings.TextRequiredCaption, "required", InspectorEditors.toggle)
    ])].concat(FormSupport.formControl(this));
  }
  static insertable = true;
  static create(editor) {
    let result = new _CheckboxNode(editor.strings.TextCheckboxCaption);
    result.editor = editor;
    result.value = "on";
    return result;
  }
  checked = false;
  indeterminate = false;
  required = false;
  value = "";
  get captionText() {
    return this.content.text;
  }
  get placeholderText() {
    return this.strings.TextCheckboxCaption;
  }
  build(body) {
    let row = Utilities.element("div", "form-check scv-check-control");
    let widget = Utilities.element("span", "scv-widget", { contenteditable: "false" });
    let box = Utilities.element("input", "form-check-input", { type: "checkbox", tabindex: "-1" });
    box.checked = this.checked;
    box.indeterminate = this.indeterminate;
    widget.append(box);
    row.append(widget);
    let caption = Utilities.element("span", "form-check-label scv-check-caption");
    row.append(caption);
    body.append(row);
    let host = this.addHost(new TextHost(this, this.content, caption, TextHostModes.inline));
    host.placeholder = this.placeholderText;
    this.applyTextAppearance(caption);
    host.render();
  }
  handleClick(event) {
    let target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type != "checkbox")
      return false;
    if (!this.editor || this.editor.readOnly || this.locked) {
      event.preventDefault();
      return true;
    }
    this.willChange();
    this.checked = target.checked;
    this.indeterminate = false;
    this.changed();
    return true;
  }
  propertyFields() {
    let strings = this.strings;
    return [
      { name: "value", label: strings.TextValueCaption, value: this.value },
      ...super.propertyFields(),
      { name: "required", label: strings.TextRequiredCaption, value: this.required, type: "checkbox" },
      { name: "indeterminate", label: strings.TextIndeterminateCaption, value: this.indeterminate, type: "checkbox" }
    ];
  }
  applyProperties(values) {
    super.applyProperties(values);
    this.value = String(values.value || "");
    this.required = values.required === true;
    this.indeterminate = values.indeterminate === true;
  }
  toJSON() {
    let result = super.toJSON();
    if (this.captionText.length > 0)
      result["caption"] = this.captionText;
    if (this.checked)
      result["checked"] = true;
    if (this.indeterminate)
      result["indeterminate"] = true;
    if (this.required)
      result["required"] = true;
    if (this.value.length > 0)
      result["value"] = this.value;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    if (this.content.length == 0 && Utilities.string(data.caption).length > 0)
      this.content = new RichText(Utilities.string(data.caption));
    this.checked = Utilities.boolean(data.checked, false);
    this.indeterminate = Utilities.boolean(data.indeterminate, false);
    this.required = Utilities.boolean(data.required, false);
    this.value = Utilities.string(data.value);
    return true;
  }
  toHTML() {
    let result = `<input${this.htmlFormAttributes()} type="checkbox"`;
    if (this.checked)
      result += " checked";
    if (this.required)
      result += " required";
    if (this.value.length > 0 && this.value != "on")
      result += ` value="${Utilities.escapeAttribute(this.value)}"`;
    result += ">";
    if (this.captionText.length == 0)
      return result;
    return `<label>${result}${this.content.htmlText()}</label>`;
  }
  toPlainText() {
    return `${this.checked ? "[x]" : "[ ]"} ${this.captionText}`;
  }
};
var ButtonTypes = /* @__PURE__ */ ((ButtonTypes2) => {
  ButtonTypes2[ButtonTypes2["submit"] = 0] = "submit";
  ButtonTypes2[ButtonTypes2["reset"] = 1] = "reset";
  ButtonTypes2[ButtonTypes2["button"] = 2] = "button";
  return ButtonTypes2;
})(ButtonTypes || {});
var ButtonNode = class _ButtonNode extends FormControlNode {
  static identifier = "button";
  static caption = "Button";
  static icon = "bi bi-hand-index";
  static keywords = "form submit reset action";
  static importElement(element, importer) {
    if (element.tagName == "INPUT") {
      let input = element;
      let type = (input.getAttribute("type") || "text").toLowerCase();
      if (!/^(submit|reset|button|image)$/.test(type))
        return void 0;
      let button2 = new _ButtonNode(input.value || type);
      button2.buttonType = ["submit", "reset", "button"].indexOf(type == "image" ? "submit" : type);
      FormSupport.readControl(input, button2);
      return importer.attach(button2);
    }
    if (element.tagName != "BUTTON")
      return void 0;
    let button = new _ButtonNode();
    button.content = importer.trimmed(importer.richText(Array.from(element.childNodes)));
    button.buttonType = Math.max(0, ["submit", "reset", "button"].indexOf((element.getAttribute("type") || "submit").toLowerCase()));
    FormSupport.readControl(element, button);
    button.value = element.getAttribute("value") || "";
    let attributes = [["command", "command"], ["commandFor", "commandfor"], ["formAction", "formaction"], ["formEnctype", "formenctype"], ["formMethod", "formmethod"], ["formTarget", "formtarget"], ["popoverTarget", "popovertarget"], ["popoverTargetAction", "popovertargetaction"]];
    attributes.forEach(([property, attribute]) => button[property] = element.getAttribute(attribute) || "");
    button.formNoValidate = element.hasAttribute("formnovalidate");
    return importer.attach(button);
  }
  inspectorSections() {
    let strings = this.strings;
    let item = FormSupport.item;
    let type = InspectorItem.menu("buttontype", strings.TextTypeCaption, [[strings.TextSubmitCaption, 0 /* submit */], [strings.TextResetCaption, 1 /* reset */], [strings.TextButtonCaption, 2 /* button */]], (target) => target.buttonType, (target, value) => target.buttonType = value);
    type.setDefaultValue(0 /* submit */);
    return [InspectorDefaults.section("button", strings.TextButtonCaption, [
      InspectorItem.bound("caption", strings.TextCaptionCaption, InspectorEditors.text, (target) => target.content.text, (target, value) => InspectorDefaults.setPlainText(target, String(value || ""))),
      item("value", strings.TextValueCaption, "value", InspectorEditors.text),
      type,
      item("command", strings.TextCommandCaption, "command", InspectorEditors.text),
      item("commandfor", strings.TextCommandForCaption, "commandFor", InspectorEditors.text),
      item("formaction", strings.TextFormActionCaption, "formAction", InspectorEditors.text),
      item("formenctype", strings.TextEncodingCaption, "formEnctype", InspectorEditors.text),
      item("formmethod", strings.TextFormMethodCaption, "formMethod", InspectorEditors.text),
      item("formnovalidate", strings.TextNoValidateCaption, "formNoValidate", InspectorEditors.toggle),
      item("formtarget", strings.TextFormTargetCaption, "formTarget", InspectorEditors.text),
      item("popovertarget", strings.TextPopoverTargetCaption, "popoverTarget", InspectorEditors.text),
      item("popovertargetaction", strings.TextPopoverActionCaption, "popoverTargetAction", InspectorEditors.text)
    ])].concat(FormSupport.formControl(this));
  }
  static insertable = true;
  static typeNames = ["submit", "reset", "button"];
  static create(editor) {
    let result = new _ButtonNode(editor.strings.TextButtonCaption);
    result.editor = editor;
    return result;
  }
  buttonType = 0 /* submit */;
  command = "";
  commandFor = "";
  formAction = "";
  formEnctype = "";
  formMethod = "";
  formNoValidate = false;
  formTarget = "";
  popoverTarget = "";
  popoverTargetAction = "";
  value = "";
  get placeholderText() {
    return this.strings.TextButtonCaption;
  }
  build(body) {
    let style = ["btn-primary", "btn-outline-secondary", "btn-secondary"][this.buttonType] || "btn-primary";
    let button = Utilities.element("span", `btn ${style} scv-button-control`);
    body.append(button);
    let host = this.addHost(new TextHost(this, this.content, button, TextHostModes.inline));
    host.placeholder = this.placeholderText;
    this.applyTextAppearance(button);
    host.render();
  }
  actions() {
    let strings = this.strings;
    let type = new ToolbarItem("buttontype", _ButtonNode.typeNames[this.buttonType], "bi bi-hand-index", ToolbarItemKinds.menu, strings.TextButtonTypeCaption);
    type.alwaysShowCaption = true;
    [strings.TextSubmitCaption, strings.TextResetCaption, strings.TextButtonCaption].forEach((caption, index) => {
      let menuItem = new ToolbarMenuItem(String(index), caption);
      menuItem.checked = index == this.buttonType;
      type.menuItems.push(menuItem);
    });
    return [type, this.propertiesItem()];
  }
  performAction(item, menuItem) {
    if (item.identifier == "buttontype" && menuItem) {
      this.willChange();
      this.buttonType = Number(menuItem.identifier);
      this.refresh();
      this.changed();
      return true;
    }
    return super.performAction(item, menuItem);
  }
  propertyFields() {
    let strings = this.strings;
    return [
      { name: "value", label: strings.TextValueCaption, value: this.value },
      ...super.propertyFields(),
      { name: "formAction", label: strings.TextFormActionCaption, value: this.formAction },
      { name: "formMethod", label: strings.TextFormMethodCaption, value: this.formMethod, type: "select", options: [{ value: "", caption: strings.TextDefault }, { value: "get", caption: "get" }, { value: "post", caption: "post" }, { value: "dialog", caption: "dialog" }] },
      { name: "formTarget", label: strings.TextFormTargetCaption, value: this.formTarget },
      { name: "formNoValidate", label: strings.TextNoValidateCaption, value: this.formNoValidate, type: "checkbox" }
    ];
  }
  applyProperties(values) {
    super.applyProperties(values);
    this.value = String(values.value || "");
    this.formAction = String(values.formAction || "").trim();
    this.formMethod = String(values.formMethod || "");
    this.formTarget = String(values.formTarget || "").trim();
    this.formNoValidate = values.formNoValidate === true;
  }
  toJSON() {
    let result = super.toJSON();
    if (this.content.text.length > 0)
      result["caption"] = this.content.text;
    ["command", "commandFor", "formAction", "formEnctype", "formMethod", "formTarget", "popoverTarget", "popoverTargetAction"].forEach((name) => {
      if (this[name].length > 0)
        result[name] = this[name];
    });
    if (this.formNoValidate)
      result["formNoValidate"] = true;
    if (this.buttonType != 0 /* submit */)
      result["buttonType"] = this.buttonType;
    if (this.value.length > 0)
      result["value"] = this.value;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    if (this.content.length == 0 && Utilities.string(data.caption).length > 0)
      this.content = new RichText(Utilities.string(data.caption));
    ["command", "commandFor", "formAction", "formEnctype", "formMethod", "formTarget", "popoverTarget", "popoverTargetAction", "value"].forEach((name) => this[name] = Utilities.string(data[name]));
    this.formNoValidate = Utilities.boolean(data.formNoValidate, false);
    this.buttonType = Utilities.clamp(Utilities.integer(data.buttonType, 0), 0, 2);
    return true;
  }
  toHTML() {
    let attributes = `${this.htmlFormAttributes()} type="${_ButtonNode.typeNames[this.buttonType]}"`;
    if (this.value.length > 0)
      attributes += ` value="${Utilities.escapeAttribute(this.value)}"`;
    let pairs = [["command", this.command], ["commandfor", this.commandFor], ["formaction", this.formAction], ["formenctype", this.formEnctype], ["formmethod", this.formMethod], ["formtarget", this.formTarget], ["popovertarget", this.popoverTarget], ["popovertargetaction", this.popoverTargetAction]];
    pairs.forEach(([name, value]) => {
      if (value.length > 0)
        attributes += ` ${name}="${Utilities.escapeAttribute(value)}"`;
    });
    if (this.formNoValidate)
      attributes += " formnovalidate";
    return `<button${attributes}>${this.content.htmlText()}</button>`;
  }
};
var DropdownNode = class _DropdownNode extends FormControlNode {
  static identifier = "select";
  static caption = "Dropdown";
  static icon = "bi bi-menu-button-wide";
  static keywords = "form select choice combobox list";
  static importElement(element, importer) {
    if (element.tagName != "SELECT")
      return void 0;
    let select = new _DropdownNode();
    FormSupport.readControl(element, select);
    select.multiple = element.hasAttribute("multiple");
    select.required = element.hasAttribute("required");
    select.size = Utilities.integer(element.getAttribute("size"), 1);
    select.autoComplete = element.getAttribute("autocomplete") || "";
    select.options = Array.from(element.querySelectorAll("option")).map((option) => {
      let item = new FormOption((option.textContent || "").trim(), option.getAttribute("value") ?? (option.textContent || "").trim(), option.hasAttribute("selected"));
      item.disabled = option.hasAttribute("disabled");
      return item;
    });
    return importer.attach(select);
  }
  inspectorSections() {
    let strings = this.strings;
    let item = FormSupport.item;
    let size = InspectorItem.number("size", strings.TextVisibleRowsCaption, (target) => target.size, (target, value) => target.size = Math.max(1, Math.round(value)), 1, 100, 1);
    size.setDefaultValue(1);
    return [InspectorDefaults.section("dropdown", strings.TextDropdownCaption, [
      item("autocomplete", strings.TextAutocompleteCaption, "autoComplete", InspectorEditors.text),
      item("multiple", strings.TextMultipleCaption, "multiple", InspectorEditors.toggle),
      item("required", strings.TextRequiredCaption, "required", InspectorEditors.toggle),
      size,
      InspectorItem.actionItem("dropdown:add", strings.TextOptionsCaption, strings.TextAddOptionCaption, (target) => target.options.push(new FormOption(Utilities.format(strings.TextOptionNumberFormat, { number: target.options.length + 1 }), "")))
    ])].concat(FormSupport.optionSections(this, "dropdown", true), FormSupport.formControl(this).filter((entry) => entry.identifier != "content" && entry.identifier != "typography"));
  }
  static insertable = true;
  static create(editor) {
    let result = new this();
    result.editor = editor;
    result.options = [new FormOption(editor.strings.TextFirstOptionCaption, "first", true), new FormOption(editor.strings.TextSecondOptionCaption, "second")];
    return result;
  }
  options = [];
  autoComplete = "";
  multiple = false;
  required = false;
  size = 1;
  normalizeSelection() {
    if (this.multiple)
      return;
    let found = false;
    this.options.forEach((option) => {
      if (option.selected && found)
        option.selected = false;
      if (option.selected)
        found = true;
    });
  }
  build(body) {
    let showList = this.multiple || this.size > 1;
    if (showList) {
      let list = Utilities.element("div", "form-control scv-listbox", { contenteditable: "false" });
      this.options.forEach((option) => {
        let row = Utilities.element("div", `scv-listbox-option${option.selected ? " active" : ""}${option.disabled ? " text-body-tertiary" : ""}`);
        row.textContent = option.caption;
        list.append(row);
      });
      body.append(list);
      return;
    }
    let select = Utilities.element("div", "form-select scv-select", { contenteditable: "false" });
    let selected = this.options.find((option) => option.selected) || this.options[0];
    select.textContent = selected ? selected.caption : "";
    body.append(select);
  }
  async editOptions() {
    if (!this.editor || this.editor.readOnly)
      return;
    let values = await this.editor.prompt(this.typeName, [{ name: "options", label: this.strings.TextOptionsDialogPrompt, value: FormOption.toLines(this.options), type: "textarea" }]);
    if (!values)
      return;
    this.willChange();
    this.options = FormOption.fromLines(String(values.options || ""), this.options);
    this.normalizeSelection();
    this.refresh();
    this.changed();
  }
  actions() {
    return [new ToolbarItem("options", this.strings.TextOptionsCaption, "bi bi-list-ul"), this.propertiesItem()];
  }
  performAction(item, menuItem) {
    if (item.identifier == "options") {
      this.editOptions();
      return true;
    }
    return super.performAction(item, menuItem);
  }
  propertyFields() {
    let strings = this.strings;
    return super.propertyFields().concat([
      { name: "multiple", label: strings.TextMultipleCaption, value: this.multiple, type: "checkbox" },
      { name: "size", label: strings.TextVisibleRowsCaption, value: String(this.size), type: "number" },
      { name: "autoComplete", label: strings.TextAutocompleteCaption, value: this.autoComplete },
      { name: "required", label: strings.TextRequiredCaption, value: this.required, type: "checkbox" }
    ]);
  }
  applyProperties(values) {
    super.applyProperties(values);
    this.multiple = values.multiple === true;
    this.size = Math.max(1, Utilities.integer(values.size, 1));
    this.autoComplete = String(values.autoComplete || "").trim();
    this.required = values.required === true;
    this.normalizeSelection();
  }
  toJSON() {
    let result = super.toJSON();
    if (this.autoComplete.length > 0)
      result["autoComplete"] = this.autoComplete;
    if (this.multiple)
      result["multiple"] = true;
    if (this.required)
      result["required"] = true;
    if (this.size != 1)
      result["size"] = this.size;
    result["options"] = this.options.map((option) => option.toJSON());
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.autoComplete = Utilities.string(data.autoComplete);
    this.multiple = Utilities.boolean(data.multiple, false);
    this.required = Utilities.boolean(data.required, false);
    this.size = Utilities.integer(data.size, 1);
    this.options = Array.isArray(data.options) ? data.options.map((item) => FormOption.fromJSON(item)).filter((option) => option !== null) : [];
    this.normalizeSelection();
    return true;
  }
  toHTML() {
    let result = `<select${this.htmlFormAttributes()}`;
    if (this.autoComplete.length > 0)
      result += ` autocomplete="${Utilities.escapeAttribute(this.autoComplete)}"`;
    if (this.multiple)
      result += " multiple";
    if (this.required)
      result += " required";
    if (this.size != 1)
      result += ` size="${Math.max(1, this.size)}"`;
    result += ">";
    this.options.forEach((option) => {
      result += "<option";
      if (option.value != option.caption)
        result += ` value="${Utilities.escapeAttribute(option.value)}"`;
      if (option.disabled)
        result += " disabled";
      if (option.selected)
        result += " selected";
      result += `>${Utilities.escapeText(option.caption)}</option>`;
    });
    return result + "</select>";
  }
  toPlainText() {
    return this.options.map((option) => option.caption).join(", ");
  }
};
var RadioGroupLayouts = /* @__PURE__ */ ((RadioGroupLayouts2) => {
  RadioGroupLayouts2[RadioGroupLayouts2["vertical"] = 0] = "vertical";
  RadioGroupLayouts2[RadioGroupLayouts2["horizontal"] = 1] = "horizontal";
  return RadioGroupLayouts2;
})(RadioGroupLayouts || {});
var RadioGroupNode = class _RadioGroupNode extends DropdownNode {
  static exportStyles(sheet, editor) {
    super.exportStyles(sheet, editor);
    sheet.addRule("fieldset[role='radiogroup']", "padding: 0; border: 0");
    sheet.addRule("fieldset[role='radiogroup'] > legend", "padding: 0; font-weight: 700; overflow-wrap: anywhere");
    sheet.addRule("fieldset[role='radiogroup'] > .radio-options", "display: flex; flex-direction: column; gap: var(--radio-line-spacing, 0)");
    sheet.addRule("fieldset[role='radiogroup'][aria-orientation='horizontal'] > .radio-options", "flex-direction: row; flex-wrap: wrap; column-gap: 20px");
    sheet.addRule("fieldset[role='radiogroup'] > .radio-options > label", "display: flex; align-items: center");
  }
  static identifier = "radiogroup";
  static caption = "Radio Group";
  static icon = "bi bi-ui-radios";
  static keywords = "form radio choice option fieldset";
  static importElement(element, importer) {
    if (element.tagName != "FIELDSET")
      return void 0;
    let radios = Array.from(element.querySelectorAll("input[type=radio]"));
    if (radios.length == 0)
      return void 0;
    let group = new _RadioGroupNode();
    let legend = element.querySelector("legend");
    group.legendContent = legend ? importer.trimmed(importer.richText(Array.from(legend.childNodes))) : new RichText();
    group.layout = element.getAttribute("aria-orientation") == "horizontal" ? 1 /* horizontal */ : 0 /* vertical */;
    FormSupport.readControl(radios[0], group);
    group.id = element.id;
    group.required = radios.some((radio) => radio.hasAttribute("required"));
    group.options = radios.map((radio) => {
      let holder = radio.closest("label");
      let caption = holder ? importer.trimmed(importer.richText(Array.from(holder.childNodes).filter((child) => child !== radio))) : new RichText(radio.value);
      let option = new FormOption("", radio.getAttribute("value") ?? "on", radio.hasAttribute("checked"));
      option.captionContent = caption;
      option.disabled = radio.hasAttribute("disabled");
      return option;
    });
    return importer.attach(group);
  }
  get inspectorFollowsCaret() {
    return true;
  }
  noteCaretHost(host) {
    if (this.optionIndexOf(host) >= 0)
      this.activeOptionIndex = this.optionIndexOf(host);
  }
  inspectorSections() {
    let strings = this.strings;
    let item = FormSupport.item;
    let activeIndex = (target) => Utilities.clamp(target.activeOptionIndex, 0, Math.max(0, target.options.length - 1));
    let option = (target) => target.options[activeIndex(target)] || new FormOption();
    let content = InspectorDefaults.section("content", strings.TextContentInspectorCaption, [
      InspectorItem.bound("legend", strings.TextLegendCaption, InspectorEditors.text, (target) => target.legend, (target, value) => target.legendContent = new RichText(String(value || ""), target.legendContent.styleAt(0))),
      InspectorItem.bound("activelabel", strings.TextOptionLabelCaption, InspectorEditors.text, (target) => option(target).caption, (target, value) => option(target).caption = String(value || "")),
      InspectorItem.bound("activevalue", strings.TextOptionValueCaption, InspectorEditors.text, (target) => option(target).value, (target, value) => option(target).value = String(value || "")),
      InspectorItem.bound("activeselected", strings.TextDefaultSelectionCaption, InspectorEditors.toggle, (target) => option(target).selected, (target, value) => {
        target.options.forEach((other) => other.selected = false);
        option(target).selected = value === true;
      }),
      InspectorItem.bound("activedisabled", strings.TextOptionDisabledCaption, InspectorEditors.toggle, (target) => option(target).disabled, (target, value) => option(target).disabled = value === true)
    ]);
    content.items().forEach((entry) => entry.setDefaultValue(void 0));
    content.item("activelabel")?.setDefaultValue((target) => Utilities.format(strings.TextOptionNumberFormat, { number: activeIndex(target) + 1 }));
    content.item("activevalue")?.setDefaultValue("");
    content.item("activeselected")?.setDefaultValue(false);
    content.item("activedisabled")?.setDefaultValue(false);
    let layout = InspectorItem.menu("layout", strings.TextLayoutCaption, [[strings.TextVerticalCaption, 0 /* vertical */], [strings.TextHorizontalCaption, 1 /* horizontal */]], (target) => target.layout, (target, value) => target.layout = value);
    let group = InspectorDefaults.section("radiogroup", strings.TextRadioGroupCaption, [item("required", strings.TextRequiredCaption, "required", InspectorEditors.toggle), layout]);
    let control = FormSupport.formControl(this).filter((entry) => entry.identifier != "content" && entry.identifier != "typography");
    return [content, group].concat(control);
  }
  static create(editor) {
    let result = super.create(editor);
    result.name = "choice";
    result.legendContent = new RichText(editor.strings.TextDefaultRadioGroupLegend);
    return result;
  }
  legendContent = new RichText();
  layout = 0 /* vertical */;
  /** The option whose caption last had the caret. Not saved. */
  activeOptionIndex = 0;
  get legend() {
    return this.legendContent.text.replace(/[\n\u2028]/g, " ");
  }
  build(body) {
    let fieldset = Utilities.element("fieldset", `scv-radiogroup${this.layout == 1 /* horizontal */ ? " scv-radiogroup-horizontal" : ""}`);
    let legend = Utilities.element("legend", "scv-radiogroup-legend");
    fieldset.append(legend);
    let legendHost = this.addHost(new TextHost(this, this.legendContent, legend, TextHostModes.inline));
    legendHost.placeholder = this.strings.TextDefaultRadioGroupLegend;
    legendHost.render();
    let list = Utilities.element("div", "scv-radiogroup-options");
    this.options.forEach((option, index) => {
      let row = Utilities.element("div", "form-check scv-radio-option");
      row.dataset.option = String(index);
      let widget = Utilities.element("span", "scv-widget", { contenteditable: "false" });
      let radio = Utilities.element("input", "form-check-input", { type: "radio", tabindex: "-1", name: `scv-${this.nodeId}` });
      radio.checked = option.selected;
      radio.disabled = option.disabled;
      widget.append(radio);
      row.append(widget);
      let caption = Utilities.element("span", "form-check-label");
      row.append(caption);
      let host = this.addHost(new TextHost(this, option.captionContent, caption, TextHostModes.inline));
      host.placeholder = Utilities.format(this.strings.TextOptionNumberFormat, { number: index + 1 });
      host.render();
      list.append(row);
    });
    fieldset.append(list);
    body.append(fieldset);
  }
  /** The option whose caption a host edits, or -1 for the legend. */
  optionIndexOf(host) {
    return host && host.node === this ? host.index - 1 : -1;
  }
  handleKeyDown(event, host) {
    if (!host || host.node !== this || !this.editor)
      return false;
    let index = this.optionIndexOf(host);
    if (event.key == "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.addOption(index + 1);
      return true;
    }
    if (event.key == "Backspace" && index >= 0 && host.rich.length == 0 && this.options.length > 1) {
      event.preventDefault();
      this.removeOption(index);
      return true;
    }
    return false;
  }
  addOption(at = this.options.length) {
    this.willChange();
    at = Utilities.clamp(at, 0, this.options.length);
    this.options.splice(at, 0, new FormOption("", ""));
    this.refresh();
    this.changed();
    let host = this.hosts()[at + 1];
    if (host)
      host.focus();
  }
  removeOption(index) {
    if (index < 0 || index >= this.options.length || this.options.length <= 1)
      return;
    this.willChange();
    this.options.splice(index, 1);
    this.refresh();
    this.changed();
    let host = this.hosts()[Math.max(1, index)];
    if (host)
      host.focus(true);
  }
  handleClick(event) {
    let target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type != "radio")
      return false;
    if (!this.editor || this.editor.readOnly || this.locked) {
      event.preventDefault();
      return true;
    }
    let row = target.closest(".scv-radio-option");
    let index = Utilities.integer(row ? row.dataset.option : -1, -1);
    this.willChange();
    this.options.forEach((option, optionIndex) => option.selected = optionIndex == index);
    this.changed();
    return true;
  }
  actions() {
    let strings = this.strings;
    let add = new ToolbarItem("addoption", strings.TextAddOptionCaption, "bi bi-plus-circle");
    let remove = new ToolbarItem("removeoption", strings.TextRemoveOptionCaption, "bi bi-dash-circle");
    remove.enabled = this.options.length > 1;
    let layout = new ToolbarItem("layout", strings.TextLayoutCaption, this.layout == 1 /* horizontal */ ? "bi bi-distribute-horizontal" : "bi bi-distribute-vertical", ToolbarItemKinds.menu);
    [strings.TextVerticalCaption, strings.TextHorizontalCaption].forEach((caption, index) => {
      let menuItem = new ToolbarMenuItem(String(index), caption);
      menuItem.checked = index == this.layout;
      layout.menuItems.push(menuItem);
    });
    return [add, remove, layout, this.propertiesItem()];
  }
  performAction(item, menuItem) {
    switch (item.identifier) {
      case "addoption":
        this.addOption(this.editor && this.editor.activeHost ? this.optionIndexOf(this.editor.activeHost) + 1 : this.options.length);
        return true;
      case "removeoption": {
        let index = this.editor && this.editor.activeHost ? this.optionIndexOf(this.editor.activeHost) : -1;
        this.removeOption(index >= 0 ? index : this.options.length - 1);
        return true;
      }
      case "layout":
        if (!menuItem)
          return false;
        this.willChange();
        this.layout = Number(menuItem.identifier);
        this.refresh();
        this.changed();
        return true;
    }
    return super.performAction(item, menuItem);
  }
  propertyFields() {
    return super.propertyFields().filter((field) => field.name != "multiple" && field.name != "size" && field.name != "autoComplete");
  }
  toJSON() {
    this.content = this.legendContent.clone();
    let result = super.toJSON();
    if (this.legend.length > 0)
      result["legend"] = this.legend;
    result["legendContent"] = this.legendContent.toJSON();
    if (this.layout != 0 /* vertical */)
      result["layout"] = this.layout;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.layout = Utilities.clamp(Utilities.integer(data.layout, 0), 0, 1);
    if (data.legendContent) {
      this.legendContent = RichText.fromJSON(data.legendContent);
      this.legendContent.listType = 0;
    } else {
      this.legendContent = new RichText(Utilities.string(data.legend));
    }
    return true;
  }
  toHTML() {
    let result = `<fieldset role="radiogroup"`;
    if (this.id.length > 0)
      result += ` id="${Utilities.escapeAttribute(this.id)}"`;
    result += ` aria-orientation="${this.layout == 1 /* horizontal */ ? "horizontal" : "vertical"}"`;
    result += ` style="${Utilities.escapeAttribute(this.htmlBackgroundCSS() + this.htmlTextAlignmentCSS() + this.htmlLineHeightCSS())}">`;
    if (this.legend.length > 0)
      result += `<legend>${this.legendContent.htmlText()}</legend>`;
    result += `<div class="radio-options">`;
    this.options.forEach((option, index) => {
      let optionID = this.id.length > 0 ? `${this.id}-${index}` : "";
      result += `<label><input${this.htmlFormAttributes(false, false)} type="radio"`;
      if (optionID.length > 0)
        result += ` id="${Utilities.escapeAttribute(optionID)}"`;
      if (option.value != "on")
        result += ` value="${Utilities.escapeAttribute(option.value)}"`;
      if (option.selected)
        result += " checked";
      if (option.disabled)
        result += " disabled";
      if (this.required)
        result += " required";
      result += `>${option.captionContent.htmlText()}</label>`;
    });
    return result + "</div></fieldset>";
  }
  toPlainText() {
    return [this.legend].concat(this.options.map((option) => `${option.selected ? "(\u2022)" : "( )"} ${option.caption}`)).join("\n");
  }
};
var DatalistNode = class _DatalistNode extends Node {
  static identifier = "datalist";
  static caption = "Datalist";
  static icon = "bi bi-card-list";
  static keywords = "form suggestions autocomplete options";
  static importElement(element, importer) {
    if (element.tagName != "DATALIST")
      return void 0;
    let list = new _DatalistNode();
    list.id = element.id;
    list.options = Array.from(element.querySelectorAll("option")).map((option) => {
      let value = option.getAttribute("value") || "";
      let item = new FormOption(option.getAttribute("label") || value, value);
      item.disabled = option.hasAttribute("disabled");
      return item;
    });
    return importer.attach(list);
  }
  inspectorSections() {
    let strings = this.strings;
    return [InspectorDefaults.section("datalist", strings.TextDatalistCaption, [
      FormSupport.item("id", strings.TextIDCaption, "id", InspectorEditors.text),
      InspectorItem.actionItem("datalist:add", strings.TextOptionsCaption, strings.TextAddOptionCaption, (target) => target.options.push(new FormOption(Utilities.format(strings.TextOptionNumberFormat, { number: target.options.length + 1 }), "")))
    ])].concat(FormSupport.optionSections(this, "datalist", false), InspectorDefaults.node(this));
  }
  static create(editor) {
    let result = new _DatalistNode();
    result.editor = editor;
    result.id = "suggestions";
    result.options = [new FormOption(editor.strings.TextFirstOptionCaption), new FormOption(editor.strings.TextSecondOptionCaption)];
    return result;
  }
  id = "";
  options = [];
  build(body) {
    let card = Utilities.element("div", "scv-datalist", { contenteditable: "false" });
    let title = Utilities.element("div", "scv-datalist-title small");
    title.innerHTML = `<i class="bi bi-card-list"></i> `;
    title.append(document.createTextNode(Utilities.format(this.strings.TextDatalistLabelFormat, { id: this.id.length > 0 ? this.id : "\u2014" })));
    card.append(title);
    let chips = Utilities.element("div", "scv-datalist-options");
    this.options.forEach((option) => {
      let chip = Utilities.element("span", "badge text-bg-secondary");
      chip.textContent = option.caption.length > 0 ? option.caption : option.value;
      chips.append(chip);
    });
    card.append(chips);
    body.append(card);
  }
  actions() {
    return [new ToolbarItem("options", this.strings.TextOptionsCaption, "bi bi-list-ul"), new ToolbarItem("properties", this.strings.TextPropertiesCaption, "bi bi-sliders")];
  }
  performAction(item, _menuItem) {
    if (!this.editor)
      return false;
    if (item.identifier == "options") {
      this.editor.prompt(this.typeName, [{ name: "options", label: this.strings.TextOptionsDialogPrompt, value: FormOption.toLines(this.options), type: "textarea" }]).then((values) => {
        if (!values)
          return;
        this.willChange();
        this.options = FormOption.fromLines(String(values.options || ""), this.options);
        this.options.forEach((option) => option.selected = false);
        this.refresh();
        this.changed();
      });
      return true;
    }
    if (item.identifier == "properties") {
      this.editor.prompt(this.typeName, [{ name: "id", label: this.strings.TextIDCaption, value: this.id }]).then((values) => {
        if (!values)
          return;
        this.willChange();
        this.id = String(values.id || "").trim();
        this.refresh();
        this.changed();
      });
      return true;
    }
    return false;
  }
  toJSON() {
    let result = super.toJSON();
    if (this.id.length > 0)
      result["id"] = this.id;
    result["options"] = this.options.map((option) => option.toJSON());
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    this.id = Utilities.string(data.id);
    this.options = Array.isArray(data.options) ? data.options.map((item) => FormOption.fromJSON(item)).filter((option) => option !== null) : [];
    return true;
  }
  toHTML() {
    let result = "<datalist";
    if (this.id.length > 0)
      result += ` id="${Utilities.escapeAttribute(this.id)}"`;
    let css = this.htmlBackgroundCSS();
    if (css.length > 0)
      result += ` style="${Utilities.escapeAttribute(css)}"`;
    result += ">";
    this.options.forEach((option) => {
      result += `<option value="${Utilities.escapeAttribute(option.value.length > 0 ? option.value : option.caption)}"`;
      if (option.caption.length > 0 && option.caption != option.value && option.value.length > 0)
        result += ` label="${Utilities.escapeAttribute(option.caption)}"`;
      if (option.disabled)
        result += " disabled";
      result += "></option>";
    });
    return result + "</datalist>";
  }
  toPlainText() {
    return "";
  }
};
var FormNode = class _FormNode extends TableNode {
  /** Not the table rules: this node's HTML has no table elements. */
  static exportStyles(sheet, editor) {
    sheet.addRule("form", `display: grid; gap: 16px; padding: 16px; border: 1px solid ${Editor.themeCSS(editor, ThemeColors.borderStrong)}; border-radius: 8px; background: ${Editor.themeCSS(editor, ThemeColors.surface)}`);
    sheet.addRule("label", `color: ${Editor.themeCSS(editor, ThemeColors.text)}; overflow-wrap: anywhere`);
  }
  static identifier = "form";
  static caption = "Form";
  static icon = "bi bi-ui-checks-grid";
  static keywords = "form fields controls submit";
  static importElement(element, importer) {
    if (element.tagName != "FORM")
      return void 0;
    let form = new _FormNode();
    importer.attach(form);
    ["action", "method", "enctype", "target", "name", "id", "rel"].forEach((name) => form[name] = element.getAttribute(name) || form[name]);
    form.acceptCharset = element.getAttribute("accept-charset") || "";
    form.autoComplete = element.getAttribute("autocomplete") || form.autoComplete;
    form.noValidate = element.hasAttribute("novalidate");
    form.cells[0].nodes = importer.importChildren(element);
    return form;
  }
  inspectorSections() {
    let strings = this.strings;
    let item = FormSupport.item;
    let method = InspectorItem.menu("method", strings.TextFormMethodCaption, [["GET", "get"], ["POST", "post"], ["dialog", "dialog"]], (target) => target.method || "get", (target, value) => target.method = value);
    method.setDefaultValue("get");
    let encoding = InspectorItem.menu("enctype", strings.TextEncodingCaption, [["application/x-www-form-urlencoded", "application/x-www-form-urlencoded"], ["multipart/form-data", "multipart/form-data"], ["text/plain", "text/plain"]], (target) => target.enctype || "application/x-www-form-urlencoded", (target, value) => target.enctype = value);
    encoding.setDefaultValue("application/x-www-form-urlencoded");
    let autoComplete = InspectorItem.menu("autocomplete", strings.TextAutocompleteCaption, [[strings.TextOnCaption, "on"], [strings.TextOffCaption, "off"]], (target) => target.autoComplete || "on", (target, value) => target.autoComplete = value);
    autoComplete.setDefaultValue("on");
    return [InspectorDefaults.section("form", strings.TextFormCaption, [
      item("action", strings.TextFormActionCaption, "action", InspectorEditors.text),
      method,
      encoding,
      item("target", strings.TextFormTargetCaption, "target", InspectorEditors.text),
      autoComplete,
      item("novalidate", strings.TextNoValidateCaption, "noValidate", InspectorEditors.toggle),
      item("name", strings.TextNameCaption, "name", InspectorEditors.text),
      item("id", strings.TextIDCaption, "id", InspectorEditors.text),
      item("rel", strings.TextRelationshipCaption, "rel", InspectorEditors.text),
      item("charset", strings.TextAcceptCharsetCaption, "acceptCharset", InspectorEditors.text)
    ])].concat(InspectorDefaults.node(this));
  }
  static create(editor) {
    let result = new _FormNode();
    result.editor = editor;
    let field = new TextFieldNode();
    field.name = "name";
    let label = new LabelNode(editor.strings.TextNameCaption);
    let button = new ButtonNode(editor.strings.TextSubmitCaption);
    result.cells[0].nodes = [label, field, button];
    return result;
  }
  acceptCharset = "";
  action = "";
  autoComplete = "on";
  enctype = "application/x-www-form-urlencoded";
  id = "";
  method = "get";
  name = "";
  noValidate = false;
  rel = "";
  target = "";
  constructor() {
    super(1, 1);
  }
  build(body) {
    this.ensureCells();
    this.hostCells = [];
    let frame = Utilities.element("div", "scv-form");
    frame.dataset.cell = "0";
    let badge = Utilities.element("div", "scv-form-badge small", { contenteditable: "false" });
    badge.innerHTML = `<i class="bi bi-ui-checks-grid"></i> `;
    let summary = [this.method.toUpperCase(), this.action].filter((part) => part.length > 0).join(" ");
    badge.append(document.createTextNode(`${this.strings.TextFormCaption}${summary.length > 0 ? ` \xB7 ${summary}` : ""}`));
    frame.append(badge);
    this.buildCell(frame, this.cells[0], 0);
    body.append(frame);
  }
  handleKeyDown(_event, _host) {
    return false;
  }
  actions() {
    return [new ToolbarItem("properties", this.strings.TextPropertiesCaption, "bi bi-sliders")];
  }
  performAction(item, _menuItem) {
    if (item.identifier != "properties" || !this.editor)
      return false;
    let strings = this.strings;
    this.editor.prompt(this.typeName, [
      { name: "action", label: strings.TextFormActionCaption, value: this.action, type: "url" },
      { name: "method", label: strings.TextFormMethodCaption, value: this.method || "get", type: "select", options: [{ value: "get", caption: "get" }, { value: "post", caption: "post" }, { value: "dialog", caption: "dialog" }] },
      { name: "enctype", label: strings.TextEncodingCaption, value: this.enctype || "application/x-www-form-urlencoded", type: "select", options: [{ value: "application/x-www-form-urlencoded", caption: "application/x-www-form-urlencoded" }, { value: "multipart/form-data", caption: "multipart/form-data" }, { value: "text/plain", caption: "text/plain" }] },
      { name: "target", label: strings.TextFormTargetCaption, value: this.target },
      { name: "name", label: strings.TextNameCaption, value: this.name },
      { name: "id", label: strings.TextIDCaption, value: this.id },
      { name: "noValidate", label: strings.TextNoValidateCaption, value: this.noValidate, type: "checkbox" }
    ]).then((values) => {
      if (!values)
        return;
      this.willChange();
      this.action = String(values.action || "").trim();
      this.method = String(values.method || "get");
      this.enctype = String(values.enctype || "");
      this.target = String(values.target || "").trim();
      this.name = String(values.name || "").trim();
      this.id = String(values.id || "").trim();
      this.noValidate = values.noValidate === true;
      this.refresh();
      this.changed();
    });
    return true;
  }
  toJSON() {
    let result = super.toJSON();
    ["acceptCharset", "action", "autoComplete", "enctype", "id", "method", "name", "rel", "target"].forEach((key) => {
      if (this[key].length > 0)
        result[key] = this[key];
    });
    if (this.noValidate)
      result["noValidate"] = true;
    return result;
  }
  fromJSON(data) {
    if (!super.fromJSON(data))
      return false;
    ["acceptCharset", "action", "autoComplete", "enctype", "id", "method", "name", "rel", "target"].forEach((key) => this[key] = Utilities.string(data[key]));
    this.noValidate = Utilities.boolean(data.noValidate, false);
    this.rows = 1;
    this.columns = 1;
    this.ensureCells();
    return true;
  }
  toHTML() {
    let attributes = "";
    let add = (name, value) => {
      if (value.length > 0)
        attributes += ` ${name}="${Utilities.escapeAttribute(value)}"`;
    };
    add("accept-charset", this.acceptCharset);
    add("action", this.action);
    if (this.autoComplete.toLowerCase() != "on")
      add("autocomplete", this.autoComplete);
    if (this.enctype.toLowerCase() != "application/x-www-form-urlencoded")
      add("enctype", this.enctype);
    add("id", this.id);
    if (this.method.toLowerCase() != "get")
      add("method", this.method);
    add("name", this.name);
    if (this.noValidate)
      attributes += " novalidate";
    add("rel", this.rel);
    add("target", this.target);
    let cell = this.cells[0];
    let result = `<form${attributes} style="${this.htmlBackgroundCSS()}">`;
    if (cell) {
      result += cell.htmlText();
      cell.nodes.forEach((child) => {
        if (child.canExportHTML)
          result += child.toHTML();
      });
    }
    return result + "</form>";
  }
  toMarkdown() {
    return this.toHTML();
  }
  toPlainText() {
    let cell = this.cells[0];
    if (!cell)
      return "";
    return [cell.text].concat(cell.nodes.map((child) => child.toPlainText())).filter((part) => part.length > 0).join("\n");
  }
};
Editor.registerNodeType(FormNode, 190);
Editor.registerNodeType(LabelNode, 200);
Editor.registerNodeType(TextFieldNode, 210);
Editor.registerNodeType(TextAreaNode, 220);
Editor.registerNodeType(CheckboxNode, 230);
Editor.registerNodeType(RadioGroupNode, 240);
Editor.registerNodeType(DropdownNode, 250);
Editor.registerNodeType(DatalistNode, 260);
Editor.registerNodeType(ButtonNode, 270);
export {
  ButtonNode,
  ButtonTypes,
  CheckboxNode,
  DatalistNode,
  DropdownNode,
  FormControlNode,
  FormNode,
  FormOption,
  FormSupport,
  LabelNode,
  RadioGroupLayouts,
  RadioGroupNode,
  TextAreaNode,
  TextFieldNode,
  TextFieldTypes
};
