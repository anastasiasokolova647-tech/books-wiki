import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"

// Only the published build is available. Keep that build intact and make a
// versioned copy with a small bridge to the readable crying-support module.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const base = path.join(root, "static/stabilizer")
const htmlPath = path.join(base, "index.html")
const html = fs.readFileSync(htmlPath, "utf8")
const original = fs.readFileSync(path.join(base, "assets/index-C0o7WV-C.js"), "utf8")
const start =
  "function oe(){ae(),re(`holding`),S.current||(S.current=new Audio(`./sounds/ocean.mp3`),S.current.loop=!0),S.current.volume=.58,S.current.currentTime=0,S.current.play().catch(()=>{}),t(`cry`)}"
if (original.split(start).length !== 2)
  throw new Error("The crying entry changed; review the latest build before applying this bridge")
let result = original.replace(
  start,
  `function oe(){openCrySupport({onSea:()=>{${start.slice("function oe(){".length, -1)}}})}`,
)
const unknown = "onClick:()=>t(`sadness`),children:`Хочеться плакати`"
if (result.split(unknown).length !== 2) throw new Error("The unknown-state crying entry changed")
result = result.replace(unknown, "onClick:oe,children:`Хочеться плакати`")
const cryLabel = 'onClick:oe,"aria-label":`Плач`,children:`;(`'
if (result.split(cryLabel).length !== 2) throw new Error("The home crying button changed")
result = result.replace(cryLabel, 'onClick:oe,"aria-label":`Плачу`,children:`;( Плачу`')
result = 'import { openCrySupport } from "../cry-support.js?v=cry-rain-fatigue-4";\n' + result
const hash = createHash("sha256").update(result).digest("hex").slice(0, 10)
const name = `assets/index-cry-${hash}.js`
fs.writeFileSync(path.join(base, name), result)
if (
  !html.includes("./assets/index-C0o7WV-C.js") &&
  !/\.\/assets\/index-cry-[a-f0-9]+\.js/.test(html)
) {
  throw new Error("Review the current HTML entry before applying")
}
let updated = html
  .replace(/\.\/assets\/index-(?:C0o7WV-C|cry-[a-f0-9]+)\.js/, `./${name}`)
  .replace('<html lang="en">', '<html lang="uk">')
  .replace("<title>stabilizer</title>", "<title>Стабілізатор — Чай опівночі</title>")
if (!/href="\.\/cry-support\.css(?:\?[^\"]*)?"/.test(updated)) {
  updated = updated.replace(
    "</head>",
    '  <link rel="stylesheet" href="./cry-support.css?v=cry-rain-fatigue-4">\n  </head>',
  )
}
updated = updated.replace(
  /href="\.\/cry-support\.css(?:\?[^\"]*)?"/,
  'href="./cry-support.css?v=cry-rain-fatigue-4"',
)
fs.writeFileSync(htmlPath, updated)
console.log(`Crying support wired: ${name}`)
