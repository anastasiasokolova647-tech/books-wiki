
import type { QuartzComponent } from "./types"

const TeaNavigation: QuartzComponent = () => {
  return (
    <nav class="tea-navigation" aria-label="Особливі розділи">
      <a href="/books-wiki/static/walk/">
        🌿 Прогулянка
      </a>
      <a href="/books-wiki/prezentatsiia">
        ✨ Презентація
      </a>
    </nav>
  )
}

TeaNavigation.css = `
.tea-navigation {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.tea-navigation a {
  display: block;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--lightgray);
  border-radius: 12px;
  color: var(--darkgray);
  text-decoration: none;
}

.tea-navigation a:hover,
.tea-navigation a:focus-visible {
  background: var(--highlight);
  color: var(--secondary);
}
`

export default TeaNavigation
