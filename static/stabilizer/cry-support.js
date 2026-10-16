import { cryReasons, getCryPassages } from "./cry-routing.js?v=cry-together-3"

function element(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function button(label, action, className = "") {
  const node = element("button", `cry-support__button ${className}`.trim(), label)
  node.type = "button"
  node.addEventListener("click", action)
  return node
}

let youtubeReady
function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeReady) return youtubeReady
  youtubeReady = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      try {
        previous?.()
      } finally {
        resolve(window.YT)
      }
    }
    const script = element("script")
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true
    script.addEventListener("error", () => resolve(null))
    document.head.append(script)
  })
  return youtubeReady
}

export function openCrySupport({ onSea }) {
  const existing = document.querySelector(".cry-support")
  if (existing) return existing

  const trigger = document.activeElement
  const previousOverflow = document.body.style.overflow
  const dialog = element("dialog", "cry-support")
  dialog.setAttribute("aria-labelledby", "cry-support-title")
  const container = element("div", "cry-support__container")
  dialog.append(container)
  document.body.append(dialog)
  document.body.style.overflow = "hidden"

  // Someone crying is already present; choosing a cause changes the videos in place.
  let selected = new Set(["unknown"])
  let players = []
  let revision = 0
  let finished = false

  function clearPlayers() {
    revision++
    for (const player of players) player.destroy()
    players = []
  }

  function finish(goToSea = false) {
    if (finished) return
    finished = true
    clearPlayers()
    document.body.style.overflow = previousOverflow
    if (dialog.open && typeof dialog.close === "function") dialog.close()
    dialog.remove()
    if (goToSea) onSea()
    else if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus()
  }

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault()
    finish()
  })
  dialog.addEventListener("close", () => finish())

  const top = element("div", "cry-support__top")
  const title = element("h1", "cry-support__title", "Плачу")
  title.id = "cry-support-title"
  title.tabIndex = -1
  top.append(
    title,
    button("До моря", () => finish(true), "cry-support__back"),
    button("Закрити", () => finish(), "cry-support__close"),
  )

  const group = element("fieldset", "cry-support__reasons")
  group.append(element("legend", "cry-support__sr-only", "Що зараз найближче?"))
  const list = element("div", "cry-support__passages")
  list.setAttribute("aria-label", "Відео для тебе")

  function showVideos() {
    clearPlayers()
    list.replaceChildren()
    const currentRevision = revision
    const frames = []
    for (const choice of group.querySelectorAll("[data-cry-reason]")) {
      const active = selected.has(choice.dataset.cryReason)
      choice.setAttribute("aria-checked", String(active))
      choice.classList.toggle("is-selected", active)
    }
    for (const passage of getCryPassages([...selected])) {
      const card = element("article", "cry-support__player")
      const frame = element("iframe", "cry-support__video")
      const params = new URLSearchParams({
        rel: "0",
        playsinline: "1",
        enablejsapi: "1",
        origin: window.location.origin,
      })
      frame.src = `https://www.youtube-nocookie.com/embed/${passage.video.id}?${params}`
      frame.title = `${passage.title} — ${passage.book}`
      frame.loading = "lazy"
      frame.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture"
      frame.allowFullscreen = true
      frame.referrerPolicy = "strict-origin-when-cross-origin"
      card.append(frame)
      list.append(card)
      frames.push(frame)
    }
    // Keep the native play button. The API only prevents overlapping recordings.
    loadYouTubeAPI().then((YT) => {
      if (!YT || finished || revision !== currentRevision) return
      for (const frame of frames) {
        players.push(new YT.Player(frame, {
          events: {
            onStateChange(event) {
              if (event.data !== YT.PlayerState.PLAYING) return
              for (const other of players) {
                if (other !== event.target) other.pauseVideo()
              }
            },
          },
        }))
      }
    })
  }

  for (const reason of cryReasons) {
    const choice = button(reason.label, () => {
      if (reason.id === "unknown") selected = new Set(["unknown"])
      else {
        selected.delete("unknown")
        if (selected.has(reason.id)) selected.delete(reason.id)
        else selected.add(reason.id)
        if (selected.size === 0) selected.add("unknown")
      }
      showVideos()
    }, "cry-support__reason")
    choice.dataset.cryReason = reason.id
    choice.setAttribute("role", "checkbox")
    group.append(choice)
  }
  container.append(top, group, list)
  showVideos()

  if (typeof dialog.showModal === "function") dialog.showModal()
  else {
    dialog.setAttribute("open", "")
    dialog.setAttribute("role", "dialog")
    dialog.setAttribute("aria-modal", "true")
    const siblings = [...document.body.children].filter((node) => node !== dialog)
    const previous = siblings.map((node) => [node, node.inert])
    for (const [node] of previous) node.inert = true
    const restore = finish
    finish = function (goToSea = false) {
      for (const [node, inert] of previous) node.inert = inert
      restore(goToSea)
    }
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") finish()
    })
  }
  title.focus({ preventScroll: true })
  return dialog
}
