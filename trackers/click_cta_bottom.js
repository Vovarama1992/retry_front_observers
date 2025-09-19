// trackers/click_cta_bottom.js
import { post, onReady } from "../utils.js";

const CTA_SEL = "a.tn-atom, button.tn-atom";
const CTA_BOTTOM_HREF_MATCH = "#order:";

function matches(el) {
  if (!(el instanceof Element) || !el.matches(CTA_SEL)) return false;
  if (el.dataset.track === "click_cta_bottom") return true;
  const href = el.getAttribute("href") || "";
  return href.includes(CTA_BOTTOM_HREF_MATCH);
}

function mark(root = document) {
  root.querySelectorAll?.(CTA_SEL).forEach(el => {
    if (matches(el) && el.dataset.track !== "click_cta_bottom") {
      el.setAttribute("data-track", "click_cta_bottom");
    }
  });
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export function initClickCtaBottom() {
  onReady(() => {
    document.addEventListener(
      "click",
      e => {
        let n = e.target instanceof Element ? e.target : null;
        while (n && n !== document.body) {
          if (n.closest?.('[data-track="click_cta_bottom"]') || matches(n)) {
            const target = n.closest?.('[data-track="click_cta_bottom"]') || n;
            if (target.dataset.track !== "click_cta_bottom") {
              target.setAttribute("data-track", "click_cta_bottom");
            }

            // твоя аналитика
            post("click_cta_bottom");

            // Диагностика Roistat
            const visit = getCookie("roistat_visit");
            console.log("[Roistat] CTA bottom clicked. visit =", visit, "obj =", window.roistat);

            // Roistat: событие
            if (window.roistat?.event?.send) {
              const payload = {
                button: "cta_bottom",
                visit: visit || null,
                page: location.pathname || "/"
              };
              console.log("[Roistat] event.send('cta_bottom', payload):", payload);
              window.roistat.event.send("cta_bottom", payload);
            } else {
              console.warn("[Roistat] event.send NOT available.");
            }

            return;
          }
          n = n.parentElement;
        }
      },
      { capture: true, passive: true }
    );

    mark(document);

    new MutationObserver(muts => {
      for (const m of muts) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          mark(node);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  });
}