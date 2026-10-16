import { cryPassages } from "./cry-passages.js?v=cry-together-3"

const cryingReactions = new Set(["Плач", "Плачу", "Плакати разом", "Ридаю", "Плачу на самоті"])

export const cryReasons = [
  { id: "exhaustion", label: "Виснаження", hint: "Забагато всього, а сил уже немає" },
  { id: "loneliness", label: "Самотність", hint: "Хочу, щоб хтось залишився поруч" },
  { id: "hurt", label: "Образа чи нерозуміння", hint: "Мені зробили боляче або мене не чують" },
  { id: "fear", label: "Страх", hint: "Мені тривожно за себе чи близьких" },
  { id: "loss", label: "Втрата", hint: "Горюю або сумую за тим, кого втрачаю" },
  { id: "selfBlame", label: "Сором чи самозвинувачення", hint: "Здається, я недостатньо зробила / зробив" },
  { id: "tenderness", label: "Ніжність чи полегшення", hint: "Мене нарешті зігріли, почули або обійняли" },
  { id: "unknown", label: "Поки не знаю", hint: "Можна без пояснень" },
]

export function getCryPassages(reasonIds = [], excludedIds = []) {
  const valid = new Set(cryReasons.map((reason) => reason.id))
  const selected = [...new Set(reasonIds)].filter((id) => valid.has(id) && id !== "unknown")
  const excluded = new Set(excludedIds)
  const depth = { quiet: 0, tender: 1, deep: 2 }

  return cryPassages
    .filter((passage) => {
      if (excluded.has(passage.id)) return false
      // This route offers someone crying alongside the visitor. Kindness,
      // relaxation or a general emotion tag alone are not enough to qualify.
      if (!passage.cryingEvidence?.reactionTags.some((tag) => cryingReactions.has(tag))) return false
      // A general tear/body tag must never send an exhausted visitor into bereavement.
      if (passage.requiresExplicitReason && !selected.includes(passage.requiresExplicitReason)) {
        return false
      }
      if (selected.length === 0) return passage.unknownSafe
      return passage.reasons.some((reason) => selected.includes(reason))
    })
    .map((passage, order) => ({
      passage,
      order,
      matches: passage.reasons.filter((reason) => selected.includes(reason)).length,
    }))
    .sort((left, right) => {
      if (selected.includes("exhaustion") || selected.length === 0) {
        const difference = depth[left.passage.intensity] - depth[right.passage.intensity]
        if (difference) return difference
      }
      return (
        right.matches - left.matches ||
        depth[left.passage.intensity] - depth[right.passage.intensity] ||
        left.order - right.order
      )
    })
    .map(({ passage }) => passage)
}
