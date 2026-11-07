/* Elite Drako Gym: página de Eventos.
   Lê data/eventos-media.json (fotos, vídeos, datas, resumo) e junta com data/eventos.js
   (horários, programa, prêmios, botões) pelo "id" de cada evento. Sem build. */
(function () {
  "use strict";
  var COPY = window.DRAKO_EVENTOS || { eventos: {} };
  var IG = COPY.instagram || "https://www.instagram.com/elite_drakogym/";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lista = document.querySelector("[data-ev-lista]");
  var agenda = document.querySelector("[data-ev-agenda]");
  if (!lista || !agenda) return;

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  // "2026-10-24" -> {longa: "Sábado, 24 de outubro de 2026", curta: "24 out"}; "2026-11" -> mês só
  function data(str) {
    var p = String(str || "").split("-").map(Number);
    if (!p[0] || !p[1]) return { longa: "Data a confirmar", curta: "A confirmar", iso: "" };
    var mes = MESES[p[1] - 1];
    if (!p[2]) {
      var M = mes.charAt(0).toUpperCase() + mes.slice(1);
      return { longa: M + " de " + p[0], curta: M, iso: str };
    }
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return { longa: DIAS[d.getUTCDay()] + ", " + p[2] + " de " + mes + " de " + p[0], curta: p[2] + " " + mes.slice(0, 3), iso: str };
  }
  function hoje() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function futuro(ev) {
    if (ev.status === "em-breve") return true;
    if (ev.status === "realizado") return false;
    return String(ev.data || "") >= hoje().slice(0, String(ev.data || "").length || 10);
  }
  function externo(href) { return /^https?:/.test(href); }

  function heroFonte() {
    var src = document.querySelector("[data-ev-hero-video] source:not([media])");
    return src ? src.getAttribute("src") : "";
  }

  /* ---------- merge the two data files ---------- */
  function juntar(media) {
    var base = (media && media.eventos) || [];
    var extras = COPY.eventos || {};
    var vistos = {};
    var out = base.map(function (ev) {
      vistos[ev.id] = true;
      return Object.assign({}, ev, extras[ev.id] || {});
    });
    Object.keys(extras).forEach(function (id) {
      if (!vistos[id] && extras[id].titulo) out.push(Object.assign({ id: id, fotos: [], videos: [] }, extras[id]));
    });
    return out;
  }

  /* ---------- markup ---------- */
  function lista_(titulo, itens, cls) {
    if (!itens || !itens.length) return "";
    return '<div class="ev-fato ' + (cls || "") + '"><h3>' + esc(titulo) + '</h3><ul role="list">' +
      itens.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>";
  }
  function botoes(cta) {
    if (!cta || !cta.length) return "";
    return '<div class="ev-cap__acoes">' + cta.map(function (b, i) {
      var ext = externo(b.href) ? ' target="_blank" rel="noopener"' : "";
      return '<a class="btn' + (i ? " btn--ghost" : "") + '" href="' + esc(b.href) + '"' + ext + ">" + esc(b.texto) + "</a>";
    }).join("") + "</div>";
  }
  function video(v, i) {
    var w = v.w || 16, h = v.h || 9;
    var som = v.som === true;
    return '<figure class="ev-video' + (h > w ? " ev-video--alto" : "") + '" style="--ar:' + w + "/" + h + '">' +
      '<video muted loop playsinline preload="metadata"' + (v.poster ? ' poster="' + esc(v.poster) + '"' : "") +
      ' aria-label="' + esc(v.alt) + '" width="' + w + '" height="' + h + '" data-ev-video>' +
      '<source src="' + esc(v.src) + '" type="video/mp4"></video>' +
      '<div class="ev-video__ctl">' +
      '<button class="ev-play" type="button" aria-pressed="false" data-ev-pausa>Pausar vídeo</button>' +
      (som ? '<button class="ev-play" type="button" aria-pressed="false" data-ev-som>Ligar som</button>' : "") +
      "</div></figure>";
  }
  function galeria(ev) {
    var fotos = ev.fotos || [];
    if (!fotos.length) return "";
    return '<ul class="ev-gal" role="list" aria-label="Fotos do ' + esc(ev.titulo) + '">' + fotos.map(function (f, i) {
      var r = (f.w && f.h) ? f.w / f.h : 1.33;
      return '<li class="ev-gal__item" style="--r:' + r.toFixed(3) + '">' +
        '<button type="button" class="ev-gal__btn" data-lb-open="' + esc(ev.id) + '" data-lb-i="' + i + '" aria-label="Ampliar foto ' + (i + 1) + " de " + fotos.length + ": " + esc(f.alt) + '">' +
        '<img src="' + esc(f.src) + '" alt="" width="' + (f.w || "") + '" height="' + (f.h || "") + '" loading="lazy" decoding="async"></button></li>';
    }).join("") + "</ul>";
  }
  function arte(ev) {
    var a = ev.arte;
    if (!a) return "";
    return '<figure class="ev-arte"><button type="button" class="ev-gal__btn" data-lb-open="' + esc(ev.id) + '-arte" data-lb-i="0" aria-label="Ampliar a arte de divulgação: ' + esc(a.alt) + '">' +
      '<img src="' + esc(a.src) + '" alt="" width="' + a.w + '" height="' + a.h + '" loading="lazy" decoding="async"></button>' +
      "<figcaption>Arte de divulgação do evento</figcaption></figure>";
  }

  function capitulo(ev) {
    var d = data(ev.data);
    var vem = futuro(ev);
    var temMidia = (ev.fotos && ev.fotos.length) || (ev.videos && ev.videos.length);
    var meta = '<p class="ev-cap__quando"><time' + (d.iso ? ' datetime="' + esc(d.iso) + '"' : "") + ">" + esc(d.longa) + "</time>" +
      (ev.tema ? '<span class="ev-tag">' + esc(ev.tema) + "</span>" : "") +
      '<span class="ev-tag ' + (vem ? "ev-tag--breve" : "ev-tag--feito") + '">' + (vem ? "Em breve" : "Realizado") + "</span></p>";

    var fatos = lista_("Horário", ev.horarios) + lista_("Programação", ev.programa, "ev-fato--wide") + lista_("Sorteio", ev.premios, "ev-fato--wide");
    var txt = '<div class="ev-cap__txt ev-up">' +
      "<h2 id=\"t-" + esc(ev.id) + '">' + esc(ev.titulo) + "</h2>" + meta +
      (ev.resumo ? '<p class="ev-cap__lead">' + esc(ev.resumo) + "</p>" : "") +
      (ev.publico ? '<p class="ev-cap__pub">' + esc(ev.publico) + "</p>" : "") +
      (ev.convite ? '<p class="ev-cap__pub">' + esc(ev.convite) + "</p>" : "") +
      (fatos ? '<div class="ev-fatos">' + fatos + "</div>" : "") +
      (!vem && !temMidia ? '<p class="ev-cap__nota">As fotos e os vídeos do dia ainda vão entrar nesta página. Enquanto isso, veja no <a href="' + esc(IG) + '" target="_blank" rel="noopener">Instagram @elite_drakogym</a>.</p>' : "") +
      botoes(ev.cta) + "</div>";

    var vids = (ev.videos || []).slice();
    var heroSrc = heroFonte();
    var lado = "", resto = vids;
    if (ev.arte) lado = arte(ev);
    else if (vids.length) {
      // beside the text: a clip not already playing in the hero, vertical first
      var cands = vids.filter(function (v) { return v.src !== heroSrc; });
      if (!cands.length) cands = vids;
      var pick = cands.filter(function (v) { return (v.h || 0) > (v.w || 0); })[0] || cands[0];
      lado = video(pick);
      resto = vids.filter(function (v) { return v !== pick && v.src !== heroSrc; });
    }
    var cls = "ev-cap" + (vem ? " ev-cap--breve" : "") + (lado ? "" : " ev-cap--solo");
    return '<section class="' + cls + '" id="' + esc(ev.id) + '" aria-labelledby="t-' + esc(ev.id) + '">' +
      '<div class="ev-cap__head">' + txt + (lado ? '<div class="ev-cap__lado ev-up">' + lado + "</div>" : "") + "</div>" +
      (ev.fotos && ev.fotos.length ? '<div class="ev-cap__fotos ev-up"><h3 class="ev-cap__sub">Fotos do dia</h3>' + galeria(ev) + "</div>" : "") +
      (resto.length ? '<div class="ev-cap__videos ev-up">' + resto.map(video).join("") + "</div>" : "") +
      "</section>";
  }

  function agendaHtml(evs) {
    var prox = evs.filter(futuro), feitos = evs.filter(function (e) { return !futuro(e); });
    prox.sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); });
    feitos.sort(function (a, b) { return String(b.data).localeCompare(String(a.data)); });
    function col(titulo, arr, vazio) {
      return '<div class="agenda__col"><h3>' + titulo + "</h3>" + (arr.length ? '<ol class="agenda__lista" role="list">' + arr.map(function (e) {
        var d = data(e.data);
        return '<li><a class="agenda__item' + (futuro(e) ? " agenda__item--breve" : "") + '" href="#' + esc(e.id) + '">' +
          '<span class="agenda__data">' + esc(d.curta) + "</span>" +
          '<span class="agenda__nome">' + esc(e.titulo) + "</span>" +
          (e.tema ? '<span class="agenda__tema">' + esc(e.tema) + "</span>" : "") + "</a></li>";
      }).join("") + "</ol>" : '<p class="ev-vazio">' + vazio + "</p>") + "</div>";
    }
    return col("Próximos", prox, "Nenhum evento marcado agora. Acompanhe pelo Instagram.") + col("Realizados", feitos, "Ainda não há eventos realizados.");
  }

  /* ---------- render ---------- */
  var grupos = {}; // id -> [{src, alt, w, h}]
  function render(media) {
    var evs = juntar(media);
    // chapter order: realizados (mais recente primeiro), depois os próximos
    var feitos = evs.filter(function (e) { return !futuro(e); }).sort(function (a, b) { return String(b.data).localeCompare(String(a.data)); });
    var prox = evs.filter(futuro).sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); });
    var ordem = feitos.concat(prox);
    evs.forEach(function (e) {
      grupos[e.id] = e.fotos || [];
      if (e.arte) grupos[e.id + "-arte"] = [e.arte];
    });
    agenda.innerHTML = agendaHtml(evs);
    lista.innerHTML = ordem.map(capitulo).join("") || '<p class="ev-vazio">Nenhum evento publicado ainda.</p>';
    ligarVideos(lista.querySelectorAll("[data-ev-video]"));
    entradas();
    if (location.hash) {
      var alvo = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (alvo) alvo.scrollIntoView();
    }
  }

  function falhou() {
    agenda.innerHTML = '<p class="ev-vazio">Não foi possível carregar a agenda agora. Veja os eventos no <a href="' + esc(IG) + '" target="_blank" rel="noopener">Instagram @elite_drakogym</a>.</p>';
    render({ eventos: [] });
  }

  fetch("data/eventos-media.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(function () {
      if (Object.keys(COPY.eventos || {}).length) {
        var temTitulo = Object.keys(COPY.eventos).some(function (k) { return COPY.eventos[k].titulo; });
        if (temTitulo) return render({ eventos: [] });
      }
      falhou();
    });

  /* ---------- entrances ---------- */
  function entradas() {
    var els = document.querySelectorAll(".ev-up, .ev-fato, .ev-gal__item, .ev-video");
    els.forEach(function (el) {
      var irmaos = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.classList.add("ev-up");
      el.style.setProperty("--d", Math.min(irmaos, 7) * 70 + "ms");
    });
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-in"); }); return; }
    document.documentElement.classList.add("ev-anim");
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () { els.forEach(function (el) { el.classList.add("is-in"); }); }, 3500);
  }

  /* ---------- videos: autoplay muted while visible, pause button, optional sound ---------- */
  var parados = new WeakSet(); // paused by the visitor: don't auto-resume
  var vo = "IntersectionObserver" in window ? new IntersectionObserver(function (en) {
    en.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting && !document.hidden && !parados.has(v) && !reduce) tocar(v);
      else if (!e.isIntersecting) v.pause();
    });
  }, { threshold: 0.2 }) : null;
  function tocar(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function rotulo(v, btn) {
    var pausado = v.paused;
    btn.textContent = pausado ? "Tocar vídeo" : "Pausar vídeo";
    btn.setAttribute("aria-pressed", pausado ? "true" : "false");
  }
  function ligarVideos(vs) {
    vs.forEach(function (v) {
      var fig = v.closest("figure, .ev-hero__media");
      var b = fig && fig.querySelector("[data-ev-pausa], [data-ev-hero-toggle]");
      var s = fig && fig.querySelector("[data-ev-som]");
      if (b) {
        b.hidden = false;
        v.addEventListener("play", function () { rotulo(v, b); });
        v.addEventListener("pause", function () { rotulo(v, b); });
        b.addEventListener("click", function () {
          if (v.paused) { parados.delete(v); tocar(v); } else { parados.add(v); v.pause(); }
        });
        rotulo(v, b);
      }
      if (s) s.addEventListener("click", function () {
        v.muted = !v.muted;
        s.textContent = v.muted ? "Ligar som" : "Desligar som";
        s.setAttribute("aria-pressed", v.muted ? "false" : "true");
        if (!v.muted && v.paused) { parados.delete(v); tocar(v); }
      });
      if (reduce) { v.removeAttribute("autoplay"); v.pause(); }
      else if (vo) vo.observe(v);
      else tocar(v);
    });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) document.querySelectorAll("video").forEach(function (v) { v.pause(); });
  });
  var heroV = document.querySelector("[data-ev-hero-video]");
  if (heroV) ligarVideos([heroV]);

  /* ---------- lightbox: native <dialog>, arrows, Esc, swipe ---------- */
  var lb = document.querySelector("[data-lb]");
  if (!lb || typeof lb.showModal !== "function") {
    // very old browsers: open the image itself
    lista.addEventListener("click", function (e) {
      var b = e.target.closest("[data-lb-open]"); if (!b) return;
      var f = (grupos[b.getAttribute("data-lb-open")] || [])[+b.getAttribute("data-lb-i")];
      if (f) location.href = f.src;
    });
    return;
  }
  var img = lb.querySelector("[data-lb-img]"), cap = lb.querySelector("[data-lb-cap]"), cnt = lb.querySelector("[data-lb-count]");
  var prev = lb.querySelector("[data-lb-prev]"), next = lb.querySelector("[data-lb-next]");
  var atual = [], idx = 0, gatilho = null;

  function mostrar(i) {
    if (!atual.length) return;
    idx = (i + atual.length) % atual.length;
    var f = atual[idx];
    img.src = f.src; img.alt = f.alt || "";
    if (f.w && f.h) { img.width = f.w; img.height = f.h; }
    cap.textContent = f.alt || "";
    cnt.textContent = atual.length > 1 ? "Foto " + (idx + 1) + " de " + atual.length : "";
    var um = atual.length < 2;
    prev.hidden = um; next.hidden = um;
    [idx - 1, idx + 1].forEach(function (j) { var n = atual[(j + atual.length) % atual.length]; if (n) { var p = new Image(); p.src = n.src; } });
  }
  function abrir(grupo, i, btn) {
    atual = grupos[grupo] || []; if (!atual.length) return;
    gatilho = btn;
    mostrar(i);
    document.documentElement.classList.add("lb-aberto");
    lb.showModal();
    lb.querySelector("[data-lb-close]").focus();
  }
  function fechar() { if (lb.open) lb.close(); }
  lb.addEventListener("close", function () {
    document.documentElement.classList.remove("lb-aberto");
    img.removeAttribute("src");
    if (gatilho && document.contains(gatilho)) gatilho.focus();
    gatilho = null;
  });
  lista.addEventListener("click", function (e) {
    var b = e.target.closest("[data-lb-open]"); if (!b) return;
    abrir(b.getAttribute("data-lb-open"), +b.getAttribute("data-lb-i") || 0, b);
  });
  lb.querySelector("[data-lb-close]").addEventListener("click", fechar);
  prev.addEventListener("click", function () { mostrar(idx - 1); });
  next.addEventListener("click", function () { mostrar(idx + 1); });
  lb.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); mostrar(idx - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); mostrar(idx + 1); }
    else if (e.key === "Escape") { e.preventDefault(); fechar(); }
  });
  // click on the dark area (not the photo, not a button) closes
  lb.addEventListener("click", function (e) {
    if (e.target === lb || e.target.hasAttribute("data-lb-stage") || e.target.classList.contains("lb__top")) fechar();
  });
  // swipe
  var x0 = null, y0 = 0, t0 = 0;
  var stage = lb.querySelector("[data-lb-stage]");
  stage.addEventListener("pointerdown", function (e) { x0 = e.clientX; y0 = e.clientY; t0 = Date.now(); });
  stage.addEventListener("pointerup", function (e) {
    if (x0 === null) return;
    var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - t0 < 900) {
      mostrar(idx + (dx < 0 ? 1 : -1));
      stage.dataset.swiped = "1"; setTimeout(function () { delete stage.dataset.swiped; }, 50);
    }
  });
  stage.addEventListener("pointercancel", function () { x0 = null; });
  // a swipe ends with a click on the stage: don't treat it as "close"
  stage.addEventListener("click", function (e) { if (stage.dataset.swiped) e.stopPropagation(); }, true);
})();
