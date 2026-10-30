import { supabase } from './supabase';

export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
export const VIDEO_TYPES: Record<string, string> = { 'video/mp4': 'mp4' };

// Envia um arquivo para a pasta da própria pessoa no Supabase Storage e devolve a URL pública.
export async function uploadAsset(opts: {
  bucket: 'avatars' | 'posts';
  userId: string;
  uri: string;
  mime: string;
  ext: string;
  maxBytes: number;
}): Promise<string> {
  let bytes: ArrayBuffer;
  try {
    bytes = await (await fetch(opts.uri)).arrayBuffer();
  } catch {
    throw new Error('Não foi possível ler o arquivo escolhido.');
  }
  if (bytes.byteLength > opts.maxBytes) {
    throw new Error(`Arquivo muito grande. O limite é ${Math.round(opts.maxBytes / 1024 / 1024)} MB.`);
  }
  const path = `${opts.userId}/${Date.now()}.${opts.ext}`;
  const { error } = await supabase.storage.from(opts.bucket).upload(path, bytes, { contentType: opts.mime });
  if (error) throw new Error(`Falha no envio: ${error.message}`);
  return supabase.storage.from(opts.bucket).getPublicUrl(path).data.publicUrl;
}
