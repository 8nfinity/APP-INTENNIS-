import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, ErrorText, Eyebrow, Field, Headline, Screen, Sub, Text } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { confirmAsk, notify } from '@/lib/dialog';
import { setPendingImage } from '@/lib/pending';
import { colors, space } from '@/lib/theme';

export default function EditProfile() {
  const me = useMe();
  const { refreshPlayer, signOut } = useAuth();
  const [name, setName] = useState(me.name);
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // escolhe a foto e abre a tela de ajuste de enquadramento (arrastar + zoom)
  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return notify('Permissão necessária', 'Autorize o acesso às fotos para escolher sua foto de perfil.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (res.canceled) return;
    const a = res.assets[0];
    const size = a.width && a.height ? { width: a.width, height: a.height } : await getSize(a.uri);
    setPendingImage({ uri: a.uri, ...size });
    router.push('/avatar-crop');
  };

  const removePhoto = async () => {
    if (!(await confirmAsk('Remover foto?', 'Seu perfil volta a mostrar as iniciais.', 'Remover', true))) return;
    try {
      await api('/me', { method: 'PATCH', body: { avatarUrl: null } });
      await refreshPlayer();
    } catch (e) {
      setError(errMsg(e));
    }
  };

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

  const deleteAccount = async () => {
    const ok = await confirmAsk('Excluir conta?', 'Seu perfil, reservas, jogos e publicações serão apagados. Isso não pode ser desfeito.', 'Excluir', true);
    if (!ok) return;
    try {
      await api('/me', { method: 'DELETE' });
      await signOut();
    } catch (e) {
      notify('Erro', errMsg(e));
    }
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Eyebrow>Seu perfil</Eyebrow>
        <Headline>Faça do seu jeito.</Headline>
      </View>

      <View style={{ alignItems: 'center', gap: space.md }}>
        {me.avatarUrl ? <Avatar name={me.name} url={me.avatarUrl} size={104} ring="#fff" /> : <View style={s.empty} />}
      </View>

      <View style={{ gap: 6 }}>
        <Sub style={{ fontSize: 11.5 }}>Foto de perfil</Sub>
        <Pressable onPress={pickPhoto} style={s.file}>
          <View style={s.fileBtn}>
            <Text style={{ fontSize: 12, fontWeight: '500' }}>Escolher arquivo</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, flex: 1 }} numberOfLines={1}>
            {me.avatarUrl ? 'Foto atual · toque para trocar e ajustar' : 'Nenhum arquivo escolhido'}
          </Text>
        </Pressable>
        {me.avatarUrl && (
          <Pressable onPress={removePhoto} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 12, color: colors.danger }}>Remover foto</Text>
          </Pressable>
        )}
      </View>

      <Field label="Nome" value={name} onChangeText={setName} maxLength={60} />
      <Field label="@usuário" value={username} onChangeText={(t) => setUsername(t.toLowerCase())} autoCapitalize="none" maxLength={20} />
      <Field label="Bio" value={bio} onChangeText={setBio} multiline maxLength={160} />
      <ErrorText>{error}</ErrorText>
      <Button label="Salvar perfil" loading={busy} onPress={save} />
      <Button label="Excluir conta" variant="danger" onPress={deleteAccount} />
    </Screen>
  );
}

function getSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => Image.getSize(uri, (width, height) => resolve({ width, height }), reject));
}

const s = StyleSheet.create({
  empty: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.forest2, borderWidth: 3, borderColor: '#D6E0BC' },
  file: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.field, borderRadius: 14, padding: 10 },
  fileBtn: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 7 },
});
