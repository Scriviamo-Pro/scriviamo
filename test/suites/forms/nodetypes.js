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
    let dropdown = new PE.DropdownNode()
    let option = inspectorItem(dropdown, "optiondisabled0")
    t.assert(option, "The dropdown inspector omitted its first option.")
    if (option) t.equal(option.defaultValueFor(dropdown), false, "A dropdown option's inspector default was not available")
    let radio = new PE.RadioGroupNode()
    let label = inspectorItem(radio, "activelabel")
    if (label) t.assert(String(label.defaultValueFor(radio)).startsWith("Option "), "A radio option's label did not reset to its position.")
  })
}
