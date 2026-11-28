import { readdir, readFile, writeFile, mkdir } from "node:fs/promises"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "yaml"
import { slugifyFilePath } from "@quartz-community/utils"

const names = {
  Буття: "GEN",
  Вихід: "EXO",
  Левит: "LEV",
  Числа: "NUM",
  "Повторення Закону": "DEU",
  "Ісуса Навина": "JOS",
  Суддів: "JDG",
  Рут: "RUT",
  "1 Самуїла": "1SA",
  "2 Самуїла": "2SA",
  "1 Царів": "1KI",
  "2 Царів": "2KI",
  "1 Хронік": "1CH",
  "2 Хронік": "2CH",
  Ездри: "EZR",
  Неемії: "NEH",
  Естер: "EST",
  Йова: "JOB",
  Псалом: "PSA",
  Псалми: "PSA",
  Приповісті: "PRO",
  Екклезіяст: "ECC",
  "Пісня над піснями": "SNG",
  Ісаї: "ISA",
  Єремії: "JER",
  "Плач Єремії": "LAM",
  Єзекіїля: "EZK",
  Даниїла: "DAN",
  Осії: "HOS",
  Йоіла: "JOL",
  Амоса: "AMO",
  Овдія: "OBA",
  Йони: "JON",
  Михея: "MIC",
  Наума: "NAM",
  Авакума: "HAB",
  Софонії: "ZEP",
  Огія: "HAG",
  Захарії: "ZEC",
  Малахії: "MAL",
  Матвія: "MAT",
  Марка: "MRK",
  Луки: "LUK",
  Івана: "JHN",
  Дії: "ACT",
  Римлян: "ROM",
  "1 Коринтян": "1CO",
  "2 Коринтян": "2CO",
  Галатів: "GAL",
  Ефесян: "EPH",
  "Филип’ян": "PHP",
  Колосян: "COL",
  "1 Солунян": "1TH",
  "2 Солунян": "2TH",
  "1 Тимофія": "1TI",
  "2 Тимофія": "2TI",
  Тита: "TIT",
  Филимона: "PHM",
  Євреїв: "HEB",
  Якова: "JAS",
  "1 Петра": "1PE",
  "2 Петра": "2PE",
  "1 Івана": "1JN",
  "2 Івана": "2JN",
  "3 Івана": "3JN",
  Юди: "JUD",
  "Об’явлення": "REV",
}
const pattern = new RegExp(
  "(" +
    Object.keys(names)
      .sort((a, b) => b.length - a.length)
      .join("|") +
    ")\\s+(\\d+):(\\d+)(?:[–—-](\\d+))?",
  "gu",
)
export function epigraphBlock(text) {
  const lines = text.split(/\r?\n/)
  const i = lines.findIndex((l) => /^>\s*\*\*Біблійний епіграф\*\*/i.test(l))
  if (i < 0) return ""
  let j = i + 1
  while (j < lines.length && /^>/.test(lines[j])) j++
  return lines
    .slice(i + 1, j)
    .map((l) => l.replace(/^>\s?/, ""))
    .join("\n")
    .trim()
}
export function references(block) {
  const found = new Map()
  // Preserve explicit target URLs: Psalms numbering can differ between editions.
  const linked = new Map(
    [...block.matchAll(/\[([^\]]+)\]\((https:\/\/www\.bible\.com\/uk\/bible\/186\/[^)]+)\)/g)].map(
      (m) => [m[1], m[2]],
    ),
  )
  const plain = block.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  for (const m of plain.matchAll(pattern)) {
    const [label, book, ch, start, end] = m
    const code = names[book],
      range = end ? `${start}-${end}` : start
    const key = `${code}.${ch}.${range}`
    if (+ch < 1 || +start < 1 || (end && +end < +start)) throw Error(`Invalid reference: ${label}`)
    found.set(key, {
      label,
      book,
      chapter: +ch,
      start: +start,
      end: +(end || start),
      url: linked.get(label) || `https://www.bible.com/uk/bible/186/${key}.UBIO`,
    })
  }
  return [...found.values()]
}
export function workKey(book, title) {
  return (
    book +
    "/" +
    title
      .normalize("NFC")
      .toLocaleLowerCase("uk")
      .replace(/^\d+\.?\s*/, "")
      .replace(/[«»“”".,!?]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
  )
}
export function combine(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = workKey(row.book, row.title),
      old = map.get(key)
    if (!old) {
      map.set(key, { ...row, aliases: [] })
      continue
    }
    old.aliases.push(row.slug)
    for (const ref of row.references)
      if (!old.references.some((r) => r.url === ref.url)) old.references.push(ref)
    if (row.epigraph !== old.epigraph) old.epigraph += "\n" + row.epigraph
  }
  return [...map.values()].sort((a, b) => a.title.localeCompare(b.title, "uk"))
}
export async function build(root = "content", output = "public") {
  const published = JSON.parse(await readFile(join(output, "static/contentIndex.json"), "utf8"))
  const files = []
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) await walk(p)
      else if (e.name.endsWith(".md")) files.push(p)
    }
  }
  await walk(root)
  const rows = []
  for (const file of files.sort()) {
    const rel = relative(root, file).replaceAll("\\", "/"),
      parts = rel.split("/")
    if (!["Поезія присутності", "Коли шукаєш відповідь (проза))"].includes(parts[0])) continue
    const text = await readFile(file, "utf8"),
      block = epigraphBlock(text)
    if (!block) continue
    const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/),
      meta = front ? parse(front[1]) || {} : {}
    if (meta.draft || meta.publish === false || meta.unlisted || meta.password) continue
    const slug = slugifyFilePath(rel)
    // This also excludes ignored/private content and follows the site's actual publication result.
    if (!Object.hasOwn(published, slug)) continue
    const refs = references(block)
    if (!refs.length) throw Error(`No recognized Bible references: ${rel}`)
    rows.push({
      slug,
      title: published[slug].title || meta.title || parts.at(-1).slice(0, -3),
      book: parts[1].replace(/^\d+\s+/, ""),
      epigraph: block.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
      references: refs,
    })
  }
  const result = {
    version: 1,
    translation: "Іван Огієнко, 1962 (UBIO)",
    sourceCards: rows.length,
    works: combine(rows),
  }
  await mkdir(join(output, "static/bible-search"), { recursive: true })
  await writeFile(
    join(output, "static/bible-search/index.json"),
    JSON.stringify(result, null, 2) + "\n",
  )
  console.log(`Bible index: ${rows.length} published cards, ${result.works.length} distinct works`)
  return result
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  await build(process.argv[2], process.argv[3])
