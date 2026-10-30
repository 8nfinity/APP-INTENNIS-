import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { Avatar, Button, Card, Empty, ErrorState, Loading, Muted, RoundButton, Screen, Section, Segmented, Text } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { confirmAsk, notify } from '@/lib/dialog';
import { POINTS, TOURNAMENT_SPOTS } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { MatchRow, Player } from '@/lib/types';

const MEDAL = [colors.gold, colors.silver, colors.bronze];
const PILL: [string, string][] = [
  ['#C8E64A', '#7FD39A'],
  ['#9AD9B4', '#C8E64A'],
  ['#E9C46A', '#E8955F'],
];

// Bloco 3D do pódio: face de cima (trapézio) + frente em degradê com o número grande.
function Block({ n, height }: { n: number; height: number }) {
  const W = 100;
  return (
    <View style={{ width: '100%' }}>
      <Svg width="100%" height={16} viewBox={`0 0 ${W} 16`} preserveAspectRatio="none">
        <Polygon points={`10,0 ${W - 10},0 ${W},16 0,16`} fill="#2C4434" />
      </Svg>
      <LinearGradient colors={['#253A2B', 'rgba(37,58,43,0)']} style={{ height, alignItems: 'center', paddingTop: 10 }}>
        <Text style={s.blockNum}>{n}</Text>
      </LinearGradient>
    </View>
  );
}

function PodiumSpot({ p, rank, score }: { p?: Player; rank: number; score: number }) {
  const heights = [150, 116, 92];
  if (!p) return <View style={{ flex: 1 }} />;
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <View>
        <Avatar name={p.name} url={p.avatarUrl} size={rank === 0 ? 78 : 62} ring={MEDAL[rank]} />
        <View style={[s.medal, { backgroundColor: MEDAL[rank] }]}>
          {rank === 0 ? <Ionicons name="trophy" size={13} color="#1A1A1A" /> : <Text style={s.medalText}>{rank + 1}</Text>}
        </View>
      </View>
      <Text style={s.podName} numberOfLines={1}>
        {p.username}
      </Text>
      <LinearGradient colors={PILL[rank]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.pill}>
        <Text style={s.pillText}>{score} pts</Text>
      </LinearGradient>
      <View style={{ height: 10 }} />
      <Block n={rank + 1} height={heights[rank]} />
    </View>
  );
}

