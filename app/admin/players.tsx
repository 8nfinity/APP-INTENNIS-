import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { Avatar, Button, Card, Empty, ErrorText, Field, Loading, Muted, Screen, Text } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { useMe } from '@/lib/auth';
import { colors, space } from '@/lib/theme';
import { Player } from '@/lib/types';

function PlayerCard({ p, isMe, onChanged }: { p: Player; isMe: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const adjust = async () => {
    const n = Number(points);
    if (!Number.isInteger(n) || n === 0) return setError('Informe um número inteiro, ex: 20 ou -10.');
    try {
      await api(`/admin/players/${p.id}/points`, { method: 'POST', body: { points: n, note: note.trim() } });
      setPoints('');
      setNote('');
      setOpen(false);
      setError(null);
      onChanged();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const toggleAdmin = () =>
    Alert.alert(p.isAdmin ? 'Remover administrador?' : 'Tornar administrador?', `${p.name} (@${p.username})`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await api(`/admin/players/${p.id}/admin`, { method: 'POST', body: { isAdmin: !p.isAdmin } });
            onChanged();
          } catch (e) {
            Alert.alert('Erro', errMsg(e));
          }
        },
      },
    ]);

  return (
    <Card style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Avatar name={p.name} url={p.avatarUrl} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>
            {p.name} {p.isAdmin ? '🛡️' : ''}
          </Text>
          <Muted>
            @{p.username} · {p.wins}V {p.losses}D
          </Muted>
        </View>
        <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 20 }}>{p.points}</Text>
      </View>
      {open ? (
        <View style={{ gap: space.md }}>
          <Field label="Pontos (use - para tirar)" value={points} onChangeText={setPoints} keyboardType="numbers-and-punctuation" placeholder="ex: 25 ou -10" />
          <Field label="Motivo" value={note} onChangeText={setNote} maxLength={100} placeholder="ex: vitória no torneio" />
          <ErrorText>{error}</ErrorText>
          <Button label="Aplicar ajuste" onPress={adjust} />
          <Button label="Cancelar" variant="ghost" onPress={() => setOpen(false)} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="Ajustar pontos" variant="ghost" onPress={() => setOpen(true)} style={{ flex: 1, minHeight: 46 }} />
          {!isMe && (
            <Button
              label={p.isAdmin ? 'Tirar admin' : 'Tornar admin'}
              variant={p.isAdmin ? 'danger' : 'ghost'}
              onPress={toggleAdmin}
              style={{ flex: 1, minHeight: 46 }}
            />
          )}
        </View>
      )}
    </Card>
  );
}

export default function AdminPlayers() {
  const me = useMe();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);
  const { data, loading, reload } = useFetch<{ players: Player[] }>(`/admin/players?q=${encodeURIComponent(debounced)}`);

  return (
    <Screen padTop={false} refreshing={false} onRefresh={reload}>
      <Field label="Buscar jogador" value={q} onChangeText={setQ} autoCapitalize="none" placeholder="Nome ou @usuário" />
      {loading && <Loading />}
      {data && data.players.length === 0 && <Empty title="Nenhum jogador encontrado" />}
      {data?.players.map((p) => (
        <PlayerCard key={p.id + p.points + String(p.isAdmin)} p={p} isMe={p.id === me.id} onChanged={reload} />
      ))}
    </Screen>
  );
}
