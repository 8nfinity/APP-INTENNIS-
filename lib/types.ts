export type Player = {
  id: string;
  name: string;
  username: string;
  bio: string;
  isAdmin: boolean;
  points: number;
  monthPoints: number;
  wins: number;
  losses: number;
  classes: number;
  streak: number;
};

export type Court = { id: string; name: string; surface: string; pricePerHour: number };

export type BookingKind = 'jogo' | 'aula';

export type Booking = {
  id: string;
  courtId: string;
  date: string; // yyyy-mm-dd
  hour: number;
  kind: BookingKind;
  price: number;
  method: 'pix' | 'cartao' | null;
  status: 'pendente' | 'pago' | 'concluido' | 'cancelado';
};

export type MatchRow = {
  id: string;
  status: 'agendado' | 'aguardando_confirmacao' | 'finalizado' | 'recusado';
  score: string | null;
  reportedBy: string | null;
  winnerId: string | null;
  otherId: string;
  otherName: string;
  otherUsername: string;
};

export type Post = {
  id: string;
  text: string;
  mediaUrl: string | null;
  tag: 'jogo' | 'treino' | 'foto' | 'video';
  score: string | null;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  kudos: number;
  kudosByMe: boolean;
  comments: number;
};

export type Comment = {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
};

export type GameEvent = {
  id: string;
  title: string;
  description: string;
  category: 'torneio' | 'jogo' | 'aula' | 'novidade';
  date: string; // yyyy-mm-dd
  place: string;
};
