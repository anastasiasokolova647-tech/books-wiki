/* Shared outbound video links for Quartz pages, including SPA navigation. */
(() => {
  if (window.__teaVideoLinksReady) return;
  window.__teaVideoLinksReady = true;
  const links = new WeakMap();
  function originalURL(src) {
    try {
      const url = new URL(src, location.href);
      if (!['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(url.hostname)) return null;
      const id = url.pathname.match(/^\/embed\/([\w-]{11})(?:\/|$)/)?.[1];
      if (!id) return null;
      const original = new URL('https://www.youtube.com/watch');
      original.searchParams.set('v', id);
      for (const key of ['list', 'start']) {
        const value = url.searchParams.get(key);
        if (value) original.searchParams.set(key === 'start' ? 't' : key, value);
      }
      return original.href;
    } catch { return null; }
  }
  function refresh() {
    document.querySelectorAll('.tea-video-block .tea-video-links a[href]').forEach(link => {
      if (!link.classList.contains('tea-original-video')) {
        link.classList.add('tea-original-video');
        link.textContent = '↗ Відкрити відео на YouTube';
      }
    });
    document.querySelectorAll('article iframe[src], .popover-inner iframe[src]').forEach(frame => {
      if (frame.closest('.tea-video-block')) return;
      const href = originalURL(frame.getAttribute('src'));
      let link = links.get(frame);
      if (!href) { link?.remove(); links.delete(frame); return; }
      if (!link || !link.isConnected) {
        link = document.createElement('a');
        link.className = 'tea-original-video';
        link.textContent = '↗ Відкрити відео на YouTube';
        link.target = '_blank';
        link.rel = 'noopener';
        link.dataset.noPopover = 'true';
        frame.insertAdjacentElement('afterend', link);
        links.set(frame, link);
      }
      if (link.href !== href) link.href = href;
    });
  }
  function start() {
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['src']});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
  document.addEventListener('nav', refresh);
})();
