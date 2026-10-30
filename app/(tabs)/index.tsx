import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/Logo';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Empty,
  ErrorState,
  H1,
  Muted,
  ProgressBar,
  Screen,
  Title,
  formatBRL,
} from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { fmtDate, levelFor, toISO } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { Booking, BookingKind, Court } from '@/lib/types';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function nextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { iso: toISO(d), label: WEEKDAYS[d.getDay()], day: d.getDate() };
  });
}

export default function Inicio() {
  const me = useMe();
  const { refreshPlayer } = useAuth();
  const days = nextDays(10);
  const [date, setDate] = useState(days[0].iso);
  const [courtId, setCourtId] = useState('c1');
  const [kind, setKind] = useState<BookingKind>('jogo');

  const courtsQ = useFetch<{ courts: Court[]; hours: number[]; classExtra: number }>('/courts');
  const availQ = useFetch<{ taken: { courtId: string; hour: number }[] }>(`/availability?date=${date}`);
  const bookingsQ = useFetch<{ bookings: Booking[] }>('/bookings');

  const lvl = levelFor(me.points);
  const courts = courtsQ.data?.courts ?? [];
  const court = courts.find((c) => c.id === courtId) ?? courts[0];
  const price = court ? court.pricePerHour + (kind === 'aula' ? courtsQ.data?.classExtra ?? 0 : 0) : 0;
  const now = new Date();
  const isToday = date === toISO(now);

  const isTaken = (hour: number) =>
    (isToday && hour <= now.getHours()) ||
    !!availQ.data?.taken.some((t) => t.courtId === court?.id && t.hour === hour);

  const upcoming = (bookingsQ.data?.bookings ?? []).filter((b) => b.status === 'pago' || b.status === 'concluido');
  const next = upcoming.filter((b) => b.status === 'pago').sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour))[0];

  const pickSlot = (hour: number) =>
    router.push({ pathname: '/checkout', params: { courtId: court.id, date, hour: String(hour), kind } });

  const doCheckIn = async (id: string) => {
    try {
      const { points } = await api<{ points: number }>(`/bookings/${id}/checkin`, { method: 'POST' });
      Alert.alert('Presença confirmada! 🎾', `Você ganhou +${points} pontos no ranking.`);
      bookingsQ.reload();
      refreshPlayer();
    } catch (e) {
      Alert.alert('Check-in', errMsg(e));
    }
  };

  const reloadAll = () => {
    courtsQ.reload();
    availQ.reload();
    bookingsQ.reload();
  };

  return (
    <Screen refreshing={false} onRefresh={reloadAll}>
      <View style={s.top}>
        <Logo size={34} />
        <Avatar name={me.name} size={42} />
      </View>

      <View style={{ gap: 4 }}>
        <Muted>Olá,</Muted>
        <H1 style={{ fontSize: 34 }}>{me.name.split(' ')[0]} 👋</H1>
      </View>

      <Card glow style={{ gap: space.sm }}>
        <View style={s.between}>
          <Text style={[s.level, { color: lvl.current.color }]}>{lvl.current.name}</Text>
          <Text style={s.pts}>
            {me.points}
            <Text style={s.ptsUnit}> pts</Text>
          </Text>
        </View>
        <ProgressBar value={lvl.progress} color={lvl.current.color} />
        <Muted>{lvl.next ? `Faltam ${lvl.toNext} pts para ${lvl.next.name}` : 'Você chegou ao topo!'}</Muted>
      </Card>

      {next && (
        <Card style={s.between}>
          <View style={{ flex: 1, gap: 2 }}>
            <Muted>Próximo horário</Muted>
            <Text style={s.nextTitle}>
              {fmtDate(next.date)} · {String(next.hour).padStart(2, '0')}:00
            </Text>
            <Muted>
              {next.kind === 'aula' ? 'Aula' : 'Jogo'} · {courts.find((c) => c.id === next.courtId)?.name ?? ''}
            </Muted>
          </View>
          <Button label="Check-in" onPress={() => doCheckIn(next.id)} style={s.small} />
        </Card>
      )}

      <Title style={{ fontSize: 24, marginTop: space.sm }}>Reserve sua quadra</Title>

      {courtsQ.error && <ErrorState message={courtsQ.error} onRetry={courtsQ.reload} />}

      <View style={s.row}>
        <Chip label="Jogo livre" active={kind === 'jogo'} onPress={() => setKind('jogo')} />
        <Chip label="Aula com professor" active={kind === 'aula'} onPress={() => setKind('aula')} />
      </View>

      <View style={[s.row, { flexWrap: 'nowrap' }]}>
        {days.slice(0, 7).map((d) => (
          <Pressable key={d.iso} onPress={() => setDate(d.iso)} style={[s.day, d.iso === date && s.dayActive]}>
            <Text style={[s.dayLabel, d.iso === date && { color: colors.onAccent }]}>{d.label}</Text>
            <Text style={[s.dayNum, d.iso === date && { color: colors.onAccent }]}>{d.day}</Text>
          </Pressable>
        ))}
      </View>

      <View style={s.row}>
        {courts.map((c) => (
          <Chip key={c.id} label={`${c.name} · ${c.surface}`} active={c.id === court?.id} onPress={() => setCourtId(c.id)} />
        ))}
      </View>

      {court && (
        <Muted>
          {formatBRL(price)} por hora{kind === 'aula' ? ' (inclui professor)' : ''}. Pague para confirmar o horário.
        </Muted>
      )}

      <View style={s.grid}>
        {(courtsQ.data?.hours ?? []).map((h) => {
          const taken = isTaken(h);
          return (
            <Pressable key={h} disabled={taken} onPress={() => pickSlot(h)} style={[s.slot, taken && s.slotTaken]}>
              <Text style={[s.slotText, taken && { color: colors.muted, textDecorationLine: 'line-through' }]}>
                {String(h).padStart(2, '0')}:00
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Title style={{ marginTop: space.lg }}>Meus horários</Title>
      {upcoming.length === 0 ? (
        <Empty title="Nenhuma reserva ainda" hint="Escolha um horário acima para jogar." />
      ) : (
        upcoming.map((b) => (
          <Card key={b.id} style={s.between}>
            <View style={{ flex: 1 }}>
              <Text style={s.nextTitle}>
                {b.kind === 'aula' ? 'Aula' : 'Jogo'} · {courts.find((c) => c.id === b.courtId)?.name ?? ''}
              </Text>
              <Muted>
                {fmtDate(b.date)} às {String(b.hour).padStart(2, '0')}:00 · {formatBRL(b.price)}
              </Muted>
            </View>
            {b.status === 'pago' ? (
              <Button label="Check-in" onPress={() => doCheckIn(b.id)} style={s.small} />
            ) : (
              <Ionicons name="checkmark-circle" size={26} color={colors.success} />
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  level: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pts: { color: colors.text, fontSize: 30, fontWeight: '900' },
  ptsUnit: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  nextTitle: { color: colors.text, fontWeight: '800', fontSize: 17 },
  day: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  dayNum: { color: colors.text, fontSize: 18, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  slot: {
    width: '23%',
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  slotTaken: { borderColor: colors.border, backgroundColor: colors.card },
  slotText: { color: colors.text, fontWeight: '800' },
  small: { paddingVertical: 10, paddingHorizontal: 16 },
});
