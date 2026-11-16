// Monta a pasta .vercel-build (site estático + função /api) para publicar na Vercel.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, '.vercel-build');
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f !== '.vercel') fs.rmSync(path.join(out, f), { recursive: true, force: true });
const copy = (from, to) => fs.cpSync(path.join(root, from), path.join(out, to), { recursive: true });
copy('web', 'public');
for (const f of ['index.js', 'api.js', 'auth.js', 'storage.js']) copy('server/' + f, 'server/' + f);
fs.mkdirSync(path.join(out, 'api'), { recursive: true });
fs.writeFileSync(path.join(out, 'api/index.js'), "module.exports = require('../server/index.js');\n");
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'server/package.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify({ name: 'in-tennis', private: true, version: '1.0.0', dependencies: pkg.dependencies, engines: { node: '22.x' } }, null, 2));
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.neon.tech; media-src 'self' blob: https://*.neon.tech; font-src 'self' data:; connect-src 'self' blob: data: https://*.neon.tech; object-src 'none'; frame-ancestors 'none'";
fs.writeFileSync(path.join(out, 'vercel.json'), JSON.stringify({
  regions: ['iad1'], // perto do banco (Neon, us-east-1)
  rewrites: [{ source: '/api/(.*)', destination: '/api/index' }],
  headers: [
    { source: '/(.*)', headers: [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
    ] },
    { source: '/(app.js|app.css|base.css|design-v2.css|integracao.css|index.html)', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
  ],
}, null, 2));
console.log('pronto:', out);
