import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import type { QuartzComponent } from "./quartz/components/types"

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

ensureMenuHint()
document.addEventListener("nav", ensureMenuHint)
`

  return component
}

componentRegistry.register("PWARegistration", PWARegistration, "local")

const config = await loadQuartzConfig()

export default config
export const layout = await loadQuartzLayout()
