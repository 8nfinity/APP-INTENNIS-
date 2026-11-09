import { useState } from 'react';
import { View } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button, ErrorText, Eyebrow, Field, Headline } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function CreateProfile() {
  const { refreshPlayer, signOut, session } = useAuth();
  // o nome digitado no cadastro vem junto da conta
  const metaName = typeof session?.user.user_metadata?.name === 'string' ? (session.user.user_metadata.name as string) : '';
  const [name, setName] = useState(metaName);
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
    <AuthLayout line="Falta pouco" heading="Como a galera vai te ver?" back={false}>
      <View style={{ gap: 6 }}>
        <Eyebrow>Seu perfil</Eyebrow>
        <Headline>Faça do seu jeito.</Headline>
      </View>
      <Field label="Nome" value={name} onChangeText={setName} placeholder="Como você se chama" maxLength={60} />
      <Field label="@usuário" value={username} onChangeText={(t) => setUsername(t.toLowerCase())} autoCapitalize="none" placeholder="ex: joao.silva" maxLength={20} />
      <Field label="Bio (opcional)" value={bio} onChangeText={setBio} multiline maxLength={160} placeholder="Seu estilo de jogo, sua história..." />
      <ErrorText>{error}</ErrorText>
      <Button label="Entrar no clube" arrow loading={busy} onPress={submit} />
      <Button label="Sair da conta" variant="ghost" onPress={signOut} />
    </AuthLayout>
  );
}
