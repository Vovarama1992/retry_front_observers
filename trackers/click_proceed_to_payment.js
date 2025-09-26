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

        // roistat_visit из cookie
        const roistatVisit =
          (document.cookie.match(/(?:^|;\s*)roistat_visit=([^;]+)/) || [])[1] ||
          null;

        if (roistatVisit) {
          console.log("[Roistat] найден roistat_visit:", roistatVisit);
        } else {
          console.warn("[Roistat] ⚠️ roistat_visit не найден в cookie");
        }

        const payload = {
          email,
          social,
          name: method,
          meta: {
            email,
            social_link: social,
            name: method, // метод оплаты
            page: location.pathname || "/",
            roistat_visit: roistatVisit,
          },
        };

        console.log("[CRM] 🚀 отправка в нашу CRM:", payload);

        // Отправляем в CRM
        post("click_proceed_to_payment", payload)
          .then((resp) => {
            console.log("[CRM] ✅ ответ из нашей CRM получен:", resp);
          })
          .catch((err) => {
            console.error("[CRM] ❌ ошибка при отправке в CRM:", err);
          });

        // Отправляем событие в Яндекс.Метрику
        if (typeof ym === "function") {
          try {
            ym(102345100, "reachGoal", "proceed_to_payment", {}, () => {
              console.log("[YM] ✅ событие 'proceed_to_payment' отправлено успешно");
            });
          } catch (err) {
            console.error("[YM] ❌ ошибка при вызове ym:", err);
          }
        } else {
          console.warn("[YM] ⚠️ функция ym не найдена — код счётчика Метрики не подключён");
        }
      },
      { capture: true, passive: true }
    );

    console.debug("[retry] обработчик клика по кнопке 'Перейти к оплате' навешан");
  });
}