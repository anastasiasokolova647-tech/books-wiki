import { QuartzComponent, QuartzComponentConstructor } from "./types"
import styles from "./styles/feedbackCards.scss"

const FeedbackCards: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = () => null

  Component.css = styles
  Component.afterDOMLoaded = `
const TEA_FEEDBACK_ENDPOINT = "https://docs.google.com/forms/d/e/1FAIpQLSfjj6dJNZ8pxXI-GYGT6UvNfbeDI8OgnexYhhWy4zKAEWJupw/formResponse"
const TEA_FEEDBACK_FIELDS = {
  meta: "entry.1836990483",
  name: "entry.1884719716",
  impressions: "entry.682797320",
  touched: "entry.349173787",
  takeaway: "entry.1454293127",
  supported: "entry.654017823",
  recommend: "entry.1755347026",
}

function teaPageTitle() {
  return (
    document.querySelector("article h1")?.textContent?.trim() ||
    document.querySelector(".article-title")?.textContent?.trim() ||
    document.title.replace(/\\s*[|·-]\\s*Чай опівночі\\s*$/i, "").trim() ||
    "Без назви"
  )
}

function teaFeedbackMeta(kind) {
  return kind + " • " + teaPageTitle() + " • " + window.location.href
}

function teaYoutubeId(rawUrl) {
  try {
    const url = new URL(rawUrl, window.location.href)
    const host = url.hostname.replace(/^www\\./, "")

    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v")
      const parts = url.pathname.split("/").filter(Boolean)
      if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || null
    }
  } catch {}

  return null
}

function teaChoice(name, value, label) {
  return (
    "<label class='tea-feedback-choice'>" +
      "<input type='radio' name='" + name + "' value='" + value + "'>" +
      "<span>" + label + "</span>" +
    "</label>"
  )
}

function teaFeedbackActions() {
  return (
    "<div class='tea-feedback-actions'>" +
      "<button class='tea-feedback-submit' type='submit'>Поділитися відповіддю</button>" +
      "<button class='tea-feedback-later' type='button' data-feedback-later>Не зараз</button>" +
    "</div>" +
    "<p class='tea-feedback-status' role='status' aria-live='polite'></p>"
  )
}

function teaVideoFeedbackCard() {
  const card = document.createElement("section")
  card.className = "tea-feedback-card tea-feedback-card--video"
  card.hidden = true
  card.innerHTML =
    "<div class='tea-feedback-glow' aria-hidden='true'></div>" +
    "<div class='tea-feedback-heading'>" +
      "<span class='tea-feedback-kicker'>Після прослуховування</span>" +
      "<h2>Як цей уривок відгукнувся вам?</h2>" +
      "<p>Можна відповісти кількома словами або лише на одне запитання. Тут немає правильних відповідей.</p>" +
    "</div>" +
    "<form class='tea-feedback-form' data-feedback-kind='після відео'>" +
      "<label class='tea-feedback-field'>" +
        "<span>Що ви відчули або помітили під час прослуховування?</span>" +
        "<textarea name='impressions' rows='3' placeholder='Можна кількома словами…'></textarea>" +
      "</label>" +
      "<fieldset class='tea-feedback-fieldset'>" +
        "<legend>Чи торкнувся уривок того, з чим ви прийшли?</legend>" +
        "<div class='tea-feedback-choices'>" +
          teaChoice("touched", "Так", "Так") +
          teaChoice("touched", "Частково", "Частково") +
          teaChoice("touched", "Поки не знаю", "Поки не знаю") +
          teaChoice("touched", "Не цього разу", "Не цього разу") +
        "</div>" +
      "</fieldset>" +
      "<label class='tea-feedback-field'>" +
        "<span>Що вам хочеться забрати із собою після цієї історії?</span>" +
        "<textarea name='takeaway' rows='3' placeholder='Я забираю із собою…'></textarea>" +
      "</label>" +
      "<details class='tea-feedback-prompts'>" +
        "<summary>Важко підібрати слова?</summary>" +
        "<div>" +
          "<button type='button' data-feedback-prompt='Під час прослуховування я…'>Під час прослуховування я…</button>" +
          "<button type='button' data-feedback-prompt='Найбільше мене зачепило…'>Найбільше мене зачепило…</button>" +
          "<button type='button' data-feedback-prompt='Після цього уривка я зрозуміла / зрозумів…'>Після цього уривка я зрозуміла / зрозумів…</button>" +
          "<button type='button' data-feedback-prompt='Із собою я забираю…'>Із собою я забираю…</button>" +
        "</div>" +
      "</details>" +
      "<label class='tea-feedback-field tea-feedback-field--name'>" +
        "<span>Ім’я <small>(за бажанням)</small></span>" +
        "<input type='text' name='visitorName' autocomplete='name' placeholder='Як до вас звертатися?'>" +
      "</label>" +
      "<p class='tea-feedback-privacy'>Відповідь побачить авторка «Чаю опівночі». Ім’я можна не вказувати.</p>" +
      teaFeedbackActions() +
    "</form>"

  return card
}

function teaCardFeedback() {
  const card = document.createElement("section")
  card.className = "tea-feedback-card tea-feedback-card--short"
  card.innerHTML =
    "<div class='tea-feedback-glow' aria-hidden='true'></div>" +
    "<div class='tea-feedback-heading'>" +
      "<span class='tea-feedback-kicker'>Кілька слів перед дорогою</span>" +
      "<h2>Перш ніж іти…</h2>" +
      "<p>Можна відповісти лише на одне запитання.</p>" +
    "</div>" +
    "<form class='tea-feedback-form' data-feedback-kind='картка'>" +
      "<fieldset class='tea-feedback-fieldset'>" +
        "<legend>Чи підтримав вас цей уривок?</legend>" +
        "<div class='tea-feedback-choices'>" +
          teaChoice("supported", "Так", "Так") +
          teaChoice("supported", "Трохи", "Трохи") +
          teaChoice("supported", "Поки не знаю", "Поки не знаю") +
          teaChoice("supported", "Не цього разу", "Не цього разу") +
        "</div>" +
      "</fieldset>" +
      "<label class='tea-feedback-field'>" +
        "<span>Що вам хочеться забрати із собою з цієї історії?</span>" +
        "<textarea name='takeaway' rows='3' placeholder='Я забираю із собою…'></textarea>" +
      "</label>" +
      "<label class='tea-feedback-field'>" +
        "<span>Кому б ви порадили «Чай опівночі»?</span>" +
        "<textarea name='recommend' rows='3' placeholder='Людині, яка…'></textarea>" +
      "</label>" +
      "<p class='tea-feedback-privacy'>Відповідь побачить авторка «Чаю опівночі».</p>" +
      teaFeedbackActions() +
    "</form>"

  return card
}

function teaRevealFeedback(card) {
  if (!card || !card.hidden) return
  card.hidden = false
  card.classList.add("is-visible")
  window.setTimeout(() => card.classList.remove("is-visible"), 900)
}

function teaFinishFeedback(card) {
  card.innerHTML =
    "<div class='tea-feedback-thanks' role='status'>" +
      "<span aria-hidden='true'>♡</span>" +
      "<h2>Дякую, що поділилися. Ваш коментар безцінний.</h2>" +
      "<p>Нехай те, що відгукнулося, ще трохи побуде поруч.</p>" +
    "</div>"
}

function teaBindFeedbackCard(card) {
  if (!card || card.dataset.feedbackReady === "true") return
  card.dataset.feedbackReady = "true"

  const form = card.querySelector(".tea-feedback-form")
  if (!form) return

  for (const prompt of form.querySelectorAll("[data-feedback-prompt]")) {
    const onPrompt = () => {
      const textarea = form.querySelector("textarea[name='takeaway']")
      if (!textarea) return
      const phrase = prompt.dataset.feedbackPrompt || ""
      textarea.value = textarea.value.trim() ? textarea.value + "\\n" + phrase : phrase
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
    prompt.addEventListener("click", onPrompt)
    window.addCleanup?.(() => prompt.removeEventListener("click", onPrompt))
  }

  const later = form.querySelector("[data-feedback-later]")
  if (later) {
    const onLater = () => card.classList.add("is-dismissed")
    later.addEventListener("click", onLater)
    window.addCleanup?.(() => later.removeEventListener("click", onLater))
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    const data = new FormData(form)
    const answers = ["impressions", "touched", "takeaway", "supported", "recommend"]
      .map((name) => String(data.get(name) || "").trim())

    const status = form.querySelector(".tea-feedback-status")
    const submit = form.querySelector(".tea-feedback-submit")

    if (!answers.some(Boolean)) {
      if (status) status.textContent = "Можна відповісти хоча б на одне запитання — навіть одним словом."
      form.querySelector("textarea, input[type='radio']")?.focus()
      return
    }

    const payload = new URLSearchParams()
    payload.set(TEA_FEEDBACK_FIELDS.meta, teaFeedbackMeta(form.dataset.feedbackKind || "картка"))
    payload.set(TEA_FEEDBACK_FIELDS.name, String(data.get("visitorName") || "").trim())
    payload.set(TEA_FEEDBACK_FIELDS.impressions, String(data.get("impressions") || "").trim())
    payload.set(TEA_FEEDBACK_FIELDS.touched, String(data.get("touched") || "").trim())
    payload.set(TEA_FEEDBACK_FIELDS.takeaway, String(data.get("takeaway") || "").trim())
    payload.set(TEA_FEEDBACK_FIELDS.supported, String(data.get("supported") || "").trim())
    payload.set(TEA_FEEDBACK_FIELDS.recommend, String(data.get("recommend") || "").trim())

    if (submit) {
      submit.disabled = true
      submit.textContent = "Надсилаю…"
    }
    if (status) status.textContent = ""

    try {
      await fetch(TEA_FEEDBACK_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: payload,
      })
      teaFinishFeedback(card)
    } catch {
      if (submit) {
        submit.disabled = false
        submit.textContent = "Спробувати ще раз"
      }
      if (status) status.textContent = "Не вдалося надіслати відповідь. Перевірте інтернет і спробуйте ще раз."
    }
  }

  form.addEventListener("submit", onSubmit)
  window.addCleanup?.(() => form.removeEventListener("submit", onSubmit))
}

function teaLoadYoutubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (window.__teaYoutubeApiPromise) return window.__teaYoutubeApiPromise

  window.__teaYoutubeApiPromise = new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === "function") previousReady()
      resolve(window.YT)
    }

    if (!document.getElementById("tea-youtube-api")) {
      const script = document.createElement("script")
      script.id = "tea-youtube-api"
      script.src = "https://www.youtube.com/iframe_api"
      script.async = true
      document.head.appendChild(script)
    }
  })

  return window.__teaYoutubeApiPromise
}

function teaPlaceVideo(link, videoId, index) {
  const article = link.closest("article")
  if (!article) return null

  const originalUrl = link.href
  const block = document.createElement("section")
  block.className = "tea-video-block"
  block.dataset.teaVideo = videoId

  const frameWrap = document.createElement("div")
  frameWrap.className = "tea-video-frame"

  const frame = document.createElement("iframe")
  frame.id = "tea-youtube-player-" + Date.now() + "-" + index
  frame.src =
    "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId) +
    "?enablejsapi=1&rel=0&playsinline=1&origin=" + encodeURIComponent(window.location.origin)
  frame.title = "Прослухати уривок «" + teaPageTitle() + "»"
  frame.loading = "lazy"
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  frame.allowFullscreen = true
  frame.referrerPolicy = "strict-origin-when-cross-origin"
  frameWrap.appendChild(frame)

  const beneath = document.createElement("div")
  beneath.className = "tea-video-beneath"
  beneath.innerHTML =
    "<span>Послухайте у своєму темпі.</span>" +
    "<span class='tea-video-links'>" +
      "<button type='button' class='tea-video-feedback-now'>Поділитися враженням зараз</button>" +
      "<a href='" + originalUrl.replace(/'/g, "%27") + "' target='_blank' rel='noopener noreferrer'>Відкрити на YouTube ↗</a>" +
    "</span>"

  const feedback = teaVideoFeedbackCard()
  teaBindFeedbackCard(feedback)
  block.append(frameWrap, feedback, beneath)

  const paragraph = link.closest("p")
  const anchor = paragraph && article.contains(paragraph) ? paragraph : link
  anchor.insertAdjacentElement("afterend", block)
  link.remove()

  if (paragraph && !paragraph.textContent?.trim() && !paragraph.querySelector("img, video, iframe, button")) {
    paragraph.remove()
  }

  const showNow = beneath.querySelector(".tea-video-feedback-now")
  const onShowNow = () => {
    teaRevealFeedback(feedback)
    feedback.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }
  showNow?.addEventListener("click", onShowNow)
  window.addCleanup?.(() => showNow?.removeEventListener("click", onShowNow))

  teaLoadYoutubeApi()
    .then((YT) => {
      if (!document.getElementById(frame.id) || !YT?.Player) return
      const player = new YT.Player(frame, {
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) teaRevealFeedback(feedback)
          },
        },
      })
      window.addCleanup?.(() => {
        try { player.destroy() } catch {}
      })
    })
    .catch(() => {})

  return block
}

function setupTeaFeedbackCards() {
  const slug = document.body.dataset.slug || ""
  if (!slug || slug === "index" || slug.endsWith("/index")) return

  const article = document.querySelector("article")
  if (!article || article.dataset.teaFeedbackReady === "true") return
  article.dataset.teaFeedbackReady = "true"

  const youtubeLinks = Array.from(article.querySelectorAll("a[href]"))
    .map((link) => ({ link, id: teaYoutubeId(link.href) }))
    .filter((item) => item.id)

  if (youtubeLinks.length) {
    youtubeLinks.forEach((item, index) => teaPlaceVideo(item.link, item.id, index))
    return
  }

  const card = teaCardFeedback()
  teaBindFeedbackCard(card)
  article.appendChild(card)
}

setupTeaFeedbackCards()
document.addEventListener("nav", setupTeaFeedbackCards)
document.addEventListener("render", setupTeaFeedbackCards)
`

  return Component
}

export default FeedbackCards
