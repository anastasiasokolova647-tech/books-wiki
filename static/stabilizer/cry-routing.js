import { cryPassages } from "./cry-passages.js?v=cry-depth-pain-6"

const cryingReactions = new Set(["Плач", "Плачу", "Плакати разом", "Ридаю", "Плачу на самоті"])

export const cryReasons = [
  { id: "exhaustion", label: "Виснаження", hint: "Забагато всього, а сил уже немає" },
  { id: "loneliness", label: "Самотність", hint: "Хочу, щоб хтось залишився поруч" },
  { id: "hurt", label: "Образа чи нерозуміння", hint: "Мені зробили боляче або мене не чують" },
  { id: "fear", label: "Страх", hint: "Мені тривожно за себе чи близьких" },
  { id: "loss", label: "Втрата", hint: "Горюю або сумую за тим, кого втрачаю" },
  { id: "selfBlame", label: "Сором чи самозвинувачення", hint: "Здається, я недостатньо зробила / зробив" },
  { id: "tenderness", label: "Ніжність чи полегшення", hint: "Мене нарешті зігріли, почули або обійняли" },
  { id: "unknown", label: "Просто поплакати", hint: "Можна без пояснень" },
]

export function getCryPassages(reasonIds = [], excludedIds = [], painLevel = null) {
  const valid = new Set(cryReasons.map((reason) => reason.id))
  const selected = [...new Set(reasonIds)].filter((id) => valid.has(id) && id !== "unknown")
  const excluded = new Set(excludedIds)
  const depth = { quiet: 0, tender: 1, deep: 2 }
  const level = Number.isInteger(painLevel) && painLevel >= 1 && painLevel <= 10 ? painLevel : null

  const passages = cryPassages
    .filter((passage) => {
      if (excluded.has(passage.id)) return false
      // This route offers someone crying alongside the visitor. Kindness,
      // relaxation or a general emotion tag alone are not enough to qualify.
      if (!passage.cryingEvidence?.reactionTags.some((tag) => cryingReactions.has(tag))) return false
      // A general tear/body tag must never send an exhausted visitor into bereavement.
      if (passage.requiresExplicitReason && !selected.includes(passage.requiresExplicitReason)) {
        return false
      }
      if (selected.length === 0) return level !== null || passage.showByDefault
      return passage.reasons.some((reason) => selected.includes(reason))
    })
    .map((passage, order) => ({
      passage,
      order,
      matches: passage.reasons.filter((reason) => selected.includes(reason)).length,
    }))
    .sort((left, right) => {
      if (level !== null) {
        const distance = Math.abs(left.passage.depthScore - level) - Math.abs(right.passage.depthScore - level)
        if (distance) return distance
      }
      // The author wants emotionally deep company. Do not automatically soften
      // the default or fatigue route into the lightest available story.
      const difference = depth[right.passage.intensity] - depth[left.passage.intensity]
      if (difference) return difference
      return (
        right.matches - left.matches ||
        left.order - right.order
      )
    })
    .map(({ passage }) => passage)

  if (level === null || passages.length === 0) return passages
  const closest = Math.min(...passages.map((passage) => Math.abs(passage.depthScore - level)))
  return passages.filter((passage) => Math.abs(passage.depthScore - level) <= closest + 1)
}
