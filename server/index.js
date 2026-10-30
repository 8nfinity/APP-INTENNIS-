const path = require('path');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Banco: Supabase Postgres. Defina DATABASE_URL nas variáveis do Railway.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

const needDb = (res) => {
  if (pool) return false;
  res.status(503).json({ error: 'DATABASE_URL não configurada' });
  return true;
};

app.get('/api/health', async (_req, res) => {
  if (!pool) return res.json({ ok: true, db: 'não configurado' });
  try {
    await pool.query('select 1');
    res.json({ ok: true, db: 'conectado' });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'erro', message: e.message });
  }
});

app.get('/api/ranking', async (_req, res) => {
  if (needDb(res)) return;
  try {
    const { rows } = await pool.query(
      'select id, name, username, points, month_points, wins, losses from players order by points desc limit 100',
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/events', async (_req, res) => {
  if (needDb(res)) return;
  try {
    const { rows } = await pool.query(
      'select id, title, description, category, date, place from events order by date asc',
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Versão web do app (gerada por `expo export --platform web`).
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'não encontrado' });
  res.sendFile(path.join(publicDir, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor na porta ${port}`));
