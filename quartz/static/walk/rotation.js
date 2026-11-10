/* Keep only shown IDs in this browser; no mood, identity or server tracking. */
;(() => {
  const memory = new Map()
  const key = (theme) => "tea-walk-seen-v1:" + theme
  function read(theme) {
    if (memory.has(theme)) return memory.get(theme)
    try {
      const value = JSON.parse(localStorage.getItem(key(theme)) || "[]")
      if (Array.isArray(value)) return value.filter((x) => typeof x === "string").slice(-100)
    } catch {}
    return []
  }
  function mark(story, theme) {
    const seen = read(theme).filter((id) => id !== story.id)
    seen.push(story.id)
    memory.set(theme, seen)
    try {
      localStorage.setItem(key(theme), JSON.stringify(seen))
    } catch {}
  }
  function pick(pool, theme, rank = () => 0) {
    if (!pool.length) return null
    const seen = read(theme),
      last = seen[seen.length - 1]
    let options = pool.filter((s) => !seen.includes(s.id))
    if (!options.length) {
      options = pool.filter((s) => s.id !== last)
      memory.set(theme, [])
    }
    if (!options.length) options = pool
    // Novelty first; mood only weights choices within the desired theme.
    const weights = options.map((s) => 1 + Math.max(0, rank(s)))
    let draw = Math.random() * weights.reduce((a, b) => a + b, 0)
    let chosen = options[options.length - 1]
    for (let i = 0; i < options.length; i++) {
      draw -= weights[i]
      if (draw < 0) {
        chosen = options[i]
        break
      }
    }
    mark(chosen, theme)
    return chosen
  }
  window.TeaRotation = { pick, mark }
})()
