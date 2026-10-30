import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Chip, ErrorText, Loading, Muted, Screen, Text, Title, formatBRL } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { notify } from '@/lib/dialog';
import { fmtDate } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { BookingKind, Court } from '@/lib/types';

export default function Checkout() {
  const p = useLocalSearchParams<{ courtId: string; date: string; hour: string; kind: string }>();
  const hour = Number(p.hour);
  const kind = p.kind as BookingKind;
  const { data } = useFetch<{ courts: Court[]; classExtra: number }>('/courts');
  const court = data?.courts.find((c) => c.id === p.courtId);
  const price = court ? court.pricePerHour + (kind === 'aula' ? data!.classExtra : 0) : 0;

  const [method, setMethod] = useState<'pix' | 'cartao'>('pix');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    if (secs === null) return;
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(secs - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  // 1) segura o horário por 15 min no servidor; 2) paga. O preço vem do servidor.
  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const { booking, holdMinutes } = await api<{ booking: { id: string }; holdMinutes: number }>('/bookings', {
        method: 'POST',
        body: { courtId: p.courtId, date: p.date, hour, kind },
      });
      setSecs(holdMinutes * 60);
      await api(`/bookings/${booking.id}/pay`, { method: 'POST', body: { method } });
      notify('Reserva confirmada! ✅', 'Faça o check-in no dia para ganhar pontos.');
      router.dismissTo('/');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (!court) return <Loading />;

  return (
    <Screen padTop={false}>
      <Card glow style={{ gap: 4 }}>
        <Muted>{kind === 'aula' ? 'Aula com professor' : 'Jogo livre'}</Muted>
        <Title style={{ fontSize: 24 }}>
          {court.name} · {court.surface}
        </Title>
        <Muted>
          {fmtDate(p.date)} das {String(hour).padStart(2, '0')}:00 às {String(hour + 1).padStart(2, '0')}:00
        </Muted>
        <Text style={s.total}>{formatBRL(price)}</Text>
      </Card>

      <View style={s.row}>
        <Chip label="Pix" active={method === 'pix'} onPress={() => setMethod('pix')} />
        <Chip label="Cartão" active={method === 'cartao'} onPress={() => setMethod('cartao')} />
      </View>

      <Card style={{ gap: space.sm, flexDirection: 'row', alignItems: 'flex-start' }}>
        <Ionicons name="information-circle" size={20} color={colors.hot} />
        <Muted style={{ flex: 1 }}>
          Pagamento em modo de teste: nenhuma cobrança real é feita por enquanto. O horário fica reservado para você por 15
          minutos enquanto você paga.
        </Muted>
      </Card>

      {secs !== null && secs > 0 && (
        <Muted>
          Horário reservado por {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
        </Muted>
      )}
      <ErrorText>{error}</ErrorText>
      <Button label={`Pagar ${formatBRL(price)}`} arrow loading={busy} onPress={pay} />
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  total: { color: colors.accent, fontSize: 40, fontWeight: '900', letterSpacing: -1, marginTop: space.sm },
});
