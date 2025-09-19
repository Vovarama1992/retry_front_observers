// trackers/click_proceed_to_payment.js
import { post, onReady } from "../utils.js";

function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export function initClickProceedToPayment() {
  console.debug("[retry] initClickProceedToPayment загружен");

  onReady(() => {
    console.debug("[retry] initClickProceedToPayment onReady сработал");

    document.addEventListener(
      "submit",
      (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;

        const submitBtn = form.querySelector("button.t-submit.t-btnflex_type_submit");
        if (!submitBtn) return;

        console.debug("[retry] найдена форма с кнопкой 'Перейти к оплате'");

        // собираем email и телефон, если есть
        const email =
          form.querySelector('input[type="email"]')?.value?.trim() || null;
        const phone =
          form.querySelector('input[type="tel"]')?.value?.trim() || null;
        const name =
          form.querySelector('input[name="name"]')?.value?.trim() || null;

        const visit = getCookie("roistat_visit");
        const selected = form.querySelector("input.t-radio_payment:checked");
        const method =
          selected?.value || selected?.dataset.paymentVariantSystem || null;

        // твоя аналитика
        post("click_proceed_to_payment", { method, email, phone });

        // Roistat ProxyLead
        if (window.roistat && window.roistat.api && window.roistat.api.send) {
          const payload = {
            roistat: visit || null,
            name: name || "Unknown",
            phone: phone,
            email: email,
            fields: {
              method: method,
              page: location.pathname
            }
          };
          console.log("[Roistat] proxy lead send:", payload);

          window.roistat.api.send("proxy_lead", payload);
        } else {
          console.warn("[Roistat] proxy lead API not available. window.roistat =", window.roistat);
        }
      },
      { capture: true, passive: true }
    );
  });
}