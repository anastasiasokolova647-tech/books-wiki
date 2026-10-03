import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import type { QuartzComponent } from "./quartz/components/types"
import ListeningSpace from "./quartz/components/ListeningSpace"
import FeedbackCards from "./quartz/components/FeedbackCards"

const PWARegistration = () => {
  const component: QuartzComponent = () => null
  component.afterDOMLoaded = `
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/books-wiki/service-worker.js", {
      scope: "/books-wiki/",
      updateViaCache: "none",
    })
    .then((registration) => registration.update())
    .catch((error) => {
      console.error("PWA service worker registration failed:", error)
    })
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true
}

function ensureInstallUI() {
  if (!document.getElementById("tea-install-style")) {
    const style = document.createElement("style")
    style.id = "tea-install-style"
    style.textContent = \`
      .tea-install-wrap {
        margin: 0 0 1rem 0;
      }
      .tea-install-button {
        width: 100%;
        border: 1px solid var(--secondary);
        border-radius: 12px;
        padding: 0.8rem 1rem;
        background: var(--light);
        color: var(--dark);
        font: inherit;
        font-weight: 650;
        cursor: pointer;
      }
      .tea-install-button:hover {
        background: color-mix(in srgb, var(--light) 92%, var(--secondary) 8%);
      }
      .tea-install-note {
        display: none;
        margin-top: 0.65rem;
        padding: 0.75rem 0.9rem;
        border: 1px solid var(--lightgray);
        border-radius: 12px;
        color: var(--darkgray);
        font-size: 0.92rem;
        line-height: 1.4;
      }
    \`
    document.head.appendChild(style)
  }

  let wrap = document.getElementById("tea-install-wrap")
  if (!wrap) {
    const center = document.querySelector(".center")
    if (!center) return

    wrap = document.createElement("div")
    wrap.id = "tea-install-wrap"
    wrap.className = "tea-install-wrap"
    wrap.innerHTML = \`
      <button id="tea-install-button" class="tea-install-button" type="button">
        Встановити «Чай опівночі»
      </button>
      <div id="tea-install-note" class="tea-install-note" role="status" aria-live="polite"></div>
    \`
    center.insertBefore(wrap, center.firstChild)
  }

  if (isStandalone()) {
    wrap.style.display = "none"
    return
  }

  wrap.style.display = ""

  const button = document.getElementById("tea-install-button")
  const note = document.getElementById("tea-install-note")
  if (!button || button.dataset.installBound === "1") return
  button.dataset.installBound = "1"

  button.addEventListener("click", async () => {
    note.style.display = "none"

    if (window.__teaInstallPrompt) {
      const promptEvent = window.__teaInstallPrompt
      window.__teaInstallPrompt = null
      await promptEvent.prompt()

      try {
        await promptEvent.userChoice
      } catch (_) {}

      if (!isStandalone()) {
        button.disabled = false
      }
      return
    }

    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (isiOS) {
      note.innerHTML =
        'Ще один крок: відкрийте меню <strong>Поділитися</strong> і виберіть <strong>«На початковий екран»</strong>.'
    } else {
      note.textContent =
        "Відкрийте меню браузера й виберіть «Встановити застосунок» або «Додати на головний екран»."
    }
    note.style.display = "block"
  })
}

if (!window.__teaInstallListenersBound) {
  window.__teaInstallListenersBound = true

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    window.__teaInstallPrompt = event
    ensureInstallUI()
  })

  window.addEventListener("appinstalled", () => {
    window.__teaInstallPrompt = null
    const wrap = document.getElementById("tea-install-wrap")
    if (wrap) wrap.style.display = "none"
  })
}

function ensureMenuHint() {
  if (!document.getElementById("menu-hint-style")) {
    const style = document.createElement("style")
    style.id = "menu-hint-style"
    style.textContent = \`
      .menu-hint {
        display: none;
      }
      @media (max-width: 800px) {
        .menu-hint {
          display: block;
          margin: 0 0 1rem 0;
          padding: 0.8rem 1rem;
          border: 1px solid var(--lightgray);
          border-radius: 12px;
          background: color-mix(in srgb, var(--light) 92%, var(--secondary) 8%);
          color: var(--darkgray);
          font-size: 0.95rem;
          line-height: 1.45;
        }
        .menu-hint strong {
          color: var(--dark);
        }
      }
    \`
    document.head.appendChild(style)
  }

  if (document.querySelector(".menu-hint")) return

  const center = document.querySelector(".center")
  if (!center) return
  const hint = document.createElement("div")
  hint.className = "menu-hint"
  hint.setAttribute("role", "note")
  hint.setAttribute("aria-label", "Навігація")
  hint.innerHTML =
    '☰ <strong>Меню — у трьох смужках ліворуч.</strong><br>Там можна знайти потрібний розділ і перейти далі.'

  center.insertBefore(hint, center.firstChild)
}

ensureInstallUI()
ensureMenuHint()
document.addEventListener("nav", ensureInstallUI)
document.addEventListener("nav", ensureMenuHint)
`

  return component
}
componentRegistry.register("PWARegistration", PWARegistration, "local")
componentRegistry.register("ListeningSpace", ListeningSpace, "local")
componentRegistry.register("FeedbackCards", FeedbackCards, "local")

const config = await loadQuartzConfig()

export default config
export const layout = await loadQuartzLayout()
