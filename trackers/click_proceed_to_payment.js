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
        console.debug("[retry] значения из формы:", { email, social });

        // твой backend
        post("click_proceed_to_payment", { email, social });
        console.debug("[retry] post вызван для backend с email/social");

        // Roistat
        const visit = (document.cookie.match(/(?:^|;\s*)roistat_visit=([^;]+)/) || [])[1] || null;
        if (window.roistat?.event?.send) {
          const payload = {
            email,
            social_link: social,
            visit,
            page: location.pathname || "/",
          };
          console.log("[RoistatLead] отправка лида:", payload);
          window.roistat.event.send("lead", payload);
        } else {
          console.warn("[RoistatLead] roistat.event.send недоступен", window.roistat);
        }
      },
      { capture: true, passive: true }
    );

    console.debug("[retry] обработчик клика по кнопке 'Перейти к оплате' навешан");
  });
}