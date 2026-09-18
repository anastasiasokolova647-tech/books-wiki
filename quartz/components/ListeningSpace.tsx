import { QuartzComponent, QuartzComponentConstructor } from "./types"
import styles from "./styles/listeningSpace.scss"

const sceneNames = ["Ніч", "Місяць", "Дощ", "Море", "Вітер", "Сонце"] as const
const sceneKeys = ["night", "moon", "rain", "sea", "wind", "sun"] as const

const ListeningSpace: QuartzComponentConstructor = () => {
  const Component: QuartzComponent = ({ fileData }) => {
    if (fileData.slug !== "index") return null

    const stars = Array.from({ length: 36 }, (_, index) => {
      const left = (index * 37 + 11) % 100
      const top = (index * 53 + 7) % 62
      const size = 1 + (index % 3)
      const delay = -((index % 9) * 0.43)

      return (
        <i
          aria-hidden="true"
          style={`left:${left}%;top:${top}%;width:${size}px;height:${size}px;animation-delay:${delay}s`}
        />
      )
    })

    const drops = Array.from({ length: 48 }, (_, index) => {
      const left = (index * 29 + 3) % 105
      const delay = -((index % 13) * 0.17)
      const duration = 0.72 + (index % 5) * 0.08
      const opacity = 0.28 + (index % 4) * 0.12

      return (
        <i
          aria-hidden="true"
          style={`left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;opacity:${opacity}`}
        />
      )
    })

    const grass = Array.from({ length: 58 }, (_, index) => {
      const left = (index * 19 + 1) % 101
      const height = 34 + (index % 7) * 12
      const delay = -((index % 11) * 0.19)
      const duration = 2.2 + (index % 5) * 0.31

      return (
        <i
          aria-hidden="true"
          style={`left:${left}%;height:${height}px;animation-delay:${delay}s;animation-duration:${duration}s`}
        />
      )
    })

    const windLines = Array.from({ length: 10 }, (_, index) => {
      const top = 16 + index * 6
      const width = 90 + (index % 4) * 45
      const delay = -((index % 6) * 0.54)
      const duration = 4.7 + (index % 4) * 0.8

      return (
        <i
          aria-hidden="true"
          style={`top:${top}%;width:${width}px;animation-delay:${delay}s;animation-duration:${duration}s`}
        />
      )
    })

    return (
      <section class="listening-space" id="listening-space" aria-labelledby="listening-title">
        <div class="listening-space__intro">
          <div>
            <p class="listening-space__eyebrow">Дівчинка-веселка</p>
            <h2 id="listening-title">Обери свій екран для слухання</h2>
            <p class="listening-space__hint">
              Увімкни аудіокнигу в сусідній вкладці й повернися сюди.
            </p>
          </div>

          <a
            class="listening-space__youtube external"
            href="https://www.youtube.com/playlist?list=PLgf50mlM2gm8krs6Hms_dyGp6qSIPKmXT"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true">▶</span> Слухати на YouTube
          </a>
        </div>

        <figure class="listening-screen-wrap">
          <div
            class="listening-screen"
            id="listening-screen"
            data-scene="sea"
            role="img"
            aria-label="Місячне море"
          >
            <div class="listening-screen__sky" aria-hidden="true" />
            <div class="listening-screen__stars" aria-hidden="true">
              {stars}
            </div>

            <div class="listening-screen__moon" aria-hidden="true">
              <i />
            </div>
            <div class="listening-screen__sun" aria-hidden="true">
              <i />
            </div>

            <div class="listening-screen__clouds" aria-hidden="true">
              <i class="cloud cloud--one" />
              <i class="cloud cloud--two" />
              <i class="cloud cloud--three" />
            </div>

            <div class="listening-screen__rain" aria-hidden="true">
              {drops}
            </div>

            <div class="listening-screen__wind" aria-hidden="true">
              {windLines}
            </div>

            <div class="listening-screen__sea" aria-hidden="true">
              <i class="sea-reflection" />
              <i class="wave wave--one" />
              <i class="wave wave--two" />
              <i class="wave wave--three" />
            </div>

            <div class="listening-screen__grass" aria-hidden="true">
              {grass}
            </div>

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
            {sceneKeys.map((key, index) => (
              <button
                class={`listening-space__choice${key === "sea" ? " is-active" : ""}`}
                type="button"
                role="radio"
                aria-checked={key === "sea" ? "true" : "false"}
                data-listening-scene={key}
              >
                <span class={`listening-space__swatch swatch--${key}`} aria-hidden="true" />
                {sceneNames[index]}
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
  night: { name: "Ніч", label: "Тиха зоряна ніч" },
  moon: { name: "Місяць", label: "Місяць серед хмар" },
  rain: { name: "Дощ", label: "Тихий нічний дощ" },
  sea: { name: "Море", label: "Місячне море" },
  wind: { name: "Вітер", label: "Трава хитається від вітру" },
  sun: { name: "Сонце", label: "Тепле сонце над горизонтом" },
}

const LISTENING_STORAGE_KEY = "tea-midnight-listening-screen"

function createListeningSpace() {
  if (!document.body.matches('[data-slug="index"]')) return null

  const center = document.querySelector(".center")
  if (!center) return null

  const stars = Array.from({ length: 36 }, (_, index) => {
    const left = (index * 37 + 11) % 100
    const top = (index * 53 + 7) % 62
    const size = 1 + (index % 3)
    const delay = -((index % 9) * 0.43)
    return '<i aria-hidden="true" style="left:' + left + '%;top:' + top + '%;width:' + size + 'px;height:' + size + 'px;animation-delay:' + delay + 's"></i>'
  }).join("")

  const drops = Array.from({ length: 48 }, (_, index) => {
    const left = (index * 29 + 3) % 105
    const delay = -((index % 13) * 0.17)
    const duration = 0.72 + (index % 5) * 0.08
    const opacity = 0.28 + (index % 4) * 0.12
    return '<i aria-hidden="true" style="left:' + left + '%;animation-delay:' + delay + 's;animation-duration:' + duration + 's;opacity:' + opacity + '"></i>'
  }).join("")

  const grass = Array.from({ length: 58 }, (_, index) => {
    const left = (index * 19 + 1) % 101
    const height = 34 + (index % 7) * 12
    const delay = -((index % 11) * 0.19)
    const duration = 2.2 + (index % 5) * 0.31
    return '<i aria-hidden="true" style="left:' + left + '%;height:' + height + 'px;animation-delay:' + delay + 's;animation-duration:' + duration + 's"></i>'
  }).join("")

  const windLines = Array.from({ length: 10 }, (_, index) => {
    const top = 16 + index * 6
    const width = 90 + (index % 4) * 45
    const delay = -((index % 6) * 0.54)
    const duration = 4.7 + (index % 4) * 0.8
    return '<i aria-hidden="true" style="top:' + top + '%;width:' + width + 'px;animation-delay:' + delay + 's;animation-duration:' + duration + 's"></i>'
  }).join("")

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
    '<div class="listening-space__intro">' +
      '<div><p class="listening-space__eyebrow">Дівчинка-веселка</p>' +
      '<h2 id="listening-title">Обери свій екран для слухання</h2>' +
      '<p class="listening-space__hint">Увімкни аудіокнигу в сусідній вкладці й повернися сюди.</p></div>' +
      '<a class="listening-space__youtube external" href="https://www.youtube.com/playlist?list=PLgf50mlM2gm8krs6Hms_dyGp6qSIPKmXT" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">▶</span> Слухати на YouTube</a>' +
    '</div>' +
    '<figure class="listening-screen-wrap">' +
      '<div class="listening-screen" id="listening-screen" data-scene="sea" role="img" aria-label="Місячне море">' +
        '<div class="listening-screen__sky" aria-hidden="true"></div>' +
        '<div class="listening-screen__stars" aria-hidden="true">' + stars + '</div>' +
        '<div class="listening-screen__moon" aria-hidden="true"><i></i></div>' +
        '<div class="listening-screen__sun" aria-hidden="true"><i></i></div>' +
        '<div class="listening-screen__clouds" aria-hidden="true"><i class="cloud cloud--one"></i><i class="cloud cloud--two"></i><i class="cloud cloud--three"></i></div>' +
        '<div class="listening-screen__rain" aria-hidden="true">' + drops + '</div>' +
        '<div class="listening-screen__wind" aria-hidden="true">' + windLines + '</div>' +
        '<div class="listening-screen__sea" aria-hidden="true"><i class="sea-reflection"></i><i class="wave wave--one"></i><i class="wave wave--two"></i><i class="wave wave--three"></i></div>' +
        '<div class="listening-screen__grass" aria-hidden="true">' + grass + '</div>' +
        '<div class="listening-screen__shade" aria-hidden="true"></div>' +
        '<div class="listening-screen__toolbar"><span class="listening-screen__name" id="listening-screen-name" aria-live="polite">Море</span>' +
          '<div class="listening-screen__actions">' +
            '<button class="listening-screen__icon-button" id="listening-pause" type="button" aria-pressed="false" title="Зупинити рух"><span aria-hidden="true">Ⅱ</span><span class="sr-only">Зупинити рух</span></button>' +
            '<button class="listening-screen__icon-button" id="listening-fullscreen" type="button" title="На весь екран"><span aria-hidden="true">⛶</span><span class="sr-only">На весь екран</span></button>' +
          '</div>' +
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
  if (!root || !screen || root.dataset.ready === "true") return

  root.dataset.ready = "true"
  const name = document.getElementById("listening-screen-name")
  const choices = Array.from(root.querySelectorAll("[data-listening-scene]"))
  const pauseButton = document.getElementById("listening-pause")
  const fullscreenButton = document.getElementById("listening-fullscreen")

  function selectScene(scene) {
    if (!Object.prototype.hasOwnProperty.call(LISTENING_SCENES, scene)) return

    screen.dataset.scene = scene
    screen.setAttribute("aria-label", LISTENING_SCENES[scene].label)
    if (name) name.textContent = LISTENING_SCENES[scene].name

    for (const choice of choices) {
      const active = choice.dataset.listeningScene === scene
      choice.classList.toggle("is-active", active)
      choice.setAttribute("aria-checked", String(active))
    }

    try {
      localStorage.setItem(LISTENING_STORAGE_KEY, scene)
    } catch {}
  }

  let savedScene = "sea"
  try {
    const storedScene = localStorage.getItem(LISTENING_STORAGE_KEY)
    if (storedScene && Object.prototype.hasOwnProperty.call(LISTENING_SCENES, storedScene)) {
      savedScene = storedScene
    }
  } catch {}
  selectScene(savedScene)

  for (const choice of choices) {
    const onChoose = () => selectScene(choice.dataset.listeningScene)
    choice.addEventListener("click", onChoose)
    window.addCleanup?.(() => choice.removeEventListener("click", onChoose))
  }

  if (pauseButton) {
    const onPause = () => {
      const paused = screen.classList.toggle("is-paused")
      pauseButton.setAttribute("aria-pressed", String(paused))
      pauseButton.title = paused ? "Продовжити рух" : "Зупинити рух"
      const hiddenLabel = pauseButton.querySelector(".sr-only")
      if (hiddenLabel) hiddenLabel.textContent = pauseButton.title
    }
    pauseButton.addEventListener("click", onPause)
    window.addCleanup?.(() => pauseButton.removeEventListener("click", onPause))
  }

  if (fullscreenButton) {
    const onFullscreen = async () => {
      try {
        if (document.fullscreenElement === screen) {
          await document.exitFullscreen()
        } else {
          await screen.requestFullscreen()
        }
      } catch (error) {
        console.error("Listening screen fullscreen failed:", error)
      }
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
