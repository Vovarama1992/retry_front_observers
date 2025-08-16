import { norm, post, onReady } from "../utils.js";

const RAID_WORDS = ["raid","рейд"]; // lower-case

function isArtstationArtwork(href){
  try { return /(^https?:\/\/)?(www\.)?artstation\.com\/artwork\/[A-Za-z0-9_-]+/i.test(href); }
  catch { return false; }
}

function isRaidButton(a){
  if (!(a instanceof Element)) return false;
  const href = a.getAttribute("href") || "";
  const txt  = norm(a) || "";
  const hasWord = RAID_WORDS.some(w => txt.includes(w));
  const looksLikeGalleryBtn = a.className?.toString()?.includes("t-btnflex") || a.className?.toString()?.includes("t734__button");
  return (hasWord && looksLikeGalleryBtn) || isArtstationArtwork(href);
}

function extractRaidName(a){
  const txt = (norm(a) || "").trim();
  for (const w of RAID_WORDS){
    const i = txt.indexOf(w);
    if (i > 0){
      return txt.slice(0, i).trim();
    }
  }
  return txt || null;
}

function buildMeta(a){
  const href = a?.getAttribute?.('href') || "";
  let host = null; try { if (href) host = new URL(href, location.href).host.toLowerCase(); } catch {}
  return {
    href: href || null,
    host,
    text: norm(a) || null,
    raid_name: extractRaidName(a)
  };
}

function mark(root=document){
  root.querySelectorAll('a[href]').forEach(a=>{
    if (a.dataset.track) return;
    if (isRaidButton(a)){
      a.setAttribute("data-track","external_link_raid");
    }
  });
}

export function initExternalLinkRaid(){
  onReady(()=>{
    document.addEventListener("click",(e)=>{
      const el = (e.target instanceof Element) ? e.target : null;
      if (!el) return;
      const a = el.closest('a[data-track="external_link_raid"]') || el.closest('a[href]');
      if (!a || !isRaidButton(a)) return;
      if (a.dataset.track !== "external_link_raid"){
        a.setAttribute("data-track","external_link_raid");
      }
      post("external_link_raid", buildMeta(a));
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