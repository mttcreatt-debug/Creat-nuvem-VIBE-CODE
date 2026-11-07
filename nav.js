/* Elite Drako Gym — navegação do topo (desktop + menu do celular). Vanilla, sem dependências. */
(function () {
  "use strict";
  var bar = document.querySelector("[data-nav]");
  if (!bar) return;
  var root = document.documentElement;
  var DESKTOP = window.matchMedia("(min-width: 1100px)");
  var HOVER = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ---------- página atual ---------- */
  var arquivo = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var naHome = arquivo === "index.html" || arquivo === "";
  bar.querySelectorAll("a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    // na própria home, "./#tour" vira "#tour" para rolar sem recarregar
    if (naHome && href.indexOf("./#") === 0) { a.setAttribute("href", href.slice(2)); return; }
    if (a.classList.contains("bar__mark") || a.classList.contains("btn")) return;
    var alvo = href.split("#")[0].split("?")[0];
    if (alvo === "./") alvo = "index.html";
    if (href.indexOf("#") === -1 && alvo && alvo.toLowerCase() === arquivo) a.setAttribute("aria-current", "page");
  });
  document.querySelectorAll(".foot a[href^='./#']").forEach(function (a) {
    if (naHome) a.setAttribute("href", a.getAttribute("href").slice(2));
  });
  var drop = bar.querySelector("[data-nav-drop]");
  var fecharDrop = function () {};
  if (drop && arquivo === "loja.html") drop.classList.add("is-current");

  /* ---------- dropdown da Loja ---------- */
  if (drop) {
    var dBtn = drop.querySelector(".nav__drop-btn");
    var dList = drop.querySelector(".nav__drop-list");
    var dLinks = function () { return Array.prototype.slice.call(dList.querySelectorAll("a")); };
    var tAbre = 0, tFecha = 0, abertoPorHover = 0;
    var dAberto = function () { return dBtn.getAttribute("aria-expanded") === "true"; };
    var abrirDrop = function (focar) {
      clearTimeout(tFecha);
      dList.hidden = false; dBtn.setAttribute("aria-expanded", "true"); drop.classList.add("is-open");
      if (focar === "primeiro") dLinks()[0].focus();
      if (focar === "ultimo") { var l = dLinks(); l[l.length - 1].focus(); }
    };
    fecharDrop = function (devolverFoco) {
      clearTimeout(tAbre); clearTimeout(tFecha);
      if (!dAberto()) return;
      dList.hidden = true; dBtn.setAttribute("aria-expanded", "false"); drop.classList.remove("is-open");
      if (devolverFoco) dBtn.focus();
    };
    dBtn.addEventListener("click", function () {
      // um clique logo depois do hover abrir não deve fechar
      if (dAberto() && Date.now() - abertoPorHover < 450) return;
      if (dAberto()) fecharDrop(false); else abrirDrop();
    });
    dBtn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); abrirDrop("primeiro"); }
      else if (e.key === "ArrowUp") { e.preventDefault(); abrirDrop("ultimo"); }
    });
    dList.addEventListener("keydown", function (e) {
      var l = dLinks(), i = l.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); l[(i + 1) % l.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); l[(i - 1 + l.length) % l.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); l[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); l[l.length - 1].focus(); }
    });
    drop.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && dAberto()) { e.stopPropagation(); fecharDrop(true); }
    });
    drop.addEventListener("focusout", function (e) {
      if (e.relatedTarget && !drop.contains(e.relatedTarget)) fecharDrop(false);
    });
    drop.addEventListener("mouseenter", function () {
      if (!HOVER.matches) return;
      clearTimeout(tFecha);
      if (dAberto()) return;
      tAbre = setTimeout(function () { abrirDrop(); abertoPorHover = Date.now(); }, 110);
    });
    drop.addEventListener("mouseleave", function () {
      if (!HOVER.matches) return;
      clearTimeout(tAbre);
      tFecha = setTimeout(function () { fecharDrop(false); }, 280);
    });
    dList.addEventListener("click", function (e) { if (e.target.closest("a")) fecharDrop(false); });
    document.addEventListener("pointerdown", function (e) { if (!drop.contains(e.target)) fecharDrop(false); });
  }

  /* ---------- menu de tela cheia (celular e tablet) ---------- */
  var sheet = bar.querySelector("[data-nav-sheet]");
  var burger = bar.querySelector("[data-nav-abrir]");
  var aberto = false;

  function focaveis() {
    return Array.prototype.slice.call(sheet.querySelectorAll("a[href], button:not([disabled])"))
      .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }
  // a lista do menu rola quando não cabe na tela: o pé esmaece enquanto ainda há itens abaixo
  var grupos = sheet && sheet.querySelector(".nav__groups");
  function marcarMais() {
    if (grupos) grupos.classList.toggle("tem-mais", grupos.scrollTop + grupos.clientHeight < grupos.scrollHeight - 4);
  }
  if (grupos) {
    grupos.addEventListener("scroll", marcarMais, { passive: true });
    window.addEventListener("resize", function () { if (aberto) marcarMais(); });
  }
  function abrir() {
    if (aberto || !sheet) return;
    aberto = true;
    fecharDrop(false);
    sheet.hidden = false;
    burger.setAttribute("aria-expanded", "true"); burger.setAttribute("aria-label", "Fechar menu");
    root.classList.add("nav-trava");
    requestAnimationFrame(function () { sheet.classList.add("is-open"); marcarMais(); });
    var primeiro = sheet.querySelector("[data-nav-fechar]");
    if (primeiro) primeiro.focus({ preventScroll: true });
  }
  function fechar(devolverFoco) {
    if (!aberto) return;
    aberto = false;
    sheet.classList.remove("is-open"); sheet.hidden = true;
    burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menu");
    root.classList.remove("nav-trava");
    if (devolverFoco !== false) burger.focus({ preventScroll: true });
  }
  if (sheet && burger) {
    burger.addEventListener("click", function () { if (aberto) fechar(); else abrir(); });
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("[data-nav-fechar]")) { fechar(); return; }
      // link: fecha antes da navegação (destrava a rolagem para o salto da âncora funcionar)
      if (e.target.closest("a[href]")) { fechar(false); return; }
      // carrinho: fecha o menu, o site.js abre a gaveta por cima
      if (e.target.closest("[data-abrir-carrinho]")) fechar(false);
    });
    document.addEventListener("keydown", function (e) {
      if (!aberto) return;
      if (e.key === "Escape") { e.preventDefault(); fechar(); return; }
      if (e.key !== "Tab") return;
      var f = focaveis(); if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
    });
    // nunca deixa o menu preso: ao virar desktop, ao voltar pelo histórico, ao trocar de página
    var aoMudar = function (q) { if (q.matches) fechar(false); };
    if (DESKTOP.addEventListener) DESKTOP.addEventListener("change", aoMudar); else DESKTOP.addListener(aoMudar);
    window.addEventListener("pageshow", function () { fechar(false); root.classList.remove("nav-trava"); });
    window.addEventListener("pagehide", function () { fechar(false); });
    window.addEventListener("hashchange", function () { fechar(false); });
  }

  /* ---------- loja.html#categoria: aplica o filtro mesmo sem recarregar ---------- */
  function filtroDaLoja() {
    if (arquivo !== "loja.html") return;
    var h = decodeURIComponent((location.hash || "").slice(1));
    if (!h || document.getElementById(h)) return; // se a seção existe, o navegador já rola até ela
    var b = document.querySelector('[data-cat="' + h.replace(/"/g, "") + '"]');
    if (b) {
      if (b.getAttribute("aria-pressed") !== "true") b.click();
      var alvo = document.getElementById("produtos");
      if (alvo) alvo.scrollIntoView();
    }
  }
  window.addEventListener("hashchange", filtroDaLoja);
})();
