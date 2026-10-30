import { Court, GameEvent, Player, Post } from './types';

export const ME_ID = 'me';

export const courts: Court[] = [
  { id: 'c1', name: 'Quadra 1', surface: 'Saibro', pricePerHour: 80 },
  { id: 'c2', name: 'Quadra 2', surface: 'Saibro', pricePerHour: 80 },
  { id: 'c3', name: 'Quadra 3', surface: 'Rápida', pricePerHour: 70 },
];

export const HOURS = [7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21];

export const CLASS_PRICE_EXTRA = 60;

export const POINTS = { vitoria: 30, derrota: 10, aula: 20, jogoAgendado: 10 };

// Posição de corte: os melhores do ranking são convidados para o torneio.
export const TOURNAMENT_SPOTS = 8;

export const initialPlayers: Player[] = [
  p('me', 'Você', 'voce', 'Tenista de fim de semana 🎾', 140, 60, 4, 2, 1, 2, '#C8F03A'),
  p('p1', 'Rafael Moura', 'rafa.moura', 'Saibro é vida', 820, 210, 31, 9, 6, 5, '#E2753B'),
  p('p2', 'Camila Duarte', 'cami.duarte', 'Backhand de uma mão', 760, 190, 28, 11, 9, 4, '#5BC0EB'),
  p('p3', 'Lucas Prado', 'lucasprado', 'Sacador nato', 690, 120, 25, 12, 4, 1, '#B388FF'),
  p('p4', 'Ana Beatriz', 'anabia', 'Treino todo dia', 610, 230, 22, 10, 14, 7, '#FF7BAC'),
  p('p5', 'Thiago Reis', 'thiagoreis', 'Dupla é o melhor', 540, 80, 19, 13, 3, 0, '#FFD04A'),
  p('p6', 'Marina Lopes', 'marilopes', 'Voleio e cerveja', 480, 150, 17, 12, 8, 3, '#3DDC84'),
  p('p7', 'Diego Alves', 'diegoalves', 'Em busca do primeiro título', 420, 60, 15, 14, 2, 1, '#FF8A65'),
  p('p8', 'Julia Fontes', 'jufontes', 'Nova no esporte', 360, 140, 12, 11, 10, 6, '#4DD0E1'),
  p('p9', 'Pedro Henrique', 'pedrohm', 'Slice assassino', 300, 40, 10, 12, 1, 0, '#AED581'),
  p('p10', 'Bruna Teles', 'bruteles', 'Treino de manhã', 250, 90, 8, 9, 7, 2, '#F48FB1'),
  p('p11', 'Caio Mendes', 'caiom', 'Aprendendo ainda', 190, 70, 6, 8, 5, 1, '#90CAF9'),
];

function p(
  id: string,
  name: string,
  username: string,
  bio: string,
  points: number,
  monthPoints: number,
  wins: number,
  losses: number,
  classes: number,
  streak: number,
  color: string,
): Player {
  return { id, name, username, bio, points, monthPoints, wins, losses, classes, streak, color };
}

export const initialPosts: Post[] = [
  {
    id: 'po1',
    authorId: 'p1',
    text: 'Virada no terceiro set! 5-7, 6-4, 7-5. Saibro não perdoa 🔥',
    tag: 'jogo',
    score: '5-7 · 6-4 · 7-5',
    kudos: 24,
    comments: 6,
    kudosByMe: false,
    when: 'há 2 h',
  },
  {
    id: 'po2',
    authorId: 'p2',
    text: 'Treino de saque hoje cedo. 80 bolas, 62 dentro.',
    tag: 'treino',
    kudos: 15,
    comments: 2,
    kudosByMe: true,
    when: 'há 5 h',
  },
  {
    id: 'po3',
    authorId: 'p4',
    text: 'Melhor ponto da semana: lob no último momento 🚀',
    tag: 'video',
    kudos: 41,
    comments: 12,
    kudosByMe: false,
    when: 'ontem',
  },
];

function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const events: GameEvent[] = [
  {
    id: 'e1',
    title: 'Torneio Open de Verão',
    description: 'Os 8 primeiros do ranking recebem convite direto. Premiação em dinheiro e troféu.',
    category: 'torneio',
    date: inDays(21),
    place: 'Quadras principais',
  },
  {
    id: 'e2',
    title: 'Noite de duplas',
    description: 'Sorteio de duplas e jogos curtos. Vale pontos no ranking!',
    category: 'jogo',
    date: inDays(4),
    place: 'Quadra 1 e 2',
  },
  {
    id: 'e3',
    title: 'Clínica de saque com o prof. Marcos',
    description: 'Duas horas focadas em saque e devolução. Vagas limitadas.',
    category: 'aula',
    date: inDays(9),
    place: 'Quadra 3',
  },
  {
    id: 'e4',
    title: 'Quadra 3 reformada',
    description: 'Piso novo e iluminação LED. Reabre com horários promocionais.',
    category: 'novidade',
    date: inDays(1),
    place: 'Quadra 3',
  },
];

export const LEVELS = [
  { name: 'Iniciante', min: 0, color: '#8FA79A' },
  { name: 'Bronze', min: 100, color: '#D08A4E' },
  { name: 'Prata', min: 300, color: '#C5CDD3' },
  { name: 'Ouro', min: 600, color: '#FFD04A' },
  { name: 'Platina', min: 1000, color: '#5BC0EB' },
  { name: 'Lenda', min: 1500, color: '#C8F03A' },
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
