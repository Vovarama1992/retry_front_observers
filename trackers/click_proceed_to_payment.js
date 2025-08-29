import { post, onReady } from "../utils.js";

export function initClickProceedToPayment() {
  console.debug("[retry] initClickProceedToPayment загружен");
  onReady(() => {
    console.debug("[retry] initClickProceedToPayment onReady сработал");
    document.addEventListener(
      "click",
      (e) => {
        console.debug("[retry] document click перехвачен");
        const btn = e.target instanceof Element
          ? e.target.closest("button.t-submit.t-btnflex_type_submit")
          : null;
        if (!btn) return;

        console.debug("[retry] найдена кнопка 'Перейти к оплате'", btn);

        const root =
          btn.closest("form") ||
          btn.closest('[data-payment-root]') ||
          document;

        const selected = root.querySelector("input.t-radio_payment:checked");
        const method =
          selected?.value || selected?.dataset.paymentVariantSystem || null;

        console.debug("[retry] click_proceed_to_payment", { method, root });
        post("click_proceed_to_payment", { name: method });
      },
      { capture: true }
    );
  });
}