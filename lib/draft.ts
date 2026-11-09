import { useSyncExternalStore } from 'react';

import { toISO } from './game';

// Rascunho da reserva: a tela Agendar e o calendário compartilham a escolha de
// data, quadra, horário e tipo (jogo livre ou aula com professor).
export type Draft = {
  date: string;
  hour: number | null;
  courtId: string | null;
  kind: 'jogo' | 'aula';
  teacherId: string | null;
};

let state: Draft = { date: toISO(new Date()), hour: null, courtId: null, kind: 'jogo', teacherId: null };
const subs = new Set<() => void>();

export function setDraft(patch: Partial<Draft>) {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
}

function subscribe(cb: () => void) {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}

export function useDraft(): Draft {
  const get = () => {
    // se o app ficou aberto até virar o dia, volta para hoje
    const today = toISO(new Date());
    if (state.date < today) state = { ...state, date: today, hour: null };
    return state;
  };
  return useSyncExternalStore(subscribe, get, get);
}
