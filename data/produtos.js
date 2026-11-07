/* Catálogo da loja. Só itens da própria Elite Drako Gym, com fotos da própria academia.
   Para mudar preço, nome ou foto, edite aqui.
   Itens marcados "confirmar: true" precisam ter preço/condições confirmados pela academia. */
window.DRAKO_PRODUTOS = [
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
    foto: "assets/img/tour/corredor.jpg",
    resumo: "Um dia inteiro de treino para quem está de passagem por Valente.",
    detalhes: "Válida no dia da compra, em qualquer horário de funcionamento.",
    confirmar: true
  },
  {
    id: "avaliacao", categoria: "servicos", nome: "Avaliação física",
    preco: 50.00, unidade: "por avaliação",
    foto: "assets/img/tour/avaliacao.jpg",
    resumo: "Na sala de avaliação: medidas, objetivos e o ponto de partida do seu treino.",
    detalhes: "Agendada com a equipe. Valor e formato a confirmar com a academia.",
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
  { id: "servicos", nome: "Serviços" },
  { id: "roupas", nome: "Roupas" },
  { id: "eventos", nome: "Eventos" }
];
