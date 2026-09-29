(function () {
  "use strict";
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  var form = document.getElementById("kontaktformular");
  if (!form) return;
  var ts = form.querySelector("[name=t]");
  if (ts) ts.value = Date.now();
  var status = form.querySelector(".status");
  var params = new URLSearchParams(location.search);
  if (params.get("gesendet")) status.textContent = "Danke! Die Nachricht ist angekommen.";
  if (params.get("fehler")) status.textContent = "Senden hat nicht geklappt. Bitte schreib direkt per E-Mail.";

  if (!window.fetch) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    status.textContent = "Wird gesendet …";
    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        status.textContent = res.ok ? "Danke! Die Nachricht ist angekommen." : (res.message || "Senden hat nicht geklappt.");
        if (res.ok) form.reset();
      })
      .catch(function () { status.textContent = "Senden hat nicht geklappt. Bitte schreib direkt per E-Mail."; })
      .then(function () { btn.disabled = false; });
  });
})();
