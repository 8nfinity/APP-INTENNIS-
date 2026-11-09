// Regras visíveis da gamificação. Os valores reais de pontos são aplicados no servidor.
export const POINTS = { vitoria: 30, derrota: 10, aula: 20, jogoAgendado: 10 };

// Os melhores do ranking são convidados para o torneio.
export const TOURNAMENT_SPOTS = 8;

export const LEVELS = [
  { name: 'Iniciante', min: 0, color: '#6E7A71' },
  { name: 'Bronze', min: 100, color: '#B07A45' },
  { name: 'Prata', min: 300, color: '#7C8A92' },
  { name: 'Ouro', min: 600, color: '#B8901E' },
  { name: 'Platina', min: 1000, color: '#3E8FB0' },
  { name: 'Lenda', min: 1500, color: '#6E8A1E' },
];

export function levelFor(points: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (points >= l.min) idx = i;
  });
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next ? (points - current.min) / (next.min - current.min) : 1;
  return { current, next, progress, toNext: next ? next.min - points : 0 };
}

export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fmtDate(iso: string) {
  return iso.split('-').reverse().join('/');
}

const AVATAR_COLORS = ['#D4F23C', '#E8A07A', '#8FC7B0', '#C9B8E8', '#F0B8C8', '#7BD39A', '#E8CF7A', '#8FD0DC'];
export function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return `há ${Math.floor(s / 86400)} d`;
}
