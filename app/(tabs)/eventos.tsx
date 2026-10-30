import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Empty, ErrorState, H1, Loading, Muted, Screen, Text } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { colors, radius, space } from '@/lib/theme';
import { GameEvent } from '@/lib/types';

const CATEGORY: Record<GameEvent['category'], { label: string; color: string }> = {
  torneio: { label: 'TORNEIO', color: colors.gold },
  jogo: { label: 'JOGO', color: colors.accent },
  aula: { label: 'AULA', color: '#5BC0EB' },
  novidade: { label: 'NOVIDADE', color: colors.hot },
};
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function daysUntil(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((new Date(y, m - 1, d).getTime() - start) / 86400000);
}

export default function Eventos() {
  const { data, error, loading, reload } = useFetch<{ events: GameEvent[] }>('/events');
  const [watching, setWatching] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setWatching((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <H1 style={{ fontSize: 40, lineHeight: 42 }}>Agenda{'\n'}do clube</H1>
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.events.length === 0 && <Empty icon="calendar-outline" title="Sem eventos por enquanto" hint="Novidades do clube aparecem aqui." />}
      {data?.events.map((e, i) => {
        const cat = CATEGORY[e.category];
        const n = daysUntil(e.date);
        const on = watching.has(e.id);
        const [, m, d] = e.date.split('-').map(Number);
        return (
          <Card key={e.id} glow={i === 0} style={{ gap: space.md }}>
            <View style={s.top}>
              <View style={s.dateCircle}>
                <Text style={s.dateDay}>{d}</Text>
                <Text style={s.dateMonth}>{MONTHS[m - 1]}</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[s.tag, { color: cat.color, borderColor: cat.color }]}>{cat.label}</Text>
                <Text style={s.when}>{n <= 0 ? 'Hoje' : n === 1 ? 'Amanhã' : `em ${n} dias`}</Text>
              </View>
            </View>
            <Text style={s.title}>{e.title}</Text>
            {!!e.description && <Text style={s.desc}>{e.description}</Text>}
            {!!e.place && <Muted>📍 {e.place}</Muted>}
            <Pressable onPress={() => toggle(e.id)} style={[s.btn, on && s.btnOn]}>
              <Text style={[s.btnText, on && { color: colors.onAccent }]}>{on ? '🔔 Vou acompanhar' : 'Quero ser avisado'}</Text>
            </Pressable>
          </Card>
        );
      })}
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dateCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.onAccent, fontSize: 24, fontWeight: '900', lineHeight: 26, letterSpacing: -1 },
  dateMonth: { color: colors.onAccent, fontSize: 11, fontWeight: '800' },
  tag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '900',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    letterSpacing: 1,
  },
  when: { color: colors.text, fontWeight: '700', fontSize: 15 },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: -1, lineHeight: 28 },
  desc: { color: colors.text, opacity: 0.8, lineHeight: 21, fontSize: 15 },
  btn: {
    alignSelf: 'flex-start',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(244,243,236,0.07)',
  },
  btnOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  btnText: { color: colors.text, fontWeight: '700' },
});
