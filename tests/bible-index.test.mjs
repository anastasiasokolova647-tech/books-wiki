import test from "node:test"
import assert from "node:assert/strict"
import { readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { epigraphBlock, references, combine, build } from "../scripts/build-bible-index.mjs"
import { matches } from "../quartz/static/bible-search/search.mjs"
import { slugifyFilePath } from "@quartz-community/utils"
const text =
  "> **Біблійний епіграф**\n> [Івана 11:33–36](https://www.bible.com/uk/bible/186/JHN.11.33-36.UBIO)\n> Дотичні місця: 1 Івана 3:1; Римлян 12:15\n\n# Емоція\nсекрет"
test("block stops before any psychological heading", () => {
  assert.ok(!epigraphBlock(text).includes("секрет"))
  assert.equal(references(epigraphBlock(text)).length, 3)
})
test("range search includes contained verse and excludes wrong chapter", () => {
  const row = {
    title: "Лазар",
    book: "Дівчинка-веселка",
    epigraph: "",
    references: references(epigraphBlock(text)),
  }
  assert.ok(matches(row, "Івана 11:35"))
  assert.ok(matches(row, "Івана 11"))
  assert.ok(!matches(row, "Івана 1:35"))
  assert.ok(!matches(row, "Івана 11:37"))
  assert.ok(matches(row, "Лазар", "Дівчинка-веселка"))
  assert.ok(!matches(row, "Лазар", "Ліхтар"))
  assert.ok(matches(row, "1 Івана 3:1"))
})
test("duplicates merge references, not books", () => {
  const a = {
    title: "111. Люцик",
    book: "Дівчинка-веселка",
    slug: "a",
    epigraph: "a",
    references: [{ url: "a" }],
  }
  const b = { ...a, slug: "b", epigraph: "b", references: [{ url: "b" }] }
  const c = { ...a, book: "Ліхтар" }
  const out = combine([a, b, c])
  assert.equal(out.length, 2)
  assert.equal(out[0].references.length, 2)
  assert.deepEqual(out[0].aliases, ["b"])
})
test("build reads Markdown rather than stripped search content and excludes private/draft/unpublished", async () => {
  const dir = await mkdtemp(join(tmpdir(), "bible-test-")),
    root = join(dir, "content"),
    out = join(dir, "public"),
    book = "Поезія присутності/Ліхтар"
  try {
    await mkdir(join(root, book), { recursive: true })
    await mkdir(join(out, "static"), { recursive: true })
    const pub = {}
    for (const [name, front] of [
      ["живий", ""],
      ["чернетка", "draft: true"],
      ["приватний", "password: secret"],
      ["непублічний", "unlisted: true"],
      ["прихований", "publish: false"],
      ["відсутній", ""],
    ]) {
      const path = book + "/" + name + ".md"
      await writeFile(join(root, path), (front ? "---\n" + front + "\n---\n" : "") + text)
      if (name !== "відсутній") pub[slugifyFilePath(path)] = { title: name, content: "" }
    }
    await writeFile(join(out, "static/contentIndex.json"), JSON.stringify(pub))
    const result = await build(root, out)
    assert.equal(result.works.length, 1)
    assert.equal(result.works[0].title, "живий")
    assert.equal(result.works[0].references.length, 3)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
test("built index contains unique works and only published slugs", async () => {
  const data = JSON.parse(await readFile("public/static/bible-search/index.json", "utf8")),
    published = JSON.parse(await readFile("public/static/contentIndex.json", "utf8"))
  assert.ok(data.works.length >= 7)
  assert.equal(new Set(data.works.map((r) => r.slug)).size, data.works.length)
  for (const row of data.works) {
    assert.ok(published[row.slug])
    assert.ok(row.references.length)
    for (const r of row.references)
      assert.match(r.url, /^https:\/\/www.bible.com\/uk\/bible\/186\//)
  }
})
test("reviewed epigraphs cannot silently disappear from Markdown", async () => {
  for (const name of ["batch-01", "batch-02", "batch-03", "batch-04", "batch-05"]) {
    const reviews = JSON.parse(await readFile(`audits/bible/${name}.json`, "utf8"))
    for (const r of reviews.filter((r) => r.status === "Епіграфи додано")) {
      for (const path of r.paths) {
        const block = epigraphBlock(await readFile(path, "utf8"))
        assert.ok(block, `Lost epigraph: ${path}`)
        assert.ok(references(block).length)
      }
    }
  }
})
