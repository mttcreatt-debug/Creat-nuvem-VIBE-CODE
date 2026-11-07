# Elite Drako Gym — site

Site institucional da Elite Drako Gym (Valente-BA). HTML, CSS e JavaScript puros, sem etapa de build:
basta abrir `index.html` ou publicar a pasta em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel).

## Estrutura

```
index.html          página única (hero, estrutura, obra, horários, planos, dúvidas, visita, rodapé)
styles.css          estilos; tokens de cor e tipo no topo (:root)
main.js             status "aberto agora", abas, perguntas, formulário, animações
assets/img/         fotos, logo e favicon da academia
assets/video/       vídeo do salão (hero) e loop de treino
```

## Ideia visual

O hexágono alongado do neon do teto da academia é a única forma do site: recorta as fotos,
os botões, os marcadores da lista de horários e a faixa que divide a página. Cores tiradas
do logo (vermelho `#b3181b` e preto), fonte Saira (letras quadradas, próximas às do logo).

## O que confirmar antes de divulgar

- **Preço**: Plano mensal a R$ 119,90 (valor de tabela do flyer "Lote 02").
- **Visita guiada grátis**: o bloco de planos oferece uma visita gratuita com agendamento — confirmar com a academia.
- **Endereço**: o site diz só "Valente, Bahia"; incluir rua e número quando houver.
- **Contato**: o formulário monta a mensagem e abre o direct do Instagram `@elite_drakogym`.
  Se houver WhatsApp oficial, dá para trocar o link em `main.js` (`ig.me/m/elite_drakogym`).
- **Horários** (do flyer oficial): seg a sex 05h–00h, sáb 07h–18h, dom 08h–15h. Se mudarem,
  atualize `HOURS` em `main.js` e o texto em `index.html`.

## Publicar no GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → Branch `main`, pasta `/ (root)`.
