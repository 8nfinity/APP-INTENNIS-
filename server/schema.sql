-- Schema do In Tennis Club. É idempotente: pode ser rodado várias vezes.
-- Aplicar com: railway run --service web node server/migrate.js

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,               -- liga ao login do Supabase Auth
  name text not null,
  username text not null unique check (username ~ '^[a-z0-9._]{3,20}$'),
  bio text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table players add column if not exists is_admin boolean not null default false;

create table if not exists courts (
  id text primary key,
  name text not null,
  surface text not null,
  price_per_hour numeric(10,2) not null
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  court_id text not null references courts(id),
  date date not null,
  hour int not null check (hour between 0 and 23),
  kind text not null check (kind in ('jogo','aula')),
  price numeric(10,2) not null,
  payment_method text check (payment_method in ('pix','cartao')),
  payment_id text,                          -- id da cobrança no gateway
  status text not null default 'pendente' check (status in ('pendente','pago','concluido','cancelado')),
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);
alter table bookings alter column payment_method drop not null;
alter table bookings add column if not exists checked_in_at timestamptz;
-- Impede duas reservas no mesmo horário da mesma quadra.
create unique index if not exists bookings_slot_unique
  on bookings (court_id, date, hour) where status in ('pendente','pago','concluido');

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references players(id) on delete cascade,
  opponent_id uuid not null references players(id) on delete cascade,
  status text not null default 'agendado',
  winner_id uuid references players(id),
  score text,
  reported_by uuid references players(id),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  check (challenger_id <> opponent_id)
);
alter table matches add column if not exists reported_by uuid references players(id);
alter table matches add column if not exists confirmed_at timestamptz;
alter table matches drop constraint if exists matches_status_check;
alter table matches add constraint matches_status_check
  check (status in ('agendado','aguardando_confirmacao','finalizado','recusado'));

-- Histórico de pontos: o ranking é a soma daqui. A restrição única impede
-- ganhar pontos duas vezes pelo mesmo evento.
create table if not exists point_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  points int not null,
  reason text not null check (reason in ('match_win','match_loss','booking_jogo','booking_aula')),
  ref_id uuid not null,
  created_at timestamptz not null default now(),
  unique (player_id, reason, ref_id)
);
create index if not exists point_events_player on point_events (player_id, created_at);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references players(id) on delete cascade,
  text text not null default '' check (char_length(text) <= 1000),
  media_url text,
  tag text not null check (tag in ('jogo','treino','foto','video')),
  score text,
  created_at timestamptz not null default now()
);
create index if not exists posts_created on posts (created_at desc);

create table if not exists kudos (
  post_id uuid references posts(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  primary key (post_id, player_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references players(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists comments_post on comments (post_id, created_at);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null check (category in ('torneio','jogo','aula','novidade')),
  date date not null,
  place text not null default ''
);

-- ---------- v3: admin, foto de perfil, quadras ativas e bloqueios ----------
alter table players add column if not exists avatar_url text;
alter table courts add column if not exists active boolean not null default true;

create table if not exists court_blocks (
  id uuid primary key default gen_random_uuid(),
  court_id text not null references courts(id) on delete cascade,
  date date not null,
  hour int not null check (hour between 0 and 23),
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (court_id, date, hour)
);
alter table court_blocks enable row level security;

alter table point_events add column if not exists note text;
alter table point_events drop constraint if exists point_events_reason_check;
alter table point_events add constraint point_events_reason_check
  check (reason in ('match_win','match_loss','booking_jogo','booking_aula','admin_adjust'));

-- ---------- v4: professores ----------
-- Cada professor tem o próprio preço por aula. `player_id` liga o professor a
-- uma conta do app: é com ela que ele entra e vê a agenda.
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  player_id uuid unique references players(id) on delete set null,
  name text not null,
  bio text not null default '',
  price_per_hour numeric(10,2) not null check (price_per_hour >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table teachers enable row level security;

alter table bookings add column if not exists teacher_id uuid references teachers(id);
alter table bookings add column if not exists teacher_price numeric(10,2); -- valor do professor na data da reserva
-- o mesmo professor não pode ter duas aulas no mesmo horário
create unique index if not exists bookings_teacher_slot
  on bookings (teacher_id, date, hour) where teacher_id is not null and status in ('pendente','pago','concluido');

-- ---------- v5: interesse em eventos ----------
create table if not exists event_interests (
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, player_id)
);
alter table event_interests enable row level security;

-- Segurança: com RLS ligado e nenhuma policy, a chave pública do Supabase não
-- lê nem escreve nestas tabelas. Só o servidor (conexão direta, DATABASE_URL)
-- acessa, e ele valida o login e as permissões de cada pedido.
alter table players      enable row level security;
alter table courts       enable row level security;
alter table bookings     enable row level security;
alter table matches      enable row level security;
alter table point_events enable row level security;
alter table posts        enable row level security;
alter table kudos        enable row level security;
alter table comments     enable row level security;
alter table events       enable row level security;

insert into courts (id, name, surface, price_per_hour) values
  ('c1','Quadra 1','Saibro',80),
  ('c2','Quadra 2','Saibro',80),
  ('c3','Quadra 3','Rápida',70)
on conflict (id) do nothing;

insert into events (title, description, category, date, place)
select * from (values
  ('Torneio Open de Verão', 'Os 8 primeiros do ranking recebem convite direto. Premiação e troféu.', 'torneio', current_date + 21, 'Quadras principais'),
  ('Noite de duplas', 'Sorteio de duplas e jogos curtos. Vale pontos no ranking!', 'jogo', current_date + 4, 'Quadra 1 e 2'),
  ('Clínica de saque', 'Duas horas focadas em saque e devolução. Vagas limitadas.', 'aula', current_date + 9, 'Quadra 3'),
  ('Are you IN.?', 'O app do In Tennis Club chegou. Reserve, jogue e suba no ranking.', 'novidade', current_date, 'Online')
) as v(title, description, category, date, place)
where not exists (select 1 from events);

-- Armazenamento de fotos e vídeos dos posts. Cada pessoa só envia para a
-- própria pasta (<id do usuário>/arquivo). Leitura pública, limite de 20 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posts', 'posts', true, 20971520, array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Fotos de perfil: mesma regra (só na própria pasta), limite de 5 MB, só imagens.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_upload_own_folder" on storage.objects;
create policy "avatars_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own_files" on storage.objects;
create policy "avatars_delete_own_files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "posts_upload_own_folder" on storage.objects;
create policy "posts_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "posts_delete_own_files" on storage.objects;
create policy "posts_delete_own_files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
