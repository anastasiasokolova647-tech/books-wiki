import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""

    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix

    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(
        fileData.description?.trim() ??
          "Чай опівночі — книги, історії й карта внутрішніх станів. Місце, де хочеться залишитись.",
      )

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug

    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)

    const iconPath = joinSegments(baseDir, "static/icon.png")

    // URL РїРѕС‚РѕС‡РЅРѕС— СЃС‚РѕСЂС–РЅРєРё
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug!)

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some((e) => e.name === "CustomOgImages")

    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    const coreStylesheet = css[0]?.content

    const coreScript = js.find(
      (r) => r.loadTime === "beforeDOMReady" && r.contentType === "external",
    )

    return (
      <head>
        <title>{title}</title>

        <meta charSet="utf-8" />

        {coreStylesheet && <link rel="preload" href={coreStylesheet} as="style" />}

        {coreScript && coreScript.contentType === "external" && (
          <link rel="preload" href={coreScript.src} as="script" />
        )}

        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />

            <link rel="preconnect" href="https://fonts.gstatic.com" />

            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />

            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}

        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />

        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Open Graph */}
        <meta name="og:site_name" content={cfg.pageTitle} />

        <meta property="og:title" content={title} />

        <meta property="og:type" content="website" />

        <meta property="og:description" content={description} />

        <meta property="og:image:alt" content={description} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />

        <meta name="twitter:title" content={title} />

        <meta name="twitter:description" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />

            <meta property="og:image:url" content={ogImageDefaultPath} />

            <meta name="twitter:image" content={ogImageDefaultPath} />

            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl} />

            <meta property="og:url" content={socialUrl} />

            <meta property="twitter:url" content={socialUrl} />
          </>
        )}

        {/* Р†РєРѕРЅРєР° */}
        <link rel="icon" href={iconPath} />

        {/* PWA manifest */}
        <link rel="manifest" href={joinSegments(baseDir, "manifest.webmanifest")} />

        <meta name="description" content={description} />

        <meta name="generator" content="Quartz" />

        {/* Quartz CSS */}
        {css.map((resource) => CSSResourceToStyleElement(resource, true))}

        {/* Quartz JS */}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}

        {/* Р”РѕРґР°С‚РєРѕРІС– РµР»РµРјРµРЅС‚Рё head */}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}

        {/* PWA install button */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                let installPrompt = null;

                window.addEventListener(
                  "beforeinstallprompt",
                  (event) => {
                    event.preventDefault();
                    installPrompt = event;
                  }
                );

                document.addEventListener(
                  "click",
                  async (event) => {
                    const target = event.target;

                    if (
                      !(target instanceof HTMLElement) ||
                      !target.closest("#install-app")
                    ) {
                      return;
                    }

                    if (installPrompt) {
                      installPrompt.prompt();

                      await installPrompt.userChoice;

                      installPrompt = null;
                    } else {
                      alert(
                        "Якщо вікно встановлення не з'явилося, відкрий меню браузера та обери «Встановити додаток»."
                      );
                    }
                  }
                );
              })();
            `,
          }}
        />
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