export default function Ranking() {
  const { player: me, refreshPlayer } = useAuth();
  const rankQ = useFetch<{ players: Player[] }>('/ranking');
  const matchQ = useFetch<{ matches: MatchRow[] }>('/matches');
  const [period, setPeriod] = useState<'geral' | 'mes'>('geral');

  const reload = () => {
    rankQ.reload();
    matchQ.reload();
    refreshPlayer();
  };

  if (!me) return null;

  const score = (p: Player) => (period === 'geral' ? p.points : p.monthPoints);
  const sorted = [...(rankQ.data?.players ?? [])].sort((a, b) => score(b) - score(a));
  const myPos = sorted.findIndex((p) => p.id === me.id) + 1;
  const cutoff = sorted[TOURNAMENT_SPOTS - 1];
  const gap = cutoff && myPos > TOURNAMENT_SPOTS ? Math.max(0, score(cutoff) - score(me) + 1) : 0;
  const matches = (matchQ.data?.matches ?? []).filter((m) => m.status === 'agendado' || m.status === 'aguardando_confirmacao');

  const challenge = async (p: Player) => {
    if (p.id === me.id) return;
    if (!(await confirmAsk(`Desafiar ${p.name}?`, `Combinem o jogo. Vitória vale +${POINTS.vitoria} pontos e derrota +${POINTS.derrota}.`, 'Desafiar'))) return;
    try {
      await api('/matches', { method: 'POST', body: { opponentId: p.id } });
      notify('Desafio criado! ⚔️', 'Depois do jogo, informe o resultado aqui no ranking.');
      matchQ.reload();
    } catch (e) {
      notify('Desafio', errMsg(e));
    }
  };

  const confirm = async (m: MatchRow, accept: boolean) => {
    try {
      await api(`/matches/${m.id}/confirm`, { method: 'POST', body: { accept } });
      reload();
    } catch (e) {
      notify('Confirmação', errMsg(e));
    }
  };

  const rules = () =>
    notify(
      'Como ganhar pontos',
      `Vitória +${POINTS.vitoria}\nDerrota +${POINTS.derrota}\nAula (check-in) +${POINTS.aula}\nJogo reservado (check-in) +${POINTS.jogoAgendado}\n\nOs ${TOURNAMENT_SPOTS} primeiros são convidados para o torneio.`,
    );

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={s.head}>
        <Text style={s.title}>Ranking</Text>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <RoundButton icon="information-circle-outline" onPress={rules} />
          <RoundButton icon="person-circle-outline" onPress={() => router.push('/perfil')} />
        </View>
      </View>

      <Segmented
        options={[
          { key: 'geral', label: 'Geral' },
          { key: 'mes', label: 'Este mês' },
        ]}
        value={period}
        onChange={setPeriod}
      />

      {rankQ.loading && <Loading />}
      {rankQ.error && <ErrorState message={rankQ.error} onRetry={rankQ.reload} />}

      {sorted.length > 0 && (
        <View style={s.podium}>
          <PodiumSpot p={sorted[1]} rank={1} score={sorted[1] ? score(sorted[1]) : 0} />
          <PodiumSpot p={sorted[0]} rank={0} score={score(sorted[0])} />
          <PodiumSpot p={sorted[2]} rank={2} score={sorted[2] ? score(sorted[2]) : 0} />
        </View>
      )}

      <Card glow style={s.mine}>
        <View style={{ flex: 1 }}>
          <Muted>Sua posição</Muted>
          <Text style={{ fontSize: 26, fontWeight: '800' }}>#{myPos || '-'}</Text>
        </View>
        <Text style={s.mineHint}>
          {myPos > 0 && myPos <= TOURNAMENT_SPOTS
            ? '🏆 Você está na zona do torneio'
            : gap > 0
              ? `Faltam ${gap} pts para o top ${TOURNAMENT_SPOTS}`
              : `Top ${TOURNAMENT_SPOTS} vai ao torneio`}
        </Text>
      </Card>

      {matches.length > 0 && (
        <View style={{ gap: space.sm }}>
          <Section>Seus jogos</Section>
          {matches.map((m) => {
            const waitingMe = m.status === 'aguardando_confirmacao' && m.reportedBy !== me.id;
            const waitingThem = m.status === 'aguardando_confirmacao' && m.reportedBy === me.id;
            return (
              <Card key={m.id} style={{ gap: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <Avatar name={m.otherName} url={m.otherAvatarUrl} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700' }}>vs {m.otherName}</Text>
                    <Muted>
                      {m.status === 'agendado'
                        ? 'Jogo marcado'
                        : waitingThem
                          ? 'Aguardando o adversário confirmar'
                          : `Resultado: ${m.winnerId === me.id ? 'você venceu' : 'você perdeu'} ${m.score ?? ''}`}
                    </Muted>
                  </View>
                </View>
                {m.status === 'agendado' && (
                  <Button label="Informar resultado" variant="ghost" onPress={() => router.push({ pathname: '/match-result', params: { matchId: m.id, name: m.otherName } })} />
                )}
                {waitingMe && (
                  <View style={{ flexDirection: 'row', gap: space.sm }}>
                    <Button label="Confirmar" onPress={() => confirm(m, true)} style={{ flex: 1 }} />
                    <Button label="Contestar" variant="danger" onPress={() => confirm(m, false)} style={{ flex: 1 }} />
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {sorted.length <= 1 && !rankQ.loading && <Empty title="Você abre o ranking" hint="Quando outros jogadores entrarem, eles aparecem aqui." />}

      <View>
        {sorted.slice(3).map((p, i) => {
          const pos = i + 4;
          return (
            <View key={p.id}>
              {pos === TOURNAMENT_SPOTS + 1 && <Text style={s.cut}>linha de corte do torneio</Text>}
              <Pressable onPress={() => challenge(p)} style={[s.row, p.id === me.id && s.rowMine]}>
                <View style={s.rank}>
                  <Ionicons name="trophy-outline" size={13} color={colors.muted} />
                  <Text style={s.rankText}>{pos}</Text>
                </View>
                <Avatar name={p.name} url={p.avatarUrl} size={46} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Muted>@{p.username}</Muted>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={15} color={colors.gold} />
                    <Text style={s.pts}>{score(p)}</Text>
                  </View>
                  {p.monthPoints > 0 && <Text style={s.delta}>+{p.monthPoints} no mês</Text>}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
      {sorted.length > 3 && <Muted style={{ textAlign: 'center' }}>Toque num jogador para desafiá-lo</Muted>}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: space.md },
  medal: { position: 'absolute', right: -4, top: -2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  medalText: { color: '#1A1A1A', fontWeight: '800', fontSize: 12 },
  podName: { marginTop: 8, fontSize: 14, fontWeight: '600', maxWidth: '95%' },
  pill: { marginTop: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { color: '#14210F', fontWeight: '800', fontSize: 14 },
  blockNum: { fontSize: 56, fontWeight: '700', color: 'rgba(244,243,236,0.35)', lineHeight: 60 },
  mine: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  mineHint: { color: colors.cream, fontWeight: '600', fontSize: 13, textAlign: 'right', flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowMine: { backgroundColor: 'rgba(244,243,236,0.04)', borderRadius: 12, paddingHorizontal: 8 },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 3, width: 36 },
  rankText: { color: colors.muted, fontWeight: '600', fontSize: 14 },
  name: { fontSize: 16, fontWeight: '600' },
  pts: { fontSize: 17, fontWeight: '700' },
  delta: { color: colors.lime, fontSize: 12, fontWeight: '600', marginTop: 2 },
  cut: { color: colors.hot, textAlign: 'center', fontSize: 11, fontWeight: '600', paddingVertical: 8, letterSpacing: 1, textTransform: 'uppercase' },
});
