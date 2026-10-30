import { useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { Button, Card, ErrorState, ErrorText, Field, Loading, Muted, Screen, Text, Title, formatBRL } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { colors, space } from '@/lib/theme';
import { AdminCourt } from '@/lib/types';

function CourtCard({ court, onChanged }: { court: AdminCourt; onChanged: () => void }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(court.name);
  const [surface, setSurface] = useState(court.surface);
  const [price, setPrice] = useState(String(court.pricePerHour));
  const [error, setError] = useState<string | null>(null);

  const patch = async (body: object) => {
    try {
      await api(`/admin/courts/${court.id}`, { method: 'PATCH', body });
      setError(null);
      onChanged();
      return true;
    } catch (e) {
      setError(errMsg(e));
      return false;
    }
  };

  const save = async () => {
    const p = Number(price.replace(',', '.'));
    if (!(p >= 0)) return setError('Preço inválido.');
    if (await patch({ name, surface, pricePerHour: p })) setEdit(false);
  };

  return (
    <Card style={{ gap: space.md, opacity: court.active ? 1 : 0.6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Title>{court.name}</Title>
          <Muted>
            {court.surface} · {formatBRL(court.pricePerHour)}/h
          </Muted>
        </View>
        <Switch value={court.active} onValueChange={(v) => {
            patch({ active: v });
          }} trackColor={{ true: colors.accent }} />
      </View>
      {!court.active && <Muted>Quadra desativada: não aparece para os jogadores.</Muted>}
      {edit ? (
        <View style={{ gap: space.md }}>
          <Field label="Nome" value={name} onChangeText={setName} maxLength={40} />
          <Field label="Piso" value={surface} onChangeText={setSurface} maxLength={30} />
          <Field label="Preço por hora (R$)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          <ErrorText>{error}</ErrorText>
          <Button label="Salvar" onPress={save} />
          <Button label="Cancelar" variant="ghost" onPress={() => setEdit(false)} />
        </View>
      ) : (
        <>
          <ErrorText>{error}</ErrorText>
          <Button label="Editar" variant="ghost" onPress={() => setEdit(true)} />
        </>
      )}
    </Card>
  );
}

export default function AdminCourts() {
  const { data, error, loading, reload } = useFetch<{ courts: AdminCourt[] }>('/admin/courts');
  const [name, setName] = useState('');
  const [surface, setSurface] = useState('');
  const [price, setPrice] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const p = Number(price.replace(',', '.'));
    if (name.trim().length < 2 || surface.trim().length < 2 || !(p >= 0) || price === '') {
      return setFormError('Preencha nome, piso e preço.');
    }
    setBusy(true);
    setFormError(null);
    try {
      await api('/admin/courts', { method: 'POST', body: { name: name.trim(), surface: surface.trim(), pricePerHour: p } });
      setName('');
      setSurface('');
      setPrice('');
      reload();
      Alert.alert('Quadra criada', 'Ela já aparece para os jogadores.');
    } catch (e) {
      setFormError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen padTop={false} refreshing={false} onRefresh={reload}>
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.courts.map((c) => <CourtCard key={c.id + c.name + c.surface + c.pricePerHour + c.active} court={c} onChanged={reload} />)}

      <Card style={{ gap: space.md }}>
        <Title>Nova quadra</Title>
        <Field label="Nome" value={name} onChangeText={setName} maxLength={40} placeholder="Quadra 4" />
        <Field label="Piso" value={surface} onChangeText={setSurface} maxLength={30} placeholder="Saibro" />
        <Field label="Preço por hora (R$)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="80" />
        <ErrorText>{formError}</ErrorText>
        <Button label="Adicionar quadra" arrow loading={busy} onPress={add} />
      </Card>
      <Text style={{ color: colors.muted, fontSize: 12 }}>
        Quadras não são apagadas para não perder o histórico de reservas. Desative para esconder.
      </Text>
    </Screen>
  );
}
