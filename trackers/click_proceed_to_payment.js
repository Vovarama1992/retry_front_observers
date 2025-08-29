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

        const form = btn.closest("form");
        if (!form) return;

        // ищем выбранный способ оплаты в рамках этой формы
        const selected = form.querySelector("input.t-radio_payment:checked");
        const method =
          selected?.value || selected?.dataset.paymentVariantSystem || null;

        post("click_proceed_to_payment", { name: method });
      },
      { capture: true }
    );
  });
}