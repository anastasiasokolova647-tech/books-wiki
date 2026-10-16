import { cryReasons, getCryPassages } from "./cry-routing.js"

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

export function openCrySupport({ onSea }) {
  const existing = document.querySelector(".cry-support")
  if (existing) return existing

  const trigger = document.activeElement
  const previousOverflow = document.body.style.overflow
  const dialog = element("dialog", "cry-support")
  dialog.setAttribute("aria-labelledby", "cry-support-title")
  dialog.setAttribute("aria-describedby", "cry-support-description")
  const container = element("div", "cry-support__container")
  dialog.append(container)
  document.body.append(dialog)
  document.body.style.overflow = "hidden"

  let selected = new Set()
  const excluded = new Set()
  let finished = false

  function finish(goToSea = false) {
    if (finished) return
    finished = true
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

  function heading(title, description, backAction) {
    container.replaceChildren()
    const top = element("div", "cry-support__top")
    top.append(
      backAction
        ? button("← Назад", backAction, "cry-support__back")
        : element("span", "cry-support__brand", "Чай опівночі"),
      button("До моря", () => finish(true), "cry-support__back"),
      button("Закрити", () => finish(), "cry-support__close"),
    )
    const heading = element("h1", "cry-support__title", title)
    heading.id = "cry-support-title"
    heading.tabIndex = -1
    const text = element("p", "cry-support__description", description)
    text.id = "cry-support-description"
    container.append(top, heading, text)
    dialog.scrollTop = 0
    if (dialog.open) heading.focus({ preventScroll: true })
  }

  function seaButton() {
    return button("Просто побути біля моря", () => finish(true), "cry-support__sea")
  }

  function showReasons() {
    heading("Плачу", "Що стоїть за сльозами? Можна вибрати кілька причин або не пояснювати нічого.")
    const group = element("fieldset", "cry-support__reasons")
    const legend = element("legend", "cry-support__sr-only", "Що зараз найближче?")
    group.append(legend)
    const show = button("Показати уривки", () => showPassages(), "cry-support__primary")
    show.disabled = selected.size === 0

    function updateChoices() {
      for (const choice of group.querySelectorAll("[data-cry-reason]")) {
        const active = selected.has(choice.dataset.cryReason)
        choice.setAttribute("aria-checked", String(active))
        choice.classList.toggle("is-selected", active)
      }
      show.disabled = selected.size === 0
    }

    for (const reason of cryReasons) {
      const choice = button("", () => {
        if (selected.has(reason.id)) selected.delete(reason.id)
        else if (reason.id === "unknown") selected = new Set(["unknown"])
        else {
          selected.delete("unknown")
          selected.add(reason.id)
        }
        excluded.clear()
        updateChoices()
      }, "cry-support__reason")
      choice.dataset.cryReason = reason.id
      choice.setAttribute("role", "checkbox")
      choice.append(
        element("span", "cry-support__reason-name", reason.label),
        element("small", "cry-support__reason-hint", reason.hint),
      )
      group.append(choice)
    }
    updateChoices()
    const actions = element("div", "cry-support__actions")
    actions.append(show, seaButton())
    container.append(group, actions)
  }

  function showPassages() {
    const names = cryReasons.filter((reason) => selected.has(reason.id)).map((reason) => reason.label)
    const unknown = selected.size === 0 || selected.has("unknown")
    heading(
      "Що відгукується зараз?",
      unknown
        ? "Можна почати з тихої сцени без пояснення своїх сліз. Або одразу побути біля моря."
        : `Твій вибір: ${names.join(" · ")}. Прочитай короткий опис і виріши, чи хочеться заходити в цю історію.`,
      showReasons,
    )
    const list = element("div", "cry-support__passages")
    const passages = getCryPassages([...selected], [...excluded])
    for (const passage of passages) {
      const card = element("article", "cry-support__card")
      const depth = { quiet: "Тиха сцена", tender: "Сцена з ніжністю та сльозами", deep: "Глибша сцена" }
      card.append(
        element("p", "cry-support__source", `${passage.book} · ${depth[passage.intensity]}`),
        element("h2", "cry-support__passage-title", passage.title),
        element("p", "cry-support__synopsis", passage.description),
      )
      if (passage.contentNote) card.append(element("p", "cry-support__note", passage.contentNote))
      const read = button("Читати уривок", () => showReader(passage), "cry-support__read")
      read.setAttribute("aria-label", `Читати «${passage.title}»`)
      card.append(read)
      list.append(card)
    }
    if (passages.length === 0) {
      const empty = element("div", "cry-support__empty")
      empty.append(
        element("p", "", "Ці уривки зараз не відгукнулися. Можна змінити вибір або просто побути біля моря."),
        button("Змінити вибір", showReasons),
      )
      list.append(empty)
    }
    const actions = element("div", "cry-support__actions")
    actions.append(seaButton())
    container.append(list, actions)
  }

  function showReader(passage) {
    heading(passage.title, `${passage.book} · Анастасія Соколова · Уривок`, showPassages)
    const reader = element("article", "cry-support__reader")
    reader.setAttribute("aria-label", `Уривок «${passage.title}»`)
    for (const paragraph of passage.paragraphs) {
      reader.append(element("p", "", paragraph))
    }
    const actions = element("div", "cry-support__reader-actions")
    actions.append(
      button("Не про мене — інший уривок", () => {
        excluded.add(passage.id)
        showPassages()
      }),
      seaButton(),
      button("Повернутися до вибору", showReasons, "cry-support__back"),
    )
    container.append(reader, actions)
  }

  showReasons()
  if (typeof dialog.showModal === "function") dialog.showModal()
  else {
    // Preserve the same controls on older embedded browsers without <dialog> support.
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
  dialog.querySelector("h1")?.focus({ preventScroll: true })
  return dialog
}
