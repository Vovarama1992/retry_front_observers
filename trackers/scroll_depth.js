import { post, onReady } from "../utils.js";

// не чаще одного события в 3 секунды
const SCROLL_THROTTLE_MS = 3000;

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

// пытаемся понять “до какого раздела доскроллил”
// приоритет: явные tilda-рекорды (#rec...), затем <section id>, затем любой элемент с id
function getLastVisibleSection(){
  const vpBottom = window.scrollY + window.innerHeight;

  // кандидаты: tilda records + section[id] + любые id, но без шумных служебных
  const candidates = [
    ...document.querySelectorAll('[id^="rec"]'),
    ...document.querySelectorAll('section[id]'),
    ...document.querySelectorAll('[id]:not([id^="rec"])')
  ];

  let lastEl = null;
  let lastTop = -Infinity;

  for (const el of candidates){
    if (!(el instanceof Element)) continue;
    const r = el.getBoundingClientRect();
    const topAbs = r.top + window.scrollY;
    // берём те, чья верхняя граница уже попала в видимую область (с небольшим запасом)
    if (topAbs <= vpBottom - 100 && topAbs > lastTop){
      lastTop = topAbs;
      lastEl = el;
    }
  }

  if (!lastEl) return null;

  // читабельный идентификатор
  const id = lastEl.id || null;
  // тильда может хранить человекочитаемый заголовок внутри блока — попробуем его достать
  const title =
    lastEl.getAttribute?.('data-title')
    || lastEl.querySelector?.('h1,h2,h3')?.textContent?.trim()
    || null;

  return { section_id: id, section_title: title };
}

export function initScrollDepth(){
  onReady(()=>{
    let lastSentAt = 0;
    let pending = false;
    let maxDepthPct = 0;

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

    function sendNow(){
      post("scroll_depth", buildMeta());
    }

    function onScrollThrottled(){
      // обновим максимум сразу, чтобы не потерять пиковое значение между посылками
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

    // источники скролла/изменений
    addEventListener("scroll",     onScrollThrottled, { passive:true });
    addEventListener("wheel",      onScrollThrottled, { passive:true });
    addEventListener("touchmove",  onScrollThrottled, { passive:true });
    addEventListener("resize",     onScrollThrottled, { passive:true });

    // стартовый снимок
    onScrollThrottled();

    // финальный пинг при уходе/перезагрузке — без троттла
    addEventListener("pagehide", () => {
      sendNow();
    }, { passive:true });
  });
}