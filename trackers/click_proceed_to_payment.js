import { post, onReady } from "../utils.js";

function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export function initClickProceedToPayment() {
  console.debug("[retry] initClickProceedToPayment загружен - новый ройстатовский"); // скрипт точно попал на страницу

  onReady(() => {
    console.debug("[retry] initClickProceedToPayment onReady сработал");

    document.addEventListener(
      "submit",
      (e) => {
        console.debug("[retry] событие submit поймано", e.target);

        const form = e.target;
        if (!(form instanceof HTMLFormElement)) {
          console.debug("[retry] target не форма, выходим");
          return;
        }

        // проверяем, что форма содержит кнопку "Перейти к оплате"
        const submitBtn = form.querySelector("button.t-submit.t-btnflex_type_submit");
        if (!submitBtn) {
          console.debug("[retry] в форме нет кнопки 'Перейти к оплате'");
          return;
        }
        console.debug("[retry] найдена кнопка 'Перейти к оплате'", submitBtn);

        // ищем выбранный способ оплаты
        const selected = form.querySelector("input.t-radio_payment:checked");
        const method =
          selected?.value || selected?.dataset.paymentVariantSystem || null;
        console.debug("[retry] выбранный метод оплаты:", method);

        // твоя аналитика
        post("click_proceed_to_payment", { name: method });
        console.debug("[retry] post вызван с type=click_proceed_to_payment");

        // Roistat ProxyLead
        const visit = getCookie("roistat_visit");
        const email = form.querySelector("input[type=email]")?.value || null;
        const phone = form.querySelector("input[type=tel]")?.value || null;

        const payload = {
          leadName: "ProceedToPayment",
          fields: {
            email,
            phone,
            payment_method: method,
          },
          visit,
        };

        if (window.roistat?.api?.send) {
          console.log("[Roistat proxyLead] отправляем лид:", payload);
          window.roistat.api.send("proxy_lead", payload);
        } else {
          console.warn("[Roistat proxyLead] send недоступен, window.roistat =", window.roistat);
        }
      },
      { capture: true, passive: true }
    );

    console.debug("[retry] обработчик submit навешан");
  });
}