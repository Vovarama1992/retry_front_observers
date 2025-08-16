import { norm, post, onReady } from "../utils.js";

// профиль на ArtStation вида https://www.artstation.com/<slug>
const PROFILE_RE = /^https?:\/\/(?:www\.)?artstation\.com\/([^\/?#]+)\/?$/i;

function isMentorProfileLink(a){
  if (!(a instanceof Element)) return false;
  const href = a.getAttribute("href") || "";
  return PROFILE_RE.test(href);
}

function mark(root=document){
  // типовая ссылка имени ментора
  root.querySelectorAll('a.t-card__link[href]').forEach(a=>{
    if (isMentorProfileLink(a) && a.dataset.track !== "external_link_mentor_page"){
      a.setAttribute("data-track","external_link_mentor_page");
    }
  });
  // про всякий случай — любые <a> на artstation-профиль
  root.querySelectorAll('a[href*="artstation.com"]').forEach(a=>{
    if (isMentorProfileLink(a) && a.dataset.track !== "external_link_mentor_page"){
      a.setAttribute("data-track","external_link_mentor_page");
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
  // 1) сам узел — ссылка?
  if (node && node.matches?.('a[data-track="external_link_mentor_page"]')) return node;
  // 2) ближайшая помеченная ссылка вверх по дереву
  const up = node.closest?.('a[data-track="external_link_mentor_page"]');
  if (up) return up;
  // 3) карточка: ищем ссылку внутри того же контейнера
  const card = node.closest?.('.t-card, .t923, [class*="t-card"], [class*="t923"]') || node.closest?.('[id^="rec"]');
  if (card){
    const a = card.querySelector('a[data-track="external_link_mentor_page"], a.t-card__link[href]');
    if (a && isMentorProfileLink(a)) return a;
  }
  // 4) последняя попытка: ближайший <a href> вокруг
  const a = node.closest?.('a[href]') || null;
  if (a && isMentorProfileLink(a)) return a;
  return null;
}

function enrichWithImage(node, meta){
  // если клик был по картинке карточки — вытащим ссылку на изображение
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

      // ищем связанную с карточкой ссылку
      const a = findRelatedAnchorFromNode(el);
      if (!a || a.dataset.track !== "external_link_mentor_page") return;

      const meta = enrichWithImage(el, extractMetaFromAnchor(a));
      post("external_link_mentor_page", meta);
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