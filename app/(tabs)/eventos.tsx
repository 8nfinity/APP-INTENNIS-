import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Empty, ErrorState, H1, Loading, Muted, Screen } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { fmtDate } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { GameEvent } from '@/lib/types';

const CATEGORY: Record<GameEvent['category'], { label: string; color: string }> = {
  torneio: { label: 'TORNEIO', color: colors.gold },
  jogo: { label: 'JOGO', color: colors.accent },
  aula: { label: 'AULA', color: '#5BC0EB' },
  novidade: { label: 'NOVIDADE', color: colors.hot },
};

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
    <Screen refreshing={false} onRefresh={reload}>
      <H1 style={{ fontSize: 34 }}>Agenda do clube</H1>
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.events.length === 0 && <Empty icon="calendar-outline" title="Sem eventos por enquanto" hint="Novidades do clube aparecem aqui." />}
      {data?.events.map((e) => {
        const cat = CATEGORY[e.category];
        const n = daysUntil(e.date);
        const on = watching.has(e.id);
        return (
          <Card key={e.id} style={{ gap: space.sm }}>
            <View style={s.top}>
              <Text style={[s.tag, { color: cat.color, borderColor: cat.color }]}>{cat.label}</Text>
              <Text style={s.when}>{n <= 0 ? 'Hoje' : n === 1 ? 'Amanhã' : `em ${n} dias`}</Text>
            </View>
            <Text style={s.title}>{e.title}</Text>
            <Text style={s.desc}>{e.description}</Text>
            <Muted>
              {fmtDate(e.date)} · {e.place}
            </Muted>
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
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: {
    fontSize: 11,
    fontWeight: '900',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    letterSpacing: 1,
  },
  when: { color: colors.text, fontWeight: '800' },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  desc: { color: colors.text, opacity: 0.8, lineHeight: 20 },
  btn: {
    marginTop: space.xs,
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  btnOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  btnText: { color: colors.text, fontWeight: '700' },
});
