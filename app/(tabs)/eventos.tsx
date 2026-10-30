import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Muted, Title } from '@/components/ui';
import { events } from '@/lib/data';
import { colors, radius, space } from '@/lib/theme';
import { GameEvent } from '@/lib/types';

const CATEGORY: Record<GameEvent['category'], { label: string; color: string }> = {
  torneio: { label: 'TORNEIO', color: colors.gold },
  jogo: { label: 'JOGO', color: colors.ball },
  aula: { label: 'AULA', color: '#5BC0EB' },
  novidade: { label: 'NOVIDADE', color: colors.clay },
};

function daysUntil(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((target - start) / 86400000);
}

export default function EventosScreen() {
  const [interested, setInterested] = useState<Set<string>>(new Set());
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  const toggle = (id: string) =>
    setInterested((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Title style={{ fontSize: 24 }}>Agenda do clube</Title>
      {sorted.map((e) => {
        const cat = CATEGORY[e.category];
        const n = daysUntil(e.date);
        const on = interested.has(e.id);
        return (
          <Card key={e.id} style={{ gap: space.sm }}>
            <View style={s.top}>
              <Text style={[s.tag, { color: cat.color, borderColor: cat.color }]}>{cat.label}</Text>
              <Text style={s.when}>{n <= 0 ? 'Hoje' : n === 1 ? 'Amanhã' : `em ${n} dias`}</Text>
            </View>
            <Text style={s.title}>{e.title}</Text>
            <Text style={s.desc}>{e.description}</Text>
            <Muted>
              {e.date.split('-').reverse().join('/')} · {e.place}
            </Muted>
            <Pressable onPress={() => toggle(e.id)} style={[s.btn, on && s.btnOn]}>
              <Text style={[s.btnText, on && { color: colors.onBall }]}>
                {on ? '🔔 Vou acompanhar' : 'Quero ser avisado'}
              </Text>
            </Pressable>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 40 },
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
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  desc: { color: colors.text, opacity: 0.85, lineHeight: 20 },
  btn: {
    marginTop: space.xs,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  btnOn: { backgroundColor: colors.ball, borderColor: colors.ball },
  btnText: { color: colors.text, fontWeight: '700' },
});
