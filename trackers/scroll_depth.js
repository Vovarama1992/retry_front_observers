import { post, onReady } from "../utils.js";

const SCROLL_THROTTLE_MS = 5000;

console.log('hello from civil scroller_observer');

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

function getLastVisibleSection(){
  const vpBottom = window.scrollY + window.innerHeight;
  const candidates = [
    ...document.querySelectorAll('[id^="rec"]'),
    ...document.querySelectorAll('section[id]'),
    ...document.querySelectorAll('[id]:not([id^="rec"])')
  ];
  let lastEl = null, lastTop = -Infinity;
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
  const id = lastEl.id || null;
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
    let lastSectionId = null;

    function buildMeta(){
      const sec = getLastVisibleSection();
      return {
        depth_pct: getDepthPct(),
        max_depth_pct: maxDepthPct,
        ...(sec ? sec : {})
      };
    }

    function sendNow(){
      const meta = buildMeta();
      console.log("[scroll_depth] sending:", meta);
      post("scroll_depth", meta);
    }

    function onScrollThrottled(){
      const curr = getDepthPct();
      if (curr > maxDepthPct) maxDepthPct = curr;

      const sec = getLastVisibleSection();
      const secId = sec?.section_id || null;

      // если не изменилось ничего важного — не шлём
      if (curr <= maxDepthPct && secId === lastSectionId) return;

      lastSectionId = secId;

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

    onScrollThrottled();
    addEventListener("pagehide", sendNow, { passive:true });
  });
}