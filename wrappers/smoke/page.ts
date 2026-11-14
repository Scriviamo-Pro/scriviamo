// The parts every smoke page shares: a "Run the smoke test" button that runs window.runSmoke()
// and lists each check as passed or failed. Each page also shows a live editor.

/** The value of each check: true passes, false fails, anything else is shown for reading. */
export function connectRunner(run: () => Promise<Record<string, unknown>>) {
  let button = document.getElementById("run") as HTMLButtonElement
  let results = document.getElementById("results") as HTMLElement
  ;(window as any).runSmoke = run
  button.addEventListener("click", async () => {
    button.disabled = true
    results.replaceChildren()
    try {
      let log = await run()
      let failed = 0
      for (let [name, value] of Object.entries(log)) {
        let row = document.createElement("li")
        row.className = "list-group-item d-flex justify-content-between"
        let state = value === true ? "pass" : value === false ? "fail" : "value"
        if (state == "fail") failed++
        row.innerHTML = `<span></span><span class="badge ${state == "pass" ? "text-bg-success" : state == "fail" ? "text-bg-danger" : "text-bg-secondary"}"></span>`
        row.children[0].textContent = name
        row.children[1].textContent = state == "value" ? String(value) : state
        results.append(row)
      }
      let summary = document.createElement("li")
      summary.className = `list-group-item fw-semibold ${failed ? "text-danger" : "text-success"}`
      summary.textContent = failed ? `${failed} check(s) failed` : "Every check passed"
      results.prepend(summary)
    } catch (error) {
      let row = document.createElement("li")
      row.className = "list-group-item text-danger"
      row.textContent = `The smoke test threw: ${error}`
      results.append(row)
    } finally {
      button.disabled = false
    }
  })
}

export const sample = "# Hello from Scriviamo\n\nThis editor is live. Type / in an empty paragraph to add a block."
