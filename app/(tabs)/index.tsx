import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Button, Card, Chip, ErrorState, H1, Muted, Screen, Text, formatBRL } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { checkinInfo, doCheckIn, pad2 } from '@/lib/booking';
import { fmtDate, toISO } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { Booking, BookingKind, Court } from '@/lib/types';

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEK_LONG = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type Summary = { days: { date: string; taken: number }[]; slotsPerDay: number };

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (iso: string, n: number) => {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

// cor do pontinho de ocupação: livre, enchendo, lotado
function occColor(taken: number, total: number) {
  if (!total) return colors.muted;
  const r = taken / total;
  return r >= 0.95 ? colors.danger : r >= 0.6 ? colors.hot : colors.accent;
}

export default function Agendar() {
  const { refreshPlayer } = useAuth();
  const today = toISO(new Date());
  const [date, setDate] = useState(today);
  const [cursor, setCursor] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }));
  const [kind, setKind] = useState<BookingKind>('jogo');

  const courtsQ = useFetch<{ courts: Court[]; hours: number[]; classExtra: number; maxDaysAhead: number }>('/courts');
  const maxDate = addDays(today, courtsQ.data?.maxDaysAhead ?? 365);

  const monthStart = toISO(new Date(cursor.y, cursor.m, 1));
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const monthFrom = monthStart < today ? today : monthStart;
  const monthDays = Math.max(1, daysInMonth - parse(monthFrom).getDate() + 1);

  const stripQ = useFetch<Summary>(`/availability/summary?from=${today}&days=30`);
  const monthQ = useFetch<Summary>(`/availability/summary?from=${monthFrom}&days=${monthDays}`);
  const dayQ = useFetch<{ taken: { courtId: string; hour: number }[] }>(`/availability?date=${date}`);
  const bookingsQ = useFetch<{ bookings: Booking[] }>('/bookings');

  const courts = courtsQ.data?.courts ?? [];
  const hours = courtsQ.data?.hours ?? [];
  const extra = kind === 'aula' ? (courtsQ.data?.classExtra ?? 0) : 0;
  const now = new Date();

  const takenOn = (q: typeof stripQ, iso: string) => q.data?.days.find((d) => d.date === iso)?.taken ?? 0;
  const myOn = (bookingsQ.data?.bookings ?? []).filter((b) => b.date === date && (b.status === 'pago' || b.status === 'concluido'));

  const pick = (iso: string) => {
    setDate(iso);
    const d = parse(iso);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const canPrev = cursor.y > now.getFullYear() || (cursor.y === now.getFullYear() && cursor.m > now.getMonth());
  const nextMonthStart = toISO(new Date(cursor.y, cursor.m + 1, 1));
  const canNext = nextMonthStart <= maxDate;
  const move = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const book = (court: Court, hour: number) =>
    router.push({ pathname: '/checkout', params: { courtId: court.id, date, hour: String(hour), kind } });

  const checkIn = async (id: string) => {
    if (await doCheckIn(id)) {
      bookingsQ.reload();
      refreshPlayer();
    }
  };

  const reload = () => {
    courtsQ.reload();
    stripQ.reload();
    monthQ.reload();
    dayQ.reload();
    bookingsQ.reload();
  };

  // grade do mês: espaços vazios até o 1º dia da semana
  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(cursor.y, cursor.m, i + 1))),
  ];
  const strip = Array.from({ length: 30 }, (_, i) => addDays(today, i));
  const wide = courts.length > 3; // muitas quadras: o mapa rola para o lado
  const colStyle = wide ? { width: 104 } : { flex: 1 };

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={s.top}>
        <Logo size={22} />
      </View>
      <H1 style={{ fontSize: 40, lineHeight: 42 }}>Reserve{'\n'}sua quadra</H1>

      <View style={s.row}>
        <Chip label="Jogo livre" active={kind === 'jogo'} onPress={() => setKind('jogo')} />
        <Chip label="Aula com professor" active={kind === 'aula'} onPress={() => setKind('aula')} />
      </View>

      {courtsQ.error && <ErrorState message={courtsQ.error} onRetry={reload} />}

      {/* Próximos 30 dias: quantos horários livres em cada dia */}
      <View style={{ gap: space.sm }}>
        <Text style={s.section}>Próximos 30 dias</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingRight: space.lg }}>
          {strip.map((iso) => {
            const d = parse(iso);
            const on = iso === date;
            const total = stripQ.data?.slotsPerDay ?? 0;
            const free = Math.max(0, total - takenOn(stripQ, iso));
            return (
              <Pressable key={iso} onPress={() => pick(iso)} style={[s.stripDay, on && s.stripOn]}>
                <Text style={[s.stripWeek, on && { color: colors.onAccent }]}>{iso === today ? 'Hoje' : WEEK_LONG[d.getDay()]}</Text>
                <Text style={[s.stripNum, on && { color: colors.onAccent }]}>{d.getDate()}</Text>
                <View style={[s.stripDot, { backgroundColor: on ? colors.onAccent : occColor(total - free, total) }]} />
                <Text style={[s.stripFree, on && { color: colors.onAccent }]}>{stripQ.data ? `${free} livres` : ' '}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Calendário do mês (referência 1), navegável até 1 ano */}
      <Card style={{ gap: space.md }}>
        <View style={s.monthHead}>
          <Pressable onPress={() => canPrev && move(-1)} hitSlop={12} style={{ opacity: canPrev ? 1 : 0.25 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={s.monthTitle}>
            {MONTHS[cursor.m]} <Text style={{ color: colors.muted, fontWeight: '600' }}>{cursor.y}</Text>
          </Text>
          <Pressable onPress={() => canNext && move(1)} hitSlop={12} style={{ opacity: canNext ? 1 : 0.25 }}>
            <Ionicons name="arrow-forward" size={22} color={colors.text} />
          </Pressable>
        </View>
        <View style={s.weekRow}>
          {WEEK.map((w, i) => (
            <Text key={i} style={s.weekDay}>
              {w}
            </Text>
          ))}
        </View>
        <View style={s.grid}>
          {cells.map((iso, i) => {
            if (!iso) return <View key={`e${i}`} style={s.cell} />;
            const off = iso < today || iso > maxDate;
            const on = iso === date;
            const total = monthQ.data?.slotsPerDay ?? 0;
            return (
              <Pressable key={iso} disabled={off} onPress={() => pick(iso)} style={s.cell}>
                <View style={[s.dayCircle, on && s.dayOn, iso === today && !on && s.dayToday]}>
                  <Text style={[s.dayNum, off && { color: 'rgba(244,243,236,0.25)' }, on && { color: colors.onAccent, fontWeight: '900' }]}>
                    {parse(iso).getDate()}
                  </Text>
                </View>
                {!off && <View style={[s.dot, { backgroundColor: on ? 'transparent' : occColor(takenOn(monthQ, iso), total) }]} />}
              </Pressable>
            );
          })}
        </View>
        <View style={s.legend}>
          <Legend color={colors.accent} label="Livre" />
          <Legend color={colors.hot} label="Enchendo" />
          <Legend color={colors.danger} label="Lotado" />
        </View>
      </Card>

      {/* Mapa completo do dia: todas as quadras x todos os horários */}
      <View style={{ gap: space.sm }}>
        <Text style={s.section}>
          Mapa de {date === today ? 'hoje' : fmtDate(date)}
          <Text style={{ color: colors.muted, fontSize: 15, fontWeight: '600' }}>  · {WEEK_LONG[parse(date).getDay()]}</Text>
        </Text>
        <Muted>Toque num horário livre para reservar. {kind === 'aula' ? `Aula: +${formatBRL(extra)} pelo professor.` : ''}</Muted>
      </View>

      <ScrollView horizontal={wide} scrollEnabled={wide} showsHorizontalScrollIndicator={false}>
        <View style={{ gap: 6, flex: 1, minWidth: '100%' }}>
          <View style={s.mapRow}>
            <View style={s.mapHour} />
            {courts.map((c) => (
              <View key={c.id} style={[s.mapHead, colStyle]}>
                <Text style={s.mapCourt} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={s.mapSurface}>{c.surface}</Text>
              </View>
            ))}
          </View>
          {hours.map((h) => (
            <View key={h} style={s.mapRow}>
              <Text style={s.mapHour}>{pad2(h)}h</Text>
              {courts.map((c) => {
                const mine = myOn.find((b) => b.courtId === c.id && b.hour === h);
                const past = date === today && h <= now.getHours();
                const taken = !!dayQ.data?.taken.some((t) => t.courtId === c.id && t.hour === h);
                if (mine) {
                  return (
                    <View key={c.id} style={[s.cell2, colStyle, s.cellMine]}>
                      <Text style={s.cellMineText}>Você</Text>
                    </View>
                  );
                }
                if (past || taken) {
                  return (
                    <View key={c.id} style={[s.cell2, colStyle, s.cellTaken]}>
                      <Text style={s.cellTakenText}>{past ? '—' : 'Ocupado'}</Text>
                    </View>
                  );
                }
                return (
                  <Pressable key={c.id} onPress={() => book(c, h)} style={({ pressed }) => [s.cell2, colStyle, s.cellFree, pressed && { borderColor: colors.accent }]}>
                    <Text style={s.cellPrice}>{formatBRL(c.pricePerHour + extra).replace(',00', '')}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {myOn.length > 0 && (
        <View style={{ gap: space.sm }}>
          <Text style={s.section}>Suas reservas neste dia</Text>
          {myOn.map((b) => {
            const ci = checkinInfo(b);
            return (
              <Card key={b.id} glow style={{ gap: space.md }}>
                <View style={s.between}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.bookTitle}>
                      {pad2(b.hour)}:00 · {courts.find((c) => c.id === b.courtId)?.name ?? ''}
                    </Text>
                    <Muted>
                      {b.kind === 'aula' ? 'Aula' : 'Jogo'} · {formatBRL(b.price)}
                    </Muted>
                  </View>
                </View>
                {ci.state === 'open' ? (
                  <Button label="Fazer check-in" arrow onPress={() => checkIn(b.id)} />
                ) : (
                  <Text style={[s.ciInfo, ci.state === 'done' && { color: colors.success }]}>{ci.label}</Text>
                )}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[s.dot, { backgroundColor: color, marginTop: 0 }]} />
      <Muted style={{ fontSize: 12 }}>{label}</Muted>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  section: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.6 },

  stripDay: {
    width: 76,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(244,243,236,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stripOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  stripWeek: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  stripNum: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  stripDot: { width: 6, height: 6, borderRadius: 3 },
  stripFree: { color: colors.muted, fontSize: 11, fontWeight: '600' },

  monthHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  weekRow: { flexDirection: 'row' },
  weekDay: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4, minHeight: 50 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: colors.accent },
  dayToday: { borderWidth: 1, borderColor: colors.accent },
  dayNum: { color: colors.text, fontSize: 15, fontWeight: '600' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: space.lg },

  mapRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapHour: { width: 40, color: colors.muted, fontSize: 13, fontWeight: '700' },
  mapHead: { alignItems: 'center', paddingVertical: 6 },
  mapCourt: { color: colors.text, fontSize: 13, fontWeight: '800' },
  mapSurface: { color: colors.muted, fontSize: 11 },
  cell2: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cellFree: { backgroundColor: 'rgba(244,243,236,0.07)', borderWidth: 1, borderColor: 'rgba(212,242,60,0.35)' },
  cellTaken: { backgroundColor: 'rgba(244,243,236,0.025)' },
  cellMine: { backgroundColor: colors.accent },
  cellPrice: { color: colors.text, fontSize: 13, fontWeight: '800' },
  cellTakenText: { color: 'rgba(244,243,236,0.3)', fontSize: 12, fontWeight: '600' },
  cellMineText: { color: colors.onAccent, fontSize: 13, fontWeight: '900' },

  bookTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  ciInfo: { color: colors.muted, fontSize: 14, fontWeight: '700' },
});
