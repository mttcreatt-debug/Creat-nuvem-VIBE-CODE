/* Catálogo da loja. Para mudar preço, nome ou foto, edite aqui.
   Preços marcados "confirmar: true" são exemplos e precisam ser confirmados pela academia. */
window.DRAKO_PRODUTOS = [
  {
    id: "plano-mensal", categoria: "planos", nome: "Plano mensal",
    preco: 119.90, unidade: "por mês",
    foto: "assets/img/salao-amplo.jpg",
    resumo: "Acesso livre ao salão em todos os horários da casa, sem limite de dias.",
    detalhes: "Inclui musculação, vestiário e os eventos para alunos, como o Drako 30.",
    confirmar: false
  },
  {
    id: "diaria", categoria: "planos", nome: "Diária",
    preco: 20.00, unidade: "por dia",
    foto: "assets/img/salao-corredor.jpg",
    resumo: "Um dia inteiro de treino para quem está de passagem por Valente.",
    detalhes: "Válida no dia da compra, em qualquer horário de funcionamento.",
    confirmar: true
  },
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
  {
    id: "kit-drako", categoria: "suplementos", nome: "Kit Drako",
    preco: 249.90, unidade: "kit",
    foto: "assets/img/produto-whey.jpg",
    fotoExtra: "assets/img/produto-creatina.jpg",
    resumo: "1 whey + 1 creatina: o mesmo kit que foi prêmio no Drako 30.",
    detalhes: "Whey High Protein 900 g + Creatina monohidratada 500 g.",
    confirmar: true
  },
  {
    id: "whey", categoria: "suplementos", nome: "Whey High Protein 900 g",
    preco: 149.90, unidade: "pacote",
    foto: "assets/img/produto-whey.jpg",
    resumo: "Proteína para o pós-treino, sabor baunilha.",
    detalhes: "Retire no balcão da academia.",
    confirmar: true
  },
  {
    id: "creatina", categoria: "suplementos", nome: "Creatina 500 g",
    preco: 119.90, unidade: "pacote",
    foto: "assets/img/produto-creatina.jpg",
    resumo: "Creatina monohidratada para força e volume de treino.",
    detalhes: "Retire no balcão da academia.",
    confirmar: true
  },
  {
    id: "energetico", categoria: "bebidas", nome: "Energético 350 ml",
    preco: 9.90, unidade: "lata",
    foto: "assets/img/produto-energetico.jpg",
    resumo: "Gelado no balcão, para o treino das 5h ou o das 23h.",
    detalhes: "Retire no balcão da academia.",
    confirmar: true
  },
  {
    id: "drako30-ingresso", categoria: "eventos", nome: "Drako 30 · próxima edição",
    preco: 30.00, unidade: "por dupla",
    foto: "assets/img/evento-drako30.jpg",
    resumo: "Desafio em dupla: 1 aluno + 1 convidado, com prêmios e sorteios.",
    detalhes: "Níveis iniciante, intermediário e avançado. Data da próxima edição a anunciar.",
    confirmar: true
  }
];

window.DRAKO_CATEGORIAS = [
  { id: "todos", nome: "Tudo" },
  { id: "planos", nome: "Planos" },
  { id: "roupas", nome: "Roupas" },
  { id: "suplementos", nome: "Suplementos" },
  { id: "bebidas", nome: "Bebidas" },
  { id: "eventos", nome: "Eventos" }
];
