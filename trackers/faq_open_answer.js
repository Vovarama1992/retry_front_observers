import { post, onReady } from "../utils.js";

function getBtn(el){
  return el?.closest?.('.t668__trigger-button, [aria-controls][aria-expanded]') || null;
}
function getState(btn){
  const before = (btn?.getAttribute('aria-expanded') === 'true');
  const id = btn?.getAttribute('aria-controls') || null;
  const titleEl = btn?.querySelector?.('.t668__title') || btn;
  const question = (titleEl?.innerText || titleEl?.textContent || '').trim() || null;
  return { before, id, question };
}
function mark(root=document){
  root.querySelectorAll('[aria-controls][aria-expanded]').forEach(btn=>{
    if (btn.dataset.track !== 'faq_open_answer'){
      btn.setAttribute('data-track','faq_open_answer');
    }
  });
}
function afterDomChange(cb){ requestAnimationFrame(()=>requestAnimationFrame(cb)); }

export function initFaqOpenAnswer(){
  onReady(()=>{
    document.addEventListener('click',(e)=>{
      const btn = getBtn(e.target instanceof Element ? e.target : null);
      if (!btn || btn.dataset.track !== 'faq_open_answer') return;

      const s = getState(btn); // до клика (aria-expanded ещё старое)
      afterDomChange(()=>{
        const nowOpen = (btn.getAttribute('aria-expanded') === 'true');
        if (!s.before && nowOpen){ // фиксируем только открытие
          post('faq_open_answer', {
            question_id: s.id,
            question_text: s.question
          });
        }
      });
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