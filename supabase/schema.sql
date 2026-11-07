-- ============================================================
-- Elite Drako Gym — banco de dados (Supabase / Postgres)
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run.
-- Visitantes do site podem só INSERIR (enviar cadastro/pedido).
-- Ler, editar e apagar fica restrito a quem faz login no painel (admin.html).
-- ============================================================

create table if not exists public.cadastros (
  id          bigint generated always as identity primary key,
  criado_em   timestamptz not null default now(),
  tipo        text not null check (tipo in ('matricula', 'visita', 'drako30', 'novembro-azul', 'interesse')),
  -- 'interesse' = "Avise-me quando chegar" da loja; o produto vai em observacoes
  nome        text not null check (char_length(nome) between 2 and 120),
  telefone    text not null check (char_length(telefone) between 8 and 30),
  email       text check (email is null or char_length(email) <= 160),
  nascimento  date,
  objetivo    text,
  turno       text,
  nivel       text,
  convidado   text,
  convidado_telefone text,
  observacoes text check (observacoes is null or char_length(observacoes) <= 1000),
  status      text not null default 'novo' check (status in ('novo', 'contatado', 'matriculado', 'cancelado'))
);

create table if not exists public.pedidos (
  id          bigint generated always as identity primary key,
  criado_em   timestamptz not null default now(),
  nome        text not null check (char_length(nome) between 2 and 120),
  telefone    text not null check (char_length(telefone) between 8 and 30),
  entrega     text,
  itens       jsonb not null,
  total       numeric(10,2) not null check (total >= 0),
  status      text not null default 'novo' check (status in ('novo', 'pago', 'entregue', 'cancelado'))
);

-- ------------------------------------------------------------
-- Migração (para quem já rodou uma versão anterior deste arquivo):
-- o "create table if not exists" acima não altera uma tabela que já existe,
-- então a regra do campo tipo é refeita aqui para aceitar 'interesse' e 'novembro-azul'.
-- Pode rodar de novo sem problema.
-- ------------------------------------------------------------
alter table public.cadastros drop constraint if exists cadastros_tipo_check;
alter table public.cadastros add constraint cadastros_tipo_check
  check (tipo in ('matricula', 'visita', 'drako30', 'novembro-azul', 'interesse'));

alter table public.cadastros enable row level security;
alter table public.pedidos   enable row level security;

-- Qualquer visitante pode enviar (inserir), mas não pode ler nada.
drop policy if exists "site insere cadastros" on public.cadastros;
create policy "site insere cadastros" on public.cadastros
  for insert to anon, authenticated with check (status = 'novo');

drop policy if exists "site insere pedidos" on public.pedidos;
create policy "site insere pedidos" on public.pedidos
  for insert to anon, authenticated with check (status = 'novo');

-- Só a equipe logada (usuários criados em Authentication → Users) lê e atualiza.
drop policy if exists "equipe le cadastros" on public.cadastros;
create policy "equipe le cadastros" on public.cadastros
  for select to authenticated using (true);
drop policy if exists "equipe atualiza cadastros" on public.cadastros;
create policy "equipe atualiza cadastros" on public.cadastros
  for update to authenticated using (true) with check (true);

drop policy if exists "equipe le pedidos" on public.pedidos;
create policy "equipe le pedidos" on public.pedidos
  for select to authenticated using (true);
drop policy if exists "equipe atualiza pedidos" on public.pedidos;
create policy "equipe atualiza pedidos" on public.pedidos
  for update to authenticated using (true) with check (true);

-- Importante: em Authentication → Providers → Email, desligue "Allow new users to sign up"
-- e crie manualmente os usuários da equipe em Authentication → Users → Add user.
-- Assim ninguém de fora consegue criar uma conta e ler os cadastros.
