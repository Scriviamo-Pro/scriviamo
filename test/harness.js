// Parity test harness. Each test runs against the built editor and records
// failed assertions; a test that throws fails with the exception's message.
"use strict"

const PE = Scriviamo

const Parity = {
  tests: [],
  results: null
}

/** Registers a test. `fn` receives a context and may be async. */
function test(section, name, fn) {
  Parity.tests.push({section, name, fn, skipped: null})
}

/** Registers a check that does not apply to this implementation, with the reason. */
function skip(section, name, reason) {
  Parity.tests.push({section, name, fn: null, skipped: reason})
}

class TestContext {
  constructor() {
    this.failures = []
    this.hosts = []
  }

  assert(condition, message) {
    if (!condition) this.failures.push(message)
    return !!condition
  }

  equal(actual, expected, message) {
    let same = typeof expected == "object" && expected !== null ? JSON.stringify(actual) === JSON.stringify(expected) : actual === expected
    if (!same) this.failures.push(`${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`)
    return same
  }

  /**
   * A new editor in its own element, removed when the test ends. It starts with
   * no nodes, no history and no changes, unless `keepInitialContent` is set.
   */
  editor(options, keepInitialContent = false) {
    let host = document.createElement("div")
    host.className = "parity-host"
    document.getElementById("work").appendChild(host)
    let editor = new PE.Editor(host, options)
    if (!keepInitialContent && !(options && (options.content || options.html || options.markdown))) {
      editor.removeAllNodes()
      editor.history.reset()
      editor.isChanged = false
    }
    this.hosts.push({host, editor})
    return editor
  }

  /** Waits for rendering and other queued work. */
  async tick(milliseconds = 0) {
    await new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  cleanup() {
    for (let item of this.hosts) {
      try {
        item.editor.destroy()
      } catch (error) {}
      item.host.remove()
    }
    this.hosts = []
  }
}

/** Converts compact style tables and runs back into one style object per character. */
function expandStyleRuns(data) {
  if (!data || typeof data != "object") return
  if (Array.isArray(data)) {
    for (let item of data) expandStyleRuns(item)
    return
  }
  if ("styleRuns" in data) {
    let table = Array.isArray(data.styleTable) ? data.styleTable : []
    let runs = data.styleRuns
    let expanded = []
    for (let index = 0; index + 1 < runs.length; index += 2) {
      let prototype = table[runs[index + 1]] ? PE.TextStyle.fromJSON(table[runs[index + 1]]) : new PE.TextStyle()
      for (let unit = 0; unit < runs[index]; unit++) expanded.push(prototype.toJSON())
    }
    delete data.styleTable
    delete data.styleRuns
    data.styles = expanded
  }
  for (let key of Object.keys(data)) {
    if (data[key] && typeof data[key] == "object") expandStyleRuns(data[key])
  }
}

function inspectorHasItem(node, identifier) {
  if (!node) return false
  return node.inspectorSections().some(section => section.items().some(item => item && item.identifier == identifier))
}

function inspectorHasSection(node, identifier) {
  if (!node) return false
  return node.inspectorSections().some(section => section && section.identifier == identifier)
}

function hasValidationError(editor) {
  if (!editor) return true
  return editor.lastValidationIssues.some(issue => issue.severity == PE.ValidationSeverities.error)
}

async function runParityTests() {
  let results = {passed: 0, failed: [], skipped: [], total: Parity.tests.length}
  let list = document.getElementById("results")
  list.innerHTML = ""
  for (let entry of Parity.tests) {
    let row = document.createElement("li")
    let label = `${entry.section} — ${entry.name}`
    if (entry.skipped) {
      results.skipped.push({test: label, reason: entry.skipped})
      row.className = "skip"
      row.textContent = `SKIP ${label}: ${entry.skipped}`
      list.appendChild(row)
      continue
    }
    let context = new TestContext()
    try {
      await entry.fn(context)
    } catch (error) {
      context.failures.push(`threw ${error && error.stack ? error.stack.split("\n").slice(0, 3).join(" | ") : error}`)
    }
    context.cleanup()
    if (context.failures.length == 0) {
      results.passed++
      row.className = "pass"
      row.textContent = `PASS ${label}`
    } else {
      results.failed.push({test: label, failures: context.failures})
      row.className = "fail"
      row.textContent = `FAIL ${label}: ${context.failures.join(" / ")}`
    }
    list.appendChild(row)
  }
  document.getElementById("summary").textContent = `${results.passed} passed, ${results.failed.length} failed, ${results.skipped.length} skipped of ${results.total}`
  Parity.results = results
  return results
}

/** Replaces the text of rich text, keeping its styles in step. */
function setText(rich, value) {
  rich.remove(0, rich.length)
  rich.insert(0, value)
}
