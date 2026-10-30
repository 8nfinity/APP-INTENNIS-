import { useState } from 'react';
import { Switch, View } from 'react-native';

import { Button, Card, ErrorState, ErrorText, Field, Loading, Muted, Screen, Text, Title, formatBRL } from '@/components/ui';
import { api, errMsg, useFetch } from '@/lib/api';
import { notify } from '@/lib/dialog';
import { colors, space } from '@/lib/theme';
import { AdminTeacher } from '@/lib/types';

const parsePrice = (s: string) => Number(s.replace(',', '.'));

function TeacherCard({ t, onChanged }: { t: AdminTeacher; onChanged: () => void }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(t.name);
  const [bio, setBio] = useState(t.bio);
  const [price, setPrice] = useState(String(t.pricePerHour));
  const [user, setUser] = useState(t.playerUsername ?? '');
  const [error, setError] = useState<string | null>(null);

  const patch = async (body: object) => {
    try {
      await api(`/admin/teachers/${t.id}`, { method: 'PATCH', body });
      setError(null);
      onChanged();
      return true;
    } catch (e) {
      setError(errMsg(e));
      return false;
    }
  };

  const save = async () => {
    const p = parsePrice(price);
    if (!(p >= 0) || price === '') return setError('Informe o valor da aula.');
    if (await patch({ name: name.trim(), bio: bio.trim(), pricePerHour: p, playerUsername: user.trim() })) setEdit(false);
  };

  return (
    <Card style={{ gap: space.md, opacity: t.active ? 1 : 0.6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Title>{t.name}</Title>
          <Text style={{ color: colors.lime, fontWeight: '700' }}>{formatBRL(t.pricePerHour)} por aula</Text>
          <Muted>{t.playerUsername ? `Acesso: @${t.playerUsername}` : 'Sem conta de acesso ligada'}</Muted>
        </View>
        <Switch
          value={t.active}
          onValueChange={(v) => {
            patch({ active: v });
          }}
          trackColor={{ true: colors.brandLight }}
          thumbColor={colors.cream}
        />
      </View>
      {edit ? (
        <View style={{ gap: space.md }}>
          <Field label="Nome" value={name} onChangeText={setName} maxLength={60} />
          <Field label="Valor por aula (R$)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          <Field label="Descrição" value={bio} onChangeText={setBio} maxLength={160} placeholder="ex: especialista em saque" />
          <Field label="Usuário do professor no app (@)" value={user} onChangeText={setUser} autoCapitalize="none" placeholder="deixe vazio para desligar" />
          <ErrorText>{error}</ErrorText>
          <Button label="Salvar" onPress={save} />
          <Button label="Cancelar" variant="ghost" onPress={() => setEdit(false)} />
        </View>
      ) : (
        <>
          <ErrorText>{error}</ErrorText>
          <Button label="Editar valor e dados" variant="ghost" onPress={() => setEdit(true)} />
        </>
      )}
    </Card>
  );
}

// Professores: valor de cada aula e a conta com que o professor entra para ver a agenda.
export default function AdminTeachers() {
  const { data, error, loading, reload } = useFetch<{ teachers: AdminTeacher[] }>('/admin/teachers');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [bio, setBio] = useState('');
  const [user, setUser] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    const p = parsePrice(price);
    if (name.trim().length < 2 || price === '' || !(p >= 0)) return setFormError('Preencha o nome e o valor da aula.');
    setBusy(true);
    setFormError(null);
    try {
      await api('/admin/teachers', { method: 'POST', body: { name: name.trim(), pricePerHour: p, bio: bio.trim(), playerUsername: user.trim() } });
      setName('');
      setPrice('');
      setBio('');
      setUser('');
      reload();
      notify('Professor cadastrado', 'Ele já aparece para os alunos na reserva de aula.');
    } catch (e) {
      setFormError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen padTop={false} refreshing={false} onRefresh={reload}>
      <Muted>
        Para o professor ver a agenda, ele cria uma conta normal no app e você informa o @usuário dele aqui. Assim aparece a aba
        Aulas para ele.
      </Muted>
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.teachers.map((t) => (
        <TeacherCard key={`${t.id}${t.name}${t.pricePerHour}${t.active}${t.playerUsername}`} t={t} onChanged={reload} />
      ))}

      <Card style={{ gap: space.md }}>
        <Title>Novo professor</Title>
        <Field label="Nome" value={name} onChangeText={setName} maxLength={60} placeholder="Prof. Marcos" />
        <Field label="Valor por aula (R$)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="60" />
        <Field label="Descrição (opcional)" value={bio} onChangeText={setBio} maxLength={160} />
        <Field label="Usuário do professor no app (opcional)" value={user} onChangeText={setUser} autoCapitalize="none" placeholder="@marcos" />
        <ErrorText>{formError}</ErrorText>
        <Button label="Cadastrar professor" arrow loading={busy} onPress={add} />
      </Card>
    </Screen>
  );
}
