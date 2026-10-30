import { useState } from 'react';
import { View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Button, ErrorText, Field, H1, Muted, Screen } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { space } from '@/lib/theme';

export default function CreateProfile() {
  const { refreshPlayer, signOut } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const handle = username.trim().toLowerCase();
    if (name.trim().length < 2) return setError('Informe seu nome.');
    if (!/^[a-z0-9._]{3,20}$/.test(handle)) {
      return setError('Usuário: 3 a 20 caracteres, só letras minúsculas, números, ponto ou underline.');
    }
    setBusy(true);
    setError(null);
    try {
      await api('/me', { method: 'POST', body: { name: name.trim(), username: handle, bio: bio.trim() } });
      await refreshPlayer(); // o guard de rotas leva para o app
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Logo size={36} />
      <View style={{ gap: space.xs }}>
        <H1>Monte seu perfil</H1>
        <Muted>É assim que a galera vai te ver no ranking e no feed.</Muted>
      </View>
      <Field label="Nome" value={name} onChangeText={setName} placeholder="Como você se chama" maxLength={60} />
      <Field
        label="Usuário"
        value={username}
        onChangeText={(t) => setUsername(t.toLowerCase())}
        autoCapitalize="none"
        placeholder="ex: joao.silva"
        maxLength={20}
      />
      <Field label="Bio (opcional)" value={bio} onChangeText={setBio} multiline maxLength={160} placeholder="Seu estilo de jogo, sua história..." />
      <ErrorText>{error}</ErrorText>
      <Button label="Entrar no clube" arrow loading={busy} onPress={submit} />
      <Button label="Sair da conta" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
