const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const { requireAuth } = require('./auth');
const buildApi = require('./api');

const SUPABASE_URL = process.env.SUPABASE_URL || '';

const app = express();
app.set('trust proxy', 1); // Railway fica na frente: necessário para o limite por IP
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://*.supabase.co'],
        mediaSrc: ["'self'", 'blob:', 'https://*.supabase.co'],
        fontSrc: ["'self'", 'data:'],
        // blob:/data: permitem ao app ler a foto/vídeo escolhido no navegador antes do envio
        connectSrc: ["'self'", 'blob:', 'data:', 'https://*.supabase.co', 'wss://*.supabase.co'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);
app.use(express.json({ limit: '20kb' }));

// Banco: Supabase Postgres. Defina DATABASE_URL nas variáveis do Railway.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 10 })
  : null;

app.get('/api/health', async (_req, res) => {
  if (!pool) return res.json({ ok: true, db: 'não configurado' });
  try {
    await pool.query('select 1');
    res.json({ ok: true, db: 'conectado' });
  } catch {
    res.status(500).json({ ok: false, db: 'erro' });
  }
});

const limits = {
  general: rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false }),
  writes: rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'GET',
    message: { error: 'Muitas ações em pouco tempo. Aguarde um instante.' },
  }),
};

if (pool) {
  app.use(
    '/api',
    limits.general,
    limits.writes,
    requireAuth,
    buildApi(pool, {
      simulatedPayments: process.env.ALLOW_SIMULATED_PAYMENTS === 'true',
      supabaseUrl: SUPABASE_URL,
      // E-mails (separados por vírgula) que viram administradores ao entrar, se o e-mail estiver confirmado.
      adminEmails: (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    }),
  );
} else {
  app.use('/api', (_req, res) => res.status(503).json({ error: 'Banco não configurado' }));
}

// Versão web do app (gerada por `expo export --platform web`).
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'não encontrado' });
  res.sendFile(path.join(publicDir, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor na porta ${port}`));
