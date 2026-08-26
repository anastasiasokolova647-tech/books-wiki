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
`

  return component
}

componentRegistry.register(
  "PWARegistration",
  PWARegistration,
  "local"
)

const config = await loadQuartzConfig()

export default config
export const layout = await loadQuartzLayout()
