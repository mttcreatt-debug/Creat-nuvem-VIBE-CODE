/* Elite Drako Gym — page behaviour. Everything works without this file;
   it adds the live open/closed status, the tabs, the drawer and the motion. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- hours: the live thing ---------- */
  // [opens, closes] in hours, by weekday (0 = Sunday). 24 = midnight.
  var HOURS = { 0: [8, 15], 1: [5, 24], 2: [5, 24], 3: [5, 24], 4: [5, 24], 5: [5, 24], 6: [7, 18] };
  var DAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

  function bahiaNow() {
    // Valente-BA follows America/Bahia (UTC-3, no daylight saving).
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Bahia", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
      return { day: wd, h: parseInt(map.hour, 10), m: parseInt(map.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), h: d.getHours(), m: d.getMinutes() };
    }
  }
  function hh(h) { return h === 24 ? "meia-noite" : h + "h"; }
  function span(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    if (h && m) return h + "h" + (m < 10 ? "0" + m : m);
    if (h) return h + (h === 1 ? " hora" : " horas");
    return m + " min";
  }
  function nextOpening(now) {
    for (var i = 0; i < 8; i++) {
      var d = (now.day + i) % 7, o = HOURS[d][0];
      if (i === 0 && now.h * 60 + now.m >= o * 60) continue;
      return { inDays: i, day: d, at: o };
    }
  }
  function updateStatus() {
    var now = bahiaNow();
    var t = now.h * 60 + now.m;
    var today = HOURS[now.day];
    var open = t >= today[0] * 60 && t < today[1] * 60;
    var line, big, sub;
    if (open) {
      var left = today[1] * 60 - t;
      line = "Aberto agora · fecha à " + hh(today[1]);
      big = "Aberto agora. Fecha em " + span(left) + ", à " + hh(today[1]) + ".";
      sub = left <= 60 ? "Última hora do dia: dá tempo de um treino curto." : "Sem pausa para o almoço. Sábado das 7h às 18h e domingo das 8h às 15h.";
    } else {
      var n = nextOpening(now);
      var when = n.inDays === 0 ? "hoje" : n.inDays === 1 ? "amanhã" : DAY_NAMES[n.day];
      line = "Fechado agora · abre " + when + " às " + hh(n.at);
      big = "Fechado agora. Abre " + when + " às " + hh(n.at) + ".";
      sub = "De segunda a sexta, das 5h à meia-noite. Sábado das 7h às 18h e domingo das 8h às 15h.";
    }
    var s = document.querySelector("[data-status]");
    if (s) {
      s.classList.toggle("is-open", open);
      s.querySelector("[data-status-text]").textContent = line;
    }
    var b = document.querySelector("[data-now]");
    if (b) b.textContent = big;
    var bs = document.querySelector("[data-now-sub]");
    if (bs) bs.textContent = sub;
    document.querySelectorAll(".days li").forEach(function (li) {
      li.classList.toggle("is-today", Number(li.dataset.day) === now.day);
    });
  }
  updateStatus();
  setInterval(updateStatus, 30000);

  /* ---------- obra tabs with the slow crossfade ---------- */
  var COPY = [
    "Os equipamentos chegaram embalados, de caminhão e empilhadeira, e entraram pela porta da frente um a um.",
    "Cada máquina foi desembalada e montada no próprio salão, com a equipe conferindo peça por peça.",
    "Em 18 de julho as portas abriram com o salão pronto, as máquinas no lugar e o neon aceso."
  ];
  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-tab]"));
  var slides = document.querySelectorAll(".obra__frame img");
  var copyEl = document.querySelector("[data-copy]");
  var panel = document.getElementById("obra-panel");
  var current = 0, timer = null, userTook = false;
  function show(i, focus) {
    current = i;
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    slides.forEach(function (img, k) { img.classList.toggle("is-on", k === i); });
    if (copyEl) copyEl.textContent = COPY[i];
    if (panel) panel.setAttribute("aria-labelledby", "tab-" + i);
  }
  tabs.forEach(function (t, k) {
    t.addEventListener("click", function () { userTook = true; show(k); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault(); userTook = true;
        show((k + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length, true);
      }
    });
  });
  if (!reduce && tabs.length) {
    timer = setInterval(function () {
      if (userTook || document.hidden) return;
      show((current + 1) % tabs.length);
    }, 5600);
  }

  /* ---------- FAQ drawer: one card open at a time ---------- */
  var cards = document.querySelectorAll("[data-drawer] details");
  cards.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      cards.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------- plan buttons preselect the coupon ---------- */
  document.querySelectorAll("[data-plan]").forEach(function (a) {
    a.addEventListener("click", function () {
      var sel = document.getElementById("f-plano");
      if (sel) sel.value = a.dataset.plan;
    });
  });

  /* ---------- coupon: compose the message, copy it, open the Instagram chat ---------- */
  var form = document.querySelector("[data-coupon]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var lines = ["Olá, Elite Drako Gym! Quero agendar: " + f.plano.value + "."];
      if (f.nome.value.trim()) lines.push("Meu nome: " + f.nome.value.trim() + ".");
      if (f.objetivo.value) lines.push("Objetivo: " + f.objetivo.value + ".");
      if (f.turno.value) lines.push("Melhor turno: " + f.turno.value + ".");
      var msg = lines.join(" ");
      var done = form.querySelector("[data-done]");
      var go = function () {
        window.open("https://ig.me/m/elite_drakogym", "_blank", "noopener");
        if (done) done.hidden = false;
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(msg).then(go, go);
      } else { go(); }
    });
  }

  /* ---------- vitrine: four products from the catalogue ---------- */
  var vit = document.querySelector("[data-vitrine]");
  if (vit && window.Drako && window.DRAKO_PRODUTOS) {
    vit.innerHTML = ["camiseta-drako", "plano-mensal", "avaliacao", "drako30-ingresso"].map(function (id) {
      return window.Drako.cartao(window.Drako.produto(id));
    }).join("");
  }

  /* ---------- entrances: heading, then text, then picture ---------- */
  var groups = document.querySelectorAll(".reveal");
  // stagger the hero arrival even before the observer exists
  document.querySelectorAll(".rise").forEach(function (el, i) { el.style.setProperty("--d", i * 70 + "ms"); });
  if (reduce || !("IntersectionObserver" in window)) {
    groups.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    // stagger siblings inside the same section
    document.querySelectorAll("section, footer").forEach(function (sec) {
      sec.querySelectorAll(".rise, .reveal").forEach(function (el, i) {
        el.style.setProperty("--d", Math.min(i, 8) * (el.classList.contains("rise") ? 70 : 80) + "ms");
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    groups.forEach(function (el) { io.observe(el); });
    // safety net: nothing stays hidden
    setTimeout(function () { groups.forEach(function (el) { el.classList.add("is-in"); }); }, 4000);
  }

  /* ---------- videos: pause off-screen and when the tab is hidden ---------- */
  var vids = document.querySelectorAll("video");
  if (reduce) {
    vids.forEach(function (v) { v.removeAttribute("autoplay"); v.pause(); });
  } else if ("IntersectionObserver" in window) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !document.hidden) { var p = en.target.play(); if (p && p.catch) p.catch(function () {}); }
        else en.target.pause();
      });
    }, { threshold: 0.15 });
    vids.forEach(function (v) { vo.observe(v); });
  }

  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();

/* copiar coordenadas GPS */
document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-copiar]"); if (!b) return;
  var txt = b.dataset.copiar, ok = function () { b.textContent = "Copiado"; setTimeout(function () { b.textContent = "Copiar"; }, 1800); };
  try { navigator.clipboard.writeText(txt).then(ok, function () { sel(); }); } catch (err) { sel(); }
  function sel() { var s = document.querySelector("[data-gps]"); if (s) { var r = document.createRange(); r.selectNodeContents(s); var w = getSelection(); w.removeAllRanges(); w.addRange(r); } }
});
