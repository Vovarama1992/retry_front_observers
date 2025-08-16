import { norm, post, onReady } from "../utils.js";

const onLinksPage = () => /^\/links\/?$/i.test(location.pathname || "/");

function isTiktokHref(href){
  try {
    const host = new URL(href, location.href).host.toLowerCase();
    return host.includes("tiktok.com");
  } catch { return false; }
}

function isTiktokAnchor(a){
  if (!(a instanceof Element)) return false;
  const href = a.getAttribute("href") || "";
  return isTiktokHref(href);
}

function mark(root=document){
  if (!onLinksPage()) return;
  root.querySelectorAll('a[href]').forEach(a=>{
    if (a.dataset.track) return; // не перетирать спец-метки
    if (isTiktokAnchor(a)) a.setAttribute("data-track","click_links_tiktok");
  });
}

function meta(a){
  const href = a?.getAttribute?.("href") || "";
  let host = null; try { host = new URL(href, location.href).host.toLowerCase(); } catch {}
  const text = norm(a) || null;
  return { href: href || null, host, platform: "tiktok", text };
}

export function initClickLinksTiktok(){
  onReady(()=>{
    if (!onLinksPage()) return;

    document.addEventListener("click",(e)=>{
      const el = (e.target instanceof Element) ? e.target : null;
      if (!el) return;
      // клик может быть по внутренним div — поднимаемся к <a>
      const a = el.closest('a[href]');
      if (!a || !isTiktokAnchor(a)) return;

      if (a.dataset.track !== "click_links_tiktok"){
        a.setAttribute("data-track","click_links_tiktok");
      }
      post("click_links_tiktok", meta(a));
    }, { capture:true, passive:true });

    mark(document);
    new MutationObserver(muts=>{
      for (const m of muts){
        for (const node of m.addedNodes){
          if (node.nodeType !== 1) continue;
          mark(node);
        }
      }
    }).observe(document.documentElement, { childList:true, subtree:true });
  });
}