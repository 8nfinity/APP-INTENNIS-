import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EventCard } from '@/components/EventCard';
import { Card, Empty, ErrorState, Eyebrow, Headline, Loading, Screen, Segmented, Text } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { MONTHS, WEEK_HEAD, monthCells, parseISO } from '@/lib/dates';
import { useLayout } from '@/lib/layout';
import { colors, space } from '@/lib/theme';
import { GameEvent } from '@/lib/types';

export default function Eventos() {
  const { data, error, loading, reload } = useFetch<{ events: GameEvent[] }>('/events');
  const [view, setView] = useState<'destaques' | 'calendario'>('destaques');
  const [picked, setPicked] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }));
  const { contentW } = useLayout();
  const events = data?.events ?? [];

  const move = (d: number) => {
    const x = new Date(cursor.y, cursor.m + d, 1);
    setCursor({ y: x.getFullYear(), m: x.getMonth() });
  };
  const cells = monthCells(cursor.y, cursor.m);
  const size = Math.min(34, Math.floor((contentW - 34) / 7) - 2);
  const onDay = (iso: string) => events.filter((e) => e.date === iso);

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={{ gap: 8 }}>
        <Eyebrow>Nosso clube, sua agenda</Eyebrow>
        <Headline>Encontros que ficam.</Headline>
      </View>

      <Segmented
        options={[
          { key: 'destaques', label: 'Destaques' },
          { key: 'calendario', label: 'Calendário' },
        ]}
        value={view}
        onChange={setView}
      />

      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && events.length === 0 && <Empty icon="star-outline" title="Sem eventos por enquanto" hint="Torneios, encontros e novidades do clube aparecem aqui." />}

      {view === 'destaques' && events.map((e) => <EventCard key={e.id} e={e} />)}

      {view === 'calendario' && (
        <>
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
                const has = onDay(iso).length > 0;
                const on = picked === iso;
                return (
                  <Pressable key={iso} disabled={!has} onPress={() => setPicked(on ? null : iso)} style={s.cell}>
                    <View style={[{ width: size, height: size, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, has && { backgroundColor: on ? colors.forest2 : colors.lime }]}>
                      <Text style={{ fontSize: 12.5, fontWeight: has ? '700' : '400', color: has ? (on ? colors.onForest : colors.onLime) : colors.ink }}>{parseISO(iso).getDate()}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>
          {picked ? onDay(picked).map((e) => <EventCard key={e.id} e={e} />) : null}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
});
