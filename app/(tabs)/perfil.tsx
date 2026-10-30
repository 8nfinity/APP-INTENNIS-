import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, Muted, ProgressBar, Title } from '@/components/ui';
import { levelFor } from '@/lib/data';
import { useStore } from '@/lib/store';
import { colors, space } from '@/lib/theme';

export default function PerfilScreen() {
  const { me, players } = useStore();
  const lvl = levelFor(me.points);
  const rank = [...players].sort((a, b) => b.points - a.points).findIndex((p) => p.id === me.id) + 1;
  const games = me.wins + me.losses;

  const badges = [
    { icon: '🎾', label: 'Primeiro jogo', on: games >= 1 },
    { icon: '🔥', label: 'Sequência de 3', on: me.streak >= 3 },
    { icon: '📚', label: 'Aluno dedicado', on: me.classes >= 5 },
    { icon: '🏅', label: '10 vitórias', on: me.wins >= 10 },
    { icon: '🏆', label: 'Top 8', on: rank <= 8 },
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.head}>
        <Avatar player={me} size={84} />
        <Title style={{ fontSize: 24 }}>{me.name}</Title>
        <Muted>@{me.username}</Muted>
        <Text style={s.bio}>{me.bio}</Text>
        <Button label="Editar perfil" variant="ghost" onPress={() => router.push('/edit-profile')} />
      </View>

      <Card style={{ gap: space.sm }}>
        <View style={s.between}>
          <Title style={{ color: lvl.current.color }}>{lvl.current.name}</Title>
          <Text style={s.pts}>{me.points} pts</Text>
        </View>
        <ProgressBar value={lvl.progress} color={lvl.current.color} />
        <Muted>{lvl.next ? `${lvl.toNext} pts para ${lvl.next.name}` : 'Você chegou ao topo!'}</Muted>
      </Card>

      <View style={s.stats}>
        <Stat label="Ranking" value={`#${rank}`} />
        <Stat label="Jogos" value={String(games)} />
        <Stat label="Vitórias" value={String(me.wins)} />
        <Stat label="Aulas" value={String(me.classes)} />
      </View>

      <Title>Conquistas</Title>
      <View style={s.badges}>
        {badges.map((b) => (
          <Card key={b.label} style={[s.badge, !b.on && { opacity: 0.35 }]}>
            <Text style={{ fontSize: 28 }}>{b.icon}</Text>
            <Text style={s.badgeText}>{b.label}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Muted>{label}</Muted>
    </Card>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 40 },
  head: { alignItems: 'center', gap: space.sm },
  bio: { color: colors.text, textAlign: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pts: { color: colors.ball, fontWeight: '900', fontSize: 20 },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, alignItems: 'center', padding: space.md },
  statValue: { color: colors.text, fontWeight: '900', fontSize: 20 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: { width: '31%', alignItems: 'center', padding: space.md, gap: 4 },
  badgeText: { color: colors.text, fontSize: 11, textAlign: 'center', fontWeight: '700' },
});
