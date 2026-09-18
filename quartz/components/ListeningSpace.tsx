import { QuartzComponent, QuartzComponentConstructor } from "./types"
import styles from "./styles/listeningSpace.scss"

const scenes = [
  { key: "night", name: "Ніч", label: "Нічний парк після дощу" },
  { key: "moon", name: "Місяць", label: "Місяць у м'якому серпанку" },
  { key: "rain", name: "Дощ", label: "Дощові краплі на вікні" },
  { key: "sea", name: "Море", label: "Хвилі набігають на берег" },
  { key: "wind", name: "Вітер", label: "Гілки дерев рухаються на вітрі" },
  { key: "sun", name: "Сонце", label: "Сонячне світло проходить крізь листя" },
] as const

const ListeningSpace: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData }) => {
    if (fileData.slug !== "index") return null

    return (
      <section class="listening-space" id="listening-space" aria-labelledby="listening-title">
        <div class="listening-space__intro">
          <h2 id="listening-title">Обери свій екран</h2>
          <p class="listening-space__hint">Нехай поруч просто рухається природа.</p>
        </div>
        <figure class="listening-screen-wrap">
          <div
            class="listening-screen"
            id="listening-screen"
            data-scene="sea"
            role="group"
            aria-label="Хвилі набігають на берег"
          >
            <video
              class="listening-screen__video"
              id="listening-video"
              src="./static/listening-scenes/sea.mp4"
              poster="./static/listening-scenes/sea.jpg"
              autoplay
              muted
              loop
              playsinline
              preload="metadata"
            />
            <div class="listening-screen__shade" aria-hidden="true" />
            <div class="listening-screen__toolbar">
              <span class="listening-screen__name" id="listening-screen-name" aria-live="polite">
                Море
              </span>
              <div class="listening-screen__actions">
                <button
                  class="listening-screen__icon-button"
                  id="listening-pause"
                  type="button"
                  aria-pressed="false"
                  title="Зупинити рух"
                >
                  <span aria-hidden="true">Ⅱ</span>
                  <span class="sr-only">Зупинити рух</span>
                </button>
                <button
                  class="listening-screen__icon-button"
                  id="listening-fullscreen"
                  type="button"
                  title="На весь екран"
                >
                  <span aria-hidden="true">⛶</span>
                  <span class="sr-only">На весь екран</span>
                </button>
              </div>
            </div>
          </div>
          <figcaption class="listening-space__choices" role="radiogroup" aria-label="Екран">
            {scenes.map((scene) => (
              <button
                class={`listening-space__choice${scene.key === "sea" ? " is-active" : ""}`}
                type="button"
                role="radio"
                aria-checked={scene.key === "sea" ? "true" : "false"}
                data-listening-scene={scene.key}
              >
                <span class={`listening-space__swatch swatch--${scene.key}`} aria-hidden="true" />
                {scene.name}
              </button>
            ))}
          </figcaption>
        </figure>
      </section>
    )
  }

  Component.css = styles
  Component.afterDOMLoaded = `
const LISTENING_SCENES = {
  night: { name: "Ніч", label: "Нічний парк після дощу" },
  moon: { name: "Місяць", label: "Місяць у м'якому серпанку" },
  rain: { name: "Дощ", label: "Дощові краплі на вікні" },
  sea: { name: "Море", label: "Хвилі набігають на берег" },
  wind: { name: "Вітер", label: "Гілки дерев рухаються на вітрі" },
  sun: { name: "Сонце", label: "Сонячне світло проходить крізь листя" },
}
const LISTENING_STORAGE_KEY = "tea-midnight-listening-screen"

function listeningAsset(scene, extension) {
  return new URL("static/listening-scenes/" + scene + "." + extension, window.location.href).href
}

function createListeningSpace() {
  if (!document.body.matches('[data-slug="index"]')) return null
  const center = document.querySelector(".center")
  if (!center) return null

  const sceneOrder = ["night", "moon", "rain", "sea", "wind", "sun"]
  const choices = sceneOrder.map((scene) => {
    const active = scene === "sea"
    return '<button class="listening-space__choice' + (active ? ' is-active' : '') + '" type="button" role="radio" aria-checked="' + active + '" data-listening-scene="' + scene + '"><span class="listening-space__swatch swatch--' + scene + '" aria-hidden="true"></span>' + LISTENING_SCENES[scene].name + '</button>'
  }).join("")

  const root = document.createElement("section")
  root.className = "listening-space"
  root.id = "listening-space"
  root.setAttribute("aria-labelledby", "listening-title")
  root.innerHTML =
    '<div class="listening-space__intro"><h2 id="listening-title">Обери свій екран</h2><p class="listening-space__hint">Нехай поруч просто рухається природа.</p></div>' +
    '<figure class="listening-screen-wrap">' +
      '<div class="listening-screen" id="listening-screen" data-scene="sea" role="group" aria-label="Хвилі набігають на берег">' +
        '<video class="listening-screen__video" id="listening-video" src="' + listeningAsset("sea", "mp4") + '" poster="' + listeningAsset("sea", "jpg") + '" autoplay muted loop playsinline preload="metadata"></video>' +
        '<div class="listening-screen__shade" aria-hidden="true"></div>' +
        '<div class="listening-screen__toolbar"><span class="listening-screen__name" id="listening-screen-name" aria-live="polite">Море</span>' +
          '<div class="listening-screen__actions"><button class="listening-screen__icon-button" id="listening-pause" type="button" aria-pressed="false" title="Зупинити рух"><span aria-hidden="true">Ⅱ</span><span class="sr-only">Зупинити рух</span></button><button class="listening-screen__icon-button" id="listening-fullscreen" type="button" title="На весь екран"><span aria-hidden="true">⛶</span><span class="sr-only">На весь екран</span></button></div>' +
        '</div>' +
      '</div>' +
      '<figcaption class="listening-space__choices" role="radiogroup" aria-label="Екран">' + choices + '</figcaption>' +
    '</figure>'
  const pageFooter = center.querySelector(".page-footer")
  center.insertBefore(root, pageFooter)
  return root
}

function setupListeningSpace() {
  const root = document.getElementById("listening-space") || createListeningSpace()
  const screen = root?.querySelector("#listening-screen")
  const video = root?.querySelector("#listening-video")
  if (!root || !screen || !video || root.dataset.ready === "true") return

  root.dataset.ready = "true"
  const name = root.querySelector("#listening-screen-name")
  const choices = Array.from(root.querySelectorAll("[data-listening-scene]"))
  const pauseButton = root.querySelector("#listening-pause")
  const fullscreenButton = root.querySelector("#listening-fullscreen")
  let pausedByVisitor = false

  function setPauseLabel(paused) {
    if (!pauseButton) return
    pauseButton.setAttribute("aria-pressed", String(paused))
    pauseButton.title = paused ? "Продовжити рух" : "Зупинити рух"
    const icon = pauseButton.querySelector('[aria-hidden="true"]')
    const hiddenLabel = pauseButton.querySelector(".sr-only")
    if (icon) icon.textContent = paused ? "▶" : "Ⅱ"
    if (hiddenLabel) hiddenLabel.textContent = pauseButton.title
  }

  function selectScene(scene) {
    if (!Object.prototype.hasOwnProperty.call(LISTENING_SCENES, scene)) return
    const changed = video.dataset.scene !== scene
    screen.dataset.scene = scene
    screen.setAttribute("aria-label", LISTENING_SCENES[scene].label)
    video.setAttribute("aria-label", LISTENING_SCENES[scene].label)
    if (name) name.textContent = LISTENING_SCENES[scene].name
    for (const choice of choices) {
      const active = choice.dataset.listeningScene === scene
      choice.classList.toggle("is-active", active)
      choice.setAttribute("aria-checked", String(active))
    }
    if (changed) {
      screen.classList.add("is-changing")
      video.dataset.scene = scene
      video.poster = listeningAsset(scene, "jpg")
      video.src = listeningAsset(scene, "mp4")
      video.load()
      video.addEventListener("canplay", () => {
        screen.classList.remove("is-changing")
        if (!pausedByVisitor) video.play().catch(() => {})
      }, { once: true })
    }
    try { localStorage.setItem(LISTENING_STORAGE_KEY, scene) } catch {}
  }

  let savedScene = "sea"
  try {
    const storedScene = localStorage.getItem(LISTENING_STORAGE_KEY)
    if (storedScene && Object.prototype.hasOwnProperty.call(LISTENING_SCENES, storedScene)) savedScene = storedScene
  } catch {}
  selectScene(savedScene)

  for (const choice of choices) {
    const onChoose = () => selectScene(choice.dataset.listeningScene)
    choice.addEventListener("click", onChoose)
    window.addCleanup?.(() => choice.removeEventListener("click", onChoose))
  }

  if (pauseButton) {
    const onPause = () => {
      pausedByVisitor = !pausedByVisitor
      if (pausedByVisitor) video.pause()
      else video.play().catch(() => {})
      screen.classList.toggle("is-paused", pausedByVisitor)
      setPauseLabel(pausedByVisitor)
    }
    pauseButton.addEventListener("click", onPause)
    window.addCleanup?.(() => pauseButton.removeEventListener("click", onPause))
  }

  if (fullscreenButton) {
    const onFullscreen = async () => {
      try {
        if (document.fullscreenElement === screen) await document.exitFullscreen()
        else await screen.requestFullscreen()
      } catch (error) { console.error("Listening screen fullscreen failed:", error) }
    }
    fullscreenButton.addEventListener("click", onFullscreen)
    window.addCleanup?.(() => fullscreenButton.removeEventListener("click", onFullscreen))
  }
}

setupListeningSpace()
document.addEventListener("nav", setupListeningSpace)
document.addEventListener("render", setupListeningSpace)
`
  return Component
}

export default ListeningSpace
