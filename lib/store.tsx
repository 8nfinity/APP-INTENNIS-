import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { initialPlayers, initialPosts, ME_ID, POINTS } from './data';
import { Booking, Match, Player, Post } from './types';

type NewBooking = Omit<Booking, 'id' | 'status'>;

type Store = {
  players: Player[];
  me: Player;
  bookings: Booking[];
  matches: Match[];
  posts: Post[];
  isSlotTaken: (courtId: string, date: string, hour: number) => boolean;
  addBooking: (b: NewBooking) => void;
  checkIn: (bookingId: string) => number;
  challenge: (opponentId: string) => void;
  finishMatch: (matchId: string, result: 'vitoria' | 'derrota', score: string) => void;
  toggleKudos: (postId: string) => void;
  addPost: (p: { text: string; imageUri?: string; tag: Post['tag']; score?: string }) => void;
  updateProfile: (patch: Partial<Pick<Player, 'name' | 'username' | 'bio'>>) => void;
};

const Ctx = createContext<Store | null>(null);

let seq = 100;
const nextId = (prefix: string) => `${prefix}${seq++}`;

// Horários "ocupados" de mentira, estáveis por data/quadra/hora.
function fakeTaken(courtId: string, date: string, hour: number) {
  let h = 0;
  const s = `${courtId}${date}${hour}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 97;
  return h % 4 === 0;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const givePoints = useCallback((playerId: string, pts: number, patch?: (p: Player) => Partial<Player>) => {
    setPlayers((list) =>
      list.map((p) =>
        p.id === playerId
          ? { ...p, points: p.points + pts, monthPoints: p.monthPoints + pts, ...(patch ? patch(p) : {}) }
          : p,
      ),
    );
  }, []);

  const isSlotTaken = useCallback(
    (courtId: string, date: string, hour: number) =>
      fakeTaken(courtId, date, hour) ||
      bookings.some((b) => b.courtId === courtId && b.date === date && b.hour === hour),
    [bookings],
  );

  const addBooking = useCallback((b: NewBooking) => {
    setBookings((list) => [...list, { ...b, id: nextId('b'), status: 'pago' }]);
  }, []);

  // Pontos só saem quando a pessoa realmente aparece: evita farmar reserva.
  const checkIn = useCallback(
    (bookingId: string) => {
      const b = bookings.find((x) => x.id === bookingId);
      if (!b || b.status === 'concluido') return 0;
      const pts = b.kind === 'aula' ? POINTS.aula : POINTS.jogoAgendado;
      setBookings((list) => list.map((x) => (x.id === bookingId ? { ...x, status: 'concluido' } : x)));
      givePoints(ME_ID, pts, (p) => (b.kind === 'aula' ? { classes: p.classes + 1 } : {}));
      return pts;
    },
    [bookings, givePoints],
  );

  const challenge = useCallback((opponentId: string) => {
    setMatches((list) => [...list, { id: nextId('m'), opponentId, status: 'agendado' }]);
  }, []);

  const finishMatch = useCallback(
    (matchId: string, result: 'vitoria' | 'derrota', score: string) => {
      setMatches((list) =>
        list.map((m) => (m.id === matchId ? { ...m, status: 'finalizado', result, score } : m)),
      );
      const won = result === 'vitoria';
      givePoints(ME_ID, won ? POINTS.vitoria : POINTS.derrota, (p) => ({
        wins: p.wins + (won ? 1 : 0),
        losses: p.losses + (won ? 0 : 1),
        streak: won ? p.streak + 1 : 0,
      }));
    },
    [givePoints],
  );

  const toggleKudos = useCallback((postId: string) => {
    setPosts((list) =>
      list.map((p) =>
        p.id === postId
          ? { ...p, kudosByMe: !p.kudosByMe, kudos: p.kudos + (p.kudosByMe ? -1 : 1) }
          : p,
      ),
    );
  }, []);

  const addPost = useCallback((p: { text: string; imageUri?: string; tag: Post['tag']; score?: string }) => {
    setPosts((list) => [
      { id: nextId('po'), authorId: ME_ID, kudos: 0, comments: 0, kudosByMe: false, when: 'agora', ...p },
      ...list,
    ]);
  }, []);

  const updateProfile = useCallback<Store['updateProfile']>((patch) => {
    setPlayers((list) => list.map((p) => (p.id === ME_ID ? { ...p, ...patch } : p)));
  }, []);

  const value = useMemo<Store>(
    () => ({
      players,
      me: players.find((p) => p.id === ME_ID)!,
      bookings,
      matches,
      posts,
      isSlotTaken,
      addBooking,
      checkIn,
      challenge,
      finishMatch,
      toggleKudos,
      addPost,
      updateProfile,
    }),
    [players, bookings, matches, posts, isSlotTaken, addBooking, checkIn, challenge, finishMatch, toggleKudos, addPost, updateProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fora do StoreProvider');
  return s;
}
