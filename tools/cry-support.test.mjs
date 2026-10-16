import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { cryPassages } from "../static/stabilizer/cry-passages.js"
import { cryReasons, getCryPassages } from "../static/stabilizer/cry-routing.js"

test("exhaustion offers crying from exhaustion rather than rest or bereavement", () => {
  const passages = getCryPassages(["exhaustion"])
  assert(passages.some((passage) => passage.id === "night-hercules"))
  assert(passages.every((passage) => !passage.reasons.includes("loss")))
  assert(passages.every((passage) => passage.cryingEvidence.reactionTags.length > 0))
})

test("not knowing the cause still offers someone crying, without a bereavement scene", () => {
  for (const selection of [[], ["unknown"], ["not-a-reason"]]) {
    const passages = getCryPassages(selection)
    assert(passages.length > 0)
    assert(passages.every((passage) => passage.unknownSafe && passage.cryingEvidence))
    assert(passages.every((passage) => !passage.reasons.includes("loss")))
  }
})

test("every offered reason has at least one corresponding passage", () => {
  for (const reason of cryReasons) assert(getCryPassages([reason.id]).length > 0, reason.id)
})

test("loss stories appear only when the visitor explicitly chooses loss", () => {
  const withoutLoss = cryReasons.filter((reason) => reason.id !== "loss").map((reason) => reason.id)
  assert(getCryPassages(withoutLoss).every((passage) => passage.id !== "night-loss"))
  assert(getCryPassages(["loss"]).some((passage) => passage.id === "night-loss"))
})

test("mixed causes do not discard the fatigue choice or introduce a loss story", () => {
  const passages = getCryPassages(["exhaustion", "loneliness"])
  assert(passages.some((passage) => passage.id === "night-hercules"))
  assert(passages.every((passage) => passage.requiresExplicitReason !== "loss"))
  assert.equal(passages[0].id, "night-hercules")
})

test("a rejected passage does not reappear and exhausting a list does not fall back to grief", () => {
  const initial = getCryPassages(["exhaustion"])
  const rejected = initial.map((passage) => passage.id)
  assert.deepEqual(getCryPassages(["exhaustion"], rejected), [])
  const partial = getCryPassages(["exhaustion"], ["night-hercules"])
  assert(partial.every((passage) => passage.id !== "night-hercules"))
})

test("every video retains evidence from a crying-reaction section of the supplied archive", () => {
  assert.equal(new Set(cryPassages.map((passage) => passage.id)).size, cryPassages.length)
  assert.deepEqual(
    new Set(cryPassages.map((passage) => passage.book)),
    new Set(["Дівчинка-веселка", "Крізь ніч до світла"]),
  )
  for (const passage of cryPassages) {
    assert(passage.rationale && passage.title && passage.cryingEvidence)
    assert.equal(passage.cryingEvidence.sourceArchive, "Чайний чумайдан(8).zip")
    assert(passage.cryingEvidence.sourcePath.endsWith(".md"))
    assert(
      passage.cryingEvidence.reactionTags.some((tag) =>
        ["Плач", "Плачу", "Плакати разом", "Ридаю", "Плачу на самоті"].includes(tag),
      ),
    )
    if (passage.reasons.includes("loss")) assert.equal(passage.requiresExplicitReason, "loss")
  }
})

test("every listening option points to the video supplied in its own source card", () => {
  for (const passage of cryPassages) {
    assert.match(passage.video.id, /^[A-Za-z0-9_-]{11}$/)
    assert.equal(passage.video.scope, "chapter")
    const card = fs.readFileSync(new URL(`../${passage.video.sourceCard}`, import.meta.url), "utf8")
    assert(card.includes(passage.video.id), passage.id)
    const source = new URL(passage.video.sourceUrl)
    const id =
      source.hostname === "youtu.be" ? source.pathname.slice(1) : source.searchParams.get("v")
    assert.equal(passage.video.id, id, passage.id)
  }
})

test("a warm scene without crying never appears in the crying route", () => {
  const excluded = new Set(["rainbow-tea-visit", "rainbow-fatigue", "night-sleep-island"])
  assert(cryPassages.every((passage) => !excluded.has(passage.id)))
  assert(
    cryPassages.every(
      (passage) => !["uTfeiJUnzZI", "J9Tc0H5-rVk", "Py8Z29S26OM"].includes(passage.video.id),
    ),
  )
})
