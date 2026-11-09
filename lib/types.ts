export type Player = {
  id: string;
  name: string;
  username: string;
  bio: string;
  isAdmin: boolean;
  avatarUrl: string | null;
  teacherId: string | null; // conta ligada a um professor: vê a agenda de aulas
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
  teacherName?: string | null;
};

export type Teacher = { id: string; name: string; bio: string; pricePerHour: number; avatarUrl: string | null };

export type TeacherClass = {
  id: string;
  date: string;
  hour: number;
  status: 'pago' | 'concluido';
  courtName: string;
  studentName: string;
  studentUsername: string;
  studentAvatarUrl: string | null;
  teacherPrice: number;
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
  otherAvatarUrl: string | null;
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
  authorAvatarUrl: string | null;
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
  authorAvatarUrl: string | null;
};

export type GameEvent = {
  id: string;
  title: string;
  description: string;
  category: 'torneio' | 'jogo' | 'aula' | 'novidade';
  date: string; // yyyy-mm-dd
  place: string;
  interestCount: number;
  interestedByMe: boolean;
};
