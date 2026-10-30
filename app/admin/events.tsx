import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button, Card, Chip, Empty, ErrorText, Field, Loading, Muted, Screen, Text, Title } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { fmtDate } from '@/lib/game';
import { colors, space } from '@/lib/theme';
import { GameEvent } from '@/lib/types';

const CATS: { key: GameEvent['category']; label: string }[] = [
  { key: 'torneio', label: 'Torneio' },
  { key: 'jogo', label: 'Jogo' },
  { key: 'aula', label: 'Aula' },
  { key: 'novidade', label: 'Novidade' },
];

// aceita DD/MM/AAAA e devolve AAAA-MM-DD (ou null se a data não existir)
function parseDate(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function AdminEvents() {
  const { data, loading, reload } = useFetch<{ events: GameEvent[] }>('/events');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<GameEvent['category']>('torneio');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const publish = async () => {
    const iso = parseDate(date);
    if (title.trim().length < 3) return setError('Informe o título (mínimo 3 letras).');
    if (!iso) return setError('Data inválida. Use o formato DD/MM/AAAA.');
    setBusy(true);
    setError(null);
    try {
      await api('/events', { method: 'POST', body: { title: title.trim(), description: description.trim(), place: place.trim(), category, date: iso } });
      setTitle('');
      setDescription('');
      setPlace('');
      setDate('');
      reload();
      Alert.alert('Evento publicado', 'Ele já aparece na aba Eventos.');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = (e: GameEvent) =>
    Alert.alert('Apagar evento?', e.title, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/admin/events/${e.id}`, { method: 'DELETE' });
            reload();
          } catch (err) {
            Alert.alert('Erro', errMsg(err));
          }
        },
      },
    ]);

  return (
    <Screen padTop={false} refreshing={false} onRefresh={reload}>
      <Card style={{ gap: space.md }}>
        <Title>Novo evento</Title>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {CATS.map((c) => (
            <Chip key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
          ))}
        </View>
        <Field label="Título" value={title} onChangeText={setTitle} maxLength={100} />
        <Field label="Descrição" value={description} onChangeText={setDescription} multiline maxLength={500} />
        <Field label="Data (DD/MM/AAAA)" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" placeholder="25/12/2026" maxLength={10} />
        <Field label="Local" value={place} onChangeText={setPlace} maxLength={100} />
        <ErrorText>{error}</ErrorText>
        <Button label="Publicar evento" arrow loading={busy} onPress={publish} />
      </Card>

      <Title>Publicados</Title>
      {loading && <Loading />}
      {data && data.events.length === 0 && <Empty icon="calendar-outline" title="Nenhum evento" />}
      {data?.events.map((e) => (
        <Card key={e.id} style={{ gap: 4 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{e.title}</Text>
          <Muted>
            {CATS.find((c) => c.key === e.category)?.label} · {fmtDate(e.date)} {e.place ? `· ${e.place}` : ''}
          </Muted>
          <Button label="Apagar" variant="danger" onPress={() => remove(e)} style={{ marginTop: space.sm, minHeight: 46 }} />
        </Card>
      ))}
    </Screen>
  );
}
