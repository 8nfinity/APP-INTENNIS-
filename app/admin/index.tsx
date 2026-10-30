import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, ErrorState, Loading, Muted, Screen, StatTile, Text, formatBRL } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { colors, space } from '@/lib/theme';

type Stats = {
  players: number;
  bookingsToday: number;
  bookingsUpcoming: number;
  revenueMonth: number;
  posts: number;
  pendingMatches: number;
};

const MENU: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; href: Href }[] = [
  { icon: 'tennisball', title: 'Quadras', sub: 'Preço, piso, ativar e desativar', href: '/admin/courts' },
  { icon: 'ban', title: 'Bloquear horários', sub: 'Manutenção, aulas e eventos', href: '/admin/blocks' },
  { icon: 'list', title: 'Reservas', sub: 'Ver e cancelar reservas', href: '/admin/bookings' },
  { icon: 'megaphone', title: 'Eventos', sub: 'Publicar e apagar eventos', href: '/admin/events' },
  { icon: 'trophy', title: 'Jogadores e ranking', sub: 'Ajustar pontos, nomear admins', href: '/admin/players' },
];

export default function AdminHome() {
  const { data, error, loading, reload } = useFetch<Stats>('/admin/stats');

  return (
    <Screen padTop={false} refreshing={false} onRefresh={reload}>
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <View style={s.grid}>
          <StatTile value={String(data.players)} label="Jogadores" accent />
          <StatTile value={String(data.bookingsToday)} label="Reservas hoje" />
          <StatTile value={String(data.bookingsUpcoming)} label="Próximas reservas" />
          <StatTile value={String(data.pendingMatches)} label="Jogos a confirmar" />
          <StatTile value={String(data.posts)} label="Publicações" />
          <StatTile value={formatBRL(data.revenueMonth)} label="Receita do mês" />
        </View>
      )}
      <Muted>A receita só conta pagamentos reais. Pagamentos de teste não entram.</Muted>

      {MENU.map((m) => (
        <Pressable key={m.title} onPress={() => router.push(m.href)}>
          <Card style={s.menu}>
            <View style={s.icon}>
              <Ionicons name={m.icon} size={22} color={colors.onAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuTitle}>{m.title}</Text>
              <Muted>{m.sub}</Muted>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  menu: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { color: colors.text, fontWeight: '800', fontSize: 17 },
});
