// The git add-on's reference server, against a stand-in for GitHub: signing in, listing and
// opening documents, and saving versions as commits on a document's branch with one pull request.
//
//   node test/node/git.mjs
import assert from "node:assert/strict"
import http from "node:http"
import {createGitHandler, documentBranch, documentPath} from "../../src/addons/git/server/git-server.mjs"
import {startFakeGitHub} from "./fake-github.mjs"

const doc = text => JSON.stringify({version: 4, nodes: [{nodeId: "n1", type: "text", content: {text}}]})
let failures = 0
async function check(name, work) {
  try {
    await work()
  } catch (error) {
    failures++
    console.log(`✗  ${name}: ${error.message}`)
  }
}

let github = await startFakeGitHub({files: {"docs/welcome.scriviamo.json": doc("Welcome"), "README.md": "# Docs"}})
let handler = createGitHandler({
  repository: "acme/docs", folder: "docs", clientID: "client", clientSecret: "client-secret", secret: "x".repeat(32),
  apiURL: github.url, webURL: github.url, secureCookies: false, allowedOrigins: ["http://app.example"]
})
let server = http.createServer(async (request, response) => {
  if (!(await handler(request, response))) {
    response.writeHead(404)
    response.end()
  }
})
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
let base = `http://127.0.0.1:${server.address().port}/scriviamo-git`

/** A browser: keeps the session cookie, and follows nothing on its own. */
function browser() {
  let cookie = ""
  return async (path, {method = "GET", body, origin} = {}) => {
    let response = await fetch(base + path, {
      method, redirect: "manual",
      headers: {...(cookie ? {cookie} : {}), ...(body ? {"content-type": "application/json"} : {}), ...(origin ? {origin} : {})},
      body: body ? JSON.stringify(body) : undefined
    })
    let set = response.headers.get("set-cookie")
    if (set) cookie = set.split(";")[0].endsWith("=") ? "" : set.split(";")[0]
    let text = await response.text()
    return {status: response.status, location: response.headers.get("location"), body: text ? JSON.parse(text) : null}
  }
}

async function signIn(as, code) {
  let start = await as("/sign-in?return=/editor")
  assert.equal(start.status, 302)
  let state = new URL(start.location).searchParams.get("state")
  assert.ok(start.location.startsWith(`${github.url}/login/oauth/authorize?client_id=client`), start.location)
  return as(`/callback?code=${code}&state=${encodeURIComponent(state)}`)
}

