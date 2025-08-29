import { post, onReady } from "../utils.js";

export function initClickProceedToPayment() {
  onReady(() => {
    document.addEventListener(
      "click",
      (e) => {
        const btn = e.target instanceof Element
          ? e.target.closest("button.t-submit.t-btnflex_type_submit")
          : null;
        if (!btn) return;

        // нашли кнопку — уже логируем
        console.debug("[retry] найдена кнопка 'Перейти к оплате'", btn);

        // ищем контейнер — форма если есть, иначе fallback
        const root =
          btn.closest("form") ||
          btn.closest('[data-payment-root]') ||
          document;

        const selected = root.querySelector("input.t-radio_payment:checked");
        const method =
          selected?.value || selected?.dataset.paymentVariantSystem || null;

        // всегда логируем найденный метод (даже если null)
        console.debug("[retry] click_proceed_to_payment", { method, root });

        post("click_proceed_to_payment", { name: method });
      },
      { capture: true }
    );
  });
}