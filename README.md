# Elite Drako Gym — site

Site da Elite Drako Gym (Valente-BA): home cinematográfica com tour 3D, loja com carrinho,
cadastros (matrícula, visita, Drako 30) e painel da equipe. HTML, CSS e JavaScript puros,
sem etapa de build: funciona em qualquer hospedagem estática (GitHub Pages, Vercel, Netlify).

## Páginas

| Página | O que tem |
| --- | --- |
| `index.html` | Abertura em tela cheia com o vídeo do salão, tour 3D pelos hexágonos de neon com a leitura de cada lugar, anilha 3D que gira com o dedo, horários com status "aberto agora", vitrine, planos, Drako 30, dúvidas |
| `loja.html` | Catálogo com filtros (planos, roupas, suplementos, bebidas, eventos), carrinho e envio do pedido |
| `cadastro.html` | Matrícula, visita guiada ou lista do Drako 30, num formulário só |
| `admin.html` | Painel da equipe: login, cadastros e pedidos, mudança de status, busca e exportação em planilha (CSV) |

## Arquivos que você edita

- **`config.js`** — WhatsApp, Instagram, endereço e as chaves do Supabase. É o único arquivo obrigatório.
- **`data/produtos.js`** — produtos, preços, fotos e categorias da loja.

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
  camiseta R$ 79,90, Kit Drako R$ 249,90, whey R$ 149,90, creatina R$ 119,90, energético R$ 9,90,
  ingresso Drako 30 R$ 30,00. O plano mensal (R$ 119,90) veio do flyer oficial.
- **Visita guiada grátis**: confirmar se a academia oferece.
- **WhatsApp e endereço**: preencher em `config.js`.
- **Data da próxima edição do Drako 30**.
- **Fotos de pessoas**: o atleta e a equipe aparecem no site; confirme que todos autorizaram o uso de imagem.

## Origem das imagens

Todas do Google Drive da academia (ensaio "Fotos Cauã – Drako", SITE(FOTOS), Equipamentos,
Identidade Visual e campanhas Drako 30). Fotos de produtos foram recortadas da arte do Kit Drako.
