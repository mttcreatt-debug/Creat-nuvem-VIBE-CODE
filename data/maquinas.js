/* Máquinas e equipamentos da Elite Drako Gym, fotografados no salão em outubro.
   "m" = recorte tratado (fundo transparente), "f" = foto no salão.
   Nomes e grupos musculares identificados pelas fotos: confirme com a equipe (campo confirmar). */
window.DRAKO_MAQUINAS = [
  { id: "3560", nome: "Remada articulada", grupo: "costas", musculos: "Dorsais, romboides e bíceps",
    texto: "Estrutura vermelha de carga livre, com pegada alta e movimento convergente: cada braço trabalha sozinho.", destaque: true, confirmar: true },
  { id: "3599", nome: "Cadeira extensora", grupo: "pernas", musculos: "Quadríceps",
    texto: "Encosto regulável e rolo acolchoado no tornozelo. Isola a frente da coxa sem carregar a coluna.", destaque: true, confirmar: false },
  { id: "3563", nome: "Mesa flexora", grupo: "pernas", musculos: "Posteriores da coxa",
    texto: "Deitado de bruços, o rolo puxa o calcanhar em direção ao glúteo. Estofado vermelho, carga em placas.", destaque: false, confirmar: true },
  { id: "3586", nome: "Máquina articulada de glúteo", grupo: "pernas", musculos: "Glúteos e posteriores",
    texto: "Apoio de peito e alavanca vermelha: o quadril empurra para trás com a carga em anilhas.", destaque: true, confirmar: true },
  { id: "3562", nome: "Estação com placas", grupo: "costas", musculos: "Costas e braços",
    texto: "Torre de placas com assento e apoios, para puxadas e remadas sentado com carga guiada.", destaque: false, confirmar: true },
  { id: "3591", nome: "Puxada sentada", grupo: "costas", musculos: "Dorsais e bíceps",
    texto: "Assento e encosto estofados, cabo e barra ajustáveis. A puxada clássica, em versão guiada.", destaque: false, confirmar: true },
  { id: "3593", nome: "Polia alta e baixa", grupo: "multi", musculos: "Corpo todo",
    texto: "Uma torre de cabo para tríceps, bíceps, crucifixo e dezenas de variações com um só equipamento.", destaque: false, confirmar: true },
  { id: "3582", nome: "Supino reto", grupo: "peito", musculos: "Peitoral, tríceps e ombros",
    texto: "Banco com suporte de barra e anilhas de borracha nos dois lados. O exercício que todo mundo conhece.", destaque: true, confirmar: false },
  { id: "3620", nome: "Banco regulável", grupo: "multi", musculos: "Peito, ombros e braços",
    texto: "Encosto com várias inclinações: do plano ao quase vertical, para halteres e barra.", destaque: false, confirmar: false },
  { id: "3621", nome: "Banco lombar 45°", grupo: "core", musculos: "Lombar, glúteos e posteriores",
    texto: "Apoio de quadril e trava de tornozelos para a extensão de tronco inclinada.", destaque: false, confirmar: true },
  { id: "3622", nome: "Racks de agachamento", grupo: "pernas", musculos: "Pernas, glúteos e core",
    texto: "Suportes com travas de segurança para agachamento, desenvolvimento e supino com barra livre.", destaque: false, confirmar: true },
  { id: "3609", nome: "Esteira curva", grupo: "cardio", musculos: "Cardio e pernas",
    texto: "Sem motor: é a sua passada que faz a lona girar. Quanto mais forte, mais rápido.", destaque: true, confirmar: false },
  { id: "3610", nome: "Simulador de escada", grupo: "cardio", musculos: "Cardio, glúteos e panturrilhas",
    texto: "Degraus que não acabam. Pouco tempo, muito gasto calórico.", destaque: false, confirmar: true },
  { id: "3625", nome: "Halteres Elite Drako", grupo: "pesos", musculos: "Corpo todo",
    texto: "Halteres redondos com o dragão da casa estampado. No salão há pares de 35, 40 e 45 kg.", destaque: true, confirmar: false },
  { id: "3573", nome: "Anilhas de 20 kg", grupo: "pesos", musculos: "Corpo todo",
    texto: "Anilhas de borracha vermelhas e pretas, com pegada vazada, organizadas em árvores pelo salão.", destaque: false, confirmar: false },
  { id: "3598", nome: "Barras e puxadores", grupo: "pesos", musculos: "Costas, braços e ombros",
    texto: "Barra W, puxadores de remada e pegadores de triângulo: os acessórios para polia e barra livre.", destaque: false, confirmar: false },
  { id: "3626", nome: "Suporte de barras", grupo: "pesos", musculos: "Corpo todo",
    texto: "Barras retas, W e de pegada neutra, todas à mão num só lugar.", destaque: false, confirmar: false }
];

window.DRAKO_GRUPOS = [
  { id: "todos", nome: "Tudo" },
  { id: "pernas", nome: "Pernas" },
  { id: "costas", nome: "Costas" },
  { id: "peito", nome: "Peito" },
  { id: "core", nome: "Core" },
  { id: "multi", nome: "Multiuso" },
  { id: "pesos", nome: "Pesos livres" },
  { id: "cardio", nome: "Cardio" }
];
