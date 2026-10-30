import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Chip, CircleButton, ErrorState, H1, Muted, Screen, Text, formatBRL } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toISO } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { Booking, BookingKind, Court } from '@/lib/types';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function nextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { iso: toISO(d), label: WEEKDAYS[d.getDay()], day: d.getDate(), month: d.getMonth() };
  });
}

export default function Agendar() {
  const { refreshPlayer } = useAuth();
  const days = nextDays(14);
  const [date, setDate] = useState(days[0].iso);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [kind, setKind] = useState<BookingKind>('jogo');

  const courtsQ = useFetch<{ courts: Court[]; hours: number[]; classExtra: number }>('/courts');
  const availQ = useFetch<{ taken: { courtId: string; hour: number }[] }>(`/availability?date=${date}`);
  const bookingsQ = useFetch<{ bookings: Booking[] }>('/bookings');

  const courts = courtsQ.data?.courts ?? [];
  const court = courts.find((c) => c.id === courtId) ?? courts[0];
  const price = court ? court.pricePerHour + (kind === 'aula' ? (courtsQ.data?.classExtra ?? 0) : 0) : 0;
  const now = new Date();
  const isToday = date === toISO(now);
  const month = days.find((d) => d.iso === date)?.month ?? now.getMonth();

  const isTaken = (hour: number) =>
    (isToday && hour <= now.getHours()) || !!availQ.data?.taken.some((t) => t.courtId === court?.id && t.hour === hour);
  const mine = (hour: number) =>
    (bookingsQ.data?.bookings ?? []).find((b) => b.date === date && b.hour === hour && b.courtId === court?.id && (b.status === 'pago' || b.status === 'concluido'));

  const pick = (hour: number) =>
    router.push({ pathname: '/checkout', params: { courtId: court.id, date, hour: String(hour), kind } });

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
    courtsQ.reload();
    availQ.reload();
    bookingsQ.reload();
  };

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={{ gap: 4 }}>
        <H1 style={{ fontSize: 40, lineHeight: 42 }}>Reserve{'\n'}sua quadra</H1>
      </View>

      <View style={s.row}>
        <Chip label="Jogo livre" active={kind === 'jogo'} onPress={() => setKind('jogo')} />
        <Chip label="Aula com professor" active={kind === 'aula'} onPress={() => setKind('aula')} />
      </View>

      <View style={{ gap: space.md }}>
        <Text style={s.month}>{MONTHS[month]}</Text>
        <View style={s.days}>
          {days.slice(0, 7).map((d) => {
            const on = d.iso === date;
            return (
              <Pressable key={d.iso} onPress={() => setDate(d.iso)} style={s.dayCol}>
                <Text style={s.dayLabel}>{d.label}</Text>
                <View style={[s.dayCircle, on && s.dayCircleOn]}>
                  <Text style={[s.dayNum, on && { color: colors.onAccent }]}>{d.day}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={s.days}>
          {days.slice(7).map((d) => {
            const on = d.iso === date;
            return (
              <Pressable key={d.iso} onPress={() => setDate(d.iso)} style={s.dayCol}>
                <Text style={s.dayLabel}>{d.label}</Text>
                <View style={[s.dayCircle, on && s.dayCircleOn]}>
                  <Text style={[s.dayNum, on && { color: colors.onAccent }]}>{d.day}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {courtsQ.error && <ErrorState message={courtsQ.error} onRetry={courtsQ.reload} />}

      <View style={s.row}>
        {courts.map((c) => (
          <Chip key={c.id} label={`${c.name} · ${c.surface}`} active={c.id === court?.id} onPress={() => setCourtId(c.id)} />
        ))}
      </View>

      {court && (
        <Muted>
          {formatBRL(price)} por hora{kind === 'aula' ? ' (inclui professor)' : ''}
        </Muted>
      )}

      <Text style={s.section}>Horários</Text>
      <View style={{ gap: space.sm }}>
        {(courtsQ.data?.hours ?? []).map((h) => {
          const my = mine(h);
          const taken = isTaken(h);
          return (
            <View key={h} style={s.slotRow}>
              <Text style={s.hour}>{String(h).padStart(2, '0')}:00</Text>
              {my ? (
                <View style={[s.slotCard, s.slotMine]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.slotTitle, { color: colors.onAccent }]}>Sua reserva</Text>
                    <Text style={[s.slotSub, { color: colors.onAccent }]}>
                      {my.kind === 'aula' ? 'Aula' : 'Jogo'} · {court?.name}
                    </Text>
                  </View>
                  {my.status === 'pago' ? (
                    <Pressable onPress={() => checkIn(my.id)} style={s.checkBtn}>
                      <Text style={s.checkText}>Check-in</Text>
                    </Pressable>
                  ) : (
                    <Text style={[s.slotSub, { color: colors.onAccent, fontWeight: '800' }]}>Concluído ✓</Text>
                  )}
                </View>
              ) : taken ? (
                <View style={[s.slotCard, s.slotTaken]}>
                  <Text style={s.slotBusy}>Indisponível</Text>
                </View>
              ) : (
                <Pressable onPress={() => pick(h)} style={[s.slotCard, s.slotFree]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.slotTitle}>{court?.name}</Text>
                    <Text style={s.slotSub}>{formatBRL(price)}</Text>
                  </View>
                  <CircleButton onPress={() => pick(h)} size={40} />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
      {courts.length === 0 && !courtsQ.loading && !courtsQ.error && (
        <Button label="Atualizar" variant="ghost" onPress={reload} />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  month: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 8, flex: 1 },
  dayLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  dayCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dayCircleOn: { backgroundColor: colors.accent },
  dayNum: { color: colors.text, fontSize: 16, fontWeight: '700' },
  section: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.6, marginTop: space.sm },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  hour: { color: colors.muted, width: 50, fontSize: 13, fontWeight: '700' },
  slotCard: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, padding: 14, minHeight: 64 },
  slotFree: { backgroundColor: 'rgba(244,243,236,0.07)', borderWidth: 1, borderColor: colors.border },
  slotTaken: { backgroundColor: 'rgba(244,243,236,0.03)' },
  slotMine: { backgroundColor: colors.accent },
  slotTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  slotSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  slotBusy: { color: colors.muted, fontSize: 14, fontWeight: '600', opacity: 0.6 },
  checkBtn: { backgroundColor: colors.onAccent, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  checkText: { color: colors.accent, fontWeight: '800', fontSize: 13 },
});
