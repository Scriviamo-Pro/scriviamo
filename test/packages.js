// The packages the parity tests cover: the base package and each add-on, with the
// suites that test it. A package's suites run only when the package is loaded.
"use strict"

/** Suites by package, under suites/. */
const ParitySuites = {
  base: ["base/bidi.js", "base/core.js", "base/documentload.js", "base/rendering.js", "base/forms.js", "base/localization.js", "base/nodetypes.js", "base/importexport.js", "base/importexport2.js"],
  callouts: ["callouts/rendering.js", "callouts/nodetypes.js", "callouts/importexport2.js"],
  rawcontent: ["rawcontent/importexport2.js"],
  media: ["media/importexport2.js"],
  forms: ["forms/forms.js", "forms/nodetypes.js", "forms/importexport2.js"],
}

/**
 * Suites that need more than one add-on, under suites/integration/. Each runs when every
 * package it names is loaded; "all" needs every package.
 */
const ParityIntegrationSuites = [
  {packages: ["all"], suites: ["integration/strings.js"]},
]

/** The suites to run for the loaded packages. */
function ParitySuiteList(loaded) {
  let all = Object.keys(ParitySuites)
  let result = loaded.flatMap(name => ParitySuites[name])
  for (let group of ParityIntegrationSuites) {
    let needed = group.packages.includes("all") ? all : group.packages
    if (needed.every(name => loaded.includes(name))) result.push(...group.suites)
  }
  return result
}

/** Packages that have a stylesheet. */
const ParityStylesheets = [
  "base", "callouts", "media", "forms",
]

/** Data the suites share. */
const ParityFixtures = ["fixtures/desktop-strings.js", "fixtures/invoice.js"]

/** The packages a page tests: ?packages=base,forms, or every package. The base package is always included. */
function ParityPackageList(parameters) {
  let all = Object.keys(ParitySuites)
  if (parameters.has("base")) return ["base"]
  let requested = (parameters.get("packages") || "").split(",").map(name => name.trim()).filter(name => all.includes(name))
  return requested.length == 0 ? all : ["base", ...requested.filter(name => name != "base")]
}
