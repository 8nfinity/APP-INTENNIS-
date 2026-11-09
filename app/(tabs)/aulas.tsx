import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, Empty, ErrorState, Eyebrow, Headline, Loading, Screen, StatBox, Sub, Text, formatBRL } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { pad2 } from '@/lib/booking';
import { MONTHS, WEEK_HEAD, monthCells, parseISO, shortDay } from '@/lib/dates';
import { toISO } from '@/lib/game';
import { useLayout } from '@/lib/layout';
import { colors, space } from '@/lib/theme';
import { TeacherClass } from '@/lib/types';

type Agenda = { teacher: { id: string; name: string; pricePerHour: number }; classes: TeacherClass[]; month: { n: number; total: number } };

// Painel do professor: calendário com os dias que têm aluno, aulas do dia e total do mês.
export default function Aulas() {
  const me = useMe();
  const today = toISO(new Date());
  const [cursor, setCursor] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }));
  const [date, setDate] = useState(today);
  const { contentW } = useLayout();

  const monthStart = toISO(new Date(cursor.y, cursor.m, 1));
  const dim = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const q = useFetch<Agenda>(`/teacher/agenda?from=${monthStart}&days=${dim}`);

  const classes = q.data?.classes ?? [];
  const total = classes.reduce((a, c) => a + c.teacherPrice, 0);
  const onDay = classes.filter((c) => c.date === date);
  const cells = monthCells(cursor.y, cursor.m);
  const size = Math.min(34, Math.floor((contentW - 34) / 7) - 2);

  const move = (d: number) => {
    const x = new Date(cursor.y, cursor.m + d, 1);
    setCursor({ y: x.getFullYear(), m: x.getMonth() });
  };

  return (
    <Screen tab refreshing={false} onRefresh={q.reload}>
      <View style={{ gap: 8 }}>
        <Eyebrow>Área do professor</Eyebrow>
        <Headline>Olá, {me.name.split(' ')[0]}.</Headline>
        <Sub>Sua agenda, seus alunos e sua evolução.</Sub>
      </View>

      {q.error && <ErrorState message={q.error} onRetry={q.reload} />}

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <StatBox value={String(classes.length)} label="Aulas no mês selecionado" />
        <StatBox value={formatBRL(total)} label="Valor das aulas" />
      </View>

      <Card style={{ gap: space.md }}>
        <View style={s.head}>
          <Pressable onPress={() => move(-1)} hitSlop={10} style={s.nav}>
            <Ionicons name="chevron-back" size={15} color={colors.ink} />
          </Pressable>
          <Text style={{ fontSize: 14, fontWeight: '500' }}>
            {MONTHS[cursor.m]} de {cursor.y}
          </Text>
          <Pressable onPress={() => move(1)} hitSlop={10} style={s.nav}>
            <Ionicons name="chevron-forward" size={15} color={colors.ink} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {WEEK_HEAD.map((w, i) => (
            <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: colors.soft }}>
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
                <View style={[{ width: size, height: size, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, on && { backgroundColor: colors.lime }]}>
                  <Text style={{ fontSize: 12.5, fontWeight: on ? '700' : '400', color: on ? colors.onLime : colors.ink }}>{parseISO(iso).getDate()}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2, height: 4, marginTop: 1 }}>
                  {Array.from({ length: Math.min(3, n) }, (_, k) => (
                    <View key={k} style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.forest2 }} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Sub style={{ fontSize: 10.5 }}>• Pontos indicam os dias com aula marcada</Sub>
      </Card>

      <View style={s.between}>
        <Text style={{ fontSize: 18, fontWeight: '500', letterSpacing: -0.3 }}>Aulas · {shortDay(date)}</Text>
        <Sub style={{ fontSize: 11.5 }}>
          {onDay.length} {onDay.length === 1 ? 'aluno' : 'alunos'}
        </Sub>
      </View>

      {q.loading && <Loading />}
      {!q.loading && onDay.length === 0 && <Empty icon="calendar-outline" title="Sem aulas neste dia" />}
      {onDay.map((c) => (
        <Card key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: 12, opacity: c.status === 'concluido' ? 0.65 : 1 }}>
          <View style={s.time}>
            <Text style={{ fontSize: 13, fontWeight: '500' }}>{pad2(c.hour)}:00</Text>
          </View>
          <Avatar name={c.studentName} url={c.studentAvatarUrl} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
              {c.studentName}
            </Text>
            <Sub style={{ fontSize: 11.5 }}>
              @{c.studentUsername} · {c.courtName}
            </Sub>
          </View>
          <Text style={{ fontSize: 12, color: colors.muted }}>{c.status === 'concluido' ? 'Feita ✓' : formatBRL(c.teacherPrice)}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  between: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  time: { width: 50, height: 38, borderRadius: 10, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
});
