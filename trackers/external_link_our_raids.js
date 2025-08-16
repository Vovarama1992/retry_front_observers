import { norm, post, onReady } from "../utils.js";

const KEYWORDS = ["рейды", "raids"]; // lower-case

function isRaidsLink(el){
  if (!(el instanceof Element)) return false;
  const a = el.closest?.('a[href]');
  if (!a) return false;

  const href = a.getAttribute("href") || "";
  const txt  = norm(a) || norm(el) || "";

  const isArtstationRaids = href.includes("artstation.com/retry_school");
  const hasKeyword = KEYWORDS.some(k => txt.includes(k));
  return isArtstationRaids || hasKeyword;
}

function mark(root=document){
  root.querySelectorAll?.("a[href]").forEach(a=>{
    if (isRaidsLink(a) && a.dataset.track !== "external_link_raids"){
      a.setAttribute("data-track","external_link_raids");
    }
  });
}

function buildMetaFromEl(el){
  const a = el.closest("a[href]") || el;
  const href = a?.getAttribute("href") || "";
  let host = "";
  try { if (href.startsWith("http")) host = new URL(href).host; } catch(_) {}
  const text = norm(a) || norm(el) || null;
  return { href: href || null, host: host || null, text };
}

export function initExternalLinkOurRaids(){
  onReady(()=>{
    document.addEventListener("click",(e)=>{
      let n = e.target instanceof Element ? e.target : null;
      while (n && n !== document.body){
        const target = n.closest?.('[data-track="external_link_raids"]');
        if (target){
          post("external_link_raids", buildMetaFromEl(target));
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