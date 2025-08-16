import { post, onReady } from "../utils.js";

function getSliderRoot(el){
  return el.closest?.('.t-slds, [id^="carousel_"]') || document.getElementById(el.getAttribute?.('aria-controls') || '') || null;
}

function getState(root){
  if (!root) return { index: null, total: null };
  const items = root.querySelectorAll('.t-slds__item');
  const total = items.length || null;
  let index = null;
  items.forEach((it, i)=>{
    if (it.classList?.contains('t-slds__item_active')) index = i;
  });
  return { index, total };
}

function scheduleReadAfterChange(root, cb){
  // читаем после перерисовки галереи
  requestAnimationFrame(()=> requestAnimationFrame(()=> cb(getState(root))));
}

export function initGalleryTeachersScroll(){
  onReady(()=>{
    document.addEventListener('click', (e)=>{
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;

      const leftBtn  = el.closest?.('.t-slds__arrow-left');
      const rightBtn = el.closest?.('.t-slds__arrow-right');

      if (!leftBtn && !rightBtn) return;

      const btn    = leftBtn || rightBtn;
      const dir    = leftBtn ? 'left' : 'right';
      const root   = getSliderRoot(btn);
      const before = getState(root); // индекс до смены

      scheduleReadAfterChange(root, (after)=>{
        const meta = {
          gallery_id: root?.id || null,
          index_before: before.index,
          index_after:  after.index,
          total: after.total
        };
        post(dir === 'left' ? 'gallery_scroll_left' : 'gallery_scroll_right', meta);
      });
    }, { capture: true, passive: true });
  });
}