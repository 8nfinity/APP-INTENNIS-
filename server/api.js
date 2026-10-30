const express = require('express');

const HOURS = [7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21];
const CLASS_EXTRA = 60;
const POINTS = { match_win: 30, match_loss: 10, booking_jogo: 10, booking_aula: 20 };
const DAILY_MATCH_POINT_CAP = 3; // partidas que pontuam por dia, evita "farmar" ponto
const PENDING_MINUTES = 15;
const MAX_DAYS_AHEAD = 365; // dá para reservar com até 1 ano de antecedência
const TZ = 'America/Sao_Paulo';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const USERNAME = /^[a-z0-9._]{3,20}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const bad = (m) => new HttpError(400, m);

function str(v, { min = 0, max, field }) {
  if (typeof v !== 'string') throw bad(`${field} inválido`);
  const t = v.trim();
  if (t.length < min || t.length > max) throw bad(`${field} deve ter entre ${min} e ${max} caracteres`);
  return t;
}

function nowSp() {
  const d = new Date();
  const date = d.toLocaleDateString('en-CA', { timeZone: TZ });
  const hour = Number(d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).slice(0, 2));
  return { date, hour };
}

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

const PLAYER_SQL = `
  select p.id, p.name, p.username, p.bio, p.is_admin as "isAdmin", p.avatar_url as "avatarUrl",
    coalesce((select sum(points) from point_events where player_id = p.id), 0)::int as points,
    coalesce((select sum(points) from point_events where player_id = p.id
      and created_at >= date_trunc('month', now() at time zone '${TZ}') at time zone '${TZ}'), 0)::int as "monthPoints",
    (select count(*) from matches m where m.status = 'finalizado' and m.winner_id = p.id)::int as wins,
    (select count(*) from matches m where m.status = 'finalizado'
      and p.id in (m.challenger_id, m.opponent_id) and m.winner_id <> p.id)::int as losses,
    (select count(*) from bookings b where b.player_id = p.id and b.kind = 'aula' and b.status = 'concluido')::int as classes
  from players p`;

