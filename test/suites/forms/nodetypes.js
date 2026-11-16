// Dividers, quotes, page breaks, checklists, the inspector, alignment, and sizes.
"use strict"
{
  const section = "Node types"

  function inspectorItem(target, identifier) {
    let sections = target instanceof PE.Editor ? target.inspectorSections() : target.inspectorSections()
    for (let section of sections) {
      for (let item of section.items()) {
        if (item && item.identifier == identifier) return item
      }
    }
    return null
  }

  function isChecked(list, item) {
    return !!list.content.listChecked[item]
  }

  test(section, "inspector defaults come from a new node", t => {
    let heading = new PE.HeadingNode("Title", PE.HeadingLevels.heading4)
    heading.borderTop = {visible: false, size: 6, color: PE.Colors.empty}
    let border = inspectorItem(heading, "bordertopsize")
    let size = inspectorItem(heading, "fontsize")
    let level = inspectorItem(heading, "level")
    t.assert(border && level, "The heading inspector omitted its border size or level.")
    if (border) t.equal(border.defaultValueFor(heading), 1, "The border size inspector default was not a new node's size")
    if (size) t.equal(size.defaultValueFor(heading), 20, "The heading size inspector default was not its level's size")
    if (level) t.equal(level.defaultValueFor(heading), PE.HeadingLevels.heading2, "The heading level inspector default was not the prototype's level")
    // A dropdown and a radio group as the Insert menu makes them, with two options.
    let editor = t.editor()
    let dropdown = PE.DropdownNode.create(editor)
    let option = inspectorItem(dropdown, "optiondisabled0")
    t.assert(option, "The dropdown inspector omitted its first option.")
    if (option) t.equal(option.defaultValueFor(dropdown), false, "A dropdown option's inspector default was not available")
    let caption = inspectorItem(dropdown, "optioncaption1")
    if (caption) t.equal(caption.defaultValueFor(dropdown), "Option 2", "A dropdown option's label did not reset to its position")
    let radio = PE.RadioGroupNode.create(editor)
    radio.activeOptionIndex = 1
    let label = inspectorItem(radio, "activelabel")
    t.assert(label, "The radio group inspector omitted the option being edited.")
    if (label) t.equal(label.defaultValueFor(radio), "Option 2", "A radio option's label did not reset to its position")
  })
}
