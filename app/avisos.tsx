import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Empty, Eyebrow, Headline, Loading, Screen, Sub, Text } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { pad2 } from '@/lib/booking';
import { addDays, longDay } from '@/lib/dates';
import { toISO } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { Booking, GameEvent, MatchRow } from '@/lib/types';

type Notice = { id: string; icon: keyof typeof Ionicons.glyphMap; title: string; text: string; go: () => void };

// Avisos (o sino do topo): resultados para confirmar, reservas dos próximos dias e eventos.
export default function Avisos() {
  const { player: me } = useAuth();
  const bookingsQ = useFetch<{ bookings: Booking[] }>('/bookings');
  const matchesQ = useFetch<{ matches: MatchRow[] }>('/matches');
  const eventsQ = useFetch<{ events: GameEvent[] }>('/events');
  const loading = bookingsQ.loading || matchesQ.loading || eventsQ.loading;
  if (!me) return null;

  const today = toISO(new Date());
  const in3 = addDays(today, 3);
  const in14 = addDays(today, 14);
  const notices: Notice[] = [];

  for (const m of matchesQ.data?.matches ?? []) {
    if (m.status === 'aguardando_confirmacao' && m.reportedBy !== me.id) {
      notices.push({ id: `m${m.id}`, icon: 'tennisball-outline', title: `${m.otherName} informou um resultado`, text: `Placar ${m.score ?? ''}. Confirme para os pontos entrarem.`, go: () => router.push('/challenges') });
    }
  }
  for (const b of bookingsQ.data?.bookings ?? []) {
    if (b.status === 'pago' && b.date >= today && b.date <= in3) {
      notices.push({ id: `b${b.id}`, icon: 'calendar-outline', title: b.date === today ? 'Você joga hoje' : `Reserva em ${longDay(b.date)}`, text: `${pad2(b.hour)}:00 · o check-in abre 1 hora antes.`, go: () => router.push({ pathname: '/booking/[id]', params: { id: b.id } }) });
    }
  }
  for (const e of eventsQ.data?.events ?? []) {
    if (e.date >= today && e.date <= in14) {
      notices.push({ id: `e${e.id}`, icon: 'star-outline', title: e.title, text: `${longDay(e.date)}${e.place ? ` · ${e.place}` : ''}`, go: () => router.push({ pathname: '/event/[id]', params: { id: e.id } }) });
    }
  }

  return (
    <Screen refreshing={false} onRefresh={() => { bookingsQ.reload(); matchesQ.reload(); eventsQ.reload(); }}>
      <View style={{ gap: 8 }}>
        <Eyebrow>Fique por dentro</Eyebrow>
        <Headline>Seus avisos.</Headline>
        <Sub>Resultados para confirmar, reservas próximas e eventos do clube.</Sub>
      </View>

      {loading && <Loading />}
      {!loading && notices.length === 0 && <Empty icon="notifications-outline" title="Tudo em dia" hint="Quando houver novidades, elas aparecem aqui." />}

      {notices.map((n) => (
        <Pressable key={n.id} onPress={n.go}>
          <Card style={s.row}>
            <View style={s.icon}>
              <Ionicons name={n.icon} size={18} color={colors.forest2} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '500' }}>{n.title}</Text>
              <Sub style={{ fontSize: 12 }}>{n.text}</Sub>
            </View>
            <Text style={{ color: colors.soft }}>↗</Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: 14 },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.limeSoft, alignItems: 'center', justifyContent: 'center' },
});
