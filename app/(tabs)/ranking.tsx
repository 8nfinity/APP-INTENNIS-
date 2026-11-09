import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Empty, ErrorState, Eyebrow, Headline, Loading, Screen, SectionHead, Segmented, Sub, Text } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { confirmAsk, notify } from '@/lib/dialog';
import { POINTS, TOURNAMENT_SPOTS } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { Player } from '@/lib/types';

function PodiumSpot({ p, rank, score }: { p?: Player; rank: 1 | 2 | 3; score: number }) {
  const h = rank === 1 ? 78 : rank === 2 ? 56 : 44;
  if (!p) return <View style={{ flex: 1 }} />;
  const first = rank === 1;
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      {first && <Ionicons name="trophy" size={14} color={colors.gold} style={{ marginBottom: 2 }} />}
      <Avatar name={p.name} url={p.avatarUrl} size={first ? 58 : 46} ring={first ? '#C3DC66' : '#D6E0BC'} />
      <Text style={{ fontSize: 12, fontWeight: '500', marginTop: 6 }} numberOfLines={1}>
        {p.name.split(' ')[0]}
      </Text>
      <Text style={{ fontSize: 10.5, color: colors.muted, marginBottom: 8 }}>{score} pts</Text>
      <View style={[s.block, { height: h }, first ? { backgroundColor: colors.lime } : { backgroundColor: '#D9E2BE' }]}>
        <Text style={{ fontSize: 26, fontWeight: '400', color: first ? colors.onLime : '#6F7F52' }}>{rank}</Text>
      </View>
    </View>
  );
}

export default function Ranking() {
  const { player: me, refreshPlayer } = useAuth();
  const rankQ = useFetch<{ players: Player[] }>('/ranking');
  const [period, setPeriod] = useState<'geral' | 'mes'>('geral');

  if (!me) return null;

  const score = (p: Player) => (period === 'geral' ? p.points : p.monthPoints);
  const sorted = [...(rankQ.data?.players ?? [])].sort((a, b) => score(b) - score(a));
  const myPos = sorted.findIndex((p) => p.id === me.id) + 1;

  const challenge = async (p: Player) => {
    if (p.id === me.id) return;
    const ok = await confirmAsk(`Desafiar ${p.name}?`, `Combinem o jogo. Vitória vale +${POINTS.vitoria} pontos e derrota +${POINTS.derrota}.`, 'Desafiar');
    if (!ok) return;
    try {
      await api('/matches', { method: 'POST', body: { opponentId: p.id } });
      router.push('/challenges');
    } catch (e) {
      notify('Desafio', errMsg(e));
    }
  };

  const reload = () => {
    rankQ.reload();
    refreshPlayer();
  };

  return (
    <Screen tab refreshing={false} onRefresh={reload}>
      <View style={{ gap: 8 }}>
        <Eyebrow>Cada jogo conta</Eyebrow>
        <Headline>O clube em movimento.</Headline>
        <Sub>Jogue, evolua e encontre seu próximo desafio.</Sub>
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
        <LinearGradient colors={['#E3EBC8', '#EFF3E2']} style={s.podium}>
          <PodiumSpot p={sorted[1]} rank={2} score={sorted[1] ? score(sorted[1]) : 0} />
          <PodiumSpot p={sorted[0]} rank={1} score={score(sorted[0])} />
          <PodiumSpot p={sorted[2]} rank={3} score={sorted[2] ? score(sorted[2]) : 0} />
        </LinearGradient>
      )}

      <SectionHead title="Ranking completo" action="Meus desafios" onAction={() => router.push('/challenges')} />

      {sorted.length <= 1 && !rankQ.loading && <Empty title="Você abre o ranking" hint="Quando outros jogadores entrarem, eles aparecem aqui." />}

      <View>
        {sorted.map((p, i) => (
          <View key={p.id}>
            {i === TOURNAMENT_SPOTS && <Text style={s.cut}>Linha de corte do torneio</Text>}
            <Pressable onPress={() => challenge(p)} style={[s.row, p.id === me.id && { backgroundColor: colors.sage, borderRadius: 14, paddingHorizontal: 10, borderBottomColor: 'transparent' }]}>
              <Text style={{ width: 20, fontSize: 12.5, color: colors.muted }}>{i + 1}</Text>
              <Avatar name={p.name} url={p.avatarUrl} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '500' }} numberOfLines={1}>
                  {p.name}
                </Text>
                <Sub style={{ fontSize: 11 }}>@{p.username}</Sub>
              </View>
              <Text style={{ fontSize: 12.5 }}>{score(p)} pts</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {sorted.length > 1 && (
        <Sub style={{ textAlign: 'center', fontSize: 11 }}>
          {myPos > 0 && myPos <= TOURNAMENT_SPOTS ? `Você está entre os ${TOURNAMENT_SPOTS} convidados ao torneio. ` : `Os ${TOURNAMENT_SPOTS} primeiros são convidados ao torneio. `}
          Toque num jogador para desafiá-lo.
        </Sub>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, borderRadius: 26, paddingTop: 22, paddingHorizontal: 18, borderWidth: 1, borderColor: '#DCE5C4' },
  block: { width: '100%', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  cut: { textAlign: 'center', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.amberText, paddingVertical: 10 },
});
