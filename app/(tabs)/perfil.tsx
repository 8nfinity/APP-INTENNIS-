import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, H1, Muted, ProgressBar, Screen, Title } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { levelFor } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { Player } from '@/lib/types';

export default function Perfil() {
  const me = useMe();
  const { signOut, session, refreshPlayer } = useAuth();
  const rankQ = useFetch<{ players: Player[] }>('/ranking');
  const lvl = levelFor(me.points);
  const rank = (rankQ.data?.players ?? []).findIndex((p) => p.id === me.id) + 1;
  const games = me.wins + me.losses;

  const badges = [
    { icon: '🎾', label: 'Primeiro jogo', on: games >= 1 },
    { icon: '🔥', label: 'Sequência de 3', on: me.streak >= 3 },
    { icon: '📚', label: 'Aluno dedicado', on: me.classes >= 5 },
    { icon: '🏅', label: '10 vitórias', on: me.wins >= 10 },
    { icon: '🏆', label: 'Top 8', on: rank > 0 && rank <= 8 },
    { icon: '⭐', label: '100 pontos', on: me.points >= 100 },
  ];

  const deleteAccount = () =>
    Alert.alert(
      'Excluir meus dados?',
      'Seu perfil, reservas, jogos e posts serão apagados e você sairá do app. Isso não pode ser desfeito.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api('/me', { method: 'DELETE' });
              await signOut();
            } catch (e) {
              Alert.alert('Erro', errMsg(e));
            }
          },
        },
      ],
    );

  return (
    <Screen refreshing={false} onRefresh={() => { refreshPlayer(); rankQ.reload(); }}>
      <View style={s.head}>
        <Avatar name={me.name} size={92} />
        <H1>{me.name}</H1>
        <Muted>@{me.username}</Muted>
        {!!me.bio && <Text style={s.bio}>{me.bio}</Text>}
        <Muted>{session?.user.email}</Muted>
        <Button label="Editar perfil" variant="ghost" onPress={() => router.push('/edit-profile')} />
      </View>

      <Card glow style={{ gap: space.sm }}>
        <View style={s.between}>
          <Text style={[s.level, { color: lvl.current.color }]}>{lvl.current.name}</Text>
          <Text style={s.pts}>{me.points} pts</Text>
        </View>
        <ProgressBar value={lvl.progress} color={lvl.current.color} />
        <Muted>{lvl.next ? `${lvl.toNext} pts para ${lvl.next.name}` : 'Você chegou ao topo!'}</Muted>
      </Card>

      <View style={s.stats}>
        <Stat label="Ranking" value={rank ? `#${rank}` : '-'} />
        <Stat label="Jogos" value={String(games)} />
        <Stat label="Vitórias" value={String(me.wins)} />
        <Stat label="Aulas" value={String(me.classes)} />
      </View>

      <Title>Conquistas</Title>
      <View style={s.badges}>
        {badges.map((b) => (
          <Card key={b.label} style={[s.badge, !b.on && { opacity: 0.3 }]}>
            <Text style={{ fontSize: 28 }}>{b.icon}</Text>
            <Text style={s.badgeText}>{b.label}</Text>
          </Card>
        ))}
      </View>

      <Button label="Sair" variant="ghost" onPress={signOut} />
      <Button label="Excluir meus dados" variant="danger" onPress={deleteAccount} />
    </Screen>
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
  head: { alignItems: 'center', gap: space.sm },
  bio: { color: colors.text, textAlign: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  level: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pts: { color: colors.accent, fontWeight: '900', fontSize: 22 },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, alignItems: 'center', padding: space.md },
  statValue: { color: colors.text, fontWeight: '900', fontSize: 20 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: { width: '31%', alignItems: 'center', padding: space.md, gap: 4 },
  badgeText: { color: colors.text, fontSize: 11, textAlign: 'center', fontWeight: '700' },
});
