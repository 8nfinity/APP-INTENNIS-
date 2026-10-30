import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button, Card, Chip, Empty, ErrorText, Field, Loading, Muted, Screen, Text, Title } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { fmtDate, toISO } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { Court, CourtBlock } from '@/lib/types';

function nextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { iso: toISO(d), label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` };
  });
}

export default function AdminBlocks() {
  const courtsQ = useFetch<{ courts: Court[]; hours: number[] }>('/courts');
  const blocksQ = useFetch<{ blocks: CourtBlock[] }>('/admin/blocks');
  const days = nextDays(21);
  const [courtId, setCourtId] = useState<string | null>(null);
  const [date, setDate] = useState(days[0].iso);
  const [hours, setHours] = useState<number[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const courts = courtsQ.data?.courts ?? [];
  const court = courts.find((c) => c.id === courtId) ?? courts[0];

  const toggle = (h: number) => setHours((cur) => (cur.includes(h) ? cur.filter((x) => x !== h) : [...cur, h]));

  const block = async () => {
    if (!court || hours.length === 0) return setError('Escolha a quadra e pelo menos um horário.');
    setBusy(true);
    setError(null);
    const failed: string[] = [];
    for (const h of hours) {
      try {
        await api('/admin/blocks', { method: 'POST', body: { courtId: court.id, date, hour: h, reason: reason.trim() } });
      } catch (e) {
        failed.push(`${String(h).padStart(2, '0')}:00 (${errMsg(e)})`);
      }
    }
    setBusy(false);
    setHours([]);
    blocksQ.reload();
    if (failed.length) setError(`Não foi possível bloquear: ${failed.join('; ')}`);
  };

  const unblock = (b: CourtBlock) =>
    Alert.alert('Liberar horário?', `${b.courtName} · ${fmtDate(b.date)} às ${String(b.hour).padStart(2, '0')}:00`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Liberar',
        onPress: async () => {
          try {
            await api(`/admin/blocks/${b.id}`, { method: 'DELETE' });
            blocksQ.reload();
          } catch (e) {
            Alert.alert('Erro', errMsg(e));
          }
        },
      },
    ]);

  return (
    <Screen padTop={false} refreshing={false} onRefresh={blocksQ.reload}>
      <Card style={{ gap: space.md }}>
        <Title>Novo bloqueio</Title>
        <Muted>Quadra</Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {courts.map((c) => (
            <Chip key={c.id} label={c.name} active={c.id === court?.id} onPress={() => setCourtId(c.id)} />
          ))}
        </View>
        <Muted>Dia</Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {days.map((d) => (
            <Chip key={d.iso} label={d.label} active={d.iso === date} onPress={() => setDate(d.iso)} />
          ))}
        </View>
        <Muted>Horários (toque para marcar vários)</Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(courtsQ.data?.hours ?? []).map((h) => (
            <Chip key={h} label={`${String(h).padStart(2, '0')}:00`} active={hours.includes(h)} onPress={() => toggle(h)} />
          ))}
        </View>
        <Field label="Motivo (opcional)" value={reason} onChangeText={setReason} maxLength={100} placeholder="Manutenção, torneio..." />
        <ErrorText>{error}</ErrorText>
        <Button label={`Bloquear ${hours.length || ''} horário${hours.length === 1 ? '' : 's'}`} loading={busy} onPress={block} />
      </Card>

      <Title>Bloqueios ativos</Title>
      {blocksQ.loading && <Loading />}
      {blocksQ.data && blocksQ.data.blocks.length === 0 && <Empty icon="checkmark-circle-outline" title="Nenhum horário bloqueado" />}
      {blocksQ.data?.blocks.map((b) => (
        <Pressable key={b.id} onPress={() => unblock(b)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                {b.courtName} · {fmtDate(b.date)} às {String(b.hour).padStart(2, '0')}:00
              </Text>
              {!!b.reason && <Muted>{b.reason}</Muted>}
            </View>
            <Text style={{ color: colors.danger, fontWeight: '800' }}>Liberar</Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
