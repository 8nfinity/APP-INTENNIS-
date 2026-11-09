import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Eyebrow, Headline, Screen, SectionHead, Sub, Text } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { pad2 } from '@/lib/booking';
import { MONTHS, WEEK_HEAD, addDays, monthCells, occupancyDots, parseISO, shortDay } from '@/lib/dates';
import { setDraft, useDraft } from '@/lib/draft';
import { toISO } from '@/lib/game';
import { useLayout } from '@/lib/layout';
import { colors, space } from '@/lib/theme';
import { Court } from '@/lib/types';

type Summary = { days: { date: string; taken: number }[]; slotsPerDay: number };

// Calendário e ocupação: navega mês a mês (até 1 ano) e mostra o mapa do dia com todas as quadras.
export default function Calendario() {
  const today = toISO(new Date());
  const draft = useDraft();
  const { contentW } = useLayout();
  const [cursor, setCursor] = useState(() => {
    const d = parseISO(draft.date);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const courtsQ = useFetch<{ courts: Court[]; hours: number[]; maxDaysAhead: number }>('/courts');
  const maxDate = addDays(today, courtsQ.data?.maxDaysAhead ?? 365);
  const monthStart = toISO(new Date(cursor.y, cursor.m, 1));
  const dim = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const from = monthStart < today ? today : monthStart;
  const monthQ = useFetch<Summary>(`/availability/summary?from=${from}&days=${Math.max(1, dim - parseISO(from).getDate() + 1)}`);
  const dayQ = useFetch<{ taken: { courtId: string; hour: number }[]; teacherTaken: number[] }>(
    `/availability?date=${draft.date}${draft.kind === 'aula' && draft.teacherId ? `&teacherId=${draft.teacherId}` : ''}`,
  );

  const courts = courtsQ.data?.courts ?? [];
  const hours = courtsQ.data?.hours ?? [];
  const now = new Date();
  const cells = monthCells(cursor.y, cursor.m);
  const cellW = Math.floor((contentW - 34) / 7);
  const daySize = Math.min(34, cellW - 2);

  const canPrev = cursor.y > now.getFullYear() || (cursor.y === now.getFullYear() && cursor.m > now.getMonth());
  const canNext = toISO(new Date(cursor.y, cursor.m + 1, 1)) <= maxDate;
  const move = (d: number) => {
    const x = new Date(cursor.y, cursor.m + d, 1);
    setCursor({ y: x.getFullYear(), m: x.getMonth() });
  };

  const needTeacher = draft.kind === 'aula' && !draft.teacherId;
  const past = (h: number) => draft.date === today && h <= now.getHours();
  const busy = (courtId: string, h: number) =>
    past(h) ||
    !!dayQ.data?.taken.some((t) => t.courtId === courtId && t.hour === h) ||
    (draft.kind === 'aula' && !!draft.teacherId && !!dayQ.data?.teacherTaken.includes(h));

  // escolher um horário livre no mapa volta para a tela de reservas com tudo preenchido
  const pick = (courtId: string, h: number) => {
    setDraft({ courtId, hour: h });
    router.back();
  };

  return (
    <Screen refreshing={false} onRefresh={() => { monthQ.reload(); dayQ.reload(); }}>
      <View style={{ gap: 8 }}>
        <Eyebrow>Planeje sua próxima partida</Eyebrow>
        <Headline>Tem espaço pra você.</Headline>
        <Sub>Pontos indicam dias mais cheios. Selecione uma data para ver todas as quadras.</Sub>
      </View>

      <Card style={{ gap: space.md }}>
        <View style={s.head}>
          <Pressable onPress={() => canPrev && move(-1)} hitSlop={10} style={[s.nav, { opacity: canPrev ? 1 : 0.35 }]}>
            <Ionicons name="chevron-back" size={15} color={colors.ink} />
          </Pressable>
          <Text style={{ fontSize: 14, fontWeight: '500' }}>
            {MONTHS[cursor.m]} de {cursor.y}
          </Text>
          <Pressable onPress={() => canNext && move(1)} hitSlop={10} style={[s.nav, { opacity: canNext ? 1 : 0.35 }]}>
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
            const off = iso < today || iso > maxDate;
            const on = iso === draft.date;
            const dots = off ? 0 : occupancyDots(monthQ.data?.days.find((d) => d.date === iso)?.taken ?? 0, monthQ.data?.slotsPerDay ?? 0);
            return (
              <Pressable key={iso} disabled={off} onPress={() => setDraft({ date: iso, hour: null })} style={s.cell}>
                <View style={[{ width: daySize, height: daySize, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, on && { backgroundColor: colors.lime }]}>
                  <Text style={{ fontSize: 12.5, fontWeight: on ? '700' : '400', color: off ? colors.border : on ? colors.onLime : colors.ink }}>{parseISO(iso).getDate()}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2, height: 4, marginTop: 1 }}>
                  {Array.from({ length: dots }, (_, k) => (
                    <View key={k} style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.soft }} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Sub style={{ fontSize: 10.5 }}>• Até 3 pontos indicam mais reservas no dia</Sub>
      </Card>

      <SectionHead title={`Mapa do dia · ${shortDay(draft.date)}`} />
      {needTeacher && <Sub>Para aula, escolha o professor na tela anterior.</Sub>}
      <View style={{ gap: 6 }}>
        <View style={s.mapRow}>
          <View style={s.mapHour} />
          {courts.map((c, i) => (
            <Text key={c.id} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: colors.muted }}>
              Q{i + 1}
            </Text>
          ))}
        </View>
        {hours.map((h) => (
          <View key={h} style={s.mapRow}>
            <Text style={[s.mapHour, { fontSize: 11.5, color: colors.muted }]}>{pad2(h)}:00</Text>
            {courts.map((c) => {
              const off = needTeacher || busy(c.id, h);
              const on = draft.courtId === c.id && draft.hour === h;
              return (
                <Pressable key={c.id} disabled={off} onPress={() => pick(c.id, h)} style={[s.mapCell, on ? { backgroundColor: colors.lime } : off ? { backgroundColor: '#E9ECE2' } : { backgroundColor: colors.sage }]}>
                  <Text style={{ fontSize: 10.5, color: on ? colors.onLime : off ? colors.soft : colors.forest2 }}>{on ? 'Escolhido' : past(h) ? '—' : off ? 'Ocupado' : 'Livre'}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  mapRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapHour: { width: 48 },
  mapCell: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
