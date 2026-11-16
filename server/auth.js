const crypto = require('crypto');

// Login pelo Neon Auth (Better Auth gerenciado). O navegador nunca fala direto com ele:
// o servidor faz login/cadastro e devolve o "cookie de sessão" assinado, que o app guarda e
// manda de volta no cabeçalho Authorization. A cada chamada, o servidor pergunta ao Neon Auth quem é.
const BASE = (process.env.NEON_AUTH_BASE_URL || '').replace(/\/$/, '');
const ORIGIN = BASE ? new URL(BASE).origin : '';
const COOKIE = '__Secure-neon-auth.session_token';

const cache = new Map(); // hash do token -> { user, exp }
const TTL_MS = 60 * 1000;
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

async function neon(path, { method = 'GET', body, session } = {}) {
  const headers = { Origin: ORIGIN };
  if (body) headers['Content-Type'] = 'application/json';
  if (session) headers.Cookie = `${COOKIE}=${session}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  const setCookie = res.headers.get('set-cookie') || '';
  const m = new RegExp(`${COOKIE}=([^;]+)`).exec(setCookie);
  return { status: res.status, ok: res.ok, json, session: m ? m[1] : null };
}

const MSG = {
  INVALID_EMAIL_OR_PASSWORD: 'E-mail ou senha incorretos.',
  USER_ALREADY_EXISTS: 'Esse e-mail já tem conta. Entre ou recupere a senha.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Esse e-mail já tem conta. Entre ou recupere a senha.',
  PASSWORD_TOO_SHORT: 'A senha precisa ter pelo menos 8 caracteres.',
  PASSWORD_TOO_LONG: 'Senha muito longa.',
  INVALID_EMAIL: 'E-mail inválido.',
  INVALID_OTP: 'Código inválido ou expirado.',
  OTP_EXPIRED: 'Código expirado. Peça outro.',
  TOO_MANY_ATTEMPTS: 'Muitas tentativas. Peça um novo código.',
  EMAIL_NOT_VERIFIED: 'Confirme seu e-mail antes de entrar.',
};
const friendly = (j, fallback) => MSG[j?.code] || fallback;
const userOut = (u) => ({ id: u.id, email: u.email, confirmed: !!u.emailVerified });

function authRouter(express) {
  const r = express.Router();
  const wrap = (fn) => (req, res) =>
    fn(req, res).catch(() => res.status(502).json({ error: 'Não foi possível falar com o serviço de login. Tente novamente.' }));
  const str = (v, max) => (typeof v === 'string' && v.length <= max ? v : '');

  r.post('/sign-up', wrap(async (req, res) => {
    const email = str(req.body.email, 200).trim().toLowerCase();
    const password = str(req.body.password, 128);
    const name = str(req.body.name, 60).trim() || 'Jogador';
    if (!email || password.length < 8) return res.status(400).json({ error: 'Informe e-mail e uma senha de pelo menos 8 caracteres.' });
    const out = await neon('/sign-up/email', { method: 'POST', body: { email, password, name } });
    if (!out.ok) return res.status(out.status >= 500 ? 502 : 400).json({ error: friendly(out.json, 'Não foi possível criar a conta.') });
    // o cadastro já devolve a sessão; se não vier, faz o login em seguida
    let session = out.session;
    let user = out.json?.user;
    if (!session) {
      const login = await neon('/sign-in/email', { method: 'POST', body: { email, password } });
      session = login.session;
      user = login.json?.user;
    }
    if (!session || !user) return res.status(502).json({ error: 'Conta criada, mas não foi possível entrar. Tente entrar.' });
    res.json({ session, user: userOut(user) });
  }));

  r.post('/sign-in', wrap(async (req, res) => {
    const email = str(req.body.email, 200).trim().toLowerCase();
    const password = str(req.body.password, 128);
    if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' });
    const out = await neon('/sign-in/email', { method: 'POST', body: { email, password } });
    if (!out.ok || !out.session || !out.json?.user) return res.status(401).json({ error: friendly(out.json, 'E-mail ou senha incorretos.') });
    res.json({ session: out.session, user: userOut(out.json.user) });
  }));

  r.post('/sign-out', wrap(async (req, res) => {
    const token = (req.get('authorization') || '').replace(/^Bearer /, '');
    if (token) {
      cache.delete(sha(token));
      await neon('/sign-out', { method: 'POST', body: {}, session: token }).catch(() => {});
    }
    res.json({ ok: true });
  }));

  // Recuperar senha: envia um código de 6 dígitos por e-mail e depois troca a senha com ele.
  r.post('/forgot', wrap(async (req, res) => {
    const email = str(req.body.email, 200).trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Informe o e-mail.' });
    await neon('/email-otp/send-verification-otp', { method: 'POST', body: { email, type: 'forget-password' } });
    res.json({ ok: true }); // sempre ok: não revela se o e-mail existe
  }));

  r.post('/reset', wrap(async (req, res) => {
    const email = str(req.body.email, 200).trim().toLowerCase();
    const otp = str(req.body.otp, 12).trim();
    const password = str(req.body.password, 128);
    if (!email || !otp || password.length < 8) return res.status(400).json({ error: 'Informe o código e uma senha de pelo menos 8 caracteres.' });
    const out = await neon('/email-otp/reset-password', { method: 'POST', body: { email, otp, password } });
    if (!out.ok) return res.status(400).json({ error: friendly(out.json, 'Código inválido ou expirado.') });
    res.json({ ok: true });
  }));

  return r;
}

async function requireAuth(req, res, next) {
  if (!BASE) return res.status(503).json({ error: 'Autenticação não configurada' });
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || token.length > 2048) return res.status(401).json({ error: 'Não autenticado' });
  const key = sha(token);
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) {
    req.user = hit.user;
    return next();
  }
  try {
    const out = await neon('/get-session', { session: token });
    const u = out.json?.user;
    if (!out.ok || !u?.id) return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    req.user = { id: u.id, email: u.email, confirmed: !!u.emailVerified };
    cache.set(key, { user: req.user, exp: Date.now() + TTL_MS });
    if (cache.size > 5000) cache.clear();
    next();
  } catch {
    res.status(502).json({ error: 'Falha ao validar sessão' });
  }
}

module.exports = { requireAuth, authRouter };
