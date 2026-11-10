;(() => {
  const url = "https://anastasiasokolova647-tech.github.io/books-wiki/static/walk/"
  const text =
    "Тут безпечно бути собою.\nЛіс, поле чи море. Обери свою прогулянку й історію. Без поспіху."
  const full =
    text +
    "\n\nПрогулянка: " +
    url +
    "\n\nВстановити Чай опівночі: https://anastasiasokolova647-tech.github.io/books-wiki/#install-app"
  const get = (id) => document.getElementById(id),
    dialog = get("share-dialog")
  get("share-facebook").href =
    "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url)
  function openDialog() {
    get("share-status").textContent = ""
    get("share-url").value = full
    if (!dialog.open) dialog.showModal()
  }
  get("share-open").onclick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Чай опівночі · Прогулянка", text, url })
        return
      } catch (e) {
        if (e.name === "AbortError") return
      }
    }
    openDialog()
    await copy(url)
  }
  get("share-close").onclick = () => dialog.close()
  dialog.addEventListener("close", () => get("share-open").focus())
  async function copy(value) {
    get("share-url").value = value
    try {
      await navigator.clipboard.writeText(value)
      get("share-status").textContent = "Скопійовано. Можна вставити в допис або повідомлення."
    } catch {
      get("share-url").focus()
      get("share-url").select()
      get("share-status").textContent = "Текст виділено. Скористайся командою «Копіювати»."
    }
  }
  get("share-copy").onclick = () => copy(url)
  get("share-copy-text").onclick = () => copy(full)
  if (navigator.share) {
    get("share-native").hidden = false
    get("share-native").onclick = async () => {
      try {
        await navigator.share({ title: "Чай опівночі · Прогулянка", text, url })
      } catch (e) {
        if (e.name !== "AbortError")
          get("share-status").textContent =
            "Можна скопіювати посилання або поділитися через Facebook."
      }
    }
  }
})()
