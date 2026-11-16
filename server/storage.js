const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Fotos e vídeos no Neon Object Storage (compatível com S3). O bucket é privado:
// o app envia direto ao storage com um link temporário e lê por links temporários.
const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
const enabled = !!(S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);
const client = enabled
  ? new S3Client({
      region: S3_REGION || 'us-east-1',
      endpoint: S3_ENDPOINT,
      credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
    })
  : null;

const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

async function presignUpload(prefix, ownerId, contentType) {
  const ext = TYPES[contentType];
  if (!ext || !enabled) return null;
  const key = `${prefix}/${ownerId}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const url = await getSignedUrl(client, new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType }), {
    expiresIn: 300,
  });
  return { key, url };
}

// Link de leitura estável: a data de assinatura é arredondada para janelas de 6 h,
// então o mesmo arquivo mantém o mesmo link (o navegador aproveita o cache).
const WINDOW_MS = 6 * 3600 * 1000;
const cache = new Map();
async function signRead(key) {
  if (!enabled || typeof key !== 'string' || !key || /^https?:/.test(key)) return key || null;
  const win = Math.floor(Date.now() / WINDOW_MS);
  const hit = cache.get(key);
  if (hit && hit.win === win) return hit.url;
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), {
    expiresIn: 12 * 3600,
    signingDate: new Date(win * WINDOW_MS),
  });
  cache.set(key, { win, url });
  if (cache.size > 5000) cache.clear();
  return url;
}

// Troca, em qualquer resposta JSON, as chaves de arquivo (avatarUrl, mediaUrl…) por links temporários.
const URL_FIELD = /(avatarUrl|AvatarUrl|mediaUrl)$/;
async function signDeep(v) {
  if (Array.isArray(v)) return Promise.all(v.map(signDeep));
  if (v && typeof v === 'object') {
    const out = {};
    await Promise.all(
      Object.entries(v).map(async ([k, val]) => {
        out[k] = typeof val === 'string' && URL_FIELD.test(k) ? await signRead(val) : await signDeep(val);
      }),
    );
    return out;
  }
  return v;
}

module.exports = { enabled, TYPES, presignUpload, signRead, signDeep };
