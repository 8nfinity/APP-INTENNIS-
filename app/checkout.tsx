import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DemoQR } from '@/components/DemoQR';
import { Banner, Button, Card, ErrorText, Eyebrow, Headline, InfoBox, Loading, Screen, Segmented, Sub, Tag, Text, Title, formatBRL } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { pad2 } from '@/lib/booking';
import { longDay } from '@/lib/dates';
import { useDraft } from '@/lib/draft';
import { colors, space } from '@/lib/theme';
import { Court, Teacher } from '@/lib/types';

const mmss = (secs: number) => `${pad2(Math.floor(secs / 60))}:${pad2(secs % 60)}`;

// Revisão e pagamento: segura o horário por 15 minutos assim que a tela abre.
export default function Checkout() {
  const draft = useDraft();
  const { data } = useFetch<{ courts: Court[] }>('/courts');
  const teachersQ = useFetch<{ teachers: Teacher[] }>('/teachers');
  const courts = data?.courts ?? [];
  const court = courts.find((c) => c.id === draft.courtId);
  const courtNo = court ? courts.indexOf(court) + 1 : 0;
  const teacher = draft.kind === 'aula' ? teachersQ.data?.teachers.find((t) => t.id === draft.teacherId) : undefined;
  const total = court ? court.pricePerHour + (teacher?.pricePerHour ?? 0) : 0;

  const [method, setMethod] = useState<'pix' | 'cartao'>('pix');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [secs, setSecs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const ready = !!court && draft.hour !== null && (draft.kind === 'jogo' || (!teachersQ.loading && !!teacher));

  // 1) ao abrir, segura o horário no servidor (o preço vem sempre do servidor)
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    api<{ booking: { id: string }; holdSeconds: number }>('/bookings', {
      method: 'POST',
      body: { courtId: draft.courtId, date: draft.date, hour: draft.hour, kind: draft.kind, teacherId: teacher?.id },
    })
      .then((r) => {
        setBookingId(r.booking.id);
        setSecs(r.holdSeconds);
      })
      .catch((e) => setError(errMsg(e)));
  }, [ready, draft, teacher?.id]);

  useEffect(() => {
    if (secs === null || secs <= 0) return;
    const t = setTimeout(() => setSecs(secs - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  // 2) paga. Em produção quem confirma o pagamento é o gateway.
  const pay = async () => {
    if (!bookingId) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/bookings/${bookingId}/pay`, { method: 'POST', body: { method } });
      router.replace({ pathname: '/booking/[id]', params: { id: bookingId } });
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  const expired = secs !== null && secs <= 0;

  if (draft.hour === null || (!court && data)) {
    return (
      <Screen>
        <Eyebrow>Reservar quadra</Eyebrow>
        <Headline>Escolha um horário primeiro.</Headline>
        <Button label="Voltar para as quadras" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Eyebrow>Só falta confirmar</Eyebrow>
        <Headline>Sua quadra está{'\n'}quase garantida.</Headline>
      </View>

      {!court || (draft.kind === 'aula' && teachersQ.loading) ? (
        <Loading />
      ) : (
        <>
          {secs !== null && <Banner>{expired ? 'Tempo esgotado. Volte e escolha o horário de novo.' : `Horário reservado por ${mmss(secs)}`}</Banner>}

          <Card style={{ gap: space.sm }}>
            <Tag label={draft.kind === 'aula' ? 'Aula com professor' : 'Jogo livre'} />
            <Title style={{ marginTop: 6 }}>Quadra {pad2(courtNo)}</Title>
            <Sub>
              {longDay(draft.date)} · {pad2(draft.hour)}:00
            </Sub>
            <Sub>60 minutos · {court.surface}</Sub>
            <View style={s.rule} />
            <View style={s.line}>
              <Sub style={{ color: colors.ink }}>Quadra</Sub>
              <Text style={{ fontSize: 13 }}>{formatBRL(court.pricePerHour)}</Text>
            </View>
            {teacher && (
              <View style={s.line}>
                <Sub style={{ color: colors.ink }}>Professor {teacher.name}</Sub>
                <Text style={{ fontSize: 13 }}>{formatBRL(teacher.pricePerHour)}</Text>
              </View>
            )}
            <View style={[s.line, { marginTop: space.sm }]}>
              <Text style={{ fontSize: 13, color: colors.muted }}>Total</Text>
              <Text style={{ fontSize: 28, fontWeight: '400', letterSpacing: -0.8 }}>{formatBRL(total)}</Text>
            </View>
          </Card>

          <Segmented options={[{ key: 'pix', label: 'Pix' }, { key: 'cartao', label: 'Cartão' }]} value={method} onChange={setMethod} />

          {method === 'pix' ? (
            <View style={{ gap: space.md }}>
              <Title>Pague com Pix</Title>
              <InfoBox>Pagamento de demonstração. Não escaneie nem transfira valores.</InfoBox>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View style={s.qr}>
                  <DemoQR seed={bookingId ?? 'demo'} />
                </View>
                <Sub style={{ fontSize: 11, letterSpacing: 1.5 }}>DEMO</Sub>
              </View>
            </View>
          ) : (
            <View style={{ gap: space.md }}>
              <Title>Cartão de crédito</Title>
              <InfoBox>Pagamento de demonstração. Nenhum cartão é cobrado nesta versão.</InfoBox>
            </View>
          )}

          <ErrorText>{error}</ErrorText>
          <Button
            label={method === 'pix' ? 'Já fiz o Pix' : 'Pagar'}
            trailing={formatBRL(total)}
            loading={busy}
            disabled={!bookingId || expired}
            onPress={pay}
          />
          {error && !bookingId && <Button label="Escolher outro horário" variant="ghost" onPress={() => router.back()} />}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  rule: { height: 1, backgroundColor: colors.border, marginVertical: space.sm },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qr: { padding: 10, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.border },
});
