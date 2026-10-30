import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, Chip, Empty, ErrorState, H1, Loading, Muted, ProgressBar, Screen, Title } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { POINTS, TOURNAMENT_SPOTS, levelFor } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { MatchRow, Player } from '@/lib/types';

const MEDALS = ['🥇', '🥈', '🥉'];

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
  if (rankQ.loading) return <Screen><Loading /></Screen>;

  const score = (p: Player) => (period === 'geral' ? p.points : p.monthPoints);
  const sorted = [...(rankQ.data?.players ?? [])].sort((a, b) => score(b) - score(a));
  const myPos = sorted.findIndex((p) => p.id === me.id) + 1;
  const lvl = levelFor(me.points);
  const cutoff = sorted[TOURNAMENT_SPOTS - 1];
  const gap = cutoff && myPos > TOURNAMENT_SPOTS ? Math.max(0, score(cutoff) - score(me) + 1) : 0;
  const matches = (matchQ.data?.matches ?? []).filter((m) => m.status === 'agendado' || m.status === 'aguardando_confirmacao');

  const challenge = async (p: Player) => {
    try {
      await api('/matches', { method: 'POST', body: { opponentId: p.id } });
      Alert.alert('Desafio criado! ⚔️', `Combinem o jogo com ${p.name}. Vitória vale +${POINTS.vitoria} pontos.`);
      matchQ.reload();
    } catch (e) {
      Alert.alert('Desafio', errMsg(e));
    }
  };

  const confirm = async (m: MatchRow, accept: boolean) => {
    try {
      await api(`/matches/${m.id}/confirm`, { method: 'POST', body: { accept } });
      reload();
    } catch (e) {
      Alert.alert('Confirmação', errMsg(e));
    }
  };

  return (
    <Screen refreshing={false} onRefresh={reload}>
      <H1 style={{ fontSize: 34 }}>Ranking</H1>

      {rankQ.error && <ErrorState message={rankQ.error} onRetry={rankQ.reload} />}

      <Card glow style={{ gap: space.sm }}>
        <View style={s.between}>
          <View>
            <Muted>Sua posição</Muted>
            <Text style={s.pos}>#{myPos || '-'}</Text>
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
          🏆{' '}
          {myPos > 0 && myPos <= TOURNAMENT_SPOTS
            ? 'Você está na zona do torneio! Mantenha a posição.'
            : gap > 0
              ? `Faltam ${gap} pts para entrar no top ${TOURNAMENT_SPOTS} e ser convidado ao torneio.`
              : `Os ${TOURNAMENT_SPOTS} primeiros do ranking são convidados ao torneio.`}
        </Text>
      </Card>

      <Card>
        <Title>Como ganhar pontos</Title>
        <Muted style={{ marginTop: 6 }}>
          Vitória +{POINTS.vitoria} · Derrota +{POINTS.derrota} · Aula +{POINTS.aula} · Jogo reservado (check-in) +
          {POINTS.jogoAgendado}
        </Muted>
      </Card>

      {matches.length > 0 && (
        <View style={{ gap: space.sm }}>
          <Title>Seus jogos</Title>
          {matches.map((m) => {
            const waitingMe = m.status === 'aguardando_confirmacao' && m.reportedBy !== me.id;
            const waitingThem = m.status === 'aguardando_confirmacao' && m.reportedBy === me.id;
            return (
              <Card key={m.id} style={{ gap: space.md }}>
                <View style={s.between}>
                  <Avatar name={m.otherName} />
                  <View style={{ flex: 1, marginLeft: space.md }}>
                    <Text style={s.name}>vs {m.otherName}</Text>
                    <Muted>
                      {m.status === 'agendado'
                        ? 'Jogo marcado'
                        : waitingThem
                          ? 'Aguardando o adversário confirmar'
                          : `Resultado informado: ${m.winnerId === me.id ? 'você venceu' : 'você perdeu'} ${m.score ?? ''}`}
                    </Muted>
                  </View>
                </View>
                {m.status === 'agendado' && (
                  <Button
                    label="Informar resultado"
                    variant="ghost"
                    onPress={() => router.push({ pathname: '/match-result', params: { matchId: m.id, name: m.otherName } })}
                  />
                )}
                {waitingMe && (
                  <View style={s.between}>
                    <Button label="Confirmar" onPress={() => confirm(m, true)} style={{ flex: 1 }} />
                    <Button label="Contestar" variant="danger" onPress={() => confirm(m, false)} style={{ flex: 1, marginLeft: space.sm }} />
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      <View style={s.row}>
        <Chip label="Geral" active={period === 'geral'} onPress={() => setPeriod('geral')} />
        <Chip label="Este mês" active={period === 'mes'} onPress={() => setPeriod('mes')} />
      </View>

      {sorted.length <= 1 && (
        <Empty title="Você abre o ranking" hint="Chame a galera para o app. Quando outros jogadores entrarem, eles aparecem aqui." />
      )}

      <View style={{ gap: space.sm }}>
        {sorted.map((p, i) => (
          <View key={p.id}>
            {i === TOURNAMENT_SPOTS && <Text style={s.cutLine}>— linha de corte do torneio —</Text>}
            <Card style={[s.rowCard, p.id === me.id && s.mine, i < TOURNAMENT_SPOTS && s.zone]}>
              <Text style={s.rank}>{i < 3 ? MEDALS[i] : i + 1}</Text>
              <Avatar name={p.name} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{p.name}</Text>
                <Muted>
                  @{p.username} · {p.wins}V {p.losses}D{p.streak >= 3 ? ` · 🔥${p.streak}` : ''}
                </Muted>
              </View>
              <Text style={s.pts}>{score(p)}</Text>
              {p.id !== me.id && <Button label="⚔️" variant="ghost" onPress={() => challenge(p)} style={s.sword} />}
            </Card>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pos: { color: colors.accent, fontSize: 52, fontWeight: '900', letterSpacing: -2 },
  badge: { borderWidth: 2, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 6 },
  tournament: { color: colors.text, fontWeight: '700', marginTop: space.xs },
  row: { flexDirection: 'row', gap: space.sm },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  mine: { borderColor: colors.accent, backgroundColor: colors.cardAlt },
  zone: { borderLeftWidth: 4, borderLeftColor: colors.accent },
  rank: { color: colors.muted, width: 30, textAlign: 'center', fontWeight: '900', fontSize: 16 },
  name: { color: colors.text, fontWeight: '800', fontSize: 15 },
  pts: { color: colors.accent, fontWeight: '900', fontSize: 18 },
  cutLine: { color: colors.hot, textAlign: 'center', fontWeight: '700', marginVertical: space.sm, fontSize: 12 },
  sword: { paddingVertical: 8, paddingHorizontal: 12 },
});
