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

        // твой backend (оставляем, но он тут ни при чём)
        post("click_proceed_to_payment", { email, social });
        console.debug("[retry] post вызван для backend с email/social");

        // Roistat proxyLead
        const visit = (document.cookie.match(/(?:^|;\s*)roistat_visit=([^;]+)/) || [])[1] || null;

        if (visit) {
          const apiKey = "ebfba41f50aeb0373aae28d692d5fa71";
          const url = `https://cloud.roistat.com/api/proxy/1.0/leads?key=${apiKey}&roistat_visit=${visit}`;

          const payload = {
            title: "Перейти к оплате",
            email: email,
            fields: {
              social_link: social,
              page: location.pathname || "/",
            },
          };

          console.log("[RoistatLead] отправка проксилида:", payload);

          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("[RoistatLead] ✅ ответ:", data);
            })
            .catch((err) => {
              console.error("[RoistatLead] ❌ ошибка при отправке:", err);
            });
        } else {
          console.warn("[RoistatLead] не найден roistat_visit в cookie");
        }
      },
      { capture: true, passive: true }
    );

    console.debug("[retry] обработчик клика по кнопке 'Перейти к оплате' навешан");
  });
}