/* Shared PWA controller, extracted from quartz.ts. */
(() => {
if (window.__teaInstallControllerLoaded) return;
window.__teaInstallControllerLoaded = true;
if (!window.TEA_PREVIEW && "serviceWorker" in navigator) {
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
    style.textContent = `
      .tea-install-wrap {
        margin: 0 0 1rem 0;
      }
      .tea-install-button {
        width: 100%;
        pointer-events: auto;
        opacity: 1;
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
    `
    document.head.appendChild(style)
  }

  let wrap = document.getElementById("tea-install-wrap")
  if (!wrap) {
    const center = document.querySelector(".center")
    if (!center) return

    wrap = document.createElement("div")
    wrap.id = "tea-install-wrap"
    wrap.className = "tea-install-wrap"
    wrap.innerHTML = `
      <button id="tea-install-button" class="tea-install-button" type="button">
        Встановити «Чай опівночі»
      </button>
      <div id="tea-install-note" class="tea-install-note" role="status" aria-live="polite"></div>
    `
    center.insertBefore(wrap, center.firstChild)
  }

  if (isStandalone()) {
    wrap.style.display = "none"
    return
  }

  wrap.style.display = ""

  const button = document.getElementById("tea-install-button")
  const note = document.getElementById("tea-install-note")
  if (!button) return
}

async function requestInstall() {
    const button = document.getElementById("tea-install-button") || document.getElementById("install-app");
    let note = document.getElementById("tea-install-note");
    if (!note) { note = document.createElement("p"); note.id="tea-install-note"; note.setAttribute("role","status"); button.after(note); }
    note.style.display = "none"

    if (window.TEA_PREVIEW) {
      note.textContent = "Це попередній перегляд. Встановлення повного Чаю стане доступним після погодженого розміщення прогулянки в застосунку.";
      note.style.display="block"; return;
    }
    if (isStandalone() || window.__teaInstalled) { note.textContent="Чай опівночі вже встановлено."; note.style.display="block"; return; }
    if (window.__teaInstallPrompt) {
      const promptEvent = window.__teaInstallPrompt
      window.__teaInstallPrompt = null
      try {
        await promptEvent.prompt()
        await promptEvent.userChoice
      } catch (_) {
        note.textContent = "Не вдалося відкрити встановлення. Спробуйте через меню браузера."; note.style.display="block";
      }

      if (!isStandalone()) {
        button.disabled = false
      }
      return
    }

    const ua = navigator.userAgent
    const isiOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
    const isFirefox = /firefox/i.test(ua)

    if (isiOS) {
      note.innerHTML =
        'Ще один крок: натисніть <strong>Поділитися</strong> → <strong>«На початковий екран»</strong> → <strong>«Додати»</strong>.'
    } else if (isFirefox && !/Android/i.test(ua)) {
      note.textContent = "Для встановлення на цьому комп’ютері відкрийте Чай у Chrome або Edge. У цьому браузері можна продовжувати користуватися сайтом."
    } else if (isFirefox) {
      note.innerHTML =
        'Відкрийте меню браузера й виберіть <strong>«Встановити»</strong> або <strong>«Додати на головний екран»</strong>.'
    } else if (isSafari) {
      note.innerHTML =
        'У меню браузера виберіть <strong>«Додати до Dock»</strong> або встановлення вебзастосунку.'
    } else {
      note.innerHTML =
        'Браузер поки не дав системну кнопку встановлення. Відкрийте його меню й виберіть <strong>«Встановити застосунок»</strong> або <strong>«Додати на головний екран»</strong>.'
    }
    note.style.display = "block"
}

document.addEventListener("click", (event) => {
 if (event.target instanceof Element && event.target.closest("#tea-install-button, #install-app")) { event.preventDefault(); requestInstall(); }
});
window.teaRequestInstall = requestInstall;

if (!window.__teaInstallListenersBound) {
  window.__teaInstallListenersBound = true

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    window.__teaInstallPrompt = event
    ensureInstallUI()
  })

  window.addEventListener("appinstalled", () => {
    window.__teaInstallPrompt = null
    window.__teaInstalled = true
    const wrap = document.getElementById("tea-install-wrap")
    if (wrap) wrap.style.display = "none"
  })
}


window.teaEnsureInstallUI = ensureInstallUI;
if (document.readyState !== "loading") ensureInstallUI();
else document.addEventListener("DOMContentLoaded", ensureInstallUI);
document.addEventListener("nav", ensureInstallUI);
})();
