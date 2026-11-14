// Interface text and locale packs.
"use strict"
{
  const section = "Localization"

  test(section, "every desktop string name can be localized", t => {
    let strings = new PE.Strings()
    let missing = DesktopStringNames.filter(name => typeof strings[name] != "string")
    t.assert(missing.length == 0, `${missing.length} of ${DesktopStringNames.length} string names in a desktop locale pack have no equivalent: ${missing.join(", ")}`)
  })
}
