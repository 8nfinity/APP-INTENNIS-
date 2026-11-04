import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, Empty, ErrorState, Loading, Muted, Screen, Section, StatTile, Text, formatBRL } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { pad2 } from '@/lib/booking';
import { toISO } from '@/lib/game';
import { useLayout } from '@/lib/layout';
import { colors, radius, space } from '@/lib/theme';
import { TeacherClass } from '@/lib/types';

const WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const WEEK_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type Agenda = {
  teacher: { id: string; name: string; pricePerHour: number };
  classes: TeacherClass[];
  month: { n: number; total: number };
};

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Agenda do professor: calendário com os dias que têm aluno e a lista de aulas do dia.
export default function Aulas() {
  const today = toISO(new Date());
  const [cursor, setCursor] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }));
  const [date, setDate] = useState(today);

  const { contentW } = useLayout();
  const dayD = Math.max(28, Math.min(36, Math.floor((contentW - 34) / 7))); // diâmetro do dia
  const monthStart = toISO(new Date(cursor.y, cursor.m, 1));
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const monthQ = useFetch<Agenda>(`/teacher/agenda?from=${monthStart}&days=${daysInMonth}`);
  const nextQ = useFetch<Agenda>(`/teacher/agenda?from=${today}&days=366`);

  const classes = monthQ.data?.classes ?? [];
  const onDay = classes.filter((c) => c.date === date);
  const upcoming = (nextQ.data?.classes ?? []).filter((c) => c.status === 'pago');
  const move = (d: number) => {
    const x = new Date(cursor.y, cursor.m + d, 1);
    setCursor({ y: x.getFullYear(), m: x.getMonth() });
  };

  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(cursor.y, cursor.m, i + 1))),
  ];

  const reload = () => {
    monthQ.reload();
    nextQ.reload();
  };

  if (monthQ.error) {
    return (
      <Screen tab>
        <ErrorState message={monthQ.error} onRetry={reload} />
      </Screen>
    );
  }

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View>
        <Muted style={{ fontSize: 12, letterSpacing: 0.5 }}>AGENDA DO PROFESSOR</Muted>
        <Text style={s.title}>{monthQ.data?.teacher.name ?? 'Minhas aulas'}</Text>
      </View>

      <View style={s.stats}>
        <StatTile value={String(upcoming.length)} label="Próximas aulas" accent />
        <StatTile value={String(nextQ.data?.month.n ?? 0)} label="Aulas no mês" />
        <StatTile value={formatBRL(nextQ.data?.month.total ?? 0).replace(',00', '')} label="Valor no mês" />
      </View>

      <Card style={{ gap: space.md }}>
        <View style={s.monthHead}>
          <Pressable onPress={() => move(-1)} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>
            {MONTHS[cursor.m]} {cursor.y}
          </Text>
          <Pressable onPress={() => move(1)} hitSlop={12}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {WEEK.map((w) => (
            <Text key={w} style={s.week}>
              {w}
            </Text>
          ))}
        </View>
        <View style={s.grid}>
          {cells.map((iso, i) => {
            if (!iso) return <View key={`e${i}`} style={s.cell} />;
            const n = classes.filter((c) => c.date === iso).length;
            const on = iso === date;
            return (
              <Pressable key={iso} onPress={() => setDate(iso)} style={s.cell}>
                <View style={[s.day, { width: dayD, height: dayD, borderRadius: dayD / 2 }, n > 0 && s.dayBusy, on && s.dayOn, iso === today && !on && s.dayToday]}>
                  <Text style={[s.dayNum, on && { color: colors.onAccent, fontWeight: '700' }]}>{parse(iso).getDate()}</Text>
                </View>
                <Text style={[s.count, { opacity: n ? 1 : 0 }]}>{n} aula{n === 1 ? '' : 's'}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Section>
        {date === today ? 'Hoje' : `${WEEK_LONG[parse(date).getDay()]}, ${parse(date).getDate()}/${pad2(parse(date).getMonth() + 1)}`}
      </Section>
      {monthQ.loading && <Loading />}
      {!monthQ.loading && onDay.length === 0 && <Empty icon="calendar-outline" title="Sem aulas neste dia" />}
      {onDay.map((c) => (
        <View key={c.id} style={s.classRow}>
          <Text style={s.classHour}>{pad2(c.hour)}:00</Text>
          <View style={[s.classCard, c.status === 'concluido' && { opacity: 0.6 }]}>
            <Avatar name={c.studentName} url={c.studentAvatarUrl} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.onAccent }}>{c.studentName}</Text>
              <Text style={{ fontSize: 12, color: colors.onAccent, opacity: 0.75 }}>
                @{c.studentUsername} · {c.courtName} · 60 min
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.onAccent }}>{c.status === 'concluido' ? 'Feita ✓' : formatBRL(c.teacherPrice)}</Text>
          </View>
        </View>
      ))}

      {upcoming.length > 0 && (
        <>
          <Section>Próximas aulas</Section>
          {upcoming.slice(0, 8).map((c) => (
            <Pressable key={c.id} onPress={() => setDate(c.date)} style={s.nextRow}>
              <View style={s.nextDate}>
                <Text style={s.nextDay}>{parse(c.date).getDate()}</Text>
                <Text style={s.nextMon}>{MONTHS[parse(c.date).getMonth()].slice(0, 3)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600' }}>
                  {pad2(c.hour)}:00 · {c.studentName}
                </Text>
                <Muted>{c.courtName}</Muted>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  stats: { flexDirection: 'row', gap: space.sm },
  monthHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  week: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayBusy: { backgroundColor: colors.brandLight },
  dayOn: { backgroundColor: colors.cream },
  dayToday: { borderWidth: 1, borderColor: colors.cream },
  dayNum: { fontSize: 15 },
  count: { fontSize: 9, color: colors.lime, marginTop: 1 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  classHour: { width: 46, color: colors.muted, fontSize: 13 },
  classCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: colors.cream },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  nextDate: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  nextDay: { fontSize: 18, fontWeight: '800', lineHeight: 20 },
  nextMon: { fontSize: 10, color: colors.muted },
});
