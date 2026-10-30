import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, Chip, Muted, ProgressBar, Title } from '@/components/ui';
import { POINTS, TOURNAMENT_SPOTS, levelFor } from '@/lib/data';
import { useStore } from '@/lib/store';
import { colors, radius, space } from '@/lib/theme';
import { Player } from '@/lib/types';

const MEDALS = [colors.gold, colors.silver, colors.bronze];

export default function RankingScreen() {
  const { players, me, matches, challenge } = useStore();
  const [period, setPeriod] = useState<'geral' | 'mes'>('geral');

  const score = (p: Player) => (period === 'geral' ? p.points : p.monthPoints);
  const sorted = [...players].sort((a, b) => score(b) - score(a));
  const myPos = sorted.findIndex((p) => p.id === me.id) + 1;
  const lvl = levelFor(me.points);
  const cutoff = sorted[TOURNAMENT_SPOTS - 1];
  const gap = Math.max(0, score(cutoff) - score(me) + 1);
  const pending = matches.filter((m) => m.status === 'agendado');

  const doChallenge = (p: Player) => {
    challenge(p.id);
    Alert.alert('Desafio enviado! ⚔️', `${p.name} foi desafiado. Vitória vale +${POINTS.vitoria} pontos.`);
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Card style={s.hero}>
        <View style={s.heroTop}>
          <View>
            <Muted>Sua posição</Muted>
            <Text style={s.pos}>#{myPos}</Text>
          </View>
          <View style={[s.badge, { borderColor: lvl.current.color }]}>
            <Text style={{ color: lvl.current.color, fontWeight: '900' }}>{lvl.current.name}</Text>
          </View>
        </View>
        <ProgressBar value={lvl.progress} color={lvl.current.color} />
        <Muted>
          {lvl.next ? `Faltam ${lvl.toNext} pts para ${lvl.next.name}` : 'Nível máximo!'} · {me.points} pts
        </Muted>
        <Text style={s.tournament}>
          🏆 {myPos <= TOURNAMENT_SPOTS
            ? 'Você está na zona do torneio! Mantenha a posição.'
            : `Faltam ${gap} pts para entrar no top ${TOURNAMENT_SPOTS} e ser convidado ao torneio.`}
        </Text>
      </Card>

      <Card>
        <Title>Como ganhar pontos</Title>
        <Muted style={{ marginTop: 6 }}>
          Vitória +{POINTS.vitoria} · Derrota +{POINTS.derrota} · Aula +{POINTS.aula} · Jogo agendado (check-in) +
          {POINTS.jogoAgendado}
        </Muted>
      </Card>

      {pending.length > 0 && (
        <View style={{ gap: space.sm }}>
          <Title>Jogos marcados</Title>
          {pending.map((m) => {
            const opp = players.find((p) => p.id === m.opponentId)!;
            return (
              <Card key={m.id} style={s.rowCard}>
                <Avatar player={opp} />
                <Text style={[s.name, { flex: 1 }]}>vs {opp.name}</Text>
                <Button
                  label="Resultado"
                  onPress={() => router.push({ pathname: '/match-result', params: { matchId: m.id } })}
                  style={s.small}
                />
              </Card>
            );
          })}
        </View>
      )}

      <View style={s.row}>
        <Chip label="Geral" active={period === 'geral'} onPress={() => setPeriod('geral')} />
        <Chip label="Este mês" active={period === 'mes'} onPress={() => setPeriod('mes')} />
      </View>

      <View style={{ gap: space.sm }}>
        {sorted.map((p, i) => (
          <View key={p.id}>
            {i === TOURNAMENT_SPOTS && (
              <Text style={s.cutLine}>— linha de corte do torneio —</Text>
            )}
            <Card style={[s.rowCard, p.id === me.id && s.mine, i < TOURNAMENT_SPOTS && s.zone]}>
              <Text style={[s.rank, i < 3 && { color: MEDALS[i] }]}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</Text>
              <Avatar player={p} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{p.name}</Text>
                <Muted>
                  @{p.username} · {p.wins}V {p.losses}D{p.streak >= 3 ? ` · 🔥${p.streak}` : ''}
                </Muted>
              </View>
              <Text style={s.pts}>{score(p)}</Text>
              {p.id !== me.id && <Button label="⚔️" variant="ghost" onPress={() => doChallenge(p)} style={s.sword} />}
            </Card>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 40 },
  hero: { gap: space.sm, borderColor: colors.ball },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pos: { color: colors.ball, fontSize: 44, fontWeight: '900' },
  badge: { borderWidth: 2, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 6 },
  tournament: { color: colors.text, fontWeight: '700', marginTop: space.xs },
  row: { flexDirection: 'row', gap: space.sm },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  mine: { borderColor: colors.ball, backgroundColor: colors.cardAlt },
  zone: { borderLeftWidth: 4, borderLeftColor: colors.ball },
  rank: { color: colors.muted, width: 28, textAlign: 'center', fontWeight: '900', fontSize: 16 },
  name: { color: colors.text, fontWeight: '800', fontSize: 15 },
  pts: { color: colors.ball, fontWeight: '900', fontSize: 18 },
  cutLine: { color: colors.clay, textAlign: 'center', fontWeight: '700', marginVertical: space.sm, fontSize: 12 },
  small: { paddingVertical: 8, paddingHorizontal: 12 },
  sword: { paddingVertical: 8, paddingHorizontal: 12 },
});
