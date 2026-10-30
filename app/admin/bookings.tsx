import { Pressable, View, Alert } from 'react-native';
import { useState } from 'react';

import { Button, Card, Chip, Empty, ErrorState, Loading, Muted, Screen, Text, formatBRL } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { fmtDate, toISO } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { AdminBooking } from '@/lib/types';

const STATUS: Record<AdminBooking['status'], { label: string; color: string }> = {
  pendente: { label: 'Aguardando pagamento', color: colors.hot },
  pago: { label: 'Pago', color: colors.accent },
  concluido: { label: 'Concluído', color: colors.success },
  cancelado: { label: 'Cancelado', color: colors.muted },
};

function dayOptions() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { iso: toISO(d), label: i === 0 ? 'Hoje' : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` };
  });
}

export default function AdminBookings() {
  const days = dayOptions();
  const [date, setDate] = useState(days[0].iso);
  const { data, error, loading, reload } = useFetch<{ bookings: AdminBooking[] }>(`/admin/bookings?date=${date}`);

  const cancel = (b: AdminBooking) =>
    Alert.alert('Cancelar reserva?', `${b.playerName} · ${b.courtName} às ${String(b.hour).padStart(2, '0')}:00. O horário volta a ficar livre.`, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar reserva',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/admin/bookings/${b.id}/cancel`, { method: 'POST' });
            reload();
          } catch (e) {
            Alert.alert('Erro', errMsg(e));
          }
        },
      },
    ]);

  return (
    <Screen padTop={false} refreshing={false} onRefresh={reload}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {days.map((d) => (
          <Chip key={d.iso} label={d.label} active={d.iso === date} onPress={() => setDate(d.iso)} />
        ))}
      </View>
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.bookings.length === 0 && <Empty icon="calendar-outline" title="Sem reservas nesse dia" />}
      {data?.bookings.map((b) => {
        const st = STATUS[b.status];
        return (
          <Card key={b.id} style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>{String(b.hour).padStart(2, '0')}:00</Text>
              <Text style={{ color: st.color, fontWeight: '800' }}>{st.label}</Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {b.playerName} <Muted>@{b.playerUsername}</Muted>
            </Text>
            <Muted>
              {b.courtName} · {b.kind === 'aula' ? 'Aula' : 'Jogo'} · {formatBRL(b.price)} · {fmtDate(b.date)}
            </Muted>
            {(b.status === 'pago' || b.status === 'pendente') && (
              <Button label="Cancelar reserva" variant="danger" onPress={() => cancel(b)} />
            )}
          </Card>
        );
      })}
      <Pressable onPress={reload}>
        <Muted style={{ textAlign: 'center' }}>Puxe para atualizar</Muted>
      </Pressable>
    </Screen>
  );
}
