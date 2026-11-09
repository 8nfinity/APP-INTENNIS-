import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, errMsg } from './api';
import { PUBLIC_URL } from './config';
import { supabase } from './supabase';
import { Player } from './types';

type AuthState = {
  session: Session | null;
  player: Player | null;
  loading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ needsConfirm: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshPlayer: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

const friendly = (m: string) => {
  const t = m.toLowerCase();
  if (t.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (t.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar. Veja sua caixa de entrada.';
  if (t.includes('already registered')) return 'Esse e-mail já tem conta. Tente entrar.';
  if (t.includes('rate limit') || t.includes('too many')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (t.includes('password')) return 'Senha fraca. Use pelo menos 8 caracteres com letras e números.';
  return m;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [ready, setReady] = useState(false); // sessão local lida
  // de qual usuário o perfil já foi buscado: até lá o app fica carregando, sem
  // cair por engano na tela de "criar perfil" nem perder a tela atual.
  const [checkedFor, setCheckedFor] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const refreshPlayer = useCallback(async () => {
    if (!userId) {
      setPlayer(null);
      return;
    }
    try {
      const res = await api<{ player: Player | null }>('/me');
      setPlayer(res.player);
      setProfileError(null);
    } catch (e) {
      setProfileError(errMsg(e));
    } finally {
      setCheckedFor(userId);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!userId) setPlayer(null);
    else refreshPlayer();
  }, [userId, refreshPlayer]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      player,
      loading: !ready || (!!userId && checkedFor !== userId),
      profileError,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error(friendly(error.message));
      },
      signUp: async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: PUBLIC_URL, data: name ? { name } : undefined },
        });
        if (error) throw new Error(friendly(error.message));
        return { needsConfirm: !data.session };
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setPlayer(null);
      },
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: PUBLIC_URL });
        if (error) throw new Error(friendly(error.message));
      },
      refreshPlayer,
    }),
    [session, player, ready, userId, checkedFor, profileError, refreshPlayer],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
}

// Só para telas que só existem com login e perfil criado.
export function useMe(): Player {
  const { player } = useAuth();
  if (!player) throw new Error('Perfil não carregado');
  return player;
}
