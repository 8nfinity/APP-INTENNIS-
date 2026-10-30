const crypto = require('crypto');

// Valida o token de login (JWT) perguntando ao Supabase Auth quem é o usuário.
// Funciona com qualquer tipo de chave de assinatura do projeto.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

const cache = new Map(); // hash do token -> { user, exp }
const TTL_MS = 60 * 1000;

function sha(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function requireAuth(req, res, next) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(503).json({ error: 'Autenticação não configurada' });
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || token.length > 4096) return res.status(401).json({ error: 'Não autenticado' });

  const key = sha(token);
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) {
    req.user = hit.user;
    return next();
  }

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    const u = await r.json();
    if (!u || !u.id) return res.status(401).json({ error: 'Sessão inválida' });
    req.user = { id: u.id, email: u.email, confirmed: !!u.email_confirmed_at };
    cache.set(key, { user: req.user, exp: Date.now() + TTL_MS });
    if (cache.size > 5000) cache.clear();
    next();
  } catch {
    res.status(502).json({ error: 'Falha ao validar sessão' });
  }
}

module.exports = { requireAuth };
