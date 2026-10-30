import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Avatar, Button, Card, Gauge, H1, Muted, Screen, StatTile, Text, Title, formatBRL } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { checkinInfo, doCheckIn, pad2 } from '@/lib/booking';
import { confirmAsk, notify } from '@/lib/dialog';
import { fmtDate, levelFor, toISO } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { Booking, Court, Player } from '@/lib/types';

export default function Perfil() {
  const me = useMe();
  const { signOut, session, refreshPlayer } = useAuth();
  const rankQ = useFetch<{ players: Player[] }>('/ranking');
  const bookingsQ = useFetch<{ bookings: Booking[] }>('/bookings');
  const courtsQ = useFetch<{ courts: Court[] }>('/courts');

  const lvl = levelFor(me.points);
  const rank = (rankQ.data?.players ?? []).findIndex((p) => p.id === me.id) + 1;
  const games = me.wins + me.losses;
  const today = toISO(new Date());
  const key = (b: Booking) => b.date + pad2(b.hour);
  const all = bookingsQ.data?.bookings ?? [];
  const upcoming = all.filter((b) => b.status === 'pago' && b.date >= today).sort((a, b) => key(a).localeCompare(key(b)));
  const history = all.filter((b) => b.status === 'concluido').slice(0, 5);
  const courtName = (id: string) => courtsQ.data?.courts.find((c) => c.id === id)?.name ?? '';

  const badges = [
    { icon: '🎾', label: 'Primeiro jogo', on: games >= 1 },
    { icon: '🔥', label: 'Sequência de 3', on: me.streak >= 3 },
    { icon: '📚', label: 'Aluno dedicado', on: me.classes >= 5 },
    { icon: '🏅', label: '10 vitórias', on: me.wins >= 10 },
    { icon: '🏆', label: 'Top 8', on: rank > 0 && rank <= 8 },
    { icon: '⭐', label: '100 pontos', on: me.points >= 100 },
  ];

  const reload = () => {
    refreshPlayer();
    rankQ.reload();
    bookingsQ.reload();
  };

  const checkIn = async (id: string) => {
    if (await doCheckIn(id)) reload();
  };

  const deleteAccount = async () => {
    const ok = await confirmAsk(
      'Excluir meus dados?',
      'Seu perfil, reservas, jogos e posts serão apagados e você sairá do app. Isso não pode ser desfeito.',
      'Excluir',
      true,
    );
    if (!ok) return;
    try {
      await api('/me', { method: 'DELETE' });
      await signOut();
    } catch (e) {
      notify('Erro', errMsg(e));
    }
  };

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={s.top}>
        <Logo size={22} />
        {me.isAdmin && (
          <Pressable onPress={() => router.push('/admin')} style={s.adminBtn} hitSlop={8}>
            <Ionicons name="shield-checkmark" size={16} color={colors.onAccent} />
            <Text style={s.adminText}>Painel admin</Text>
          </Pressable>
        )}
      </View>

      <View style={s.head}>
        <Pressable onPress={() => router.push('/edit-profile')}>
          <Avatar name={me.name} url={me.avatarUrl} size={112} />
          <View style={s.camera}>
            <Ionicons name="camera" size={18} color={colors.onAccent} />
          </View>
        </Pressable>
        <H1 style={{ textAlign: 'center' }}>{me.name}</H1>
        <Muted>@{me.username}</Muted>
        {!!me.bio && <Text style={s.bio}>{me.bio}</Text>}
        <Button label="Editar perfil e foto" variant="ghost" onPress={() => router.push('/edit-profile')} style={{ alignSelf: 'stretch' }} />
      </View>

      <Card hero style={{ gap: space.md }}>
        <Text style={s.heroTitle}>Seus{'\n'}pontos</Text>
        <View style={{ alignItems: 'center' }}>
          <Gauge value={lvl.progress} size={240}>
            <Text style={s.gaugeNum}>{me.points}</Text>
            <Text style={s.gaugeUnit}>pts</Text>
          </Gauge>
        </View>
        <View style={s.levelPill}>
          <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
          <Text style={s.levelText}>
            <Text style={{ color: colors.accent, fontWeight: '800' }}>{lvl.current.name}</Text>
            {lvl.next ? `  ·  faltam ${lvl.toNext} pts para ${lvl.next.name}` : '  ·  nível máximo'}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/ranking')} style={s.slide}>
          <View style={s.slideDot}>
            <Ionicons name="trophy" size={20} color={colors.onAccent} />
          </View>
          <Text style={s.slideText}>Ver ranking  ›››</Text>
        </Pressable>
      </Card>

      <View style={s.grid}>
        <StatTile value={rank ? `#${rank}` : '-'} label="Ranking" accent />
        <StatTile value={String(games)} label="Jogos" />
        <StatTile value={String(me.wins)} label="Vitórias" />
        <StatTile value={String(me.classes)} label="Aulas" />
      </View>

      <Title style={{ fontSize: 24 }}>Minhas reservas</Title>
      {upcoming.length === 0 ? (
        <Card glow style={{ gap: space.md }}>
          <Muted style={{ fontSize: 15 }}>Nenhuma reserva marcada.</Muted>
          <Button label="Reservar quadra" arrow onPress={() => router.push('/')} />
        </Card>
      ) : (
        upcoming.map((b, i) => {
          const ci = checkinInfo(b);
          return (
            <Card key={b.id} glow={i === 0} style={{ gap: space.md }}>
              <View style={s.between}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.bookWhen}>
                    {b.date === today ? 'Hoje' : fmtDate(b.date)} · {pad2(b.hour)}:00
                  </Text>
                  <Muted>
                    {b.kind === 'aula' ? 'Aula' : 'Jogo'} · {courtName(b.courtId)} · {formatBRL(b.price)}
                  </Muted>
                </View>
              </View>
              {ci.state === 'open' ? (
                <Button label="Fazer check-in" arrow onPress={() => checkIn(b.id)} />
              ) : (
                <View style={s.ciRow}>
                  <Ionicons name="time-outline" size={16} color={colors.muted} />
                  <Text style={s.ciText}>{ci.label}</Text>
                </View>
              )}
            </Card>
          );
        })
      )}
      {history.length > 0 && (
        <Muted>
          Últimos check-ins: {history.map((b) => `${fmtDate(b.date)} ${pad2(b.hour)}h`).join(' · ')}
        </Muted>
      )}

      <Title style={{ fontSize: 24 }}>Conquistas</Title>
      <View style={s.badges}>
        {badges.map((b) => (
          <Card key={b.label} style={[s.badge, !b.on && { opacity: 0.3 }]}>
            <Text style={{ fontSize: 28 }}>{b.icon}</Text>
            <Text style={s.badgeText}>{b.label}</Text>
          </Card>
        ))}
      </View>

      <Muted style={{ textAlign: 'center' }}>{session?.user.email}</Muted>
      <Button label="Sair" variant="ghost" onPress={signOut} />
      <Button label="Excluir meus dados" variant="danger" onPress={deleteAccount} />
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  adminText: { color: colors.onAccent, fontWeight: '800', fontSize: 13 },
  head: { alignItems: 'center', gap: space.sm },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  bio: { color: colors.text, textAlign: 'center' },
  heroTitle: { color: colors.cream, fontSize: 40, fontWeight: '900', letterSpacing: -2, lineHeight: 40 },
  gaugeNum: { color: colors.cream, fontSize: 62, fontWeight: '900', letterSpacing: -3, lineHeight: 64 },
  gaugeUnit: { color: colors.cream, fontSize: 18, fontWeight: '800', opacity: 0.7, marginTop: -4 },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 18 },
  levelText: { color: colors.text, fontSize: 14, flex: 1 },
  slide: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 999, padding: 6, gap: 12 },
  slideDot: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  slideText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookWhen: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.6 },
  ciRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ciText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: { width: '31%', alignItems: 'center', padding: space.md, gap: 4 },
  badgeText: { color: colors.text, fontSize: 11, textAlign: 'center', fontWeight: '700' },
});
