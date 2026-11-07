# Elite Drako Gym — site

Site da Elite Drako Gym (Valente-BA): home cinematográfica com tour 3D, loja com carrinho,
cadastros (matrícula, visita, Drako 30) e painel da equipe. HTML, CSS e JavaScript puros,
sem etapa de build: funciona em qualquer hospedagem estática (GitHub Pages, Vercel, Netlify).

## Páginas

| Página | O que tem |
| --- | --- |
| `index.html` | Abertura em tela cheia, a história (galpão → academia) com o comparador projeto 3D × realidade, tour 3D com as fotos de outubro, salão em panorâmica giratória, o arsenal de máquinas animadas, anilha 3D, horários, vitrine, planos, Drako 30, dúvidas |
| `historia.html` | Linha do tempo completa: prédio, galpão vazio, projeto 3D, chegada das máquinas, montagem, inauguração, Drako 30 e a academia em outubro |
| `maquinas.html` | Todas as máquinas recortadas e tratadas, filtro por grupo muscular e ficha de cada uma com a foto no salão |
| `loja.html` | Catálogo com filtros (planos, serviços, roupas, eventos), carrinho e envio do pedido |
| `cadastro.html` | Matrícula, visita guiada ou lista do Drako 30, num formulário só |
| `admin.html` | Painel da equipe: login, cadastros e pedidos, mudança de status, busca e exportação em planilha (CSV) |

## Arquivos que você edita

- **`config.js`** — WhatsApp, Instagram, endereço e as chaves do Supabase. É o único arquivo obrigatório.
- **`data/produtos.js`** — produtos, preços, fotos e categorias da loja.
- **`data/maquinas.js`** — nome, grupo muscular e descrição de cada máquina.

## Como os pedidos e cadastros funcionam

1. O visitante monta o pedido (ou preenche o cadastro).
2. Se o Supabase estiver configurado, os dados são salvos no banco e aparecem no `admin.html`.
3. Em seguida abre a conversa com a mensagem pronta: no **WhatsApp** se `whatsapp` estiver
   preenchido em `config.js`; senão no **direct do Instagram** (a mensagem vai copiada para colar).
4. O pagamento (Pix/cartão) é combinado na conversa. Não há cobrança automática no site.

## Ligar o banco de dados (Supabase) — uns 10 minutos

1. Crie uma conta e um projeto em <https://supabase.com> (plano gratuito serve).
2. No projeto: **SQL Editor → New query**, cole o conteúdo de `supabase/schema.sql` e clique **Run**.
3. **Authentication → Providers → Email**: desligue *Allow new users to sign up*.
4. **Authentication → Users → Add user**: crie o e-mail e a senha de quem vai usar o painel.
5. **Settings → API**: copie a *Project URL* e a chave *anon public* para `config.js`.
6. Pronto: entre em `admin.html` com o usuário criado.

A chave *anon* é pública por natureza. Quem protege os dados são as regras do `schema.sql`:
o site só consegue **inserir**; ler e alterar exige login da equipe.

## Publicar

**GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
**Vercel/Netlify:** importe o repositório; não precisa de comando de build.

## O 3D

`tour3d.js` usa three.js (copiado em `assets/vendor/`, sem depender de CDN). Sem WebGL, ou com
"reduzir movimento" ligado no aparelho, o tour vira uma sequência de fotos com legenda e a
anilha vira foto. As legendas de cada lugar estão no próprio `index.html` (bloco `.cenas`).

## O que confirmar antes de divulgar

- **Preços de exemplo** (marcados `confirmar: true` em `data/produtos.js`): diária R$ 20,00,
  avaliação física R$ 50,00, camiseta R$ 79,90, ingresso Drako 30 R$ 30,00. O plano mensal
  (R$ 119,90) veio do flyer oficial.
- **Nomes das máquinas** (marcados `confirmar: true` em `data/maquinas.js`): identificados pelas fotos.
- **Datas da linha do tempo**: fevereiro (obra/projeto), junho (chegada), julho (montagem e
  inauguração em 18/07), 30/08 (Drako 30) e outubro (fotos atuais). Confirmar o mês da chegada.
- **Visita guiada grátis**: confirmar se a academia oferece.
- **WhatsApp e endereço**: preencher em `config.js`.
- **Data da próxima edição do Drako 30**.
- **Fotos de pessoas**: o atleta e a equipe aparecem no site; confirme que todos autorizaram o uso de imagem.

## Origem das imagens

Todas do Google Drive da creat.mtt, só fotos da própria academia: "Drako fotos" (outubro),
Obras/Processo (fevereiro, com os renders do projeto), Equipamentos, ensaio "Fotos Cauã – Drako",
SITE(FOTOS) e Identidade Visual. Nenhuma foto de produto de outra marca é usada.

- **Panorâmica do salão** (`assets/img/tour/salao-panorama.jpg`): 5 fotos de outubro costuradas
  com OpenCV. Cobre cerca de 190° do salão; uma volta completa de 360° precisa dos vídeos originais.
- **Máquinas** (`assets/img/maquinas/`): fundo removido com IA (rembg, modelo isnet), cor
  corrigida para tirar o alaranjado da luz. `m*.webp` é o recorte, `f*.jpg` é a foto no salão.
- Fotos e vídeos acima de ~6 MB do Drive (HEIC de máxima qualidade e os MOV da academia vazia)
  não passam pelo conector. Para usar esses originais, compartilhe a pasta por link por alguns
  minutos ou exporte versões menores.

## Como adicionar um evento

A página `eventos.html` monta a agenda e os capítulos sozinha a partir de dois arquivos:

1. **`data/eventos-media.json`**: acrescente um item na lista `eventos` com
   `id` (sem espaços, ex.: `"novembro-azul"`), `titulo`, `data` (`"AAAA-MM-DD"`, ou `"AAAA-MM"` se o dia
   ainda não está fechado), `status` (`"em-breve"` ou `"realizado"`), `resumo` (2 ou 3 frases),
   `fotos` e `videos`. Cada foto: `{ "src", "alt", "w", "h" }`; cada vídeo: `{ "src", "poster", "alt", "w", "h" }`
   e `"som": true` só se o áudio importa (aparece o botão "Ligar som"). Arte de divulgação opcional em `arte`.
2. **`data/eventos.js`** (opcional): com o mesmo `id`, os detalhes de texto: `tema`, `publico`,
   `horarios`, `programa`, `premios` e os botões `cta` (`[{ texto, href }]`).

Fotos em `assets/img/eventos/<id>/` (jpg até ~350 KB, lado maior até 1600 px, com o LUT aplicado),
vídeos em `assets/video/eventos/` (h264, até 4 MB, sem som). Eventos `em-breve` vão para "Próximos";
quando o evento acontecer, troque para `realizado` e coloque as fotos. O vídeo do topo da página
fica direto em `eventos.html` (seção `ev-hero`). Abra o site por um servidor (não por `file://`),
porque a página lê o JSON.
