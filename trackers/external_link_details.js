import { norm, post, onReady } from "../utils.js";

function isDetailsLink(el){
  if (!(el instanceof Element)) return false;
  const a = el.closest?.('a[href]');
  if (!a) return false;
  const href = a.getAttribute("href") || "";
  // детальная работа на ArtStation
  return /https?:\/\/(www\.)?artstation\.com\/artwork\/[A-Za-z0-9_-]+/.test(href);
}

function mark(root=document){
  root.querySelectorAll?.('a[href]').forEach(a=>{
    if (isDetailsLink(a) && a.dataset.track !== "external_link_details"){
      a.setAttribute("data-track","external_link_details");
    }
  });
}

function buildMetaFromEl(el){
  const a = el.closest('a[href]') || el;
  const href = a?.getAttribute?.('href') || "";
  let host = "";
  try { if (href.startsWith("http")) host = new URL(href).host; } catch(_) {}
  const text = norm(a) || norm(el) || null;
  return { href: href || null, host: host || null, text };
}

export function initExternalLinkDetails(){
  onReady(()=>{
    document.addEventListener("click",(e)=>{
      let n = e.target instanceof Element ? e.target : null;
      while (n && n !== document.body){
        const target = n.closest?.('[data-track="external_link_details"]');
        if (target){
          post("external_link_details", buildMetaFromEl(target));
          return;
        }
        n = n.parentElement;
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