module.exports = function buildApi(pool, { simulatedPayments, supabaseUrl, adminEmails = [] }) {
  const r = express.Router();
  const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

  async function me(req) {
    const { rows } = await pool.query(`${PLAYER_SQL} where p.auth_user_id = $1`, [req.user.id]);
    const p = rows[0] || null;
    // Administrador pela lista ADMIN_EMAILS, só com e-mail confirmado (evita alguém
    // se cadastrar com o e-mail de outra pessoa e virar admin).
    if (p && !p.isAdmin && req.user.confirmed && adminEmails.includes((req.user.email || '').toLowerCase())) {
      await pool.query('update players set is_admin = true where id = $1', [p.id]);
      p.isAdmin = true;
    }
    return p;
  }
  async function needMe(req) {
    const p = await me(req);
    if (!p) throw new HttpError(409, 'Complete seu perfil antes de continuar');
    return p;
  }
  async function needAdmin(req) {
    const p = await needMe(req);
    if (!p.isAdmin) throw new HttpError(403, 'Apenas administradores');
    return p;
  }
  const avatarPrefix = (uid) => `${supabaseUrl}/storage/v1/object/public/avatars/${uid}/`;
  async function withStreaks(players) {
    if (!players.length) return players;
    const { rows } = await pool.query(
      `select winner_id, challenger_id, opponent_id from matches where status = 'finalizado' order by confirmed_at desc nulls last limit 2000`,
    );
    const streak = new Map();
    const done = new Set();
    for (const m of rows) {
      for (const pid of [m.challenger_id, m.opponent_id]) {
        if (done.has(pid)) continue;
        if (m.winner_id === pid) streak.set(pid, (streak.get(pid) || 0) + 1);
        else done.add(pid);
      }
    }
    return players.map((p) => ({ ...p, streak: streak.get(p.id) || 0 }));
  }

  // ---------- perfil ----------
  r.get('/me', wrap(async (req, res) => {
    const p = await me(req);
    if (!p) return res.json({ player: null, email: req.user.email });
    res.json({ player: (await withStreaks([p]))[0], email: req.user.email });
  }));

  r.post('/me', wrap(async (req, res) => {
    if (await me(req)) throw new HttpError(409, 'Perfil já existe');
    const name = str(req.body.name, { min: 2, max: 60, field: 'Nome' });
    const username = str(req.body.username, { min: 3, max: 20, field: 'Usuário' }).toLowerCase();
    const bio = str(req.body.bio ?? '', { max: 160, field: 'Bio' });
    if (!USERNAME.test(username)) throw bad('Usuário: 3 a 20 letras minúsculas, números, ponto ou underline');
    try {
      await pool.query('insert into players (auth_user_id, name, username, bio) values ($1,$2,$3,$4)', [
        req.user.id, name, username, bio,
      ]);
    } catch (e) {
      if (e.code === '23505') throw new HttpError(409, 'Esse usuário já existe');
      throw e;
    }
    res.status(201).json({ player: await me(req) });
  }));

  r.patch('/me', wrap(async (req, res) => {
    const p = await needMe(req);
    const name = req.body.name === undefined ? p.name : str(req.body.name, { min: 2, max: 60, field: 'Nome' });
    const bio = req.body.bio === undefined ? p.bio : str(req.body.bio, { max: 160, field: 'Bio' });
    const username =
      req.body.username === undefined ? p.username : str(req.body.username, { min: 3, max: 20, field: 'Usuário' }).toLowerCase();
    if (!USERNAME.test(username)) throw bad('Usuário: 3 a 20 letras minúsculas, números, ponto ou underline');
    let avatarUrl = p.avatarUrl;
    if (req.body.avatarUrl !== undefined) {
      if (req.body.avatarUrl === null) avatarUrl = null;
      else {
        // Só aceita foto enviada para a pasta da própria pessoa no nosso storage.
        const u = req.body.avatarUrl;
        if (typeof u !== 'string' || !u.startsWith(avatarPrefix(req.user.id)) || u.length > 400) throw bad('Foto inválida');
        avatarUrl = u;
      }
    }
    try {
      await pool.query('update players set name=$1, bio=$2, username=$3, avatar_url=$4 where id=$5', [
        name, bio, username, avatarUrl, p.id,
      ]);
    } catch (e) {
      if (e.code === '23505') throw new HttpError(409, 'Esse usuário já existe');
      throw e;
    }
    res.json({ player: (await withStreaks([await me(req)]))[0] });
  }));

  // Apaga todos os dados da pessoa. A conta de login em si precisa ser removida
  // pelo painel do Supabase (exige a chave de serviço, que não fica neste servidor).
  r.delete('/me', wrap(async (req, res) => {
    await pool.query('delete from players where auth_user_id = $1', [req.user.id]);
    res.json({ ok: true });
  }));

  // ---------- ranking ----------
  r.get('/ranking', wrap(async (req, res) => {
    await needMe(req);
    const { rows } = await pool.query(`${PLAYER_SQL} order by points desc, p.created_at asc limit 200`);
    res.json({ players: await withStreaks(rows) });
  }));

  // ---------- quadras e reservas ----------
  r.get('/courts', wrap(async (_req, res) => {
    const { rows } = await pool.query(
      'select id, name, surface, price_per_hour::float as "pricePerHour" from courts where active order by id',
    );
    res.json({ courts: rows, hours: HOURS, classExtra: CLASS_EXTRA, maxDaysAhead: MAX_DAYS_AHEAD });
  }));

  async function expirePending() {
    await pool.query(
      `update bookings set status = 'cancelado'
       where status = 'pendente' and created_at < now() - ($1 || ' minutes')::interval`,
      [PENDING_MINUTES],
    );
  }

  r.get('/availability', wrap(async (req, res) => {
    const date = String(req.query.date || '');
    if (!DATE.test(date)) throw bad('Data inválida');
    await expirePending();
    const { rows } = await pool.query(
      `select court_id as "courtId", hour from bookings
         where date = $1 and status in ('pendente','pago','concluido')
       union
       select court_id, hour from court_blocks where date = $1`,
      [date],
    );
    res.json({ taken: rows });
  }));

  // Ocupação por dia (para o calendário e o mapa dos próximos dias).
  r.get('/availability/summary', wrap(async (req, res) => {
    const from = String(req.query.from || '');
    const days = Math.min(62, Math.max(1, Number(req.query.days) || 30));
    if (!DATE.test(from)) throw bad('Data inválida');
    const to = addDays(from, days - 1);
    await expirePending();
    const { rows } = await pool.query(
      `select to_char(date,'YYYY-MM-DD') as date, count(*)::int as taken from (
         select date, court_id, hour from bookings
           where status in ('pendente','pago','concluido') and date between $1 and $2
         union
         select date, court_id, hour from court_blocks where date between $1 and $2
       ) t
       where court_id in (select id from courts where active)
       group by date`,
      [from, to],
    );
    const active = (await pool.query('select count(*)::int as n from courts where active')).rows[0].n;
    res.json({ days: rows, slotsPerDay: active * HOURS.length });
  }));

  r.get('/bookings', wrap(async (req, res) => {
    const p = await needMe(req);
    await expirePending();
    const { rows } = await pool.query(
      `select id, court_id as "courtId", to_char(date,'YYYY-MM-DD') as date, hour, kind,
              price::float as price, payment_method as method, status
       from bookings where player_id = $1 and status <> 'cancelado'
       order by date desc, hour desc limit 100`,
      [p.id],
    );
    res.json({ bookings: rows });
  }));

  r.post('/bookings', wrap(async (req, res) => {
    const p = await needMe(req);
    const { courtId, date, kind } = req.body;
    const hour = Number(req.body.hour);
    if (typeof courtId !== 'string' || !DATE.test(String(date)) || !['jogo', 'aula'].includes(kind)) throw bad('Dados inválidos');
    if (!HOURS.includes(hour)) throw bad('Horário inválido');
    const today = nowSp();
    if (date < today.date || date > addDays(today.date, MAX_DAYS_AHEAD)) {
      throw bad('Dá para reservar com até 1 ano de antecedência');
    }
    if (date === today.date && hour <= today.hour) throw bad('Esse horário já passou');

    const court = (await pool.query('select id, price_per_hour::float as price from courts where id = $1 and active', [courtId])).rows[0];
    if (!court) throw bad('Quadra inválida');
    const blocked = await pool.query('select 1 from court_blocks where court_id = $1 and date = $2 and hour = $3', [courtId, date, hour]);
    if (blocked.rowCount) throw new HttpError(409, 'Esse horário está indisponível');
    const price = court.price + (kind === 'aula' ? CLASS_EXTRA : 0); // o preço vem SEMPRE do servidor

    await expirePending();
    try {
      const { rows } = await pool.query(
        `insert into bookings (player_id, court_id, date, hour, kind, price)
         values ($1,$2,$3,$4,$5,$6)
         returning id, court_id as "courtId", to_char(date,'YYYY-MM-DD') as date, hour, kind, price::float as price, status`,
        [p.id, courtId, date, hour, kind, price],
      );
      res.status(201).json({ booking: rows[0], holdMinutes: PENDING_MINUTES });
    } catch (e) {
      if (e.code === '23505') throw new HttpError(409, 'Esse horário acabou de ser reservado por outra pessoa');
      throw e;
    }
  }));

  // Pagamento. Em produção, quem marca "pago" é o webhook do gateway (Pix/cartão).
  // Enquanto não houver gateway, o modo simulado precisa ser ligado de propósito.
  r.post('/bookings/:id/pay', wrap(async (req, res) => {
    const p = await needMe(req);
    if (!UUID.test(req.params.id)) throw bad('Reserva inválida');
    const method = req.body.method;
    if (!['pix', 'cartao'].includes(method)) throw bad('Forma de pagamento inválida');
    if (!simulatedPayments) throw new HttpError(501, 'Pagamento online ainda não está disponível');
    const { rowCount } = await pool.query(
      `update bookings set status = 'pago', payment_method = $1, payment_id = 'SIMULADO'
       where id = $2 and player_id = $3 and status = 'pendente'`,
      [method, req.params.id, p.id],
    );
    if (!rowCount) throw new HttpError(409, 'Reserva expirada ou já paga. Escolha o horário novamente.');
    res.json({ ok: true });
  }));

  r.post('/bookings/:id/checkin', wrap(async (req, res) => {
    const p = await needMe(req);
    if (!UUID.test(req.params.id)) throw bad('Reserva inválida');
    const client = await pool.connect();
    try {
      await client.query('begin');
      const b = (await client.query(
        `select id, kind, to_char(date,'YYYY-MM-DD') as date, hour, status from bookings
         where id = $1 and player_id = $2 for update`,
        [req.params.id, p.id],
      )).rows[0];
      if (!b) throw new HttpError(404, 'Reserva não encontrada');
      if (b.status !== 'pago') throw new HttpError(409, b.status === 'concluido' ? 'Check-in já feito' : 'Reserva não está paga');
      const now = nowSp();
      if (b.date !== now.date || now.hour < b.hour - 1 || now.hour > b.hour) {
        throw new HttpError(409, 'O check-in abre 1 hora antes e fecha ao fim do horário reservado');
      }
      const reason = b.kind === 'aula' ? 'booking_aula' : 'booking_jogo';
      await client.query("update bookings set status = 'concluido', checked_in_at = now() where id = $1", [b.id]);
      await client.query('insert into point_events (player_id, points, reason, ref_id) values ($1,$2,$3,$4)', [
        p.id, POINTS[reason], reason, b.id,
      ]);
      await client.query('commit');
      res.json({ points: POINTS[reason] });
    } catch (e) {
      await client.query('rollback');
      throw e;
    } finally {
      client.release();
    }
  }));

  // ---------- jogos entre jogadores ----------
  const MATCH_SQL = `
    select m.id, m.status, m.score, m.reported_by as "reportedBy", m.winner_id as "winnerId",
           m.challenger_id as "challengerId", m.opponent_id as "opponentId",
           o.id as "otherId", o.name as "otherName", o.username as "otherUsername", o.avatar_url as "otherAvatarUrl"
    from matches m
    join players o on o.id = case when m.challenger_id = $1 then m.opponent_id else m.challenger_id end
    where $1 in (m.challenger_id, m.opponent_id)`;

  r.get('/matches', wrap(async (req, res) => {
    const p = await needMe(req);
    const { rows } = await pool.query(`${MATCH_SQL} order by m.created_at desc limit 50`, [p.id]);
    res.json({ matches: rows });
  }));

  r.post('/matches', wrap(async (req, res) => {
    const p = await needMe(req);
    const opponentId = req.body.opponentId;
    if (typeof opponentId !== 'string' || !UUID.test(opponentId)) throw bad('Adversário inválido');
    if (opponentId === p.id) throw bad('Você não pode desafiar a si mesmo');
    const opp = (await pool.query('select id from players where id = $1', [opponentId])).rows[0];
    if (!opp) throw new HttpError(404, 'Jogador não encontrado');
    const open = await pool.query(
      `select 1 from matches where status in ('agendado','aguardando_confirmacao')
       and least(challenger_id, opponent_id) = least($1::uuid, $2::uuid)
       and greatest(challenger_id, opponent_id) = greatest($1::uuid, $2::uuid)`,
      [p.id, opponentId],
    );
    if (open.rowCount) throw new HttpError(409, 'Já existe um jogo em aberto com essa pessoa');
    const { rows } = await pool.query('insert into matches (challenger_id, opponent_id) values ($1,$2) returning id', [
      p.id, opponentId,
    ]);
    res.status(201).json({ id: rows[0].id });
  }));

  // Um dos jogadores informa o resultado; o OUTRO precisa confirmar.
  r.post('/matches/:id/report', wrap(async (req, res) => {
    const p = await needMe(req);
    if (!UUID.test(req.params.id)) throw bad('Jogo inválido');
    const result = req.body.result;
    if (!['vitoria', 'derrota'].includes(result)) throw bad('Resultado inválido');
    const score = str(req.body.score ?? '', { max: 40, field: 'Placar' });
    const m = (await pool.query('select * from matches where id = $1', [req.params.id])).rows[0];
    if (!m || ![m.challenger_id, m.opponent_id].includes(p.id)) throw new HttpError(404, 'Jogo não encontrado');
    if (m.status !== 'agendado') throw new HttpError(409, 'Esse jogo não aceita novo resultado');
    const other = m.challenger_id === p.id ? m.opponent_id : m.challenger_id;
    await pool.query(
      `update matches set status = 'aguardando_confirmacao', reported_by = $1, winner_id = $2, score = $3 where id = $4`,
      [p.id, result === 'vitoria' ? p.id : other, score, m.id],
    );
    res.json({ ok: true });
  }));

  r.post('/matches/:id/confirm', wrap(async (req, res) => {
    const p = await needMe(req);
    if (!UUID.test(req.params.id)) throw bad('Jogo inválido');
    const accept = req.body.accept === true;
    const client = await pool.connect();
    try {
      await client.query('begin');
      const m = (await client.query('select * from matches where id = $1 for update', [req.params.id])).rows[0];
      if (!m || ![m.challenger_id, m.opponent_id].includes(p.id)) throw new HttpError(404, 'Jogo não encontrado');
      if (m.status !== 'aguardando_confirmacao') throw new HttpError(409, 'Nada para confirmar');
      if (m.reported_by === p.id) throw new HttpError(403, 'Quem informou o resultado não pode confirmá-lo');
      if (!accept) {
        await client.query("update matches set status = 'agendado', reported_by = null, winner_id = null, score = null where id = $1", [m.id]);
        await client.query('commit');
        return res.json({ ok: true, finalized: false });
      }
      await client.query("update matches set status = 'finalizado', confirmed_at = now() where id = $1", [m.id]);
      const loser = m.winner_id === m.challenger_id ? m.opponent_id : m.challenger_id;
      for (const [pid, reason] of [[m.winner_id, 'match_win'], [loser, 'match_loss']]) {
        const used = (await client.query(
          `select count(*)::int as n from point_events
           where player_id = $1 and reason in ('match_win','match_loss')
             and (created_at at time zone '${TZ}')::date = (now() at time zone '${TZ}')::date`,
          [pid],
        )).rows[0].n;
        const pts = used >= DAILY_MATCH_POINT_CAP ? 0 : POINTS[reason];
        await client.query('insert into point_events (player_id, points, reason, ref_id) values ($1,$2,$3,$4)', [pid, pts, reason, m.id]);
      }
      await client.query('commit');
      res.json({ ok: true, finalized: true });
    } catch (e) {
      await client.query('rollback');
      throw e;
    } finally {
      client.release();
    }
  }));

  // ---------- eventos ----------
  r.get('/events', wrap(async (req, res) => {
    await needMe(req);
    const { rows } = await pool.query(
      `select id, title, description, category, to_char(date,'YYYY-MM-DD') as date, place
       from events where date >= current_date - 1 order by date asc limit 100`,
    );
    res.json({ events: rows });
  }));

  r.post('/events', wrap(async (req, res) => {
    const p = await needMe(req);
    if (!p.isAdmin) throw new HttpError(403, 'Apenas administradores');
    const title = str(req.body.title, { min: 3, max: 100, field: 'Título' });
    const description = str(req.body.description ?? '', { max: 500, field: 'Descrição' });
    const place = str(req.body.place ?? '', { max: 100, field: 'Local' });
    if (!['torneio', 'jogo', 'aula', 'novidade'].includes(req.body.category)) throw bad('Categoria inválida');
    if (!DATE.test(String(req.body.date))) throw bad('Data inválida');
    await pool.query('insert into events (title, description, category, date, place) values ($1,$2,$3,$4,$5)', [
      title, description, req.body.category, req.body.date, place,
    ]);
    res.status(201).json({ ok: true });
  }));

  // ---------- social ----------
  r.get('/posts', wrap(async (req, res) => {
    const p = await needMe(req);
    const { rows } = await pool.query(
      `select po.id, po.text, po.media_url as "mediaUrl", po.tag, po.score, po.created_at as "createdAt",
              a.id as "authorId", a.name as "authorName", a.username as "authorUsername", a.avatar_url as "authorAvatarUrl",
              (select count(*) from kudos k where k.post_id = po.id)::int as kudos,
              exists(select 1 from kudos k where k.post_id = po.id and k.player_id = $1) as "kudosByMe",
              (select count(*) from comments c where c.post_id = po.id)::int as comments
       from posts po join players a on a.id = po.author_id
       order by po.created_at desc limit 50`,
      [p.id],
    );
    res.json({ posts: rows });
  }));

  r.post('/posts', wrap(async (req, res) => {
    const p = await needMe(req);
    const text = str(req.body.text ?? '', { max: 1000, field: 'Texto' });
    const score = str(req.body.score ?? '', { max: 40, field: 'Placar' }) || null;
    if (!['jogo', 'treino', 'foto', 'video'].includes(req.body.tag)) throw bad('Tipo inválido');
    let mediaUrl = null;
    if (req.body.mediaUrl) {
      // Só aceita mídia enviada para a pasta da própria pessoa no nosso storage.
      const prefix = `${supabaseUrl}/storage/v1/object/public/posts/${req.user.id}/`;
      if (typeof req.body.mediaUrl !== 'string' || !req.body.mediaUrl.startsWith(prefix) || req.body.mediaUrl.length > 400) {
        throw bad('Mídia inválida');
      }
      mediaUrl = req.body.mediaUrl;
    }
    if (!text && !mediaUrl) throw bad('Escreva algo ou anexe uma mídia');
    await pool.query('insert into posts (author_id, text, media_url, tag, score) values ($1,$2,$3,$4,$5)', [
      p.id, text, mediaUrl, req.body.tag, score,
    ]);
    res.status(201).json({ ok: true });
  }));

  r.delete('/posts/:id', wrap(async (req, res) => {
    const p = await needMe(req);
    if (!UUID.test(req.params.id)) throw bad('Post inválido');
    const { rowCount } = await pool.query('delete from posts where id = $1 and (author_id = $2 or $3)', [
      req.params.id, p.id, p.isAdmin,
    ]);
    if (!rowCount) throw new HttpError(404, 'Post não encontrado');
    res.json({ ok: true });
  }));

  r.post('/posts/:id/kudos', wrap(async (req, res) => {
    const p = await needMe(req);
    if (!UUID.test(req.params.id)) throw bad('Post inválido');
    const exists = await pool.query('select 1 from posts where id = $1', [req.params.id]);
    if (!exists.rowCount) throw new HttpError(404, 'Post não encontrado');
    const del = await pool.query('delete from kudos where post_id = $1 and player_id = $2', [req.params.id, p.id]);
    if (!del.rowCount) await pool.query('insert into kudos (post_id, player_id) values ($1,$2) on conflict do nothing', [req.params.id, p.id]);
    res.json({ kudosByMe: !del.rowCount });
  }));

  r.get('/posts/:id/comments', wrap(async (req, res) => {
    await needMe(req);
    if (!UUID.test(req.params.id)) throw bad('Post inválido');
    const { rows } = await pool.query(
      `select c.id, c.text, c.created_at as "createdAt", a.name as "authorName", a.username as "authorUsername", a.avatar_url as "authorAvatarUrl"
       from comments c join players a on a.id = c.author_id
       where c.post_id = $1 order by c.created_at asc limit 200`,
      [req.params.id],
    );
    res.json({ comments: rows });
  }));

  r.post('/posts/:id/comments', wrap(async (req, res) => {
    const p = await needMe(req);
    if (!UUID.test(req.params.id)) throw bad('Post inválido');
    const text = str(req.body.text, { min: 1, max: 500, field: 'Comentário' });
    const exists = await pool.query('select 1 from posts where id = $1', [req.params.id]);
    if (!exists.rowCount) throw new HttpError(404, 'Post não encontrado');
    await pool.query('insert into comments (post_id, author_id, text) values ($1,$2,$3)', [req.params.id, p.id, text]);
    res.status(201).json({ ok: true });
  }));

  // ---------- administração (tudo exige is_admin) ----------
  const adm = express.Router();
  adm.use((req, _res, next) => {
    needAdmin(req)
      .then((p) => {
        req.admin = p;
        next();
      })
      .catch(next);
  });

  adm.get('/stats', wrap(async (_req, res) => {
    const q = async (sql) => (await pool.query(sql)).rows[0];
    const players = await q('select count(*)::int as n from players');
    const today = await q(
      `select count(*)::int as n from bookings where status in ('pago','concluido') and date = (now() at time zone '${TZ}')::date`,
    );
    const upcoming = await q(
      `select count(*)::int as n from bookings where status = 'pago' and date >= (now() at time zone '${TZ}')::date`,
    );
    const revenue = await q(
      `select coalesce(sum(price),0)::float as n from bookings
       where status in ('pago','concluido') and payment_id is distinct from 'SIMULADO'
         and date >= date_trunc('month', now() at time zone '${TZ}')::date`,
    );
    const posts = await q('select count(*)::int as n from posts');
    const pendingMatches = await q(`select count(*)::int as n from matches where status = 'aguardando_confirmacao'`);
    res.json({
      players: players.n,
      bookingsToday: today.n,
      bookingsUpcoming: upcoming.n,
      revenueMonth: revenue.n, // só pagamentos reais; os simulados não entram
      posts: posts.n,
      pendingMatches: pendingMatches.n,
    });
  }));

  adm.get('/courts', wrap(async (_req, res) => {
    const { rows } = await pool.query(
      'select id, name, surface, price_per_hour::float as "pricePerHour", active from courts order by id',
    );
    res.json({ courts: rows });
  }));

  adm.post('/courts', wrap(async (req, res) => {
    const name = str(req.body.name, { min: 2, max: 40, field: 'Nome' });
    const surface = str(req.body.surface, { min: 2, max: 30, field: 'Piso' });
    const price = Number(req.body.pricePerHour);
    if (!(price >= 0 && price <= 5000)) throw bad('Preço inválido');
    const id = `c${Date.now().toString(36)}`;
    await pool.query('insert into courts (id, name, surface, price_per_hour) values ($1,$2,$3,$4)', [id, name, surface, price]);
    res.status(201).json({ id });
  }));

  adm.patch('/courts/:id', wrap(async (req, res) => {
    const c = (await pool.query('select * from courts where id = $1', [req.params.id])).rows[0];
    if (!c) throw new HttpError(404, 'Quadra não encontrada');
    const name = req.body.name === undefined ? c.name : str(req.body.name, { min: 2, max: 40, field: 'Nome' });
    const surface = req.body.surface === undefined ? c.surface : str(req.body.surface, { min: 2, max: 30, field: 'Piso' });
    const price = req.body.pricePerHour === undefined ? Number(c.price_per_hour) : Number(req.body.pricePerHour);
    if (!(price >= 0 && price <= 5000)) throw bad('Preço inválido');
    const active = req.body.active === undefined ? c.active : req.body.active === true;
    await pool.query('update courts set name=$1, surface=$2, price_per_hour=$3, active=$4 where id=$5', [
      name, surface, price, active, c.id,
    ]);
    res.json({ ok: true });
  }));

  adm.get('/blocks', wrap(async (_req, res) => {
    const { rows } = await pool.query(
      `select b.id, b.court_id as "courtId", c.name as "courtName", to_char(b.date,'YYYY-MM-DD') as date, b.hour, b.reason
       from court_blocks b join courts c on c.id = b.court_id
       where b.date >= (now() at time zone '${TZ}')::date order by b.date, b.hour limit 200`,
    );
    res.json({ blocks: rows });
  }));

  adm.post('/blocks', wrap(async (req, res) => {
    const { courtId, date } = req.body;
    const hour = Number(req.body.hour);
    const reason = str(req.body.reason ?? '', { max: 100, field: 'Motivo' });
    if (typeof courtId !== 'string' || !DATE.test(String(date)) || !HOURS.includes(hour)) throw bad('Dados inválidos');
    const taken = await pool.query(
      `select 1 from bookings where court_id = $1 and date = $2 and hour = $3 and status in ('pendente','pago','concluido')`,
      [courtId, date, hour],
    );
    if (taken.rowCount) throw new HttpError(409, 'Já existe uma reserva nesse horário. Cancele a reserva primeiro.');
    try {
      await pool.query('insert into court_blocks (court_id, date, hour, reason) values ($1,$2,$3,$4)', [courtId, date, hour, reason]);
    } catch (e) {
      if (e.code === '23505') throw new HttpError(409, 'Esse horário já está bloqueado');
      if (e.code === '23503') throw bad('Quadra inválida');
      throw e;
    }
    res.status(201).json({ ok: true });
  }));

  adm.delete('/blocks/:id', wrap(async (req, res) => {
    if (!UUID.test(req.params.id)) throw bad('Bloqueio inválido');
    await pool.query('delete from court_blocks where id = $1', [req.params.id]);
    res.json({ ok: true });
  }));

  adm.get('/bookings', wrap(async (req, res) => {
    const date = String(req.query.date || '');
    const byDate = DATE.test(date);
    const { rows } = await pool.query(
      `select b.id, b.court_id as "courtId", c.name as "courtName", to_char(b.date,'YYYY-MM-DD') as date, b.hour,
              b.kind, b.price::float as price, b.status, p.name as "playerName", p.username as "playerUsername"
       from bookings b join courts c on c.id = b.court_id join players p on p.id = b.player_id
       where b.status <> 'cancelado' and ${byDate ? 'b.date = $1' : `b.date >= (now() at time zone '${TZ}')::date and $1::text is not null`}
       order by b.date, b.hour limit 200`,
      [byDate ? date : 'x'],
    );
    res.json({ bookings: rows });
  }));

  adm.post('/bookings/:id/cancel', wrap(async (req, res) => {
    if (!UUID.test(req.params.id)) throw bad('Reserva inválida');
    const { rowCount } = await pool.query(
      `update bookings set status = 'cancelado' where id = $1 and status in ('pendente','pago')`,
      [req.params.id],
    );
    if (!rowCount) throw new HttpError(409, 'Essa reserva não pode ser cancelada');
    res.json({ ok: true });
  }));

  adm.get('/players', wrap(async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 40);
    const { rows } = await pool.query(
      `${PLAYER_SQL} where ($1 = '' or p.name ilike '%' || $1 || '%' or p.username ilike '%' || $1 || '%')
       order by points desc, p.created_at asc limit 100`,
      [q],
    );
    res.json({ players: rows });
  }));

  adm.post('/players/:id/points', wrap(async (req, res) => {
    if (!UUID.test(req.params.id)) throw bad('Jogador inválido');
    const points = Number(req.body.points);
    if (!Number.isInteger(points) || points === 0 || Math.abs(points) > 1000) throw bad('Pontos: número inteiro entre -1000 e 1000');
    const note = str(req.body.note ?? '', { min: 3, max: 100, field: 'Motivo' });
    const ok = await pool.query('select 1 from players where id = $1', [req.params.id]);
    if (!ok.rowCount) throw new HttpError(404, 'Jogador não encontrado');
    await pool.query(
      `insert into point_events (player_id, points, reason, ref_id, note) values ($1,$2,'admin_adjust',gen_random_uuid(),$3)`,
      [req.params.id, points, `${note} (por ${req.admin.username})`],
    );
    res.json({ ok: true });
  }));

  adm.post('/players/:id/admin', wrap(async (req, res) => {
    if (!UUID.test(req.params.id)) throw bad('Jogador inválido');
    if (req.params.id === req.admin.id) throw new HttpError(409, 'Você não pode alterar o seu próprio acesso');
    await pool.query('update players set is_admin = $1 where id = $2', [req.body.isAdmin === true, req.params.id]);
    res.json({ ok: true });
  }));

  adm.delete('/events/:id', wrap(async (req, res) => {
    if (!UUID.test(req.params.id)) throw bad('Evento inválido');
    await pool.query('delete from events where id = $1', [req.params.id]);
    res.json({ ok: true });
  }));

  r.use('/admin', adm);

  r.use((err, _req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  });

  return r;
};
