const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const { requireAuth, authRouter } = require('./auth');
const buildApi = require('./api');

// Arquivos ficam no Neon Object Storage (links temporários *.neon.tech).
const STORAGE_HOST = 'https://*.neon.tech';

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
        imgSrc: ["'self'", 'data:', 'blob:', STORAGE_HOST],
        mediaSrc: ["'self'", 'blob:', STORAGE_HOST],
        fontSrc: ["'self'", 'data:'],
        // blob:/data: permitem ao app ler a foto/vídeo escolhido no navegador antes do envio
        connectSrc: ["'self'", 'blob:', 'data:', STORAGE_HOST],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);
app.use(express.json({ limit: '20kb' }));

// Banco: Neon Postgres. Defina DATABASE_URL nas variáveis do servidor.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: process.env.VERCEL ? 3 : 10 })
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

// Login, cadastro e recuperação de senha (públicos, com limite mais rígido contra tentativas em massa)
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos.' },
});
app.use('/api/auth', authLimit, authRouter(express));

if (pool) {
  app.use(
    '/api',
    limits.general,
    limits.writes,
    requireAuth,
    buildApi(pool, {
      simulatedPayments: process.env.ALLOW_SIMULATED_PAYMENTS === 'true',
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

// Versão web do app (pasta web/, copiada para public/ no Docker).
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'não encontrado' });
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Local/Railway: sobe o servidor. Na Vercel, a função importa o app exportado.
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Servidor na porta ${port}`));
}
module.exports = app;
