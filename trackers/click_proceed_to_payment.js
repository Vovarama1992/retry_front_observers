import { post, onReady } from "../utils.js";

export function initClickProceedToPayment() {
  console.debug("[retry] initClickProceedToPayment загружен");

  onReady(() => {
    console.debug("[retry] initClickProceedToPayment onReady сработал");

    document.addEventListener(
      "click",
      (e) => {
        const btn = e.target.closest("button.t-submit.t-btnflex_type_submit");
        if (!btn) return;

        const form = btn.closest("form");
        if (!form) {
          console.warn("[retry] кнопка найдена, но форма не обнаружена");
          return;
        }

        console.debug("[retry] найдена форма для 'Перейти к оплате'", form);

        // вытащим данные из формы
        const email = form.querySelector("input[name='Email']")?.value || null;
        const social = form.querySelector("input[name='social_link']")?.value || null;

        const selected = form.querySelector("input.t-radio_payment:checked");
        const method =
          selected?.value || selected?.dataset.paymentVariantSystem || null;

        const payload = {
          email,
          social,
          name: method,
          meta: {
            email,
            social_link: social,
            name: method,
            page: location.pathname || "/",
          },
        };

        console.log("[CRM] 🚀 отправка в нашу CRM:", payload);

        post("click_proceed_to_payment", payload)
          .then((resp) => {
            console.log("[CRM] ✅ ответ из нашей CRM получен:", resp);
          })
          .catch((err) => {
            console.error("[CRM] ❌ ошибка при отправке в CRM:", err);
          });
      },
      { capture: true, passive: true }
    );

    console.debug("[retry] обработчик клика по кнопке 'Перейти к оплате' навешан");
  });
}
