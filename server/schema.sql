-- Rode este arquivo no Supabase: SQL Editor > New query > colar > Run.

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,               -- liga ao login do Supabase Auth
  name text not null,
  username text not null unique check (username ~ '^[a-z0-9._]{3,}$'),
  bio text not null default '',
  points int not null default 0,
  month_points int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  classes int not null default 0,
  streak int not null default 0,
  created_at timestamptz not null default now()
);

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
  payment_method text not null check (payment_method in ('pix','cartao')),
  payment_id text,                          -- id da cobrança no gateway
  status text not null default 'pendente' check (status in ('pendente','pago','concluido','cancelado')),
  created_at timestamptz not null default now()
);
-- Impede duas reservas pagas/pendentes no mesmo horário da mesma quadra.
create unique index if not exists bookings_slot_unique
  on bookings (court_id, date, hour) where status in ('pendente','pago','concluido');

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references players(id),
  opponent_id uuid not null references players(id),
  status text not null default 'agendado' check (status in ('agendado','finalizado')),
  winner_id uuid references players(id),
  score text,
  confirmed_by_opponent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references players(id) on delete cascade,
  text text not null default '',
  media_url text,
  tag text not null check (tag in ('jogo','treino','foto','video')),
  score text,
  created_at timestamptz not null default now()
);

create table if not exists kudos (
  post_id uuid references posts(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  primary key (post_id, player_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null check (category in ('torneio','jogo','aula','novidade')),
  date date not null,
  place text not null default ''
);

insert into courts (id, name, surface, price_per_hour) values
  ('c1','Quadra 1','Saibro',80),
  ('c2','Quadra 2','Saibro',80),
  ('c3','Quadra 3','Rápida',70)
on conflict (id) do nothing;
