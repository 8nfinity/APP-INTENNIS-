import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Avatar, Button, Card, Empty, ErrorState, Eyebrow, Headline, InfoBox, Loading, Screen, SectionHead, Sub, Tag, Text } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/dialog';
import { colors, space } from '@/lib/theme';
import { MatchRow } from '@/lib/types';

// Desafios e placares: o resultado só pontua depois que o adversário confirma.
export default function Challenges() {
  const { player: me, refreshPlayer } = useAuth();
  const { data, error, loading, reload } = useFetch<{ matches: MatchRow[] }>('/matches');
  if (!me) return null;

  const all = data?.matches ?? [];
  const open = all.filter((m) => m.status === 'agendado' || m.status === 'aguardando_confirmacao');
  const done = all.filter((m) => m.status === 'finalizado');

  const answer = async (m: MatchRow, accept: boolean) => {
    try {
      await api(`/matches/${m.id}/confirm`, { method: 'POST', body: { accept } });
      reload();
      refreshPlayer();
    } catch (e) {
      notify('Confirmação', errMsg(e));
    }
  };

  return (
    <Screen refreshing={false} onRefresh={reload}>
      <View style={{ gap: 8 }}>
        <Eyebrow>Bora jogar?</Eyebrow>
        <Headline>Seus desafios.</Headline>
        <Sub>Combine a partida e confirme o resultado com o adversário.</Sub>
      </View>

      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && open.length === 0 && <Empty icon="tennisball-outline" title="Nenhum desafio em aberto" hint="Escolha alguém no ranking para desafiar." />}

      {open.map((m) => {
        const waitingMe = m.status === 'aguardando_confirmacao' && m.reportedBy !== me.id;
        const waitingThem = m.status === 'aguardando_confirmacao' && m.reportedBy === me.id;
        const won = m.winnerId === me.id;
        return (
          <Card key={m.id} style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Avatar name={m.otherName} url={m.otherAvatarUrl} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '500' }}>{m.otherName}</Text>
                <Sub style={{ fontSize: 11.5 }}>Desafio individual</Sub>
              </View>
              <Tag tone="sage" label={m.status === 'agendado' ? 'Marcado' : waitingMe ? 'Confirmar' : 'Aguardando'} />
            </View>

            {m.status === 'aguardando_confirmacao' && (
              <View style={{ alignItems: 'center', gap: 2, paddingVertical: 6 }}>
                <Text style={{ fontSize: 24, letterSpacing: -0.5 }}>{(m.score || '-').trim().replace(/\s+/g, ' / ').replace(/-/g, '–')}</Text>
                <Sub style={{ fontSize: 12 }}>{won ? 'Você venceu' : 'Você perdeu'}</Sub>
              </View>
            )}

            {waitingThem && <InfoBox>Resultado informado. Aguardando a confirmação da outra pessoa.</InfoBox>}
            {waitingMe && <InfoBox>{m.otherName} informou este resultado. Confirme se está certo.</InfoBox>}

            {m.status === 'agendado' && <Button label="Informar resultado" onPress={() => router.push({ pathname: '/match-result', params: { matchId: m.id, name: m.otherName } })} />}
            {waitingMe && (
              <>
                <Button label="Confirmar resultado" onPress={() => answer(m, true)} />
                <Pressable onPress={() => answer(m, false)} hitSlop={8} style={{ alignSelf: 'center' }}>
                  <Text style={{ fontSize: 12.5, color: colors.danger }}>Contestar resultado</Text>
                </Pressable>
              </>
            )}
          </Card>
        );
      })}

      <Button label="Encontrar adversário" variant="ghost" onPress={() => router.push('/ranking')} />
      <InfoBox>Um placar contestado volta para revisão. Nenhum ponto é concedido enquanto não houver confirmação.</InfoBox>

      {done.length > 0 && (
        <View style={{ gap: space.sm }}>
          <SectionHead title="Histórico" />
          {done.slice(0, 8).map((m) => (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Avatar name={m.otherName} url={m.otherAvatarUrl} size={32} />
              <Text style={{ flex: 1, fontSize: 13 }}>{m.otherName}</Text>
              <Sub style={{ fontSize: 11.5 }}>{m.score}</Sub>
              <Tag label={m.winnerId === me.id ? 'Vitória' : 'Derrota'} tone={m.winnerId === me.id ? 'lime' : 'sage'} />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
