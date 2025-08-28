import { post, onReady } from "../utils.js";

export function initClickProceedToPayment() {
  onReady(() => {
    document.addEventListener(
      "submit",
      (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;

        // проверяем, что форма содержит нашу кнопку "Перейти к оплате"
        const submitBtn = form.querySelector("button.t-submit.t-btnflex_type_submit");
        if (!submitBtn) return;

        // ищем выбранный способ оплаты в рамках этой формы
        const selected = form.querySelector("input.t-radio_payment:checked");
        const method =
          selected?.value || selected?.dataset.paymentVariantSystem || null;

        post("click_proceed_to_payment", { name: method });
      },
      { capture: true, passive: true }
    );
  });
}