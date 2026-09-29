(function () {
  "use strict";
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- Angebotsfinder ---------------------------------------------------- */
  var ANGEBOTE = {
    check: {
      name: "Raum-Check",
      text: "Ein Besuch vor Ort, eine ehrliche Einschätzung und drei konkrete Ideen, die du sofort selbst umsetzen kannst."
    },
    konzept: {
      name: "Wohnkonzept",
      text: "Farben, Licht, Möbel und Materialien als durchdachtes Gesamtkonzept – mit Einkaufsliste, damit du Schritt für Schritt umsetzen kannst."
    },
    begleitung: {
      name: "Begleitung",
      text: "Von der Planung bis zur Umsetzung: Wir kümmern uns um Einkauf, Handwerker und Einrichtung, bis alles fertig ist."
    }
  };
  var UMFANG = { raum: "Ein einzelner Raum", mehrere: "Mehrere Räume", ganz: "Das ganze Zuhause", umzug: "Umzug oder Neubau" };
  var HILFE = { ideen: "Ideen und Einschätzung", konzept: "Fertiges Konzept", begleitung: "Begleitung bis alles fertig ist" };
  var FRAGEN = 4;

  var finder = document.getElementById("finder-form");
  var kontakt = document.getElementById("kontaktformular");

  if (finder) {
    var schritt = 1;
    var steps = finder.querySelectorAll("[data-step]");
    var bar = finder.querySelector(".finder-progress span");
    var count = finder.querySelector(".finder-count");
    var err = finder.querySelector(".finder-error");
    var controls = finder.querySelector("[data-finder-controls]");
    var back = finder.querySelector("[data-finder-back]");
    var next = finder.querySelector("[data-finder-next]");
    var result = finder.querySelector(".finder-result");
    var empfehlung = null;

    var wert = function (name) {
      var el = finder.querySelector("[name=" + name + "]:checked");
      return el ? el.value : "";
    };
    var raeume = function () {
      return Array.prototype.map.call(finder.querySelectorAll("[name=raeume]:checked"), function (el) { return el.value; });
    };

    var zeige = function (n, fokus) {
      schritt = n;
      steps.forEach(function (s) { s.hidden = Number(s.getAttribute("data-step")) !== n; });
      var fertig = n > FRAGEN;
      controls.hidden = fertig;
      back.disabled = n === 1;
      next.textContent = n === FRAGEN ? "Empfehlung zeigen" : "Weiter";
      bar.style.width = (fertig ? 100 : (n / FRAGEN) * 100) + "%";
      count.textContent = fertig ? "Fertig!" : "Frage " + n + " von " + FRAGEN;
      err.textContent = "";
      if (!fokus) return;
      var ziel = fertig ? result : finder.querySelector('[data-step="' + n + '"] input');
      if (ziel) ziel.focus({ preventScroll: true });
      var top = finder.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.4) finder.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    var gueltig = function () {
      if (schritt === 1 && !wert("umfang")) return "Bitte wähle eine Antwort.";
      if (schritt === 2 && !raeume().length) return "Bitte wähle mindestens einen Raum.";
      if (schritt === 3 && !wert("hilfe")) return "Bitte wähle eine Antwort.";
      if (schritt === 4 && !wert("zeit")) return "Bitte wähle eine Antwort.";
      return "";
    };

    var berechne = function () {
      var p = { check: 0, konzept: 0, begleitung: 0 };
      var u = wert("umfang"), h = wert("hilfe"), anzahl = raeume().length;
      if (u === "raum") p.check += 2;
      if (u === "mehrere") p.konzept += 2;
      if (u === "ganz") p.begleitung += 2;
      if (u === "umzug") { p.begleitung += 1; p.konzept += 1; }
      if (anzahl <= 1) p.check += 1; else if (anzahl <= 4) p.konzept += 1; else p.begleitung += 1;
      var wunsch = { ideen: "check", konzept: "konzept", begleitung: "begleitung" }[h];
      p[wunsch] += 3;
      // Bei Gleichstand gewinnt, was sich die Person ausdrücklich gewünscht hat
      return Object.keys(p).reduce(function (best, k) {
        return p[k] > p[best] || (p[k] === p[best] && k === wunsch) ? k : best;
      }, wunsch);
    };

    var zusammenfassung = function () {
      return [
        ["Umfang", UMFANG[wert("umfang")]],
        ["Räume", raeume().join(", ")],
        ["Wunsch", HILFE[wert("hilfe")]],
        ["Start", wert("zeit")]
      ];
    };

    var auswerten = function () {
      empfehlung = ANGEBOTE[berechne()];
      result.querySelector(".result-title").textContent = empfehlung.name;
      result.querySelector(".result-text").textContent = empfehlung.text;
      var ul = result.querySelector(".result-summary");
      ul.textContent = "";
      zusammenfassung().forEach(function (z) {
        var li = document.createElement("li");
        var b = document.createElement("b");
        b.textContent = z[0] + ": ";
        li.appendChild(b);
        li.appendChild(document.createTextNode(z[1]));
        ul.appendChild(li);
      });
    };

    next.addEventListener("click", function () {
      var fehler = gueltig();
      if (fehler) { err.textContent = fehler; return; }
      if (schritt === FRAGEN) auswerten();
      zeige(schritt + 1, true);
    });
    back.addEventListener("click", function () { if (schritt > 1) zeige(schritt - 1, true); });

    // Bei Einfachauswahl per Maus/Finger automatisch weiter (nicht bei Pfeiltasten)
    var zeiger = false;
    finder.addEventListener("pointerdown", function () { zeiger = true; });
    finder.addEventListener("keydown", function () { zeiger = false; });
    finder.addEventListener("change", function (e) {
      if (e.target.type !== "radio" || !zeiger) return;
      err.textContent = "";
      setTimeout(function () { if (!gueltig()) next.click(); }, 220);
    });

    finder.querySelector("[data-finder-restart]").addEventListener("click", function () {
      finder.reset();
      empfehlung = null;
      zeige(1, true);
    });

    finder.querySelector("[data-finder-request]").addEventListener("click", function () {
      if (!kontakt || !empfehlung) return;
      var text = zusammenfassung().map(function (z) { return z[0] + ": " + z[1]; }).join("\n");
      kontakt.querySelector("[name=dienstleistung]").value = empfehlung.name;
      kontakt.querySelector("[name=fragebogen]").value = text;
      var box = kontakt.querySelector(".form-choice");
      box.querySelector("strong").textContent = empfehlung.name;
      box.hidden = false;
      var msg = kontakt.querySelector("[name=nachricht]");
      if (!msg.value.trim()) msg.value = "Hallo, ich interessiere mich für das Angebot «" + empfehlung.name + "».\n\n";
      setTimeout(function () { kontakt.querySelector("[name=name]").focus({ preventScroll: true }); }, 400);
    });

    finder.addEventListener("submit", function (e) { e.preventDefault(); });
    zeige(1, false);
  }

  /* ---- Kontaktformular --------------------------------------------------- */
  var form = kontakt;
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
        if (res.ok) {
          form.reset();
          form.querySelector("[name=dienstleistung]").value = "";
          form.querySelector("[name=fragebogen]").value = "";
          var box = form.querySelector(".form-choice");
          if (box) box.hidden = true;
        }
      })
      .catch(function () { status.textContent = "Senden hat nicht geklappt. Bitte schreib direkt per E-Mail."; })
      .then(function () { btn.disabled = false; });
  });
})();
