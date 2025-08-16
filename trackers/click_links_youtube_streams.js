// trackers/click_links_youtube_streams.js
import { norm, post, onReady } from "../utils.js";

const onLinksPage = () => /^\/links\/?$/i.test(location.pathname || "/");
const STREAM_HINTS = ["стрим", "stream"]; // lower-case

function isYoutube(href){
  try {
    const host = new URL(href, location.href).host.toLowerCase();
    return host.includes("youtube.com") || host.includes("youtu.be");
  } catch { return false; }
}

function isStreamsAnchor(a){
  if (!(a instanceof Element)) return false;
  const href = a.getAttribute("href") || "";
  if (!isYoutube(href)) return false;
  const txt = norm(a) || "";
  return STREAM_HINTS.some(k => txt.includes(k));
}

function mark(root=document){
  if (!onLinksPage()) return;
  root.querySelectorAll('a[href]').forEach(a=>{
    if (a.dataset.track) return;
    if (isStreamsAnchor(a)) a.setAttribute("data-track","click_links_youtube_streams");
  });
}

function meta(a){
  const href = a?.getAttribute?.("href") || "";
  let host = null; try { host = new URL(href, location.href).host.toLowerCase(); } catch {}
  const text = norm(a) || null;
  return { href: href || null, host, platform: "youtube", text };
}

export function initClickLinksYoutubeStreams(){
  onReady(()=>{
    if (!onLinksPage()) return;

    document.addEventListener("click",(e)=>{
      const el = (e.target instanceof Element) ? e.target : null;
      if (!el) return;
      const a = el.closest('a[href]');
      if (!a) return;

      if (isStreamsAnchor(a)){
        if (a.dataset.track !== "click_links_youtube_streams"){
          a.setAttribute("data-track","click_links_youtube_streams");
        }
        post("click_links_youtube_streams", meta(a));
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