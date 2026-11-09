import { toISO } from './game';

export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const MONTHS_SHORT = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
export const WEEK_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
// calendário começa na segunda, como no protótipo
export const WEEK_HEAD = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export const parseISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (iso: string, n: number) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

// "9 de novembro"
export const longDay = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}`;
};

// "09 de nov."
export const shortDay = (iso: string) => {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2, '0')} de ${MONTHS_SHORT[d.getMonth()]}`;
};

// células do mês começando na segunda: null = espaço antes do dia 1
export function monthCells(y: number, m: number): (string | null)[] {
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7; // segunda = 0
  const dim = new Date(y, m + 1, 0).getDate();
  return [...Array.from({ length: lead }, () => null), ...Array.from({ length: dim }, (_, i) => toISO(new Date(y, m, i + 1)))];
}

// de 0 a 3 pontos conforme o quanto o dia está cheio
export function occupancyDots(taken: number, total: number): number {
  if (!total || taken <= 0) return 0;
  const r = taken / total;
  return r < 0.34 ? 1 : r < 0.67 ? 2 : 3;
}
