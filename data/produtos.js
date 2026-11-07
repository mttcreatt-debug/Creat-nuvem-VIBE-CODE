/* Catálogo da loja. Só itens da própria Elite Drako Gym, com fotos da própria academia.
   Para mudar preço, nome ou foto, edite aqui.

   Campos:
   - categoria: suplementos | acessorios | roupas | planos | eventos (veja DRAKO_CATEGORIAS abaixo)
   - status: "venda" (padrão, entra no carrinho) ou "em-breve" (aparece na loja, mas só com
     o botão "Avise-me quando chegar"; não entra no carrinho)
   - preco: número em reais; itens "em-breve" ficam sem preço até a academia definir
   - icone: desenho do bloco quando ainda não há foto (whey, creatina, pre-treino, barra,
     coqueteleira, luva, strap, cinto, toalha, garrafa) — veja ICONES em site.js
   - confirmar: true = preço/condições ainda precisam ser confirmados pela academia

   Quando um suplemento ou acessório chegar: troque status para "venda", coloque preco,
   unidade e uma foto própria (assets/img/...). Nada de foto de catálogo de marca. */
window.DRAKO_PRODUTOS = [
  /* ---------- suplementos (o balcão vende BOLD e outras marcas; preços ainda não cadastrados) ---------- */
  {
    id: "whey-protein", categoria: "suplementos", nome: "Whey protein",
    status: "em-breve", icone: "whey",
    resumo: "Proteína para completar a dieta depois do treino. Marcas, sabores e preços na chegada.",
    confirmar: true
  },
  {
    id: "creatina", categoria: "suplementos", nome: "Creatina",
    status: "em-breve", icone: "creatina",
    resumo: "Creatina monohidratada para força e volume de treino. Marcas e preços na chegada.",
    confirmar: true
  },
  {
    id: "pre-treino", categoria: "suplementos", nome: "Pré-treino",
    status: "em-breve", icone: "pre-treino",
    resumo: "Para quem treina cedo ou depois do trabalho. Opções e preços na chegada.",
    confirmar: true
  },
  {
    id: "barra-proteina", categoria: "suplementos", nome: "Barra de proteína",
    status: "em-breve", icone: "barra",
    resumo: "O lanche rápido entre o trabalho e o treino, à venda no balcão.",
    confirmar: true
  },

  /* ---------- acessórios ---------- */
  {
    id: "coqueteleira-drako", categoria: "acessorios", nome: "Coqueteleira Drako",
    status: "em-breve", icone: "coqueteleira",
    resumo: "Coqueteleira com a marca da casa. Modelo e cor a definir.",
    confirmar: true
  },
  {
    id: "luva-treino", categoria: "acessorios", nome: "Luva de treino",
    status: "em-breve", icone: "luva",
    resumo: "Pegada firme na barra e menos calo na mão. Tamanhos na chegada.",
    confirmar: true
  },
  {
    id: "strap", categoria: "acessorios", nome: "Strap",
    status: "em-breve", icone: "strap",
    resumo: "Fita de punho para puxadas e levantamento terra com carga alta.",
    confirmar: true
  },
  {
    id: "cinto-musculacao", categoria: "acessorios", nome: "Cinto de musculação",
    status: "em-breve", icone: "cinto",
    resumo: "Apoio para a lombar no agachamento e no terra. Tamanhos na chegada.",
    confirmar: true
  },
  {
    id: "toalha-drako", categoria: "acessorios", nome: "Toalha Drako",
    status: "em-breve", icone: "toalha",
    resumo: "Toalha de treino para o banco e os aparelhos, com a marca da casa.",
    confirmar: true
  },
  {
    id: "garrafa-drako", categoria: "acessorios", nome: "Garrafa Drako",
    status: "em-breve", icone: "garrafa",
    resumo: "Garrafa para a água do treino, com a marca da casa. Modelo a definir.",
    confirmar: true
  },

  /* ---------- roupas ---------- */
  {
    id: "camiseta-drako", categoria: "roupas", nome: "Camiseta Elite Drako",
    preco: 79.90, unidade: "unidade",
    foto: "assets/img/produto-camiseta.jpg",
    fotoUso: "assets/img/atleta-retrato.jpg",
    resumo: "A camiseta oficial da casa: preta, gola vermelha, dragão no peito.",
    detalhes: "Tecido dry fit. Tamanhos P, M, G e GG.",
    tamanhos: ["P", "M", "G", "GG"],
    confirmar: true
  },

  /* ---------- planos e avaliação ---------- */
  {
    id: "plano-mensal", categoria: "planos", nome: "Plano mensal",
    preco: 119.90, unidade: "por mês",
    foto: "assets/img/tour/salao.jpg",
    resumo: "Acesso livre ao salão em todos os horários da casa, sem limite de dias.",
    detalhes: "Inclui musculação, cardio, vestiário e os eventos para alunos, como o Drako 30.",
    confirmar: false
  },
  {
    id: "diaria", categoria: "planos", nome: "Diária",
    preco: 20.00, unidade: "por dia",
    foto: "assets/img/tour/halteres.jpg",
    resumo: "Um dia inteiro de treino para quem está de passagem por Valente.",
    detalhes: "Válida no dia da compra, em qualquer horário de funcionamento.",
    confirmar: true
  },
  {
    id: "avaliacao", categoria: "planos", nome: "Avaliação física",
    preco: 50.00, unidade: "por avaliação",
    foto: "assets/img/tour/avaliacao.jpg",
    resumo: "Na sala de avaliação: medidas, objetivos e o ponto de partida do seu treino.",
    detalhes: "Agendada com a equipe. Valor e formato a confirmar com a academia.",
    confirmar: true
  },

  /* ---------- eventos / ingressos ---------- */
  {
    id: "drako30-ingresso", categoria: "eventos", nome: "Drako 30 · próxima edição",
    preco: 30.00, unidade: "por dupla",
    foto: "assets/img/produto-drako30.jpg",
    resumo: "Desafio em dupla, com pódio, prêmios e sorteios.",
    detalhes: "Níveis iniciante, intermediário e avançado. Data da próxima edição a anunciar.",
    confirmar: true
  }
];

