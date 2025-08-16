import { post, onReady } from "../utils.js";

// не чаще одного события в 3 секунды
const SCROLL_THROTTLE_MS = 5000;

// --- правила распознавания секций ---
const SECTION_RULES = [
  { key: "hero",           anchor: /^top$|^home$/i,       title: /retry|hero/i },
  { key: "benefits",       anchor: /benefits|why/i,       title: /почему|зачем/i },
  { key: "faq",            anchor: /faq/i,                title: /faq|вопрос/i },
  { key: "job_chance",     anchor: /job|work|career/i,    title: /смогу ли я получить работу/i },
  { key: "gallery_raids",  anchor: /raids|gallery/i,      title: /raid|рейд|галере/i },
  { key: "buy",            anchor: /buy|order|price/i,    title: /купить|доступ|цена/i },
];

// --- helpers ---
function getDepthPct(){
  const se = document.scrollingElement || document.documentElement || document.body;
  if (!se) return 0;
  const y    = se.scrollTop || 0;
  const docH = Math.max(
    se.scrollHeight || 0,
    document.documentElement?.scrollHeight || 0,
    document.body?.scrollHeight || 0
  );
  const winH = window.innerHeight || document.documentElement?.clientHeight || 0;
  const maxScroll = Math.max(docH - winH, 1);
  return Math.min(100, Math.round((y / maxScroll) * 100));
}

const TITLE_SEL = 'h1,h2,h3,.t-section__title,.t-title,.t-name,.t-name_xl,.t668__title,.t228__title,[data-elem-type="title"]';

function readAnchor(el){
  return el.getAttribute('data-menu-anchor')
      || el.querySelector('[data-menu-anchor]')?.getAttribute('data-menu-anchor')
      || null;
}
function readTitle(el){
  return (el.querySelector(TITLE_SEL)?.textContent || "").trim();
}
function resolveSectionKey(el){
  const anchor = (readAnchor(el) || "").toLowerCase();
  const title  = (readTitle(el)  || "").toLowerCase();
  const id     = (el.id || "").toLowerCase();

  for (const r of SECTION_RULES){
    const aok = r.anchor ? new RegExp(r.anchor).test(anchor) || new RegExp(r.anchor).test(id) : false;
    const tok = r.title  ? new RegExp(r.title).test(title) : false;
    if (aok || tok) return r.key;
  }
  return null;
}

function getLastVisibleSectionDeterministic(){
  const vpBottom = window.scrollY + window.innerHeight;
  const candidates = [
    ...document.querySelectorAll('[id^="rec"]'),
    ...document.querySelectorAll('section[id]')
  ];

  let best = null, bestTop = -Infinity;
  for (const el of candidates){
    const r = el.getBoundingClientRect();
    const topAbs = r.top + window.scrollY;
    if (topAbs <= vpBottom - 100 && topAbs > bestTop){
      const key = resolveSectionKey(el);
      if (key){
        best = { el, key, title: readTitle(el), id: el.id || readAnchor(el) || null };
        bestTop = topAbs;
      }
    }
  }
  return best;
}

// --- основной модуль ---
export function initScrollDepth(){
  onReady(()=>{
    let lastSentAt = 0;
    let pending = false;
    let maxDepthPct = 0;
    let lastMaxSent = 0;
    let lastSectionKeySent = null;

    function buildMeta(){
      const curr = getDepthPct();
      if (curr > maxDepthPct) maxDepthPct = curr;

      const sec = getLastVisibleSectionDeterministic();
      return {
        depth_pct: curr,
        max_depth_pct: maxDepthPct,
        ...(sec ? { section_key: sec.key, section_id: sec.id || null, section_title: sec.title || null } : {})
      };
    }

    function shouldSend(meta){
      const sectionChanged = meta.section_key && meta.section_key !== lastSectionKeySent;
      const maxJumped = meta.max_depth_pct >= (lastMaxSent + 10);
      return sectionChanged || maxJumped;
    }

    function sendNow(force=false){
      const meta = buildMeta();
      if (!force && !shouldSend(meta)) return;
      if (meta.max_depth_pct > lastMaxSent) lastMaxSent = meta.max_depth_pct;
      if (meta.section_key) lastSectionKeySent = meta.section_key;
      post("scroll_depth", meta);
    }

    function onScrollThrottled(){
      const now = Date.now();
      if (now - lastSentAt >= SCROLL_THROTTLE_MS){
        lastSentAt = now;
        sendNow();
      } else if (!pending){
        pending = true;
        setTimeout(()=>{
          lastSentAt = Date.now();
          pending = false;
          sendNow();
        }, Math.max(0, SCROLL_THROTTLE_MS - (now - lastSentAt)));
      }
    }

    // источники скролла/изменений
    addEventListener("scroll",     onScrollThrottled, { passive:true });
    addEventListener("wheel",      onScrollThrottled, { passive:true });
    addEventListener("touchmove",  onScrollThrottled, { passive:true });
    addEventListener("resize",     onScrollThrottled, { passive:true });

    // стартовый снимок
    onScrollThrottled();

    // финальный пинг при уходе
    addEventListener("pagehide", () => { sendNow(true); }, { passive:true });
  });
}