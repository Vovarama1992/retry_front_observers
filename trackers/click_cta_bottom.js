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

export function initClickCtaBottom() {
  onReady(() => {
    document.addEventListener(
      "click",
      e => {
        let n = e.target instanceof Element ? e.target : null;
        while (n && n !== document.body) {
          if (n.closest?.('[data-track="click_cta_bottom"]') || matches(n)) {
            const target =
              n.closest('[data-track="click_cta_bottom"]') || n;
            if (target.dataset.track !== "click_cta_bottom") {
              target.setAttribute("data-track", "click_cta_bottom");
            }

            // твоя аналитика
            post("click_cta_bottom");

            // Roistat: отправляем лид + логируем
            if (window.roistat && window.roistat.lead) {
              const payload = {
                name: "CTA bottom click",
                fields: { button: "cta_bottom" }
              };
              console.log("[Roistat] lead.send available, sending:", payload);
              roistat.lead.send(payload);
            } else {
              console.warn("[Roistat] lead.send NOT available. window.roistat =", window.roistat);
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