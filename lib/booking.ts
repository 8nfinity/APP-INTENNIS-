import { api, errMsg } from './api';
import { notify } from './dialog';
import { fmtDate, toISO } from './game';
import { Booking } from './types';

export const pad2 = (n: number) => String(n).padStart(2, '0');

// "Quadra 1" vira "Quadra 01" (como no protótipo); nomes personalizados ficam como estão
export const courtLabel = (name: string, index: number) => (/^quadra\s*\d+$/i.test(name) ? `Quadra ${pad2(index + 1)}` : name);

// Mesma regra do servidor: o check-in abre 1 hora antes e fecha no fim do horário reservado.
export function checkinInfo(b: Booking, now = new Date()) {
  if (b.status === 'concluido') return { state: 'done' as const, label: 'Check-in feito ✓' };
  if (b.status !== 'pago') return { state: 'none' as const, label: '' };
  const today = toISO(now);
  const h = now.getHours();
  if (b.date === today && h >= b.hour - 1 && h <= b.hour) return { state: 'open' as const, label: 'Fazer check-in' };
  if (b.date > today || (b.date === today && h < b.hour - 1)) {
    return {
      state: 'soon' as const,
      label: `Check-in abre ${b.date === today ? 'hoje' : `em ${fmtDate(b.date)}`} às ${pad2(b.hour - 1)}:00`,
    };
  }
  return { state: 'closed' as const, label: 'Check-in encerrado' };
}

export async function doCheckIn(id: string): Promise<boolean> {
  try {
    const { points } = await api<{ points: number }>(`/bookings/${id}/checkin`, { method: 'POST' });
    notify('Presença confirmada! 🎾', `Você ganhou +${points} pontos no ranking.`);
    return true;
  } catch (e) {
    notify('Check-in', errMsg(e));
    return false;
  }
}
