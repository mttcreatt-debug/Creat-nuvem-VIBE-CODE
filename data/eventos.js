/* Elite Drako Gym: texto da página de Eventos (eventos.html).
   As fotos, vídeos, datas e o resumo de cada evento ficam em data/eventos-media.json.
   Aqui ficam só os detalhes de texto que a página mostra, ligados pelo mesmo "id".
   Campos opcionais por evento (deixe de fora o que não souber):
     tema       texto curto ao lado da data (ex.: "Outubro Rosa")
     publico    para quem é o evento
     horarios   lista de horários ["Recepção às 7h30", ...]
     programa   lista do que acontece no evento
     premios    lista de prêmios ou sorteios
     cta        botões: [{ texto, href }] (o primeiro fica vermelho)
   O vídeo e o texto do topo da página ficam direto em eventos.html (seção ev-hero).
   Ver README.md, seção "Como adicionar um evento". */
window.DRAKO_EVENTOS = {
  instagram: "https://www.instagram.com/elite_drakogym/",
  eventos: {
    "coffee-pink-drako": {
      tema: "Outubro Rosa",
      publico: "Evento aberto para mulheres",
      horarios: ["Recepção às 7h30", "Início às 8h"],
      programa: ["Café da manhã", "Aula de dança", "Sorteios", "Brindes", "Espaço para fotos"],
      convite: "O convite era um só: venha de rosa."
    },
    "drako-30": {
      tema: "Desafio",
      publico: "Alunos e convidados, em duplas: cada aluno leva um convidado",
      horarios: ["A partir das 8h30"],
      programa: [
        "Desafios separados por nível: iniciante, intermediário e avançado",
        "Agachamentos e prancha",
        "Pódio Drako 30 no final"
      ],
      premios: ["Um mês de consultoria online", "Um kit Drako", "Um mês de academia grátis"],
      cta: [{ texto: "Entrar na lista da próxima", href: "cadastro.html?tipo=drako30" }]
    },
    "novembro-azul": {
      tema: "Saúde do homem",
      cta: [
        { texto: "Quero participar", href: "cadastro.html?tipo=visita" },
        { texto: "Perguntar no Instagram", href: "https://www.instagram.com/elite_drakogym/" }
      ]
    }
  }
};
