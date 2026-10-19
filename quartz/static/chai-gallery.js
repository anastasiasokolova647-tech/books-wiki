(() => {
  if (window.__chaiGalleryLoaded) return;
  window.__chaiGalleryLoaded = true;
  const ROOT = "/books-wiki/static/";
  const pictures = [{"file": "chai-opivnochi-bg-2.png", "kind": "night", "title": "Оригінальний нічний", "original": true}, {"file": "chai-opivnochi-light.png", "kind": "day", "title": "Оригінальний денний", "original": true}, {"file": "chai-gallery/chai-01.png", "kind": "day", "title": "Краєвид 01", "original": false}, {"file": "chai-gallery/chai-02.png", "kind": "day", "title": "Краєвид 02", "original": false}, {"file": "chai-gallery/chai-03.png", "kind": "night", "title": "Краєвид 03", "original": false}, {"file": "chai-gallery/chai-04.png", "kind": "night", "title": "Краєвид 04", "original": false}, {"file": "chai-gallery/chai-05.png", "kind": "night", "title": "Краєвид 05", "original": false}, {"file": "chai-gallery/chai-06.png", "kind": "night", "title": "Краєвид 06", "original": false}, {"file": "chai-gallery/chai-07.png", "kind": "day", "title": "Краєвид 07", "original": false}, {"file": "chai-gallery/chai-08.png", "kind": "night", "title": "Краєвид 08", "original": false}, {"file": "chai-gallery/chai-09.png", "kind": "night", "title": "Краєвид 09", "original": false}, {"file": "chai-gallery/chai-10.png", "kind": "day", "title": "Краєвид 10", "original": false}, {"file": "chai-gallery/chai-11.png", "kind": "day", "title": "Краєвид 11", "original": false}, {"file": "chai-gallery/chai-12.png", "kind": "night", "title": "Краєвид 12", "original": false}, {"file": "chai-gallery/chai-13.png", "kind": "night", "title": "Краєвид 13", "original": false}, {"file": "chai-gallery/chai-14.png", "kind": "night", "title": "Краєвид 14", "original": false}, {"file": "chai-gallery/chai-15.png", "kind": "night", "title": "Краєвид 15", "original": false}];
  const key = "chai-gallery-choice-v1";
  const autoKey = "chai-gallery-auto-v1";
  const read = (k, fallback) => { try { return localStorage.getItem(k) ?? fallback } catch { return fallback } };
  const save = (k,v) => { try { localStorage.setItem(k,v) } catch {} };
  let selected = read(key, pictures[0].file);
  let auto = read(autoKey,"off") === "on";
  const mode = () => document.documentElement.getAttribute("saved-theme") === "light" ? "day" : "night";
  const hourMode = () => { const h = new Date().getHours(); return h >= 7 && h < 19 ? "day" : "night" };
  function apply() {
    const candidates = pictures.filter(p => p.kind === hourMode());
    const today = Math.floor(Date.now()/86400000);
    const file = auto ? candidates[today % candidates.length].file : selected;
    document.documentElement.style.setProperty("--chai-gallery-image", `url("${ROOT}${file}")`);
    document.documentElement.setAttribute("data-chai-gallery", "active");
    const label = document.querySelector("#chai-gallery-current");
    if (label) label.textContent = (pictures.find(p=>p.file===file)?.title ?? "Краєвид") + (auto ? " · автоматично" : "");
    const toggle = document.querySelector("#chai-gallery-auto");
    if (toggle) toggle.checked = auto;
    document.querySelectorAll("[data-chai-pick]").forEach(b => b.setAttribute("aria-pressed",String(!auto && b.dataset.chaiPick === selected)));
  }
  function mount() {
    if (document.getElementById("chai-gallery-panel")) return;
    const panel = document.createElement("details");
    panel.id="chai-gallery-panel";
    panel.innerHTML = `<summary>🌿 Фони <span id="chai-gallery-current"></span></summary>
      <div class="chai-gallery-inner"><label class="chai-gallery-switch"><input id="chai-gallery-auto" type="checkbox"> Автоматично змінювати день / ніч (новий краєвид щодня)</label>
      <div class="chai-gallery-grid"></div></div>`;
    const grid = panel.querySelector(".chai-gallery-grid");
    pictures.forEach(p=>{
      const b=document.createElement("button"); b.type="button"; b.dataset.chaiPick=p.file;
      b.title=p.title + " · " + (p.kind==="day"?"день":"ніч");
      const img=document.createElement("img"); img.src=ROOT+p.file; img.loading="lazy"; img.alt=p.title;
      const span=document.createElement("span"); span.textContent=p.title + (p.original?" ★":"");
      b.append(img,span); b.addEventListener("click",()=>{auto=false;selected=p.file;save(key,selected);save(autoKey,"off");apply()});
      grid.appendChild(b);
    });
    panel.querySelector("#chai-gallery-auto").addEventListener("change",e=>{auto=e.target.checked;save(autoKey,auto?"on":"off");apply()});
    document.body.appendChild(panel);
    apply();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mount); else mount();
  document.addEventListener("nav",mount);
  setInterval(apply,60000);
  apply();
})();