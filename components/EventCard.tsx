import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { PhotoBackdrop } from '@/components/PhotoBackdrop';
import { Sub, Tag, Text } from '@/components/ui';
import { MONTHS_SHORT, parseISO } from '@/lib/dates';
import { colors, radius } from '@/lib/theme';
import { GameEvent } from '@/lib/types';

export const CATEGORY_LABEL: Record<GameEvent['category'], string> = { torneio: 'Torneio', jogo: 'Jogo', aula: 'Aula', novidade: 'Novidade' };

// Foto do evento com o selo de data e o título em serifa por cima (sem o rodapé).
export function EventPhoto({ e, height = 190 }: { e: GameEvent; height?: number }) {
  const d = parseISO(e.date);
  return (
    <View style={[s.photo, { height }]}>
      <PhotoBackdrop kind="card" photo={e.category === 'aula' || e.category === 'novidade' ? 'green' : 'clay'} />
      <View style={s.badge}>
        <Text style={{ fontSize: 9.5, color: colors.muted }}>{MONTHS_SHORT[d.getMonth()]}</Text>
        <Text style={{ fontSize: 22, fontWeight: '500', lineHeight: 24 }}>{d.getDate()}</Text>
      </View>
      <Text serif style={s.title} numberOfLines={3}>
        {e.title}
      </Text>
    </View>
  );
}

export function EventCard({ e }: { e: GameEvent }) {
  return (
    <Pressable onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} style={({ pressed }) => [s.card, { opacity: pressed ? 0.92 : 1 }]}>
      <EventPhoto e={e} />
      <View style={{ gap: 6, padding: 4, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tag label={CATEGORY_LABEL[e.category]} />
          <Sub style={{ fontSize: 11 }}>Saiba mais ↗</Sub>
        </View>
        <Text style={{ fontSize: 14.5, fontWeight: '500' }}>{e.title}</Text>
        {!!e.description && (
          <Sub style={{ fontSize: 12 }} numberOfLines={2}>
            {e.description}
          </Sub>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 8 },
  photo: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.forest2, justifyContent: 'flex-end', padding: 14 },
  badge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  title: { color: '#fff', fontSize: 26, lineHeight: 28, textAlign: 'right', letterSpacing: -0.4 },
});
