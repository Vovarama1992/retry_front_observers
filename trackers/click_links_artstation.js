import { norm, post, onReady } from "../utils.js";

const onLinksPage = () => /^\/links\/?$/i.test(location.pathname || "/");

function isArtstationHref(href){
  try { return new URL(href, location.href).host.toLowerCase().includes("artstation.com"); }
  catch { return false; }
}

function isArtstationAnchor(a){
  if (!(a instanceof Element)) return false;
  const href = a.getAttribute("href") || "";
  return isArtstationHref(href) || (norm(a) || "").includes("artstation");
}

function mark(root=document){
  if (!onLinksPage()) return;
  root.querySelectorAll('a[href]').forEach(a=>{
    if (a.dataset.track) return;
    if (isArtstationAnchor(a)) a.setAttribute("data-track","click_links_artstation");
  });
}

function meta(a){
  const href = a?.getAttribute?.("href") || "";
  let host = null; try { host = new URL(href, location.href).host.toLowerCase(); } catch {}
  const text = norm(a) || null;
  return { href: href || null, host, platform: "artstation", text };
}

export function initClickLinksArtstation(){
  onReady(()=>{
    if (!onLinksPage()) return;

    document.addEventListener("click",(e)=>{
      const el = (e.target instanceof Element) ? e.target : null;
      if (!el) return;
      const a = el.closest('a[href]');
      if (!a || !isArtstationAnchor(a)) return;

      if (a.dataset.track !== "click_links_artstation"){
        a.setAttribute("data-track","click_links_artstation");
      }
      post("click_links_artstation", meta(a));
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