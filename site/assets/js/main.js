(function () {
  "use strict";
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- Navigation unten (Handy): aktiven Bereich markieren ------------- */
  var bnav = document.querySelector(".bnav");
  if (bnav) {
    var punkte = Array.prototype.map.call(bnav.querySelectorAll(".bnav-item"), function (a) {
      var h = a.getAttribute("href");
      var id = h.charAt(0) === "#" ? h.slice(1) : "";
      return { a: a, ziel: id === "top" ? document.body : (id ? document.getElementById(id) : null) };
    }).filter(function (p) { return p.ziel; });
    var markiere = function (p) {
      punkte.forEach(function (q) {
        var an = q === p;
        q.a.classList.toggle("is-aktiv", an);
        if (an) q.a.setAttribute("aria-current", "location"); else q.a.removeAttribute("aria-current");
      });
    };
    var geplant = false;
    var pruefe = function () {
      geplant = false;
      var linie = window.innerHeight * 0.4, aktiv = punkte[0];
      punkte.forEach(function (p) {
        if (p.ziel !== document.body && p.ziel.getBoundingClientRect().top <= linie) aktiv = p;
      });
      // ganz unten angekommen: letzter Punkt
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) aktiv = punkte[punkte.length - 1];
      markiere(aktiv);
    };
    if (punkte.length) {
      window.addEventListener("scroll", function () { if (!geplant) { geplant = true; requestAnimationFrame(pruefe); } }, { passive: true });
      window.addEventListener("resize", pruefe);
      pruefe();
    }
  }

  /* ---- Hero: Schieberegler zwischen Skizze und Foto ---------------------- */
  var hero = document.querySelector(".hero");
  var griff = hero && hero.querySelector(".hero-handle");
  if (griff) {
    var media = hero.querySelector(".hero-media");
    var tagIdee = hero.querySelector(".tag-idee");
    var tagErgebnis = hero.querySelector(".tag-ergebnis");
    var MIN = 5, MAX = 95;
    var aktuell = function () { return parseFloat(getComputedStyle(hero).getPropertyValue("--split")) || 50; };
    var anzeigen = function (p) {
      var r = Math.round(p);
      griff.setAttribute("aria-valuenow", r);
      griff.setAttribute("aria-valuetext", r + " Prozent Skizze");
      tagIdee.classList.toggle("is-weg", p < 22);
      tagErgebnis.classList.toggle("is-weg", p > 78);
    };
    var setze = function (p) {
      p = Math.min(MAX, Math.max(MIN, p));
      hero.style.setProperty("--split", p + "%");
      anzeigen(p);
    };
    anzeigen(aktuell());
    var ausZeiger = function (e) {
      var box = media.getBoundingClientRect();
      setze(((e.clientX - box.left) / box.width) * 100);
    };

    griff.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      griff.setPointerCapture(e.pointerId);
      griff.classList.add("is-drag");
      hero.classList.add("is-drag");
      ausZeiger(e);
    });
    griff.addEventListener("pointermove", function (e) {
      if (griff.hasPointerCapture(e.pointerId)) ausZeiger(e);
    });
    var loslassen = function () { griff.classList.remove("is-drag"); hero.classList.remove("is-drag"); };
    griff.addEventListener("pointerup", loslassen);
    griff.addEventListener("pointercancel", loslassen);

    griff.addEventListener("keydown", function (e) {
      var schritt = e.shiftKey ? 10 : 2, p = aktuell();
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") p -= schritt;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") p += schritt;
      else if (e.key === "Home") p = MIN;
      else if (e.key === "End") p = MAX;
      else return;
      e.preventDefault();
      setze(p);
    });
  }

  /* ---- v3: Raum-Rundgang ------------------------------------------------- */
  var tour = document.querySelector(".v3-hero");
  if (tour) {
    var rtabs = Array.prototype.slice.call(tour.querySelectorAll(".v3-tab"));
    var dock = tour.querySelector(".v3-dock");
    var vorschau = tour.querySelector(".v3-preview");
    var vImg = vorschau.querySelector("img");
    var vName = vorschau.querySelector("b");
    var prevName = tour.querySelector(".v3-prev .v3-side-name");
    var nextName = tour.querySelector(".v3-next .v3-side-name");
    var index = 0;

    var zeigeVorschau = function (tab) {
      var d = dock.getBoundingClientRect(), t = tab.getBoundingClientRect();
      vorschau.style.setProperty("--px", (t.left + t.width / 2 - d.left) + "px");
      if (vImg.getAttribute("src") !== tab.dataset.bild) vImg.setAttribute("src", tab.dataset.bild);
      vName.textContent = tab.dataset.name;
    };
    var geheZu = function (i, fokus) {
      index = (i + rtabs.length) % rtabs.length;
      rtabs.forEach(function (t, n) {
        var an = n === index;
        t.setAttribute("aria-selected", an ? "true" : "false");
        t.tabIndex = an ? 0 : -1;
        var szene = document.getElementById(t.getAttribute("aria-controls"));
        szene.classList.toggle("is-aktiv", an);
        if (an) szene.removeAttribute("aria-hidden"); else szene.setAttribute("aria-hidden", "true");
      });
      prevName.textContent = rtabs[(index - 1 + rtabs.length) % rtabs.length].dataset.name;
      nextName.textContent = rtabs[(index + 1) % rtabs.length].dataset.name;
      zeigeVorschau(rtabs[index]);
      if (fokus) rtabs[index].focus();
    };

    rtabs.forEach(function (tab, n) {
      tab.addEventListener("click", function () { geheZu(n); });
      tab.addEventListener("mouseenter", function () { zeigeVorschau(tab); });
      tab.addEventListener("mouseleave", function () { zeigeVorschau(rtabs[index]); });
      tab.addEventListener("keydown", function (e) {
        var z = { ArrowRight: n + 1, ArrowLeft: n - 1, Home: 0, End: rtabs.length - 1 }[e.key];
        if (z === undefined) return;
        e.preventDefault();
        geheZu(z, true);
      });
    });
    tour.querySelectorAll("[data-raum-schritt]").forEach(function (btn) {
      btn.addEventListener("click", function () { geheZu(index + Number(btn.dataset.raumSchritt)); });
    });
    var zoom = tour.querySelector(".v3-zoom");
    zoom.addEventListener("click", function () {
      var an = !tour.classList.contains("is-zoom");
      tour.classList.toggle("is-zoom", an);
      zoom.setAttribute("aria-pressed", an ? "true" : "false");
      zoom.setAttribute("aria-label", an ? "Bild verkleinern" : "Bild vergrössern");
    });

    // Wischen auf dem Handy
    var startX = null;
    tour.querySelector(".v3-stage").parentNode.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    tour.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50 && !e.target.closest(".v3-tabs, a, button")) geheZu(index + (dx < 0 ? 1 : -1));
    }, { passive: true });

    // Hinweis-Schilder: auf dem Handy nur Punkte, Schild erscheint beim Antippen
    tour.querySelectorAll(".hs").forEach(function (hs) { hs.tabIndex = 0; });

    window.addEventListener("resize", function () { zeigeVorschau(rtabs[index]); });
    geheZu(0);
  }

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

  // Gewähltes Angebot ins Kontaktformular übernehmen
  var VORLAGE = "Hallo, ich interessiere mich für das Angebot «";
  var waehleAngebot = function (name, fragebogen) {
    if (!kontakt) return;
    kontakt.querySelector("[name=dienstleistung]").value = name;
    kontakt.querySelector("[name=fragebogen]").value = fragebogen || "";
    var box = kontakt.querySelector(".form-choice");
    box.querySelector("strong").textContent = name;
    box.hidden = false;
    var msg = kontakt.querySelector("[name=nachricht]");
    if (!msg.value.trim() || msg.value.indexOf(VORLAGE) === 0) msg.value = VORLAGE + name + "».\n\n";
    setTimeout(function () { kontakt.querySelector("[name=name]").focus({ preventScroll: true }); }, 400);
  };
  document.querySelectorAll("[data-anfrage]").forEach(function (el) {
    el.addEventListener("click", function () { waehleAngebot(el.getAttribute("data-anfrage"), ""); });
  });

  /* ---- Reiter (v2: Angebote) --------------------------------------------- */
  document.querySelectorAll("[role=tablist]").forEach(function (liste) {
    if (liste.closest(".v3-hero")) return; // Rundgang hat eigene Logik (unten)
    var reiter = Array.prototype.slice.call(liste.querySelectorAll("[role=tab]"));
    var waehle = function (tab, fokus) {
      reiter.forEach(function (t) {
        var an = t === tab;
        t.setAttribute("aria-selected", an ? "true" : "false");
        t.tabIndex = an ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !an;
      });
      if (fokus) tab.focus();
    };
    reiter.forEach(function (tab, i) {
      tab.addEventListener("click", function () { waehle(tab); });
      tab.addEventListener("keydown", function (e) {
        var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: reiter.length - 1 }[e.key];
        if (n === undefined) return;
        e.preventDefault();
        waehle(reiter[(n + reiter.length) % reiter.length], true);
      });
    });
  });

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
      if (!empfehlung) return;
      waehleAngebot(empfehlung.name, zusammenfassung().map(function (z) { return z[0] + ": " + z[1]; }).join("\n"));
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