/* Seções da loja, na ordem em que aparecem (a mesma do menu do topo).
   "ancora" é o endereço da seção: loja.html#suplementos, loja.html#acessorios...
   "apelidos" são endereços antigos que continuam levando à seção certa. */
window.DRAKO_CATEGORIAS = [
  { id: "todos", nome: "Tudo", ancora: "produtos" },
  {
    id: "suplementos", nome: "Suplementos", ancora: "suplementos",
    titulo: "Suplementos",
    texto: "No balcão você encontra produtos BOLD e outras marcas. Pelo site eles ainda não têm preço: peça para ser avisado ou pergunte sabores e valores na recepção."
  },
  {
    id: "acessorios", nome: "Acessórios", ancora: "acessorios",
    titulo: "Acessórios",
    texto: "Coqueteleira, luva, strap, cinto e os itens com a marca da casa. Estão a caminho; peça para ser avisado."
  },
  {
    id: "roupas", nome: "Roupas", ancora: "roupas",
    titulo: "Roupas",
    texto: "A camiseta oficial da Elite Drako. Escolha o tamanho e retire no balcão."
  },
  {
    id: "planos", nome: "Planos", ancora: "planos", apelidos: ["servicos"],
    titulo: "Planos e avaliação",
    texto: "O plano mensal, a diária para quem está de passagem e a avaliação física para começar com o pé direito."
  },
  {
    id: "eventos", nome: "Ingressos", ancora: "ingressos", apelidos: ["eventos"],
    titulo: "Eventos e ingressos",
    texto: "Ingressos dos eventos da casa. O Novembro Azul é no domingo, 15 de novembro: para participar, entre na lista pelo cadastro do site. O próximo Drako 30 ainda não tem data: garanta a vaga da dupla e a academia confirma o dia."
  }
];
