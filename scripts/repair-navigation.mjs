import { readdir, readFile, writeFile } from "node:fs/promises"
import { join, relative, sep } from "node:path"

const root = "content"
let empty = 0
let requestLinks = 0
const homeLink = '<p><a href="/books-wiki/" data-router-ignore>← Повернутися до «Чаю опівночі»</a></p>'
const requestLink = '<p><a href="/books-wiki/" data-router-ignore>← До головної сторінки бібліотеки</a></p>'

async function visit(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      await visit(path)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue
    const name = relative(root, path).split(sep).join("/")
    if (name === "index.md") continue
    const original = await readFile(path, "utf8")
    if (!original.trim()) {
      const title = entry.name.slice(0, -3)
      const heading = title.replace(/[\\`*_{}\[\]<>#|]/g, "")
      await writeFile(path, '# ' + heading + '\n\nДля цієї картки матеріали ще добираються.\n\n' + homeLink + '\n')
      empty++
    } else if (name.includes("/Запит/") && !/Повернутися|На головну|До головної|Назад|href=["']\/books-wiki\//i.test(original)) {
      await writeFile(path, original.replace(/\s*$/, "") + '\n\n' + requestLink + '\n')
      requestLinks++
    }
  }
}
await visit(root)
console.log('Navigation repair (build only): ' + empty + ' empty cards received a navigation link; ' + requestLinks + ' request cards received a return link.')
