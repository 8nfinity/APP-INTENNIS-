import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Avatar, Button, Card, Gauge, H1, Muted, Screen, StatTile, Text, Title } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { fmtDate, levelFor } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { Booking, Court, Player } from '@/lib/types';

export default function Inicio() {
  const me = useMe();
  const { refreshPlayer } = useAuth();
  const rankQ = useFetch<{ players: Player[] }>('/ranking');
  const bookingsQ = useFetch<{ bookings: Booking[] }>('/bookings');
  const courtsQ = useFetch<{ courts: Court[] }>('/courts');

  const lvl = levelFor(me.points);
  const pos = (rankQ.data?.players ?? []).findIndex((p) => p.id === me.id) + 1;
  const next = (bookingsQ.data?.bookings ?? [])
    .filter((b) => b.status === 'pago')
    .sort((a, b) => (a.date + String(a.hour).padStart(2, '0')).localeCompare(b.date + String(b.hour).padStart(2, '0')))[0];
  const courtName = (id: string) => courtsQ.data?.courts.find((c) => c.id === id)?.name ?? '';

  const checkIn = async (id: string) => {
    try {
      const { points } = await api<{ points: number }>(`/bookings/${id}/checkin`, { method: 'POST' });
      Alert.alert('Presença confirmada! 🎾', `Você ganhou +${points} pontos no ranking.`);
      bookingsQ.reload();
      refreshPlayer();
    } catch (e) {
      Alert.alert('Check-in', errMsg(e));
    }
  };

  const reload = () => {
    rankQ.reload();
    bookingsQ.reload();
    refreshPlayer();
  };

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={s.top}>
        <Logo size={24} />
        <View style={s.topRight}>
          {me.isAdmin && (
            <Pressable onPress={() => router.push('/admin')} style={s.adminBtn} hitSlop={8}>
              <Ionicons name="shield-checkmark" size={16} color={colors.onAccent} />
              <Text style={s.adminText}>Admin</Text>
            </Pressable>
          )}
          <Pressable onPress={() => router.push('/perfil')} hitSlop={8}>
            <Avatar name={me.name} url={me.avatarUrl} size={44} />
          </Pressable>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <Muted style={{ fontSize: 15 }}>Olá,</Muted>
        <H1 style={{ fontSize: 40, lineHeight: 42 }}>{me.name.split(' ')[0]}</H1>
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
        <StatTile value={pos ? `#${pos}` : '-'} label="Ranking" accent />
        <StatTile value={String(me.wins)} label="Vitórias" />
        <StatTile value={String(me.classes)} label="Aulas" />
        <StatTile value={String(me.streak)} label="Sequência 🔥" />
      </View>

      {next ? (
        <Card glow style={{ gap: space.md }}>
          <Muted>Próximo horário</Muted>
          <Title style={{ fontSize: 26 }}>
            {fmtDate(next.date)} · {String(next.hour).padStart(2, '0')}:00
          </Title>
          <Muted>
            {next.kind === 'aula' ? 'Aula' : 'Jogo'} · {courtName(next.courtId)}
          </Muted>
          <Button label="Fazer check-in" arrow onPress={() => checkIn(next.id)} />
        </Card>
      ) : (
        <Card glow style={{ gap: space.md }}>
          <Title style={{ fontSize: 24 }}>Hora de jogar?</Title>
          <Muted>Reserve uma quadra e ganhe pontos a cada check-in.</Muted>
          <Button label="Reservar quadra" arrow onPress={() => router.push('/agendar')} />
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  adminText: { color: colors.onAccent, fontWeight: '800', fontSize: 12 },
  heroTitle: { color: colors.cream, fontSize: 40, fontWeight: '900', letterSpacing: -2, lineHeight: 40 },
  gaugeNum: { color: colors.cream, fontSize: 62, fontWeight: '900', letterSpacing: -3, lineHeight: 64 },
  gaugeUnit: { color: colors.cream, fontSize: 18, fontWeight: '800', opacity: 0.7, marginTop: -4 },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  levelText: { color: colors.text, fontSize: 14, flex: 1 },
  slide: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 999, padding: 6, gap: 12 },
  slideDot: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  slideText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
});
