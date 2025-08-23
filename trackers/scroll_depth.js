import { post, onReady } from "../utils.js";

const SCROLL_THROTTLE_MS = 5000;

console.log("hello from civil scroller_observer");

function getDepthPct() {
  const se = document.scrollingElement || document.documentElement || document.body;
  if (!se) return 0;
  const y = se.scrollTop || 0;
  const docH = Math.max(se.scrollHeight || 0, document.documentElement?.scrollHeight || 0, document.body?.scrollHeight || 0);
  const winH = window.innerHeight || document.documentElement?.clientHeight || 0;
  const maxScroll = Math.max(docH - winH, 1);
  return Math.min(100, Math.round((y / maxScroll) * 100));
}

function shorten(s, n = 70) {
  if (!s) return null;
  s = s.replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function getMeaningfulTitle(root) {
  const dt = root.getAttribute?.("data-title");
  if (dt && dt.trim().length > 3) return dt.trim();

  const sels = [
    ".t-title",
    ".t-name",
    ".t-uptitle",
    ".t-heading",
    ".t-descr",
    ".t-text",
    ".t-hero__title",
    'h1,h2,h3,[role="heading"]',
  ];
  for (const sel of sels) {
    const el = root.querySelector(sel);
    const txt = el?.textContent?.replace(/\s+/g, " ").trim() || "";
    if (txt.length >= 6) return txt;
  }

  const labelEl = root.querySelector("a,button,[aria-label],[title]");
  const label =
    labelEl?.getAttribute?.("aria-label") ||
    labelEl?.getAttribute?.("title") ||
    labelEl?.textContent;
  const clean = (label || "").replace(/\s+/g, " ").trim();
  if (clean.length >= 6) return clean;

  const img = root.querySelector("img[alt]");
  const alt = img?.getAttribute("alt")?.trim();
  if (alt && alt.length >= 6) return alt;

  return null;
}

function getLastVisibleSection() {
  const vpBottom = window.scrollY + window.innerHeight;

  const selector = '[id^="rec"], section[id], [id]:not([id^="rec"])';
  const candidates = [...document.querySelectorAll(selector)];

  let lastEl = null,
    lastTop = -Infinity;
  for (const el of candidates) {
    if (!(el instanceof Element)) continue;

    // пропускаем попапы/оверлеи/футер/навигацию и скрытые блоки
    if (el.closest(".t-popup,.t396__artboard,footer,nav")) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;

    const r = el.getBoundingClientRect();
    const topAbs = r.top + window.scrollY;
    if (topAbs <= vpBottom - 100 && topAbs > lastTop) {
      lastTop = topAbs;
      lastEl = el;
    }
  }
  if (!lastEl) return null;

  const id = lastEl.id || null;

  const all = candidates.filter(
    (el) =>
      el instanceof Element &&
      !el.closest(".t-popup,.t396__artboard,footer,nav") &&
      getComputedStyle(el).display !== "none" &&
      getComputedStyle(el).visibility !== "hidden"
  );
  const index = Math.max(0, all.indexOf(lastEl));

  let title = getMeaningfulTitle(lastEl);
  if (!title) title = id || `Секция #${index + 1}`;

  return {
    section_id: id,
    section_title: shorten(title, 70),
    section_index: index,
  };
}

export function initScrollDepth() {
  onReady(() => {
    let lastSentAt = 0;
    let pending = false;
    let maxDepthPct = 0;
    let lastSectionId = null;

    function buildMeta() {
      const sec = getLastVisibleSection();
      const depth = getDepthPct();
      return {
        depth_pct: depth,
        max_depth_pct: maxDepthPct,
        ...(sec ? sec : {}),
      };
    }

    function sendNow() {
      const meta = buildMeta();
      console.log("[scroll_depth] sending:", meta);
      post("scroll_depth", meta);
    }

    function onScrollThrottled() {
      const curr = getDepthPct();
      if (curr > maxDepthPct) maxDepthPct = curr;

      const sec = getLastVisibleSection();
      const secId = sec?.section_id || null;

      // без изменений — не шлём
      if (curr <= maxDepthPct && secId === lastSectionId) return;

      lastSectionId = secId;

      const now = Date.now();
      if (now - lastSentAt >= SCROLL_THROTTLE_MS) {
        lastSentAt = now;
        sendNow();
      } else if (!pending) {
        pending = true;
        setTimeout(() => {
          lastSentAt = Date.now();
          pending = false;
          sendNow();
        }, Math.max(0, SCROLL_THROTTLE_MS - (now - lastSentAt)));
      }
    }

    addEventListener("scroll", onScrollThrottled, { passive: true });
    addEventListener("wheel", onScrollThrottled, { passive: true });
    addEventListener("touchmove", onScrollThrottled, { passive: true });
    addEventListener("resize", onScrollThrottled, { passive: true });

    onScrollThrottled();
    addEventListener("pagehide", sendNow, { passive: true });
  });
}