await check("paths are checked, and branches follow them", () => {
  assert.equal(documentPath("docs/contracts/acme", "docs"), "docs/contracts/acme.scriviamo.json")
  assert.throws(() => documentPath("docs/../secrets", "docs"), /isn't a document path/)
  assert.throws(() => documentPath("other/acme", "docs"), /kept under docs/)
  assert.equal(documentBranch("docs/contracts/acme.scriviamo.json"), "scriviamo/docs/contracts/acme")
})

let ada = browser()
await check("signed out, the session says so, and documents need signing in", async () => {
  assert.deepEqual((await ada("/session")).body, {signedIn: false, user: null, signInURL: "/scriviamo-git/sign-in"})
  let documents = await ada("/documents")
  assert.equal(documents.status, 401)
  assert.equal(documents.body.error, "signed-out")
})

await check("signing in with GitHub, back to where it started", async () => {
  let back = await signIn(ada, "code-ada")
  assert.equal(back.status, 302)
  assert.equal(back.location, "/editor")
  let session = (await ada("/session")).body
  assert.equal(session.signedIn, true)
  assert.equal(session.user.login, "ada")
  assert.equal(JSON.stringify(session).includes("token"), false, "the browser saw a token")
})

await check("a sign-in that didn't start here is refused", async () => {
  let other = browser()
  await other("/sign-in")
  let refused = await other("/callback?code=code-ada&state=forged")
  assert.equal(refused.status, 400)
  assert.equal((await other("/session")).body.signedIn, false)
})

await check("documents are listed from the folder, and opened", async () => {
  let listed = (await ada("/documents")).body.documents
  assert.deepEqual(listed.map(item => item.path), ["docs/welcome.scriviamo.json"])
  let opened = (await ada("/document?path=docs/welcome")).body
  assert.equal(JSON.parse(opened.content).nodes[0].content.text, "Welcome")
  assert.equal(opened.ref, "main")
})

let first
await check("saving a version commits to the document's branch and opens one pull request", async () => {
  let saved = await ada("/versions", {method: "POST", body: {path: "docs/contracts/acme", name: "First draft", content: doc("Draft one"), readable: "Draft one"}})
  assert.equal(saved.status, 200, JSON.stringify(saved.body))
  first = saved.body.version.id
  assert.equal(saved.body.pullRequest.number, 1)
  assert.ok(github.refs.has("scriviamo/docs/contracts/acme"))
  assert.equal(github.refs.has("main") && github.pulls.length, 1)
  let second = await ada("/versions", {method: "POST", body: {path: "docs/contracts/acme", name: "Second draft", automatic: true, content: doc("Draft two")}})
  assert.equal(second.body.pullRequest.number, 1, "a second pull request was opened")
  assert.equal(github.pulls.length, 1)
})

await check("versions are the branch's commits, newest first, with their names and kinds", async () => {
  let listed = (await ada("/versions?path=docs/contracts/acme")).body
  assert.deepEqual(listed.versions.map(version => [version.name, version.automatic, version.author]), [["Second draft", true, "Ada Lovelace"], ["First draft", false, "Ada Lovelace"]])
  assert.equal(listed.pullRequest.url, "https://github.test/acme/docs/pull/1")
  let old = (await ada(`/version?path=docs/contracts/acme&id=${first}`)).body.content
  assert.equal(JSON.parse(old).nodes[0].content.text, "Draft one")
})

await check("a document in a pull request is listed and opened from its branch, with its readable copy beside it", async () => {
  let listed = (await ada("/documents")).body.documents
  let acme = listed.find(item => item.path == "docs/contracts/acme.scriviamo.json")
  assert.equal(acme.folder, "docs/contracts")
  assert.equal(acme.pullRequest.number, 1)
  let opened = (await ada("/document?path=docs/contracts/acme")).body
  assert.equal(opened.ref, "scriviamo/docs/contracts/acme")
  assert.equal(JSON.parse(opened.content).nodes[0].content.text, "Draft two")
})

await check("after the pull request is merged, the document opens from the default branch, and a new version opens a new pull request", async () => {
  github.merge(1)
  let opened = (await ada("/document?path=docs/contracts/acme")).body
  assert.equal(opened.ref, "main")
  assert.equal(opened.pullRequest, null)
  let saved = (await ada("/versions", {method: "POST", body: {path: "docs/contracts/acme", name: "Amendment", content: doc("Amended")}})).body
  assert.equal(saved.pullRequest.number, 2)
})

await check("requests from other sites can't save, unless allowed", async () => {
  let refused = await ada("/versions", {method: "POST", origin: "http://evil.example", body: {path: "docs/x", content: doc("x")}})
  assert.equal(refused.status, 403)
  let allowed = await ada("/versions", {method: "POST", origin: "http://app.example", body: {path: "docs/x", content: doc("x")}})
  assert.equal(allowed.status, 200)
})

await check("bad requests are refused", async () => {
  assert.equal((await ada("/versions", {method: "POST", body: {path: "docs/x", content: "not json"}})).body.error, "bad-content")
  assert.equal((await ada("/version?path=docs/x&id=../../etc")).body.error, "bad-version")
  assert.equal((await ada("/document?path=docs/missing")).status, 404)
})

await check("an expired token is refreshed without signing in again", async () => {
  github.server.tokenLifetime = 1
  let grace = browser()
  await signIn(grace, "code-grace")
  github.server.tokenLifetime = 28800
  let listed = await grace("/documents")
  assert.equal(listed.status, 200)
  assert.ok(github.requests.filter(line => line == "POST /login/oauth/access_token").length >= 3, "the token wasn't refreshed")
})

await check("signing out ends the session", async () => {
  await ada("/sign-out", {method: "POST"})
  assert.equal((await ada("/session")).body.signedIn, false)
  assert.equal((await ada("/documents")).status, 401)
})

server.close()
await github.close()
if (failures > 0) {
  console.log(`✗  Git server: ${failures} failed`)
  process.exit(1)
}
console.log("✓  Git server: signing in, documents, versions and pull requests")
