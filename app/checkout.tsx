import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CourtArt } from '@/components/CourtArt';
import { Button, Card, ErrorText, Header, Loading, Muted, Screen, Section, Stepper, Text, formatBRL } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { pad2 } from '@/lib/booking';
import { notify } from '@/lib/dialog';
import { fmtDate } from '@/lib/game';
import { colors, radius, space } from '@/lib/theme';
import { BookingKind, Court } from '@/lib/types';

const METHODS = [
  { key: 'pix' as const, label: 'Pix', sub: 'Aprovação na hora', icon: 'qr-code-outline' as const },
  { key: 'cartao' as const, label: 'Cartão de crédito', sub: 'Visa, Master, Elo', icon: 'card-outline' as const },
];

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
    if (secs === null || secs <= 0) return;
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
      notify('Reserva confirmada! ✅', 'Ela aparece no seu perfil. Faça o check-in no dia para ganhar pontos.');
      router.dismissTo('/');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Confirmar reserva" />
      <Stepper steps={['Quadra', 'Data e horário', 'Confirmar']} current={2} />
      {!court ? (
        <Loading />
      ) : (
        <>
          <Card style={s.service}>
            <CourtArt surface={court.surface} size={84} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 17, fontWeight: '700' }}>
                {court.name} · {court.surface}
              </Text>
              <Muted>{kind === 'aula' ? 'Aula com professor' : 'Jogo livre'}</Muted>
              <Muted>
                {fmtDate(p.date)} • {pad2(hour)}:00 às {pad2(hour + 1)}:00
              </Muted>
            </View>
          </Card>

          <Section>Forma de pagamento</Section>
          <View style={{ gap: space.sm }}>
            {METHODS.map((m) => {
              const on = method === m.key;
              return (
                <Pressable key={m.key} onPress={() => setMethod(m.key)} style={[s.method, on && s.methodOn]}>
                  <Ionicons name={m.icon} size={22} color={colors.text} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', fontSize: 15 }}>{m.label}</Text>
                    <Muted>{m.sub}</Muted>
                  </View>
                  <View style={[s.radio, on && s.radioOn]}>{on && <View style={s.radioDot} />}</View>
                </Pressable>
              );
            })}
          </View>

          <Card style={{ gap: space.sm }}>
            <View style={s.line}>
              <Muted>Quadra (60 min)</Muted>
              <Text>{formatBRL(court.pricePerHour)}</Text>
            </View>
            {kind === 'aula' && (
              <View style={s.line}>
                <Muted>Professor</Muted>
                <Text>{formatBRL(price - court.pricePerHour)}</Text>
              </View>
            )}
            <View style={[s.line, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.sm }]}>
              <Text style={{ fontWeight: '700' }}>Total</Text>
              <Text style={{ fontWeight: '800', fontSize: 18 }}>{formatBRL(price)}</Text>
            </View>
          </Card>

          <View style={s.secure}>
            <Ionicons name="information-circle-outline" size={18} color={colors.hot} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.hot }}>
              Modo de teste: nenhuma cobrança real é feita. O horário fica reservado por 15 min enquanto você paga.
            </Text>
          </View>
          {secs !== null && secs > 0 && (
            <Muted style={{ textAlign: 'center' }}>
              Horário reservado por {Math.floor(secs / 60)}:{pad2(secs % 60)}
            </Muted>
          )}
          <ErrorText>{error}</ErrorText>
          <Button label="Pagar" trailing={formatBRL(price)} loading={busy} onPress={pay} />
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  service: { flexDirection: 'row', gap: space.lg, alignItems: 'center', padding: space.md },
  method: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  methodOn: { borderColor: colors.cream },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.cream },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.cream },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secure: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(232,149,95,0.35)' },
});
