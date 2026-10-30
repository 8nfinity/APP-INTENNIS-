import { Platform } from 'react-native';

// A chave "publishable" do Supabase é pública por projeto: ela só dá acesso ao
// login. Os dados ficam protegidos por RLS e só passam pelo nosso servidor.
export const SUPABASE_URL = 'https://qyfvnqktlxpwnbwpfbeo.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_3o3nGIoot4LrY_ELoXmWYg_bORMpjIK';

export const PUBLIC_URL = 'https://web-production-96f49.up.railway.app';

// No navegador o app é servido pelo mesmo servidor da API; no celular aponta para o Railway.
export const API_BASE = Platform.OS === 'web' ? '' : PUBLIC_URL;
