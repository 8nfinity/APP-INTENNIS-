import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip, Muted, Title, formatBRL } from '@/components/ui';
import { CLASS_PRICE_EXTRA, HOURS, courts, toISO } from '@/lib/data';
import { useStore } from '@/lib/store';
import { colors, radius, space } from '@/lib/theme';
import { BookingKind } from '@/lib/types';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function nextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { iso: toISO(d), label: WEEKDAYS[d.getDay()], day: d.getDate() };
  });
}

export default function AgendarScreen() {
  const { isSlotTaken, bookings, checkIn } = useStore();
  const days = nextDays(10);
  const [date, setDate] = useState(days[0].iso);
  const [courtId, setCourtId] = useState(courts[0].id);
  const [kind, setKind] = useState<BookingKind>('jogo');
  const court = courts.find((c) => c.id === courtId)!;
  const price = court.pricePerHour + (kind === 'aula' ? CLASS_PRICE_EXTRA : 0);

  const pickSlot = (hour: number) =>
    router.push({
      pathname: '/checkout',
      params: { courtId, date, hour: String(hour), kind, price: String(price) },
    });

  const doCheckIn = (id: string) => {
    const pts = checkIn(id);
    if (pts) Alert.alert('Presença confirmada! 🎾', `Você ganhou +${pts} pontos no ranking.`);
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Title style={s.h1}>Reserve sua quadra</Title>

      <View style={s.row}>
        <Chip label="Jogo livre" active={kind === 'jogo'} onPress={() => setKind('jogo')} />
        <Chip label="Aula com professor" active={kind === 'aula'} onPress={() => setKind('aula')} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {days.map((d) => (
          <Pressable key={d.iso} onPress={() => setDate(d.iso)} style={[s.day, d.iso === date && s.dayActive]}>
            <Text style={[s.dayLabel, d.iso === date && { color: colors.onBall }]}>{d.label}</Text>
            <Text style={[s.dayNum, d.iso === date && { color: colors.onBall }]}>{d.day}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.row}>
        {courts.map((c) => (
          <Chip key={c.id} label={`${c.name} · ${c.surface}`} active={c.id === courtId} onPress={() => setCourtId(c.id)} />
        ))}
      </View>

      <Muted>
        {formatBRL(price)} por hora{kind === 'aula' ? ' (inclui professor)' : ''}. O pagamento é feito antes de confirmar.
      </Muted>

      <View style={s.grid}>
        {HOURS.map((h) => {
          const taken = isSlotTaken(courtId, date, h);
          return (
            <Pressable
              key={h}
              disabled={taken}
              onPress={() => pickSlot(h)}
              style={[s.slot, taken && s.slotTaken]}>
              <Text style={[s.slotText, taken && { color: colors.muted, textDecorationLine: 'line-through' }]}>
                {String(h).padStart(2, '0')}:00
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Title style={{ marginTop: space.xl }}>Meus horários</Title>
      {bookings.length === 0 && <Muted>Você ainda não tem reservas. Escolha um horário acima.</Muted>}
      {bookings.map((b) => {
        const c = courts.find((x) => x.id === b.courtId)!;
        return (
          <Card key={b.id} style={s.booking}>
            <View style={{ flex: 1 }}>
              <Text style={s.bTitle}>
                {b.kind === 'aula' ? 'Aula' : 'Jogo'} · {c.name}
              </Text>
              <Muted>
                {b.date.split('-').reverse().join('/')} às {String(b.hour).padStart(2, '0')}:00 · {formatBRL(b.price)}
              </Muted>
            </View>
            {b.status === 'pago' ? (
              <Button label="Check-in" onPress={() => doCheckIn(b.id)} style={s.small} />
            ) : (
              <Text style={s.done}>Concluído ✓</Text>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: 40 },
  h1: { fontSize: 24 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  day: {
    width: 56,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: space.sm,
  },
  dayActive: { backgroundColor: colors.ball, borderColor: colors.ball },
  dayLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  dayNum: { color: colors.text, fontSize: 20, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  slot: {
    width: '23%',
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.ball,
  },
  slotTaken: { borderColor: colors.border, backgroundColor: colors.card },
  slotText: { color: colors.text, fontWeight: '800' },
  booking: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  small: { paddingVertical: 10, paddingHorizontal: 14 },
  done: { color: colors.success, fontWeight: '800' },
});
