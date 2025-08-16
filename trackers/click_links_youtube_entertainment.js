import { norm, post, onReady } from "../utils.js";

function isYoutubeEntertainment(a){
  if (!(a instanceof Element)) return false;
  const href = a.getAttribute("href") || "";
  if (!href) return false;
  try {
    const u = new URL(href, location.href);
    const host = u.host.toLowerCase();
    return host.includes("youtube.com") || host.includes("youtu.be");
  } catch {
    return false;
  }
}

function mark(root=document){
  root.querySelectorAll('a[href]').forEach(a=>{
    if (a.dataset.track) return; // не перетирать спец-теги
    if (isYoutubeEntertainment(a)) a.setAttribute("data-track","click_links_youtube_entertainment");
  });
}

function meta(a){
  const href = a?.getAttribute?.("href") || "";
  let host = "";
  try { host = new URL(href, location.href).host.toLowerCase(); } catch {}
  const text = norm(a) || null;
  return { href: href || null, host: host || null, platform: "youtube", text };
}

export function initClickLinksYoutubeEntertainment(){
  onReady(()=>{
    document.addEventListener("click",(e)=>{
      const a = (e.target instanceof Element)
        ? e.target.closest('a[data-track="click_links_youtube_entertainment"]')
        : null;
      if (a) post("click_links_youtube_entertainment", meta(a));
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