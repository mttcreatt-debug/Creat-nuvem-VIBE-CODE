/* Elite Drako Gym — máquinas animadas, ficha de cada máquina e o comparador projeto × realidade. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MAQ = window.DRAKO_MAQUINAS || [];
  var GRUPOS = window.DRAKO_GRUPOS || [];
  function nomeGrupo(id) { var g = GRUPOS.filter(function (x) { return x.id === id; })[0]; return g ? g.nome : id; }

  function card(m, i) {
    return '<li class="mq" style="--i:' + i + '">' +
      '<button type="button" class="mq__btn" data-mq="' + m.id + '" aria-label="Ver ' + m.nome + '">' +
      '<span class="mq__stage"><span class="mq__glow" aria-hidden="true"></span>' +
      '<img class="mq__img" src="assets/img/maquinas/m' + m.id + '.webp" alt="" loading="lazy" width="800" height="800"></span>' +
      '<span class="mq__txt"><span class="mq__grupo">' + nomeGrupo(m.grupo) + '</span><span class="mq__nome">' + m.nome + '</span>' +
      '<span class="mq__musc">' + m.musculos + '</span></span></button></li>';
  }

  /* 3D tilt + spotlight that follows the pointer */
  function tilt(root) {
    if (reduce) return;
    root.addEventListener("pointermove", function (e) {
      var b = e.target.closest(".mq__btn"); if (!b) return;
      var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      b.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
      b.style.setProperty("--ry", (x * 14).toFixed(2) + "deg");
      b.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(1) + "%");
      b.style.setProperty("--my", ((y + 0.5) * 100).toFixed(1) + "%");
    });
    root.addEventListener("pointerout", function (e) {
      var b = e.target.closest(".mq__btn"); if (!b || b.contains(e.relatedTarget)) return;
      b.style.setProperty("--rx", "0deg"); b.style.setProperty("--ry", "0deg");
    });
  }

  /* entrance: each machine rises out of the dark as it enters */
  function entrar(root) {
    var items = root.querySelectorAll(".mq");
    if (reduce || !("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(function (el) { el.classList.add("is-in"); }); }, 5000);
  }

  /* ficha (dialog) */
  var dlg;
  function ficha(id) {
    var m = MAQ.filter(function (x) { return x.id === id; })[0]; if (!m) return;
    if (!dlg) {
      dlg = document.createElement("dialog"); dlg.className = "ficha-mq";
      document.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-fechar-mq]")) dlg.close(); });
    }
    var i = MAQ.indexOf(m), prev = MAQ[(i + MAQ.length - 1) % MAQ.length], next = MAQ[(i + 1) % MAQ.length];
    dlg.innerHTML =
      '<div class="ficha-mq__in">' +
      '<figure class="ficha-mq__cut"><img src="assets/img/maquinas/m' + m.id + '.webp" alt="' + m.nome + ', recortada" width="800" height="800"></figure>' +
      '<div class="ficha-mq__txt"><p class="ficha-mq__grupo">' + nomeGrupo(m.grupo) + '</p><h2>' + m.nome + '</h2>' +
      '<p class="ficha-mq__musc">' + m.musculos + '</p><p>' + m.texto + '</p>' +
      '<figure class="ficha-mq__foto"><img src="assets/img/maquinas/f' + m.id + '.jpg" alt="' + m.nome + ' no salão da Elite Drako" loading="lazy"><figcaption>No salão, em outubro' + (m.marca ? ' · marca ' + m.marca : '') + '</figcaption></figure>' +
      '<div class="ficha-mq__nav"><button type="button" class="btn btn--ghost btn--sm" data-mq="' + prev.id + '">‹ ' + prev.nome + '</button>' +
      '<button type="button" class="btn btn--ghost btn--sm" data-mq="' + next.id + '">' + next.nome + ' ›</button></div>' +
      '<a class="btn" href="cadastro.html?tipo=visita">Quero treinar nela</a></div>' +
      '<button type="button" class="ficha-mq__x" data-fechar-mq aria-label="Fechar">Fechar</button></div>';
    if (!dlg.open) dlg.showModal();
    dlg.querySelector(".ficha-mq__x").focus();
  }
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-mq]"); if (b) ficha(b.dataset.mq); });

  /* home: highlighted machines */
  var dest = document.querySelector("[data-maq-destaque]");
  if (dest) {
    dest.innerHTML = MAQ.filter(function (m) { return m.destaque; }).slice(0, 6).map(card).join("");
    tilt(dest); entrar(dest);
  }

  /* maquinas.html: full catalogue with filters */
  var cat = document.querySelector("[data-maq-catalogo]");
  var fil = document.querySelector("[data-maq-filtros]");
  if (cat && fil) {
    var atual = (location.hash || "").replace("#", "");
    if (!GRUPOS.some(function (g) { return g.id === atual; })) atual = "todos";
    fil.innerHTML = GRUPOS.map(function (g) {
      var n = g.id === "todos" ? MAQ.length : MAQ.filter(function (m) { return m.grupo === g.id; }).length;
      return n ? '<button type="button" data-grupo="' + g.id + '" aria-pressed="' + (g.id === atual) + '">' + g.nome + " <span>" + n + "</span></button>" : "";
    }).join("");
    var render = function () {
      cat.innerHTML = MAQ.filter(function (m) { return atual === "todos" || m.grupo === atual; }).map(card).join("");
      fil.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.grupo === atual)); });
      entrar(cat);
    };
    fil.addEventListener("click", function (e) {
      var b = e.target.closest("[data-grupo]"); if (!b) return;
      atual = b.dataset.grupo; render();
      history.replaceState(null, "", atual === "todos" ? location.pathname : "#" + atual);
    });
    tilt(cat); render();
  }

  /* filme do arsenal: plays muted when visible, sound on demand */
  document.querySelectorAll("[data-filme]").forEach(function (fig) {
    var v = fig.querySelector("[data-filme-video]"), b = fig.querySelector("[data-filme-som]");
    b.addEventListener("click", function () {
      v.muted = !v.muted;
      if (!v.muted) { v.volume = 0.8; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      b.textContent = v.muted ? "Ativar som" : "Desligar som";
      b.setAttribute("aria-pressed", String(!v.muted));
    });
    if (reduce) { v.controls = true; return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else { v.pause(); }
        });
      }, { threshold: 0.35 }).observe(fig);
    }
  });

  /* projeto × realidade */
  document.querySelectorAll("[data-compara]").forEach(function (fig) {
    var r = fig.querySelector("[data-compara-range]");
    var set = function (v) { fig.style.setProperty("--pos", v + "%"); };
    r.addEventListener("input", function () { set(r.value); });
    set(r.value);
    if (!reduce && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; io.disconnect();
        var t0 = null;
        var anim = function (t) {
          if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1600);
          var v = 50 + Math.sin(k * Math.PI * 2) * 30 * (1 - k);
          r.value = v; set(v); if (k < 1) requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
      }, { threshold: 0.6 });
      io.observe(fig);
    }
  });
})();
