// A stand-in for GitHub, in memory: the sign-in and REST calls the git add-on's servers make,
// enough to test them without a GitHub App. One repository, one user per token.
import crypto from "node:crypto"
import http from "node:http"

const sha = () => crypto.randomBytes(20).toString("hex")

export async function startFakeGitHub({repository = "acme/docs", defaultBranch = "main", files = {}} = {}) {
  let users = new Map([["code-ada", {login: "ada", name: "Ada Lovelace", email: "ada@example.com"}], ["code-grace", {login: "grace", name: "Grace Hopper", email: "grace@example.com"}]])
  let tokens = new Map()
  let refreshTokens = new Map()
  let trees = new Map()
  let commits = new Map()
  let refs = new Map()
  let pulls = []
  let requests = []

  let makeTree = map => {
    let id = sha()
    trees.set(id, new Map(map))
    return id
  }
  let makeCommit = (tree, parents, message, author) => {
    let id = sha()
    commits.set(id, {tree, parents, message, author, date: new Date(Date.now() + commits.size * 1000).toISOString()})
    return id
  }
  refs.set(defaultBranch, makeCommit(makeTree(Object.entries(files)), [], "Initial commit", "ada"))

  let resolve = ref => refs.get(ref) || (commits.has(ref) ? ref : null)
  let history = (from, path) => {
    let result = []
    let seen = new Set()
    let walk = id => {
      while (id && !seen.has(id)) {
        seen.add(id)
        let commit = commits.get(id)
        let parent = commit.parents[0]
        let before = parent ? trees.get(commits.get(parent).tree).get(path) : undefined
        let now = trees.get(commit.tree).get(path)
        if (now !== undefined && now !== before) result.push(id)
        id = parent
      }
    }
    walk(from)
    return result
  }
  let commitJSON = id => {
    let commit = commits.get(id)
    return {sha: id, html_url: `https://github.test/${repository}/commit/${id}`, author: {login: commit.author}, commit: {message: commit.message, author: {name: commit.author, date: commit.date}}}
  }

  let server = http.createServer(async (request, response) => {
    let chunks = []
    for await (let chunk of request) chunks.push(chunk)
    let body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : null
    let url = new URL(request.url, "http://localhost")
    let path = url.pathname
    requests.push(`${request.method} ${path}`)
    let send = (status, data) => {
      response.writeHead(status, {"content-type": "application/json"})
      response.end(JSON.stringify(data))
    }

    // Signing in: straight back to the app, as Ada unless ?as= names another user.
    if (path == "/login/oauth/authorize" && request.method == "GET") {
      let back = new URL(url.searchParams.get("redirect_uri"))
      back.searchParams.set("code", `code-${server.signInAs || "ada"}`)
      back.searchParams.set("state", url.searchParams.get("state") || "")
      response.writeHead(302, {location: back.toString()})
      return response.end()
    }
    if (path == "/login/oauth/access_token" && request.method == "POST") {
      let user = body.grant_type == "refresh_token" ? refreshTokens.get(body.refresh_token) : users.get(body.code)
      if (!user || body.client_id != "client" || body.client_secret != "client-secret") return send(200, {error: "bad_verification_code", error_description: "The code passed is incorrect."})
      let access = "token-" + sha()
      let refresh = "refresh-" + sha()
      tokens.set(access, user)
      refreshTokens.set(refresh, user)
      return send(200, {access_token: access, refresh_token: refresh, expires_in: server.tokenLifetime ?? 28800, refresh_token_expires_in: 15897600, token_type: "bearer"})
    }
    let user = tokens.get(String(request.headers.authorization || "").replace(/^Bearer /, ""))
    if (!user) return send(401, {message: "Bad credentials"})
    if (path == "/user") return send(200, {login: user.login, name: user.name, email: user.email, avatar_url: ""})

    let prefix = `/repos/${repository}`
    if (!path.startsWith(prefix)) return send(404, {message: "Not Found"})
    let route = path.slice(prefix.length)
    let match
    if (route == "" ) return send(200, {full_name: repository, default_branch: defaultBranch})
    if ((match = route.match(/^\/git\/ref\/heads\/(.+)$/)) && request.method == "GET") {
      let ref = decodeURIComponent(match[1])
      return refs.has(ref) ? send(200, {ref: `refs/heads/${ref}`, object: {sha: refs.get(ref), type: "commit"}}) : send(404, {message: "Not Found"})
    }
    if (route == "/git/refs" && request.method == "POST") {
      let ref = body.ref.replace(/^refs\/heads\//, "")
      if (refs.has(ref)) return send(422, {message: "Reference already exists"})
      refs.set(ref, body.sha)
      return send(201, {ref: body.ref, object: {sha: body.sha}})
    }
    if ((match = route.match(/^\/git\/refs\/heads\/(.+)$/)) && request.method == "PATCH") {
      let ref = decodeURIComponent(match[1])
      let current = refs.get(ref)
      if (!current) return send(404, {message: "Not Found"})
      if (!commits.get(body.sha).parents.includes(current)) return send(422, {message: "Update is not a fast forward"})
      refs.set(ref, body.sha)
      return send(200, {ref: `refs/heads/${ref}`, object: {sha: body.sha}})
    }
    if ((match = route.match(/^\/git\/commits\/([0-9a-f]+)$/)) && request.method == "GET") {
      let commit = commits.get(match[1])
      return commit ? send(200, {sha: match[1], tree: {sha: commit.tree}, message: commit.message}) : send(404, {message: "Not Found"})
    }
    if (route == "/git/trees" && request.method == "POST") {
      let map = new Map(trees.get(body.base_tree) || [])
      for (let entry of body.tree) map.set(entry.path, entry.content)
      return send(201, {sha: makeTree(map)})
    }
    if ((match = route.match(/^\/git\/trees\/(.+)$/)) && request.method == "GET") {
      let id = resolve(decodeURIComponent(match[1]))
      if (!id) return send(404, {message: "Not Found"})
      return send(200, {tree: [...trees.get(commits.get(id).tree).keys()].map(file => ({path: file, type: "blob"}))})
    }
    if (route == "/git/commits" && request.method == "POST") {
      let id = makeCommit(body.tree, body.parents, body.message, user.login)
      return send(201, {sha: id, message: body.message, html_url: `https://github.test/${repository}/commit/${id}`, author: {name: user.name, date: commits.get(id).date}})
    }
    if ((match = route.match(/^\/contents\/(.+)$/)) && request.method == "GET") {
      let id = resolve(url.searchParams.get("ref") || defaultBranch)
      let content = id ? trees.get(commits.get(id).tree).get(decodeURIComponent(match[1])) : undefined
      return content === undefined ? send(404, {message: "Not Found"}) : send(200, {content: Buffer.from(content).toString("base64"), encoding: "base64", sha: sha()})
    }
    if (route == "/commits" && request.method == "GET") {
      let id = resolve(url.searchParams.get("sha"))
      return id ? send(200, history(id, url.searchParams.get("path")).map(commitJSON)) : send(404, {message: "Not Found"})
    }
    if (route == "/pulls" && request.method == "GET") {
      let head = url.searchParams.get("head")
      let state = url.searchParams.get("state") || "open"
      return send(200, pulls.filter(pull => (state == "all" || pull.state == state) && (!head || `${repository.split("/")[0]}:${pull.head.ref}` == head)))
    }
    if (route == "/pulls" && request.method == "POST") {
      if (pulls.some(pull => pull.state == "open" && pull.head.ref == body.head)) return send(422, {message: "A pull request already exists"})
      let number = pulls.length + 1
      let pull = {number, state: "open", title: body.title, body: body.body, html_url: `https://github.test/${repository}/pull/${number}`, head: {ref: body.head}, base: {ref: body.base}, user: {login: user.login}}
      pulls.push(pull)
      return send(201, pull)
    }
    send(404, {message: "Not Found"})
  })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  let url = `http://127.0.0.1:${server.address().port}`
  return {
    url, server, requests, refs, pulls,
    /** Merges a pull request into the default branch, as merging on GitHub does. */
    merge(number) {
      let pull = pulls.find(item => item.number == number)
      let head = refs.get(pull.head.ref)
      let tree = new Map(trees.get(commits.get(refs.get(defaultBranch)).tree))
      for (let [file, content] of trees.get(commits.get(head).tree)) tree.set(file, content)
      refs.set(defaultBranch, makeCommit(makeTree(tree), [refs.get(defaultBranch), head], `Merge pull request #${number}`, pull.user.login))
      refs.delete(pull.head.ref)
      pull.state = "closed"
      pull.merged = true
    },
    close: () => new Promise(resolve => server.close(resolve))
  }
}
