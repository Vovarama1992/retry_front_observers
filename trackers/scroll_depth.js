import { post, onReady } from "../utils.js";

// не чаще одного события в 3 секунды
const SCROLL_THROTTLE_MS = 5000;
const MAX_STEP_TO_SEND = 10; // шлём, если max_depth вырос >= на 10%

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

// пытаемся понять “до какого раздела доскроллил”
// приоритет: tilda records (#rec...), section[id], ещё пробуем data-menu-anchor и типичные заголовки
const TITLE_SEL = 'h1,h2,h3,.t-section__title,.t-title,.t-name,.t-name_xl,.t668__title,.t228__title,[data-elem-type="title"]';

function getLastVisibleSection(){
  const vpBottom = window.scrollY + window.innerHeight;

  const records  = Array.from(document.querySelectorAll('[id^="rec"]'));
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const candidates = [...records, ...sections];

  let lastEl = null;
  let lastTop = -Infinity;

  for (const el of candidates){
    if (!(el instanceof Element)) continue;
    const r = el.getBoundingClientRect();
    const topAbs = r.top + window.scrollY;
    if (topAbs <= vpBottom - 100 && topAbs > lastTop){
      lastTop = topAbs;
      lastEl = el;
    }
  }
  if (!lastEl) return null;

  const anchor =
    lastEl.getAttribute('data-menu-anchor') ||
    lastEl.querySelector('[data-menu-anchor]')?.getAttribute('data-menu-anchor') ||
    null;

  const section_id = lastEl.id || anchor || null;

  // читаемый заголовок
  const titleEl = lastEl.querySelector(TITLE_SEL);
  const rawTitle = (titleEl?.textContent || '').trim();
  const section_title = rawTitle || (anchor ? `#${anchor}` : null);

  if (!section_id && !section_title) return null;
  return { section_id: section_id || null, section_title: section_title || null };
}

export function initScrollDepth(){
  onReady(()=>{
    let lastSentAt = 0;
    let pending = false;

    let maxDepthPct = 0;     // текущий максимум на странице
    let lastMaxSent = 0;     // максимум, с которым мы последний раз отправляли
    let lastSectionIdSent = null; // последняя отправленная секция

    function buildMeta(){
      const curr = getDepthPct();
      if (curr > maxDepthPct) maxDepthPct = curr;

      const sec = getLastVisibleSection();
      return {
        depth_pct: curr,
        max_depth_pct: maxDepthPct,
        ...(sec ? sec : {})
      };
    }

    function shouldSend(meta){
      // не отправляем "пустые" секции
      const sectionChanged = meta.section_id && meta.section_id !== lastSectionIdSent;
      const maxJumped      = meta.max_depth_pct >= (lastMaxSent + MAX_STEP_TO_SEND);

      return sectionChanged || maxJumped;
    }

    function sendNow(force=false){
      const meta = buildMeta();
      if (!force && !shouldSend(meta)) return;

      // обновляем «последние отправленные»
      if (meta.max_depth_pct > lastMaxSent) lastMaxSent = meta.max_depth_pct;
      if (meta.section_id) lastSectionIdSent = meta.section_id;

      post("scroll_depth", meta);
    }

    function onScrollThrottled(){
      // держим актуальным максимум даже между отправками
      const curr = getDepthPct();
      if (curr > maxDepthPct) maxDepthPct = curr;

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

    addEventListener("scroll",     onScrollThrottled, { passive:true });
    addEventListener("wheel",      onScrollThrottled, { passive:true });
    addEventListener("touchmove",  onScrollThrottled, { passive:true });
    addEventListener("resize",     onScrollThrottled, { passive:true });

    // старт: ничего не шлём сразу, ждём реального изменения
    // onScrollThrottled();

    // финальный пинг при уходе — всегда один раз, даже без изменений
    addEventListener("pagehide", () => { sendNow(true); }, { passive:true });
  });
}