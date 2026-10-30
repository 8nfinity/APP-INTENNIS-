export type Player = {
  id: string;
  name: string;
  username: string;
  bio: string;
  points: number;
  monthPoints: number;
  wins: number;
  losses: number;
  classes: number;
  streak: number;
  color: string;
};

export type Court = {
  id: string;
  name: string;
  surface: string;
  pricePerHour: number;
};

export type BookingKind = 'jogo' | 'aula';

export type Booking = {
  id: string;
  courtId: string;
  date: string; // yyyy-mm-dd
  hour: number;
  kind: BookingKind;
  price: number;
  method: 'pix' | 'cartao';
  status: 'pago' | 'concluido';
};

export type Match = {
  id: string;
  opponentId: string;
  status: 'agendado' | 'finalizado';
  result?: 'vitoria' | 'derrota';
  score?: string;
};

export type Post = {
  id: string;
  authorId: string;
  text: string;
  imageUri?: string;
  tag: 'jogo' | 'treino' | 'foto' | 'video';
  score?: string;
  kudos: number;
  comments: number;
  kudosByMe: boolean;
  when: string;
};

export type GameEvent = {
  id: string;
  title: string;
  description: string;
  category: 'torneio' | 'jogo' | 'aula' | 'novidade';
  date: string; // yyyy-mm-dd
  place: string;
};
