import { norm, post, onReady } from "../utils.js";

// правила: текст кнопки "Купить доступ" (или близкое) И/ИЛИ внешний короткий/платёжный URL
const TEXT_MATCH = ["купить доступ", "buy access"]; // lower-case
const HOST_HINTS = ["bit.ly", "pay.", "tinkoff", "yoomoney", "paypal", "stripe", "cloudpayments"];

function isBuyAccessLink(a){
  if (!(a instanceof Element)) return false;
  const href = a.getAttribute("href") || "";
  const txt  = norm(a) || "";
  const textOk = TEXT_MATCH.some(t => txt.includes(t));
  let host = "";
  try { if (href) host = new URL(href, location.href).host.toLowerCase(); } catch(_) {}
  const hostOk = !!HOST_HINTS.find(h => host.includes(h));
  return textOk || hostOk;
}

function mark(root=document){
  root.querySelectorAll('a[href]').forEach(a=>{
    if (isBuyAccessLink(a) && a.dataset.track !== "click_links_buy_access"){
      a.setAttribute("data-track", "click_links_buy_access");
    }
  });
}

function buildMeta(a){
  const href = a?.getAttribute?.('href') || "";
  let host = "";
  try { if (href) host = new URL(href, location.href).host.toLowerCase(); } catch(_) {}
  const text = norm(a) || null;
  return { href: href || null, host: host || null, text };
}

export function initClickLinksBuyAccess(){
  onReady(()=>{
    document.addEventListener("click",(e)=>{
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      const a = el.closest?.('a[data-track="click_links_buy_access"]');
      if (a){
        post("click_links_buy_access", buildMeta(a));
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