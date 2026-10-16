import test from "node:test"
import assert from "node:assert/strict"
import { cryPassages } from "../static/stabilizer/cry-passages.js"
import { cryReasons, getCryPassages } from "../static/stabilizer/cry-routing.js"

test("exhaustion offers the fatigue scenes and never sends the visitor to Lazarus", () => {
  const passages = getCryPassages(["exhaustion"])
  assert(passages.some((passage) => passage.id === "night-unloading"))
  assert(passages.some((passage) => passage.id === "rainbow-fatigue"))
  assert(passages.every((passage) => !passage.reasons.includes("loss")))
  assert(passages.every((passage) => !passage.paragraphs.join(" ").includes("Лазар")))
  assert.equal(passages[0].intensity, "quiet")
})

test("not knowing the cause offers only reviewed quiet scenes", () => {
  for (const selection of [[], ["unknown"], ["not-a-reason"]]) {
    const passages = getCryPassages(selection)
    assert(passages.length > 0)
    assert(passages.every((passage) => passage.unknownSafe && passage.intensity === "quiet"))
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
  assert(passages.some((passage) => passage.id === "night-unloading"))
  assert(passages.every((passage) => passage.requiresExplicitReason !== "loss"))
  assert.equal(passages[0].intensity, "quiet")
})

test("a rejected passage does not reappear and exhausting a list does not fall back to grief", () => {
  const initial = getCryPassages(["exhaustion"])
  const rejected = initial.map((passage) => passage.id)
  assert.deepEqual(getCryPassages(["exhaustion"], rejected), [])
  const partial = getCryPassages(["exhaustion"], ["night-unloading"])
  assert(partial.every((passage) => passage.id !== "night-unloading"))
})

test("all passages retain author, source metadata and nonempty source text", () => {
  assert.equal(new Set(cryPassages.map((passage) => passage.id)).size, cryPassages.length)
  assert.deepEqual(
    new Set(cryPassages.map((passage) => passage.book)),
    new Set(["Дівчинка-веселка", "Крізь ніч"]),
  )
  for (const passage of cryPassages) {
    assert(passage.description && passage.title && passage.provenance)
    assert(passage.paragraphs.length > 0)
    assert(passage.paragraphs.every((paragraph) => paragraph.trim().length > 0))
    if (passage.reasons.includes("loss")) assert.equal(passage.requiresExplicitReason, "loss")
  }
})
