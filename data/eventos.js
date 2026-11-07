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
      publico: "Alunos e convidados, em duplas",
      horarios: ["A partir das 8h30"],
      programa: ["Desafios em dupla, por nível", "Pódio Drako 30 no final"],
      premios: ["Um mês de consultoria online", "Um kit Drako", "Um mês de academia grátis"],
      cta: [{ texto: "Entrar na lista da próxima", href: "cadastro.html?tipo=drako30" }]
    },
    "novembro-azul": {
      tema: "Saúde do homem",
      publico: "Evento aberto ao público. Traga quem você ama.",
      horarios: ["Divulgado no Instagram"],
      programa: ["Café da manhã", "Palestra com o médico Dr. Jailton Campos", "Campeonato com categorias e premiações"],
      premios_titulo: "Oferta do dia",
      premios: ["1 mês de academia por R$ 59,90, só para quem estiver presente no dia 15/11"],
      convite: "Treinar. Cuidar. Viver.",
      fotos_titulo: "Artes do evento",
      cta: [
        { texto: "Quero participar", href: "cadastro.html?tipo=novembro-azul" },
        { texto: "Ver no Instagram", href: "https://www.instagram.com/elite_drakogym/" }
      ]
    }
  }
};
