// Documents, kept as JSON files in data/. A real app would use its database.
import {mkdir, readFile, readdir, writeFile} from "node:fs/promises"
import {join} from "node:path"

const folder = join(process.cwd(), "data")

export interface StoredDocument {
  id: string
  title: string
  /** What editor.toJSON() saved. */
  content: string
  updated: string
}

/** Only short, plain ids, so a request can't reach outside data/. */
export function validId(id: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(id)
}

export async function loadDocument(id: string): Promise<StoredDocument | null> {
  if (!validId(id)) return null
  try {
    return JSON.parse(await readFile(join(folder, `${id}.json`), "utf8"))
  } catch {
    return null
  }
}

export async function saveDocument(document: StoredDocument) {
  if (!validId(document.id)) throw new Error("Invalid document id")
  await mkdir(folder, {recursive: true})
  await writeFile(join(folder, `${document.id}.json`), JSON.stringify(document, null, 2))
}

export async function listDocuments(): Promise<Array<StoredDocument>> {
  let names: Array<string> = []
  try {
    names = await readdir(folder)
  } catch {
    return []
  }
  let documents = await Promise.all(names.filter(name => name.endsWith(".json")).map(name => loadDocument(name.slice(0, -5))))
  return documents.filter((document): document is StoredDocument => document !== null).sort((a, b) => b.updated.localeCompare(a.updated))
}

/** The first line of the document's text, for lists. */
export function titleOf(text: string): string {
  return text.split("\n").map(line => line.trim()).find(line => line.length > 0)?.slice(0, 80) || "Untitled"
}
