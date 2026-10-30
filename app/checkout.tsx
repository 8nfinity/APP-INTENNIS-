import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip, Muted, Title, formatBRL } from '@/components/ui';
import { courts } from '@/lib/data';
import { PixCharge, confirmPixPayment, createPixCharge, payWithCard } from '@/lib/payments';
import { useStore } from '@/lib/store';
import { colors, space } from '@/lib/theme';
import { BookingKind } from '@/lib/types';

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ courtId: string; date: string; hour: string; kind: string; price: string }>();
  const { addBooking } = useStore();
  const court = courts.find((c) => c.id === params.courtId)!;
  const hour = Number(params.hour);
  const price = Number(params.price);
  const kind = params.kind as BookingKind;

  const [method, setMethod] = useState<'pix' | 'cartao'>('pix');
  const [pix, setPix] = useState<PixCharge | null>(null);
  const [busy, setBusy] = useState(false);

  const finish = (m: 'pix' | 'cartao') => {
    addBooking({ courtId: court.id, date: params.date, hour, kind, price, method: m });
    Alert.alert('Reserva confirmada! ✅', 'Faça o check-in no dia para ganhar pontos.');
    router.dismissTo('/');
  };

  const generatePix = async () => {
    setBusy(true);
    setPix(await createPixCharge(price, `${court.name} ${params.date} ${hour}h`));
    setBusy(false);
  };

  const confirmPix = async () => {
    if (!pix) return;
    setBusy(true);
    const ok = await confirmPixPayment(pix.id);
    setBusy(false);
    if (ok) finish('pix');
  };

  const payCard = async () => {
    setBusy(true);
    const ok = await payWithCard(price, '4242');
    setBusy(false);
    if (ok) finish('cartao');
    else Alert.alert('Pagamento recusado', 'Tente outro cartão.');
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Card>
        <Title>{kind === 'aula' ? 'Aula' : 'Jogo livre'} · {court.name}</Title>
        <Muted>
          {params.date.split('-').reverse().join('/')} das {String(hour).padStart(2, '0')}:00 às {String(hour + 1).padStart(2, '0')}:00
        </Muted>
        <Text style={s.total}>{formatBRL(price)}</Text>
      </Card>

      <View style={s.row}>
        <Chip label="Pix" active={method === 'pix'} onPress={() => setMethod('pix')} />
        <Chip label="Cartão" active={method === 'cartao'} onPress={() => setMethod('cartao')} />
      </View>

      {method === 'pix' ? (
        <Card style={{ gap: space.md }}>
          {!pix ? (
            <Button label={busy ? 'Gerando...' : 'Gerar Pix'} onPress={generatePix} disabled={busy} />
          ) : (
            <>
              <Muted>Pix copia e cola (expira em 10 min):</Muted>
              <Text selectable style={s.code}>{pix.copiaECola}</Text>
              <Button label={busy ? 'Verificando...' : 'Já paguei (simular)'} onPress={confirmPix} disabled={busy} />
            </>
          )}
        </Card>
      ) : (
        <Card style={{ gap: space.md }}>
          <Muted>Cartão final 4242 (simulado)</Muted>
          <Button label={busy ? 'Processando...' : `Pagar ${formatBRL(price)}`} onPress={payCard} disabled={busy} />
        </Card>
      )}

      <Muted>Pagamento simulado: nenhuma cobrança real é feita nesta versão.</Muted>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg },
  row: { flexDirection: 'row', gap: space.sm },
  total: { color: colors.ball, fontSize: 32, fontWeight: '900', marginTop: space.sm },
  code: { color: colors.text, backgroundColor: colors.cardAlt, padding: space.md, borderRadius: 10, fontSize: 12 },
});
