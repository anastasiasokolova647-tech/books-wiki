import { readdir, readFile } from "node:fs/promises"
import { join, relative, basename } from "node:path"
const root = "content",
  files = [],
  folders = []
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      folders.push(relative(root, p).replaceAll("\\", "/"))
      await walk(p)
    } else if (e.isFile() && e.name.endsWith(".md")) files.push(p)
  }
}
await walk(root)
const norm = (s) => s.normalize("NFC").toLocaleLowerCase("uk")
const keys = new Map()
for (const p of files) {
  const rel = relative(root, p).replaceAll("\\", "/").slice(0, -3)
  const base = basename(rel)
  for (const k of [rel, base]) {
    const key = norm(k)
    if (!keys.has(key)) keys.set(key, [])
    keys.get(key).push(rel)
  }
}
for (const rel of folders) {
  for (const k of [rel, basename(rel)]) {
    const key = norm(k)
    if (!keys.has(key)) keys.set(key, [])
    keys.get(key).push(rel)
  }
}
const incoming = new Map(
  files.map((p) => [relative(root, p).replaceAll("\\", "/").slice(0, -3), 0]),
)
const broken = [],
  ambiguous = []
for (const p of files) {
  const rel = relative(root, p).replaceAll("\\", "/").slice(0, -3)
  const content = await readFile(p, "utf8")
  for (const match of content.matchAll(/\[\[([^\]]+)\]\]/g)) {
    let target = match[1].split("|")[0].split("#")[0].trim().replace(/\.md$/i, "")
    if (!target) continue
    const exact = keys.get(norm(target)) || []
    const candidates = target.includes("/")
      ? exact.filter((x) => norm(x) === norm(target) || norm(x).endsWith("/" + norm(target)))
      : exact
    const unique = [...new Set(candidates)]
    if (unique.length === 1) incoming.set(unique[0], (incoming.get(unique[0]) || 0) + 1)
    else if (!unique.length) broken.push({ from: rel, to: target })
    else ambiguous.push({ from: rel, to: target, matches: unique.length })
  }
}
const requests = files
  .map((p) => relative(root, p).replaceAll("\\", "/").slice(0, -3))
  .filter((x) => x.includes("/Запит/"))
const orphans = requests.filter((x) => incoming.get(x) === 0)
console.log(
  "AUDIT_TOTAL=" +
    JSON.stringify({
      files: files.length,
      requests: requests.length,
      requestWithoutIncomingLinks: orphans.length,
      unresolvedWikiLinks: broken.length,
      ambiguousWikiLinks: ambiguous.length,
    }),
)
for (const x of orphans) console.log("ORPHAN " + x)
for (const x of broken.slice(0, 250)) console.log("BROKEN " + JSON.stringify(x))
for (const x of ambiguous.slice(0, 40)) console.log("AMBIGUOUS " + JSON.stringify(x))
