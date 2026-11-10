import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { cryPassages } from "../static/stabilizer/cry-passages.js"
import { cryReasons, getCryPassages } from "../static/stabilizer/cry-routing.js"

test("exhaustion offers crying from exhaustion rather than rest or bereavement", () => {
  const passages = getCryPassages(["exhaustion"])
  assert.equal(passages[0].id, "night-unloading")
  assert(
    passages.findIndex((passage) => passage.id === "night-human") <
      passages.findIndex((passage) => passage.id === "rainbow-rain"),
  )
  assert(passages.some((passage) => passage.id === "night-hercules"))
  assert(passages.every((passage) => !passage.reasons.includes("loss")))
  assert(passages.every((passage) => passage.cryingEvidence.reactionTags.length > 0))
})

test("Rain follows the author's exhaustion interpretation and is not offered for hurt", () => {
  assert(getCryPassages(["exhaustion"]).some((passage) => passage.id === "rainbow-rain"))
  const hurt = getCryPassages(["hurt"])
  assert(hurt.every((passage) => passage.id !== "rainbow-rain"))
  assert(hurt.some((passage) => passage.id === "rainbow-unfair"))
})

test("the unscored default starts with deep crying and the whole piano chapter", () => {
  for (const selection of [[], ["unknown"], ["not-a-reason"]]) {
    const passages = getCryPassages(selection)
    assert(passages.length > 0)
    assert.equal(passages[0].id, "night-unloading")
    assert(passages.every((passage) => passage.showByDefault && passage.intensity === "deep"))
    assert(passages.every((passage) => passage.id !== "night-loss"))
  }
})

test("every offered reason has at least one corresponding passage", () => {
  for (const reason of cryReasons) assert(getCryPassages([reason.id]).length > 0, reason.id)
})

test("the Lazarus story appears only when the visitor explicitly chooses loss", () => {
  const withoutLoss = cryReasons.filter((reason) => reason.id !== "loss").map((reason) => reason.id)
  assert(getCryPassages(withoutLoss).every((passage) => passage.id !== "night-loss"))
  assert(getCryPassages(["loss"]).some((passage) => passage.id === "night-loss"))
})

test("mixed causes do not discard the fatigue choice or introduce a loss story", () => {
  const passages = getCryPassages(["exhaustion", "loneliness"])
  assert(passages.some((passage) => passage.id === "night-hercules"))
  assert(passages.every((passage) => passage.requiresExplicitReason !== "loss"))
  assert.equal(passages[0].id, "night-unloading")
})

test("a rejected passage does not reappear and exhausting a list does not fall back to grief", () => {
  const initial = getCryPassages(["exhaustion"])
  const rejected = initial.map((passage) => passage.id)
  assert.deepEqual(getCryPassages(["exhaustion"], rejected), [])
  const partial = getCryPassages(["exhaustion"], ["night-hercules"])
  assert(partial.every((passage) => passage.id !== "night-hercules"))
})

test("every video retains an explicit crying tag and an honest source record", () => {
  assert.equal(new Set(cryPassages.map((passage) => passage.id)).size, cryPassages.length)
  assert.deepEqual(
    new Set(cryPassages.map((passage) => passage.book)),
    new Set(["Дівчинка-веселка", "Крізь ніч до світла"]),
  )
  for (const passage of cryPassages) {
    assert(passage.rationale && passage.title && passage.cryingEvidence)
    assert(["archive", "published-vault"].includes(passage.cryingEvidence.sourceKind))
    if (passage.cryingEvidence.sourceKind === "archive") {
      assert.equal(passage.cryingEvidence.sourceArchive, "Чайний чумайдан(8).zip")
    } else {
      assert.equal(passage.cryingEvidence.sourcePath, passage.video.sourceCard)
    }
    assert(passage.cryingEvidence.sourcePath.endsWith(".md"))
    assert(
      passage.cryingEvidence.reactionTags.some((tag) =>
        ["Плач", "Плачу", "Плакати разом", "Ридаю", "Плачу на самоті"].includes(tag),
      ),
    )
    assert(
      Number.isInteger(passage.depthScore) && passage.depthScore >= 1 && passage.depthScore <= 10,
    )
    if (passage.id === "night-loss") assert.equal(passage.requiresExplicitReason, "loss")
  }
})

test("the pain scale changes depth ordering while preserving the selected cause", () => {
  const lower = getCryPassages(["exhaustion"], [], 2)
  const higher = getCryPassages(["exhaustion"], [], 10)
  assert.equal(lower[0].id, "rainbow-rain")
  assert.equal(higher[0].id, "night-unloading")
  assert(higher[0].depthScore > lower[0].depthScore)
  for (let level = 1; level <= 10; level++) {
    const passages = getCryPassages(["exhaustion"], [], level)
    assert(passages.length > 0)
    assert(passages.every((passage) => passage.reasons.includes("exhaustion")))
    assert(passages.every((passage) => passage.id !== "night-loss"))
    assert(getCryPassages(["unknown"], [], level).every((passage) => passage.id !== "night-loss"))
  }
  assert.equal(getCryPassages(["unknown"], [], 10)[0].depthScore, 10)
  for (const invalid of [-1, 0, 11, 2.5, NaN]) {
    assert.deepEqual(getCryPassages([], [], invalid), getCryPassages([]))
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
