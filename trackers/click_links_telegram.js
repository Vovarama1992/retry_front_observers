import { norm, post, onReady } from "../utils.js";

const onLinksPage = () => /^\/links\/?$/i.test(location.pathname || "/");
const TEXT_HINTS = ["телеграм","telegram"];

function isTelegramHref(href){
  try{
    const host = new URL(href, location.href).host.toLowerCase();
    return host.includes("t.me") || host.includes("telegram.me") || host.includes("telegram.org");
  }catch{ return false; }
}

function isTelegramAnchor(a){
  const href = a.getAttribute("href") || "";
  const byHost = isTelegramHref(href);
  const byText = (norm(a) || "").includes("телеграм") || (norm(a) || "").includes("telegram");
  return byHost || byText;
}

function mark(root=document){
  if (!onLinksPage()) return;
  root.querySelectorAll('a[href]').forEach(a=>{
    if (a.dataset.track) return;
    if (isTelegramAnchor(a)) a.setAttribute("data-track","click_links_telegram");
  });
}

function meta(a){
  const href = a?.getAttribute?.('href') || "";
  let host = null; try{ host = new URL(href, location.href).host.toLowerCase(); }catch{}
  const text = norm(a) || null;
  return { href: href || null, host, platform: "telegram", text };
}

export function initClickLinksTelegram(){
  onReady(()=>{
    if (!onLinksPage()) return;

    document.addEventListener("click",(e)=>{
      const el = (e.target instanceof Element) ? e.target : null;
      if (!el) return;
      // клик мог быть по div внутри <a> — поднимаемся к <a href>
      const a = el.closest('a[href]');
      if (!a) return;

      // если это телеграм — маркируем при необходимости и шлём событие
      if (isTelegramAnchor(a)){
        if (a.dataset.track !== "click_links_telegram"){
          a.setAttribute("data-track","click_links_telegram");
        }
        post("click_links_telegram", meta(a));
      }
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