import { router } from 'expo-router';
import { useState } from 'react';

import { Button, ErrorText, Field, Muted, Screen } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';

export default function EditProfile() {
  const me = useMe();
  const { refreshPlayer } = useAuth();
  const [name, setName] = useState(me.name);
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const handle = username.trim().toLowerCase();
    if (name.trim().length < 2) return setError('Informe seu nome.');
    if (!/^[a-z0-9._]{3,20}$/.test(handle)) return setError('Usuário: 3 a 20 caracteres, só letras minúsculas, números, ponto ou underline.');
    setBusy(true);
    setError(null);
    try {
      await api('/me', { method: 'PATCH', body: { name: name.trim(), username: handle, bio: bio.trim() } });
      await refreshPlayer();
      router.back();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Screen padTop={false}>
      <Field label="Nome" value={name} onChangeText={setName} maxLength={60} />
      <Field label="Usuário" value={username} onChangeText={(t) => setUsername(t.toLowerCase())} autoCapitalize="none" maxLength={20} />
      <Muted>Só letras minúsculas, números, ponto e underline.</Muted>
      <Field label="Bio" value={bio} onChangeText={setBio} multiline maxLength={160} />
      <ErrorText>{error}</ErrorText>
      <Button label="Salvar" loading={busy} onPress={save} />
    </Screen>
  );
}
