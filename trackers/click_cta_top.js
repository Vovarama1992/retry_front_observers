import { norm, post, onReady } from "../utils.js";

const CTA_TOP_TEXTS = ["получить доступ"];         // lower-case
const CTA_TOP_HREFS = ["#rec573904816"];           // href-фрагменты
const CTA_SEL       = "a.tn-atom, button.tn-atom"; // типовые кнопки Tilda

function matches(el){
  if (!(el instanceof Element) || !el.matches(CTA_SEL)) return false;
  if (el.dataset.track === "click_cta_top") return true;
  const txt  = norm(el);
  const href = el.getAttribute("href") || "";
  const byText = txt  && CTA_TOP_TEXTS.some(t => txt.includes(t));
  const byHref = href && CTA_TOP_HREFS.some(h => href.includes(h));
  return byText || byHref;
}

function mark(root=document){
  root.querySelectorAll?.(CTA_SEL).forEach(el=>{
    if (matches(el) && el.dataset.track!=="click_cta_top"){
      el.setAttribute("data-track","click_cta_top");
    }
  });
}

export function initClickCtaTop(){
  onReady(()=>{
    // клики
    document.addEventListener("click",(e)=>{
      let n = e.target instanceof Element ? e.target : null;
      while (n && n !== document.body){
        if (n.closest?.('[data-track="click_cta_top"]') || matches(n)) {
          const target = n.closest('[data-track="click_cta_top"]') || n;
          if (target.dataset.track!=="click_cta_top") target.setAttribute("data-track","click_cta_top");
          post("click_cta_top");
          return;
        }
        n = n.parentElement;
      }
    }, { capture:true, passive:true });

    // первичная разметка
    mark(document);

    // домаркировка при подгрузках Tilda
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