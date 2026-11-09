import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CATEGORY_LABEL, EventPhoto } from '@/components/EventCard';
import { Button, Card, Empty, Eyebrow, Headline, InfoBox, Loading, Screen, Sub, Tag, Text, Title } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { notify } from '@/lib/dialog';
import { longDay } from '@/lib/dates';
import { colors, space } from '@/lib/theme';
import { GameEvent } from '@/lib/types';

// Detalhes do evento: informações e "tenho interesse" (o clube vê quem se interessou).
export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, reload } = useFetch<{ events: GameEvent[] }>('/events');
  const [busy, setBusy] = useState(false);
  const e = data?.events.find((x) => x.id === id);

  if (loading) return <Screen><Loading /></Screen>;
  if (!e) {
    return (
      <Screen>
        <Empty icon="star-outline" title="Evento não encontrado" hint="Ele pode ter sido removido pelo clube." />
      </Screen>
    );
  }

  const toggle = async () => {
    setBusy(true);
    try {
      await api(`/events/${e.id}/interest`, { method: 'POST' });
      reload();
    } catch (err) {
      notify('Interesse', errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Eyebrow>Agenda do clube</Eyebrow>
        <Headline style={{ fontSize: 28, lineHeight: 31 }}>{e.title}</Headline>
      </View>

      <Card style={{ padding: 8, gap: 10 }}>
        <EventPhoto e={e} height={200} />
        <View style={{ gap: 6, paddingHorizontal: 6, paddingBottom: 6 }}>
          <Tag label={CATEGORY_LABEL[e.category]} />
          <Text style={{ fontSize: 14.5, fontWeight: '500' }}>{e.title}</Text>
          {!!e.description && <Sub style={{ fontSize: 12 }}>{e.description}</Sub>}
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={s.box}>
          <Text style={s.boxLabel}>QUANDO</Text>
          <Text style={{ fontSize: 13, fontWeight: '500' }}>{longDay(e.date)}</Text>
        </View>
        <View style={s.box}>
          <Text style={s.boxLabel}>ONDE</Text>
          <Text style={{ fontSize: 13, fontWeight: '500' }}>{e.place || 'IN Tennis Club'}</Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Title>Sobre o encontro</Title>
        <Sub style={{ fontSize: 13, lineHeight: 19 }}>{e.description || 'Mais detalhes em breve.'}</Sub>
      </View>

      {e.category === 'torneio' && <InfoBox>Os 8 primeiros do ranking são convidados. O clube confirma as inscrições.</InfoBox>}

      <Button
        label={e.interestedByMe ? 'Interesse confirmado ✓' : 'Tenho interesse'}
        variant={e.interestedByMe ? 'ghost' : 'primary'}
        arrow={!e.interestedByMe}
        loading={busy}
        onPress={toggle}
      />
      <Sub style={{ textAlign: 'center', fontSize: 11.5 }}>
        {e.interestCount === 0 ? 'Seja o primeiro a mostrar interesse.' : `${e.interestCount} ${e.interestCount === 1 ? 'pessoa tem' : 'pessoas têm'} interesse.`}
      </Sub>
    </Screen>
  );
}

const s = StyleSheet.create({
  box: { flex: 1, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4 },
  boxLabel: { fontSize: 9, letterSpacing: 1.4, color: colors.soft, fontWeight: '700' },
});
