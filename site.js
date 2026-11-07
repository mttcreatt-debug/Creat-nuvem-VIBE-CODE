/* Elite Drako Gym — código compartilhado entre as páginas:
   carrinho, envio de pedidos/cadastros (Supabase + WhatsApp/Instagram), a gaveta do carrinho
   e o "Avise-me quando chegar" dos produtos que ainda não chegaram. */
(function () {
  "use strict";
  var CFG = window.DRAKO_CONFIG || {};
  var KEY = "drako-carrinho-v1";
  var KEY_CONTATO = "drako-contato-v1";

  /* estilos da gaveta e do aviso: valem para todas as páginas que carregam este arquivo */
  (function () {
    if (document.querySelector('link[href$="css/carrinho.css"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = "css/carrinho.css";
    document.head.appendChild(l);
  })();

  function brl(v) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- canal de contato ---------- */
  function abrirConversa(texto) {
    var url;
    if (CFG.whatsapp) {
      url = "https://wa.me/" + CFG.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent(texto);
    } else {
      url = "https://ig.me/m/" + (CFG.instagram || "elite_drakogym");
      try {
        var pr = navigator.clipboard && navigator.clipboard.writeText(texto);
        if (pr && pr.catch) pr.catch(function () {});
      } catch (e) {}
    }
    window.open(url, "_blank", "noopener");
    return !CFG.whatsapp; // true = mensagem foi copiada (Instagram)
  }

  /* ---------- Supabase (opcional) ---------- */
  var sb = null;
  function supa() {
    if (sb) return sb;
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) return null;
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
    return sb;
  }
  function salvar(tabela, linha) {
    var c = supa();
    if (!c) return Promise.resolve({ salvo: false, motivo: "sem-supabase" });
    return c.from(tabela).insert(linha).then(function (r) {
      if (!r.error) return { salvo: true };
      // Banco com schema antigo, que ainda não aceita os tipos novos ("novembro-azul", "interesse"):
      // grava como "visita" e anota o tipo real nas observações, para nenhum cadastro se perder.
      var antigo = tabela === "cadastros" && linha.tipo && ["matricula", "visita", "drako30"].indexOf(linha.tipo) < 0 &&
        (r.error.code === "23514" || /check/i.test(r.error.message || ""));
      if (!antigo) return { salvo: false, motivo: r.error.message };
      var copia = {};
      for (var k in linha) copia[k] = linha[k];
      copia.tipo = "visita";
      copia.observacoes = ("[" + linha.tipo + "] " + (linha.observacoes || "")).trim().slice(0, 1000);
      return c.from(tabela).insert(copia).then(function (r2) {
        return r2.error ? { salvo: false, motivo: r2.error.message } : { salvo: true };
      });
    }, function (e) { return { salvo: false, motivo: String(e) }; });
  }

  /* nome e WhatsApp digitados uma vez ficam salvos neste aparelho para os próximos formulários */
  function contato() { try { return JSON.parse(localStorage.getItem(KEY_CONTATO)) || {}; } catch (e) { return {}; } }
  function lembrarContato(nome, tel) { try { localStorage.setItem(KEY_CONTATO, JSON.stringify({ nome: nome, telefone: tel })); } catch (e) {} }

  /* ---------- catálogo ---------- */
  function produto(id) { return (window.DRAKO_PRODUTOS || []).filter(function (p) { return p.id === id; })[0]; }
  // só entra no carrinho o que já está à venda e tem preço
  function vendavel(p) { return !!p && p.status !== "em-breve" && typeof p.preco === "number"; }

  /* ---------- carrinho ---------- */
  function ler() {
    var itens;
    try { itens = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { itens = []; }
    if (!Array.isArray(itens)) return [];
    // descarta itens que saíram do catálogo ou deixaram de estar à venda
    return itens.filter(function (i) { return i && i.k && i.q > 0 && vendavel(produto(i.id)); });
  }
  function gravar(itens) { try { localStorage.setItem(KEY, JSON.stringify(itens)); } catch (e) {} atualizar(); }
  function chave(id, tam) { return id + (tam ? "|" + tam : ""); }
  var MAX_QTD = 20;

  var carrinho = {
    itens: ler,
    adicionar: function (id, tam, qtd) {
      if (!vendavel(produto(id))) return false;
      var itens = ler(), k = chave(id, tam), achou = false;
      itens.forEach(function (i) { if (i.k === k) { i.q = Math.min(MAX_QTD, i.q + (qtd || 1)); achou = true; } });
      if (!achou) itens.push({ k: k, id: id, t: tam || "", q: qtd || 1 });
      enviado = "";
      gravar(itens); abrirGaveta();
      return true;
    },
    mudar: function (k, delta) {
      var itens = ler().map(function (i) { if (i.k === k) i.q = Math.min(MAX_QTD, i.q + delta); return i; })
        .filter(function (i) { return i.q > 0; });
      gravar(itens);
    },
    remover: function (k) { gravar(ler().filter(function (i) { return i.k !== k; })); },
    limpar: function () { gravar([]); },
    total: function () {
      return ler().reduce(function (s, i) { return s + produto(i.id).preco * i.q; }, 0);
    },
    quantidade: function () { return ler().reduce(function (s, i) { return s + i.q; }, 0); }
  };

  /* ---------- camada (gaveta e aviso): Esc, clique fora, foco preso e rolagem destravada ---------- */
  function focaveis(el) {
    return Array.prototype.slice.call(el.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(function (x) { return !x.closest("[hidden]") && x.offsetParent !== null; });
  }
  function prenderFoco(e, painel) {
    if (e.key !== "Tab") return;
    var f = focaveis(painel); if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
  }
  var camadasAbertas = 0;
  function travar(on) {
    camadasAbertas = Math.max(0, camadasAbertas + (on ? 1 : -1));
    document.documentElement.classList.toggle("trava", camadasAbertas > 0);
  }

  /* ---------- gaveta ---------- */
  var gaveta, painel, lista, totalEl, form, aviso, vazioEl, enviadoEl, contaEl, itensEl, notaEl;
  var enviado = ""; // mensagem do último pedido enviado (mostrada no lugar do carrinho vazio)
  var ICON_SACOLA = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path d="M5 8h14l-1.2 12H6.2L5 8zm4 0V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  function montarGaveta() {
    if (document.getElementById("gaveta")) return;
    var naLoja = /loja\.html$/i.test(location.pathname);
    var d = document.createElement("div");
    d.innerHTML =
      '<aside class="gaveta" id="gaveta" aria-label="Carrinho" aria-hidden="true">' +
      '  <div class="gaveta__fundo" data-fechar></div>' +
      '  <div class="gaveta__painel" role="dialog" aria-modal="true" aria-labelledby="gaveta-titulo" tabindex="-1">' +
      '    <div class="gaveta__topo"><h2 id="gaveta-titulo">Seu pedido <span class="gaveta__conta" data-conta></span></h2>' +
      '      <button class="gaveta__x" type="button" data-fechar aria-label="Fechar carrinho">Fechar</button></div>' +
      '    <ul class="gaveta__lista" data-lista role="list"></ul>' +
      '    <div class="gaveta__vazio" data-vazio>' +
      '      <span class="gaveta__vazio-ico">' + ICON_SACOLA + '</span>' +
      '      <p class="gaveta__vazio-t">Seu carrinho está vazio</p>' +
      '      <p>Escolha a camiseta, um plano ou o ingresso do Drako 30. O pedido vai pronto para a conversa com a academia.</p>' +
      '      <div class="gaveta__vazio-links">' +
      '        <a class="btn btn--sm" href="loja.html#produtos"' + (naLoja ? " data-fechar" : "") + '>Ver a loja</a>' +
      '        <a class="btn btn--sm btn--ghost" href="loja.html#planos"' + (naLoja ? " data-fechar" : "") + '>Planos</a>' +
      '      </div>' +
      '    </div>' +
      '    <div class="gaveta__enviado" data-enviado hidden>' +
      '      <p class="gaveta__vazio-t">Pedido enviado</p>' +
      '      <p data-enviado-txt></p>' +
      '      <button class="btn btn--sm btn--ghost" type="button" data-fechar>Continuar na loja</button>' +
      '    </div>' +
      '    <form class="gaveta__form" data-checkout novalidate>' +
      '      <div class="gaveta__resumo">' +
      '        <p class="gaveta__linha"><span>Itens</span><span data-itens>0</span></p>' +
      '        <p class="gaveta__total"><span>Total</span><strong data-total>R$ 0,00</strong></p>' +
      '        <p class="gaveta__nota" data-nota hidden>Alguns valores ainda podem ser ajustados pela academia na conversa.</p>' +
      '      </div>' +
      '      <label class="sr" for="g-nome">Seu nome</label><input id="g-nome" name="nome" placeholder="Seu nome" autocomplete="name" required minlength="2" maxlength="120">' +
      '      <label class="sr" for="g-fone">Seu WhatsApp</label><input id="g-fone" name="telefone" type="tel" placeholder="Seu WhatsApp com DDD" autocomplete="tel" inputmode="tel" required minlength="8" maxlength="30">' +
      '      <label class="sr" for="g-retirada">Como receber</label><select id="g-retirada" name="entrega"><option>Retirar na academia</option><option>Combinar entrega em Valente</option></select>' +
      '      <button class="btn btn--full" type="submit">Enviar pedido</button>' +
      '      <p class="gaveta__aviso" data-aviso aria-live="polite">O pagamento (Pix ou cartão) é combinado com a academia na conversa.</p>' +
      '    </form>' +
      '  </div>' +
      '</aside>';
    document.body.appendChild(d.firstChild);
    gaveta = document.getElementById("gaveta");
    painel = gaveta.querySelector(".gaveta__painel");
    lista = gaveta.querySelector("[data-lista]");
    totalEl = gaveta.querySelector("[data-total]");
    form = gaveta.querySelector("[data-checkout]");
    aviso = gaveta.querySelector("[data-aviso]");
    vazioEl = gaveta.querySelector("[data-vazio]");
    enviadoEl = gaveta.querySelector("[data-enviado]");
    contaEl = gaveta.querySelector("[data-conta]");
    itensEl = gaveta.querySelector("[data-itens]");
    notaEl = gaveta.querySelector("[data-nota]");
    var c = contato();
    if (c.nome) form.elements.nome.value = c.nome;
    if (c.telefone) form.elements.telefone.value = c.telefone;
    gaveta.addEventListener("click", function (e) {
      if (e.target.closest("[data-fechar]")) { fecharGaveta(); return; }
      var b = e.target.closest("[data-mudar]");
      if (b) { carrinho.mudar(b.dataset.k, Number(b.dataset.mudar)); focarDepois(b); return; }
      var r = e.target.closest("[data-remover]");
      if (r) { carrinho.remover(r.dataset.remover); focarDepois(null); }
    });
    gaveta.addEventListener("keydown", function (e) {
      if (!gaveta.classList.contains("is-open")) return;
      if (e.key === "Escape") { e.preventDefault(); fecharGaveta(); return; }
      prenderFoco(e, painel);
    });
    form.addEventListener("submit", enviarPedido);
  }
  // depois de redesenhar a lista, devolve o foco ao mesmo botão (ou ao painel, se o item saiu)
  function focarDepois(b) {
    var alvo = b && lista.querySelector('[data-k="' + b.dataset.k + '"][data-mudar="' + b.dataset.mudar + '"]');
    (alvo || painel).focus({ preventScroll: true });
  }
  var ultimoFoco = null;
  function abrirGaveta() {
    montarGaveta(); atualizar();
    if (gaveta.classList.contains("is-open")) return;
    ultimoFoco = document.activeElement;
    gaveta.classList.add("is-open"); gaveta.setAttribute("aria-hidden", "false");
    travar(true);
    setTimeout(function () { painel.focus({ preventScroll: true }); }, 30);
  }
  function fecharGaveta() {
    if (!gaveta || !gaveta.classList.contains("is-open")) return;
    gaveta.classList.remove("is-open"); gaveta.setAttribute("aria-hidden", "true");
    travar(false);
    if (ultimoFoco && ultimoFoco.focus && document.contains(ultimoFoco)) ultimoFoco.focus({ preventScroll: true });
  }
  function atualizar() {
    var q = carrinho.quantidade();
    document.querySelectorAll("[data-contador]").forEach(function (el) { el.textContent = q; el.hidden = q === 0; });
    if (!gaveta) return;
    var itens = ler(), aConfirmar = false;
    lista.innerHTML = itens.map(function (i) {
      var p = produto(i.id);
      if (p.confirmar) aConfirmar = true;
      var nome = esc(p.nome) + (i.t ? " · " + esc(i.t) : "");
      return '<li class="gitem">' +
        '<img src="' + esc(p.foto) + '" alt="" width="64" height="64">' +
        '<div class="gitem__info"><p class="gitem__nome">' + nome + '</p>' +
        '<p class="gitem__unit">' + brl(p.preco) + " " + esc(p.unidade || "") + '</p></div>' +
        '<p class="gitem__preco">' + brl(p.preco * i.q) + '</p>' +
        '<div class="gitem__acoes">' +
        '<div class="gitem__q" role="group" aria-label="Quantidade de ' + esc(p.nome) + '">' +
        '<button type="button" data-k="' + esc(i.k) + '" data-mudar="-1" aria-label="' + (i.q > 1 ? "Diminuir " : "Tirar ") + esc(p.nome) + '">−</button>' +
        '<span aria-live="polite">' + i.q + '</span>' +
        '<button type="button" data-k="' + esc(i.k) + '" data-mudar="1" aria-label="Aumentar ' + esc(p.nome) + '"' + (i.q >= MAX_QTD ? " disabled" : "") + '>+</button></div>' +
        '<button class="gitem__rm" type="button" data-remover="' + esc(i.k) + '">Remover<span class="sr"> ' + nome + '</span></button>' +
        '</div></li>';
    }).join("");
    totalEl.textContent = brl(carrinho.total());
    itensEl.textContent = q === 1 ? "1 item" : q + " itens";
    contaEl.textContent = q ? "(" + q + ")" : "";
    notaEl.hidden = !aConfirmar;
    var temItens = itens.length > 0;
    lista.hidden = !temItens;
    form.hidden = !temItens;
    enviadoEl.hidden = temItens || !enviado;
    vazioEl.hidden = temItens || !!enviado;
    if (enviado) enviadoEl.querySelector("[data-enviado-txt]").textContent = enviado;
  }

  function enviarPedido(e) {
    e.preventDefault();
    var f = form.elements, itens = ler();
    if (!itens.length) return;
    var nome = f.nome.value.trim(), tel = f.telefone.value.trim();
    if (nome.length < 2) { aviso.textContent = "Escreva seu nome para a academia saber de quem é o pedido."; f.nome.focus(); return; }
    if (tel.replace(/\D/g, "").length < 8) { aviso.textContent = "Coloque um WhatsApp com DDD para a academia responder."; f.telefone.focus(); return; }
    lembrarContato(nome, tel);
    var linhas = itens.map(function (i) {
      var p = produto(i.id);
      return "• " + i.q + "× " + p.nome + (i.t ? " (" + i.t + ")" : "") + " — " + brl(p.preco * i.q);
    });
    var texto = "Olá, Elite Drako Gym! Quero fazer este pedido pelo site:\n" + linhas.join("\n") +
      "\nTotal: " + brl(carrinho.total()) + "\nNome: " + nome + "\nWhatsApp: " + tel + "\n" + f.entrega.value + ".";
    var botao = form.querySelector('[type="submit"]');
    botao.disabled = true;
    aviso.textContent = "Enviando…";
    salvar("pedidos", {
      nome: nome, telefone: tel, entrega: f.entrega.value,
      itens: itens.map(function (i) { var p = produto(i.id); return { id: i.id, nome: p.nome, tamanho: i.t, qtd: i.q, preco: p.preco }; }),
      total: Math.round(carrinho.total() * 100) / 100
    }).then(function () {
      var copiou = abrirConversa(texto);
      aviso.textContent = enviado = copiou
        ? "Pedido copiado. Cole na conversa do Instagram que abriu e envie."
        : "Pedido pronto no WhatsApp. É só enviar a mensagem.";
      botao.disabled = false;
      carrinho.limpar();
      painel.focus({ preventScroll: true });
    });
  }

  /* ---------- desenhos dos produtos que ainda não têm foto ----------
     Traço na cor do texto, detalhe em vermelho, e o hexágono da casa no rótulo. */
  var HEX = function (cx, cy, w, h) { // hexágono esticado, como o neon do teto
    var c = h / 2, x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    return '<polygon class="a" points="' + [x0, cy, x0 + c, y0, x1 - c, y0, x1, cy, x1 - c, y1, x0 + c, y1].join(" ") + '"/>';
  };
  var ICONES = {
    whey: '<rect x="12" y="11" width="40" height="9" rx="2"/><path d="M14 20h36v32a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z"/>' + HEX(32, 37, 22, 12),
    creatina: '<rect x="20" y="8" width="24" height="8" rx="2"/><path d="M18 16h28v38a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4z"/>' + HEX(32, 36, 18, 10) + '<path d="M24 48h16"/>',
    "pre-treino": '<rect x="14" y="11" width="36" height="9" rx="2"/><path d="M16 20h32v32a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z"/><path class="a" d="M35 25l-9 13h6l-2 11 9-14h-6z"/>',
    barra: '<path d="M8 25l4-3 4 3 32 0 4-3 4 3v14l-4 3-4-3H16l-4 3-4-3z"/><path d="M16 25v14M48 25v14"/>' + HEX(32, 32, 20, 9),
    coqueteleira: '<rect x="27" y="5" width="10" height="6" rx="1"/><rect x="20" y="11" width="24" height="8" rx="2"/><path d="M20 19h24l-3 37a2 2 0 0 1-2 2H25a2 2 0 0 1-2-2z"/><path class="a-l" d="M24 28h5M24 34h5M24 40h5"/>' + HEX(35, 45, 10, 6),
    luva: '<path d="M18 31V22a3 3 0 0 1 6 0v8M24 29v-9a3 3 0 0 1 6 0v9M30 29v-9a3 3 0 0 1 6 0v9M36 30v-7a3 3 0 0 1 6 0v12"/><path d="M42 35v13a8 8 0 0 1-8 8h-6a10 10 0 0 1-10-10V31l-5-4a3 3 0 0 0-4 4l9 12"/><rect class="a" x="19" y="48" width="23" height="6" rx="1"/>',
    strap: '<rect x="20" y="6" width="24" height="20" rx="10"/><rect x="26.5" y="12" width="11" height="8" rx="4"/><path d="M26 26v30h12V26"/><rect class="a" x="26" y="44" width="12" height="7"/>',
    cinto: '<path d="M6 25h34v14H6z"/><rect class="a-l" x="40" y="21" width="16" height="22" rx="2"/><path d="M45 32h11"/><circle cx="13" cy="32" r="1.6" class="a"/><circle cx="20" cy="32" r="1.6"/><circle cx="27" cy="32" r="1.6"/>',
    toalha: '<path d="M10 18a4 4 0 0 1 4-4h36a4 4 0 0 1 4 4v8H10z"/><path d="M10 26h44v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z"/><path class="a-l" d="M10 42h44"/>' + HEX(32, 34, 16, 8),
    garrafa: '<rect x="26" y="5" width="12" height="7" rx="1.5"/><path d="M28 12v4l-6 5a4 4 0 0 0-2 3.5V54a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4V24.5a4 4 0 0 0-2-3.5l-6-5v-4"/>' + HEX(32, 38, 18, 10)
  };
  function desenho(p) {
    var corpo = ICONES[p.icone] || ICONES.whey;
    return '<svg class="prod__ico" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' + corpo + "</svg>";
  }

  /* ---------- cartão de produto (vitrine e loja) ---------- */
  function cartao(p) {
    if (!p) return "";
    if (p.status === "em-breve") {
      return '<li class="prod prod--breve reveal" id="p-' + esc(p.id) + '">' +
        '<div class="prod__pic prod__pic--breve" role="img" aria-label="' + esc(p.nome) + ', em breve na academia">' + desenho(p) + '</div>' +
        '<div class="prod__row"><h3>' + esc(p.nome) + '</h3><p class="prod__price prod__price--breve">Em breve</p></div>' +
        "<p>" + esc(p.resumo) + "</p>" +
        '<div class="prod__buy"><button class="btn btn--ghost" type="button" data-avise="' + esc(p.id) + '">' +
        'Avise-me<span class="prod__mais">quando chegar</span><span class="sr"> sobre ' + esc(p.nome) + '</span></button></div></li>';
    }
    var tam = p.tamanhos ? '<label class="sr" for="t-' + p.id + '">Tamanho</label><select id="t-' + p.id + '" data-tam>' +
      p.tamanhos.map(function (t) { return "<option>" + t + "</option>"; }).join("") + "</select>" : "";
    var alt = p.fotoUso || p.fotoExtra;
    return '<li class="prod reveal" id="p-' + p.id + '">' +
      '<div class="prod__pic"><img src="' + p.foto + '" alt="' + p.nome + '" loading="lazy" width="800" height="800">' +
      (alt ? '<img class="prod__alt" src="' + alt + '" alt="" loading="lazy" width="800" height="800">' : "") + "</div>" +
      '<div class="prod__row"><h3>' + p.nome + '</h3><p class="prod__price">' + brl(p.preco) + " <small>" + p.unidade + "</small></p></div>" +
      "<p>" + p.resumo + "</p>" +
      '<div class="prod__buy">' + tam + '<button class="btn" type="button" data-add="' + p.id + '">Adicionar ao pedido</button></div></li>';
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add]");
    if (!b) return;
    var card = b.closest(".prod");
    var sel = card && card.querySelector("[data-tam]");
    carrinho.adicionar(b.dataset.add, sel ? sel.value : "", 1);
  });

  /* ---------- "Avise-me quando chegar" ----------
     Com Supabase configurado, grava em cadastros (tipo "interesse") e a equipe vê no painel.
     Sem Supabase, abre a conversa (WhatsApp ou Instagram) com a mensagem pronta. */
  var avise, avisePainel, aviseForm, aviseMsg, aviseProd = null, aviseFocoAntes = null;
  function montarAvise() {
    if (avise) return;
    var d = document.createElement("div");
    d.innerHTML =
      '<div class="avise" id="avise" aria-hidden="true">' +
      '  <div class="avise__fundo" data-avise-fechar></div>' +
      '  <div class="avise__painel" role="dialog" aria-modal="true" aria-labelledby="avise-t" aria-describedby="avise-d" tabindex="-1">' +
      '    <div class="avise__topo"><h2 id="avise-t">Avise-me quando chegar</h2>' +
      '      <button class="gaveta__x" type="button" data-avise-fechar aria-label="Fechar">Fechar</button></div>' +
      '    <p id="avise-d" class="avise__txt"><strong data-avise-nome></strong> ainda não chegou à academia. Deixe seu nome e WhatsApp: a equipe avisa quando chegar, com marcas e preços.</p>' +
      '    <form class="avise__form" data-avise-form novalidate>' +
      '      <label class="sr" for="a-nome">Seu nome</label><input id="a-nome" name="nome" placeholder="Seu nome" autocomplete="name" required minlength="2" maxlength="120">' +
      '      <label class="sr" for="a-fone">Seu WhatsApp</label><input id="a-fone" name="telefone" type="tel" placeholder="Seu WhatsApp com DDD" autocomplete="tel" inputmode="tel" required minlength="8" maxlength="30">' +
      '      <button class="btn btn--full" type="submit">Quero ser avisado</button>' +
      '    </form>' +
      '    <p class="avise__msg" data-avise-msg aria-live="polite"></p>' +
      '    <button class="btn btn--sm btn--ghost avise__conversa" type="button" data-avise-conversa hidden>Mandar mensagem também</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(d.firstChild);
    avise = document.getElementById("avise");
    avisePainel = avise.querySelector(".avise__painel");
    aviseForm = avise.querySelector("[data-avise-form]");
    aviseMsg = avise.querySelector("[data-avise-msg]");
    avise.addEventListener("click", function (e) {
      if (e.target.closest("[data-avise-fechar]")) fecharAvise();
      if (e.target.closest("[data-avise-conversa]")) abrirConversa(textoAvise());
    });
    avise.addEventListener("keydown", function (e) {
      if (!avise.classList.contains("is-open")) return;
      if (e.key === "Escape") { e.preventDefault(); fecharAvise(); return; }
      prenderFoco(e, avisePainel);
    });
    aviseForm.addEventListener("submit", enviarAvise);
  }
  function textoAvise() {
    var f = aviseForm.elements;
    return "Olá, Elite Drako Gym! Quero ser avisado quando chegar: " + aviseProd.nome +
      ".\nNome: " + f.nome.value.trim() + "\nWhatsApp: " + f.telefone.value.trim();
  }
  function abrirAvise(id) {
    var p = produto(id); if (!p) return;
    montarAvise();
    aviseProd = p;
    avise.querySelector("[data-avise-nome]").textContent = p.nome;
    var c = contato();
    if (c.nome && !aviseForm.elements.nome.value) aviseForm.elements.nome.value = c.nome;
    if (c.telefone && !aviseForm.elements.telefone.value) aviseForm.elements.telefone.value = c.telefone;
    aviseForm.hidden = false;
    aviseMsg.textContent = "";
    avise.querySelector("[data-avise-conversa]").hidden = true;
    aviseFocoAntes = document.activeElement;
    avise.classList.add("is-open"); avise.setAttribute("aria-hidden", "false");
    travar(true);
    setTimeout(function () {
      var alvo = aviseForm.elements.nome.value ? aviseForm.querySelector("[type=submit]") : aviseForm.elements.nome;
      alvo.focus({ preventScroll: true });
    }, 40);
  }
  function fecharAvise() {
    if (!avise || !avise.classList.contains("is-open")) return;
    avise.classList.remove("is-open"); avise.setAttribute("aria-hidden", "true");
    travar(false);
    if (aviseFocoAntes && aviseFocoAntes.focus && document.contains(aviseFocoAntes)) aviseFocoAntes.focus({ preventScroll: true });
  }
  function enviarAvise(e) {
    e.preventDefault();
    var f = aviseForm.elements, nome = f.nome.value.trim(), tel = f.telefone.value.trim();
    if (nome.length < 2) { aviseMsg.textContent = "Escreva seu nome."; f.nome.focus(); return; }
    if (tel.replace(/\D/g, "").length < 8) { aviseMsg.textContent = "Coloque um WhatsApp com DDD."; f.telefone.focus(); return; }
    lembrarContato(nome, tel);
    var botao = aviseForm.querySelector("[type=submit]");
    botao.disabled = true; aviseMsg.textContent = "Enviando…";
    salvar("cadastros", {
      tipo: "interesse", nome: nome, telefone: tel,
      observacoes: "Avise-me quando chegar: " + aviseProd.nome + " (" + aviseProd.id + ")"
    }).then(function (r) {
      botao.disabled = false;
      if (r.salvo) {
        aviseForm.hidden = true;
        aviseMsg.textContent = "Pronto, " + nome.split(" ")[0] + ". Você está na lista do " + aviseProd.nome + " e a academia chama no seu WhatsApp quando chegar.";
        avise.querySelector("[data-avise-conversa]").hidden = false;
        avisePainel.focus({ preventScroll: true });
      } else {
        var copiou = abrirConversa(textoAvise());
        aviseForm.hidden = true;
        aviseMsg.textContent = copiou
          ? "Mensagem copiada. Cole na conversa do Instagram que abriu e envie: a academia avisa quando chegar."
          : "Mensagem pronta no WhatsApp. É só enviar: a academia avisa quando chegar.";
        avisePainel.focus({ preventScroll: true });
      }
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-avise]");
    if (b) abrirAvise(b.dataset.avise);
  });

  function preencherContato() {
    document.querySelectorAll("[data-endereco-curto]").forEach(function (el) { if (CFG.endereco) el.textContent = CFG.endereco; });
    if (CFG.endereco && CFG.endereco !== "Valente, Bahia") {
      document.querySelectorAll("[data-endereco]").forEach(function (el) { el.textContent = "Fica em " + CFG.endereco + "."; });
    }
  }
  document.addEventListener("DOMContentLoaded", preencherContato);

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-abrir-carrinho]")) { e.preventDefault(); abrirGaveta(); }
  });
  document.addEventListener("DOMContentLoaded", atualizar);
  // carrinho mudou em outra aba
  window.addEventListener("storage", function (e) { if (e.key === KEY) atualizar(); });
  // ao voltar pelo histórico, nada fica preso aberto
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) { fecharGaveta(); fecharAvise(); camadasAbertas = 0; document.documentElement.classList.remove("trava"); }
  });

  window.Drako = {
    carrinho: carrinho, brl: brl, salvar: salvar, abrirConversa: abrirConversa, produto: produto,
    vendavel: vendavel, abrirGaveta: abrirGaveta, fecharGaveta: fecharGaveta, abrirAvise: abrirAvise,
    supa: supa, config: CFG, cartao: cartao
  };
})();
