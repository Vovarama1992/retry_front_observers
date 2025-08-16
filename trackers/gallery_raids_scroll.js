import { post, onReady } from "../utils.js";

/**
 * Универсальный трекер стрелок карусели рейдов.
 * Работает по кликам на стрелки (svg/button/div), вычисляет индекс до/после и направление.
 * Meta: { gallery_id, index_before, index_after, total, dir }
 */

function getGalleryRoot(el){
  // поднимаемся к блоку-карусели
  // часто это .t-slds (тильдовский слайдер) или контейнер с id="carousel_*" / data-slider
  return (
    el.closest?.('.t-slds') ||
    el.closest?.('[id^="carousel_"]') ||
    el.closest?.('[data-slider]') ||
    // запасной вариант: общий ближайший блок с рейдами
    el.closest?.('.t734, [class*="t734"], [id^="rec"]')
  ) || null;
}

function getItems(root){
  if (!root) return [];
  // приоритет стандартных айтемов слайдера
  let nodes = root.querySelectorAll('.t-slds__item');
  if (nodes && nodes.length) return Array.from(nodes);
  // fallback: элементы-элементы слайдов внутри .t-slds__items-wrapper
  nodes = root.querySelectorAll('.t-slds__items-wrapper > *');
  if (nodes && nodes.length) return Array.from(nodes);
  // последний шанс: все прямые дети, у которых виден рейд-контент (кнопка artstation и т.п.)
  nodes = root.querySelectorAll('a.t-btnflex, .t-btnflex__text, a[href*="artstation.com/artwork/"]');
  return Array.from(nodes).map(n => n.closest?.('.t-slds__item') || n.closest?.('[data-slide]') || n).filter(Boolean);
}

function getActiveIndex(root){
  const items = getItems(root);
  if (!items.length) return { index: null, total: 0 };
  // типовой активный класс
  let idx = items.findIndex(it => it.classList?.contains('t-slds__item_active'));
  // если класса нет — попробуем по aria/current
  if (idx < 0) idx = items.findIndex(it => it.getAttribute?.('aria-current') === 'true');
  // если всё равно нет — возьмём ближайший видимый
  if (idx < 0) idx = items.findIndex(it => !!(it.offsetParent));
  if (idx < 0) idx = 0;
  return { index: idx, total: items.length };
}

function scheduleAfterChange(root, cb){
  // двойной rAF, чтобы дождаться DOM после анимации переключения
  requestAnimationFrame(() => requestAnimationFrame(() => cb(getActiveIndex(root))));
}

function looksLikeLeft(el){
  // признаки "влево"
  const txt = (el.getAttribute?.('aria-label') || '').toLowerCase();
  if (txt.includes('предыдущ') || txt.includes('prev') || txt.includes('left')) return true;
  const cls = el.className?.toString()?.toLowerCase() || '';
  return cls.includes('arrow-left') || cls.includes('__left');
}

function looksLikeRight(el){
  // признаки "вправо"
  const txt = (el.getAttribute?.('aria-label') || '').toLowerCase();
  if (txt.includes('следующ') || txt.includes('next') || txt.includes('right')) return true;
  const cls = el.className?.toString()?.toLowerCase() || '';
  return cls.includes('arrow-right') || cls.includes('__right');
}

export function initGalleryRaidsScroll(){
  onReady(()=>{
    document.addEventListener('click', (e)=>{
      const el = (e.target instanceof Element) ? e.target : null;
      if (!el) return;

      // стрелки в тильде часто вложены: svg внутри button/div.
      const arrow = el.closest('.t-slds__arrow, .t-slds__arrow-left, .t-slds__arrow-right, [aria-label*="слайд"], [aria-label*="slide"], button, svg');
      if (!arrow) return;

      const root = getGalleryRoot(arrow);
      if (!root) return;

      const before = getActiveIndex(root);
      // если индекс до не определился — не шлём
      if (before.index == null) return;

      scheduleAfterChange(root, (after)=>{
        // определить направление: по явным признакам или по индексу
        let dir = looksLikeRight(arrow) ? 'right' : looksLikeLeft(arrow) ? 'left' : null;
        if (!dir && after.index != null && before.index != null && after.index !== before.index){
          dir = (after.index > before.index) ? 'right' : 'left';
        }

        const meta = {
          gallery_id: root.id || null,
          index_before: before.index,
          index_after:  after.index,
          total: after.total,
          dir: dir || null
        };

        post('gallery_raids_scroll', meta);
      });
    }, { capture:true, passive:true });
  });
}