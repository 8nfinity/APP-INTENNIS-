import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PhotoBackdrop } from '@/components/PhotoBackdrop';
import { Button, Card, Empty, Eyebrow, Headline, Loading, Screen, Sub, Tag, Text, Title, formatBRL } from '@/components/ui';
import { useFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { checkinInfo, courtLabel, doCheckIn, pad2 } from '@/lib/booking';
import { longDay } from '@/lib/dates';
import { photoForSurface } from '@/lib/photos';
import { colors, radius, space } from '@/lib/theme';
import { Booking, Court } from '@/lib/types';

// Reserva e check-in: o comprovante da reserva e o botão de presença, que vale pontos.
export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshPlayer } = useAuth();
  const bookingsQ = useFetch<{ bookings: Booking[] }>('/bookings');
  const courtsQ = useFetch<{ courts: Court[] }>('/courts');

  const b = bookingsQ.data?.bookings.find((x) => x.id === id);
  const courts = courtsQ.data?.courts ?? [];
  const court = courts.find((c) => c.id === b?.courtId);

  if (bookingsQ.loading) return <Screen><Loading /></Screen>;
  if (!b) {
    return (
      <Screen>
        <Empty icon="calendar-outline" title="Reserva não encontrada" hint="Ela pode ter expirado ou sido cancelada." />
      </Screen>
    );
  }

  const ci = checkinInfo(b);
  const status = b.status === 'concluido' ? 'Concluída' : b.status === 'pago' ? 'Confirmada' : 'Aguardando pagamento';

  const checkIn = async () => {
    if (await doCheckIn(b.id)) {
      bookingsQ.reload();
      refreshPlayer();
    }
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Eyebrow>Sua reserva</Eyebrow>
        <Headline>Nos vemos em quadra.</Headline>
      </View>

      <Card style={{ gap: space.md }}>
        <View style={s.between}>
          <Tag label={status} />
          <Sub style={{ fontSize: 11 }}>#IN{b.id.slice(0, 4).toUpperCase()}</Sub>
        </View>
        <Title>{court ? courtLabel(court.name, courts.indexOf(court)) : 'Quadra'}</Title>
        <View style={s.photo}>
          <PhotoBackdrop kind="plain" photo={photoForSurface(court?.surface)} />
        </View>
        <View style={{ gap: 10 }}>
          <Row label="Data" value={longDay(b.date)} />
          <Row label="Horário" value={`${pad2(b.hour)}:00 · 60 minutos`} />
          <Row label="Modalidade" value={b.kind === 'aula' ? `Aula${b.teacherName ? ` com ${b.teacherName}` : ''}` : 'Jogo livre'} />
          <Row label={b.status === 'pendente' ? 'Valor' : 'Valor pago'} value={formatBRL(b.price)} />
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        <Title>Presença que vale pontos</Title>
        <Sub>
          Check-in de 1 hora antes do início até o fim do horário. {b.kind === 'aula' ? '+20 pontos por aula.' : '+10 pontos por jogo.'}
        </Sub>
      </View>

      {ci.state === 'open' && <Button label="Confirmar minha presença" onPress={checkIn} />}
      {ci.state === 'done' && <Button label="Presença confirmada ✓" variant="ghost" disabled onPress={() => {}} />}
      {(ci.state === 'soon' || ci.state === 'closed') && (
        <>
          <Button label="Confirmar minha presença" disabled onPress={() => {}} />
          <Sub style={{ textAlign: 'center' }}>{ci.label}</Sub>
        </>
      )}
      {ci.state === 'none' && b.status === 'pendente' && <Sub>Pague para confirmar este horário.</Sub>}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.between}>
      <Sub style={{ fontSize: 12 }}>{label}</Sub>
      <Text style={{ fontSize: 13, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photo: { height: 150, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.forest2 },
});
