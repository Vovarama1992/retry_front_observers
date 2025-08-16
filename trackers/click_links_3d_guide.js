import { norm, post, onReady } from "../utils.js";

const onLinksPage = () => /^\/links\/?$/i.test(location.pathname || "/");

function is3dGuideAnchor(a){
  if (!(a instanceof Element)) return false;
  const text = norm(a) || "";
  return text.includes("3d") || text.includes("гайд");
}

function mark(root=document){
  if (!onLinksPage()) return;
  root.querySelectorAll('a[href]').forEach(a=>{
    if (a.dataset.track) return;
    if (is3dGuideAnchor(a)) a.setAttribute("data-track","click_links_3d_guide");
  });
}

function meta(a){
  const href = a?.getAttribute?.("href") || "";
  let host = null; 
  try { host = new URL(href, location.href).host.toLowerCase(); } catch {}
  const text = norm(a) || null;
  return { href: href || null, host, platform: "3d_guide", text };
}

export function initClickLinks3dGuide(){
  onReady(()=>{
    if (!onLinksPage()) return;

    document.addEventListener("click",(e)=>{
      const el = (e.target instanceof Element) ? e.target : null;
      if (!el) return;
      const a = el.closest('a[data-track="click_links_3d_guide"]');
      if (a) post("click_links_3d_guide", meta(a));
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