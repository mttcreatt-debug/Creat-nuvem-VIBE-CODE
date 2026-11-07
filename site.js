/* Elite Drako Gym — código compartilhado entre as páginas:
   carrinho, envio de pedidos/cadastros (Supabase + WhatsApp/Instagram) e a gaveta do carrinho. */
(function () {
  "use strict";
  var CFG = window.DRAKO_CONFIG || {};
  var KEY = "drako-carrinho-v1";

  function brl(v) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

  /* ---------- canal de contato ---------- */
  function abrirConversa(texto) {
    var url;
    if (CFG.whatsapp) {
      url = "https://wa.me/" + CFG.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent(texto);
    } else {
      url = "https://ig.me/m/" + (CFG.instagram || "elite_drakogym");
      try { navigator.clipboard && navigator.clipboard.writeText(texto); } catch (e) {}
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
      return r.error ? { salvo: false, motivo: r.error.message } : { salvo: true };
    }, function (e) { return { salvo: false, motivo: String(e) }; });
  }

  /* ---------- carrinho ---------- */
  function ler() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function gravar(itens) { try { localStorage.setItem(KEY, JSON.stringify(itens)); } catch (e) {} atualizar(); }
  function produto(id) { return (window.DRAKO_PRODUTOS || []).filter(function (p) { return p.id === id; })[0]; }
  function chave(id, tam) { return id + (tam ? "|" + tam : ""); }

  var carrinho = {
    itens: ler,
    adicionar: function (id, tam, qtd) {
      var itens = ler(), k = chave(id, tam), achou = false;
      itens.forEach(function (i) { if (i.k === k) { i.q += (qtd || 1); achou = true; } });
      if (!achou) itens.push({ k: k, id: id, t: tam || "", q: qtd || 1 });
      gravar(itens); abrirGaveta();
    },
    mudar: function (k, delta) {
      var itens = ler().map(function (i) { if (i.k === k) i.q += delta; return i; }).filter(function (i) { return i.q > 0; });
      gravar(itens);
    },
    limpar: function () { gravar([]); },
    total: function () {
      return ler().reduce(function (s, i) { var p = produto(i.id); return s + (p ? p.preco * i.q : 0); }, 0);
    },
    quantidade: function () { return ler().reduce(function (s, i) { return s + i.q; }, 0); }
  };

  /* ---------- gaveta ---------- */
  var gaveta, lista, totalEl, form, aviso;
  function montarGaveta() {
    if (document.getElementById("gaveta")) return;
    var d = document.createElement("div");
    d.innerHTML =
      '<aside class="gaveta" id="gaveta" aria-label="Carrinho" aria-hidden="true">' +
      '  <div class="gaveta__fundo" data-fechar></div>' +
      '  <div class="gaveta__painel" role="dialog" aria-modal="true" aria-labelledby="gaveta-titulo" tabindex="-1">' +
      '    <div class="gaveta__topo"><h2 id="gaveta-titulo">Seu pedido</h2><button class="gaveta__x" type="button" data-fechar aria-label="Fechar carrinho">Fechar</button></div>' +
      '    <ul class="gaveta__lista" data-lista role="list"></ul>' +
      '    <p class="gaveta__vazio" data-vazio>O carrinho está vazio. Escolha algo na <a href="loja.html">loja</a>.</p>' +
      '    <form class="gaveta__form" data-checkout>' +
      '      <p class="gaveta__total"><span>Total</span><strong data-total>R$ 0,00</strong></p>' +
      '      <label class="sr" for="g-nome">Seu nome</label><input id="g-nome" name="nome" placeholder="Seu nome" autocomplete="name" required>' +
      '      <label class="sr" for="g-fone">Seu WhatsApp</label><input id="g-fone" name="telefone" placeholder="Seu WhatsApp com DDD" autocomplete="tel" inputmode="tel" required>' +
      '      <label class="sr" for="g-retirada">Como receber</label><select id="g-retirada" name="entrega"><option>Retirar na academia</option><option>Combinar entrega em Valente</option></select>' +
      '      <button class="btn btn--full" type="submit">Enviar pedido</button>' +
      '      <p class="gaveta__aviso" data-aviso aria-live="polite">O pagamento (Pix ou cartão) é combinado com a academia na conversa.</p>' +
      '    </form>' +
      '  </div>' +
      '</aside>';
    document.body.appendChild(d.firstChild);
    gaveta = document.getElementById("gaveta");
    lista = gaveta.querySelector("[data-lista]");
    totalEl = gaveta.querySelector("[data-total]");
    form = gaveta.querySelector("[data-checkout]");
    aviso = gaveta.querySelector("[data-aviso]");
    gaveta.addEventListener("click", function (e) {
      if (e.target.closest("[data-fechar]")) fecharGaveta();
      var b = e.target.closest("[data-mudar]");
      if (b) carrinho.mudar(b.dataset.k, Number(b.dataset.mudar));
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && gaveta.classList.contains("is-open")) fecharGaveta(); });
    form.addEventListener("submit", enviarPedido);
  }
  var ultimoFoco = null;
  function abrirGaveta() {
    montarGaveta(); atualizar();
    ultimoFoco = document.activeElement;
    gaveta.classList.add("is-open"); gaveta.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("trava");
    setTimeout(function () { gaveta.querySelector(".gaveta__painel").focus(); }, 30);
  }
  function fecharGaveta() {
    gaveta.classList.remove("is-open"); gaveta.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("trava");
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  function atualizar() {
    document.querySelectorAll("[data-contador]").forEach(function (el) {
      var q = carrinho.quantidade(); el.textContent = q; el.hidden = q === 0;
    });
    if (!gaveta) return;
    var itens = ler();
    lista.innerHTML = itens.map(function (i) {
      var p = produto(i.id); if (!p) return "";
      return '<li class="gitem"><img src="' + p.foto + '" alt="" width="64" height="64">' +
        '<div><p class="gitem__nome">' + p.nome + (i.t ? " · " + i.t : "") + '</p><p class="gitem__preco">' + brl(p.preco * i.q) + '</p></div>' +
        '<div class="gitem__q"><button type="button" data-k="' + i.k + '" data-mudar="-1" aria-label="Diminuir ' + p.nome + '">−</button><span>' + i.q + '</span>' +
        '<button type="button" data-k="' + i.k + '" data-mudar="1" aria-label="Aumentar ' + p.nome + '">+</button></div></li>';
    }).join("");
    totalEl.textContent = brl(carrinho.total());
    gaveta.querySelector("[data-vazio]").hidden = itens.length > 0;
    form.hidden = itens.length === 0;
  }

  function enviarPedido(e) {
    e.preventDefault();
    var f = form.elements, itens = ler();
    if (!itens.length) return;
    var linhas = itens.map(function (i) {
      var p = produto(i.id);
      return "• " + i.q + "× " + p.nome + (i.t ? " (" + i.t + ")" : "") + " — " + brl(p.preco * i.q);
    });
    var texto = "Olá, Elite Drako Gym! Quero fazer este pedido pelo site:\n" + linhas.join("\n") +
      "\nTotal: " + brl(carrinho.total()) + "\nNome: " + f.nome.value + "\nWhatsApp: " + f.telefone.value + "\n" + f.entrega.value + ".";
    aviso.textContent = "Enviando…";
    salvar("pedidos", {
      nome: f.nome.value, telefone: f.telefone.value, entrega: f.entrega.value,
      itens: itens.map(function (i) { var p = produto(i.id); return { id: i.id, nome: p.nome, tamanho: i.t, qtd: i.q, preco: p.preco }; }),
      total: Math.round(carrinho.total() * 100) / 100
    }).then(function () {
      var copiou = abrirConversa(texto);
      aviso.textContent = copiou
        ? "Pedido copiado. Cole na conversa do Instagram que abriu e envie."
        : "Pedido pronto no WhatsApp. É só enviar a mensagem.";
      carrinho.limpar();
    });
  }


  /* ---------- cartão de produto (vitrine e loja) ---------- */
  function cartao(p) {
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

  window.Drako = { carrinho: carrinho, brl: brl, salvar: salvar, abrirConversa: abrirConversa, produto: produto, abrirGaveta: abrirGaveta, supa: supa, config: CFG, cartao: cartao };
})();
