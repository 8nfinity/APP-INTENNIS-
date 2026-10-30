// Aplica o schema.sql no banco. Uso: railway run --service web node server/migrate.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

(async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não definida');
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  const { rows } = await client.query(
    "select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename",
  );
  console.table(rows);
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
