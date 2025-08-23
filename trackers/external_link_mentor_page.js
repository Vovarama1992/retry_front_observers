import { norm, post, onReady } from "../utils.js";

// профиль на ArtStation вида https://www.artstation.com/<slug>
const PROFILE_RE = /^https?:\/\/(?:www\.)?artstation\.com\/([^\/?#]+)\/?$/i;

// slug "retry_school" считаем не ментором, а общей страницей рейдов
function isMentorProfileLink(a){
  if (!(a instanceof Element)) return false;
  const href = a.getAttribute("href") || "";
  const m = href.match(PROFILE_RE);
  return !!(m && m[1].toLowerCase() !== "retry_school");
}

function isRaidsLink(a){
  if (!(a instanceof Element)) return false;
  const href = a.getAttribute("href") || "";
  const m = href.match(PROFILE_RE);
  return !!(m && m[1].toLowerCase() === "retry_school");
}

function mark(root=document){
  root.querySelectorAll('a[href*="artstation.com"]').forEach(a=>{
    if (isMentorProfileLink(a)){
      if (a.dataset.track !== "external_link_mentor_page"){
        a.setAttribute("data-track","external_link_mentor_page");
      }
    } else if (isRaidsLink(a)){
      if (a.dataset.track !== "external_link_raids"){
        a.setAttribute("data-track","external_link_raids");
      }
    }
  });
}

function extractMetaFromAnchor(a){
  const href = a?.getAttribute?.('href') || "";
  let host = "", slug = null;
  try {
    if (href.startsWith("http")) host = new URL(href).host;
  } catch(_) {}
  const m = href.match(PROFILE_RE);
  if (m) slug = m[1];
  const name = (norm(a) || null);
  return { href: href || null, host: host || null, mentor_slug: slug, mentor_name: name };
}

function findRelatedAnchorFromNode(node){
  const up = node.closest?.('a[data-track]'); // ищем помеченную ссылку
  return up || node.closest?.('a[href]') || null;
}

function enrichWithImage(node, meta){
  const imgDiv = node.closest?.('.t-bgimg, [data-original]') || null;
  const image_url =
    imgDiv?.getAttribute?.('data-original') ||
    imgDiv?.style?.backgroundImage?.replace(/^url\(["']?|["']?\)$/g,'') ||
    null;
  if (image_url) meta.image_url = image_url;
  return meta;
}

export function initExternalLinkMentorPage(){
  onReady(()=>{
    document.addEventListener("click",(e)=>{
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;

      const a = findRelatedAnchorFromNode(el);
      if (!a) return;

      if (a.dataset.track === "external_link_mentor_page"){
        const meta = enrichWithImage(el, extractMetaFromAnchor(a));
        post("external_link_mentor_page", meta);
      } else if (a.dataset.track === "external_link_raids"){
        // для общей страницы рейдов — другой тип события
        const href = a.getAttribute("href") || "";
        let host = "";
        try { if (href.startsWith("http")) host = new URL(href).host; } catch(_) {}
        const text = norm(a) || null;
        post("external_link_raids", { href: href || null, host: host || null, text });
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