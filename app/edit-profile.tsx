import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, ErrorText, FormRow, Header, ListGroup, Muted, Screen } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { confirmAsk, notify } from '@/lib/dialog';
import { setPendingImage } from '@/lib/pending';
import { colors, space } from '@/lib/theme';

// Editar perfil (referência "Edit Profile"): foto com câmera, campos em lista, salvar e excluir conta.
export default function EditProfile() {
  const me = useMe();
  const { refreshPlayer, session, signOut } = useAuth();
  const [name, setName] = useState(me.name);
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // escolhe a foto e abre a tela de ajuste (arrastar + zoom)
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
    const ok = await confirmAsk('Excluir conta?', 'Seu perfil, reservas, jogos e posts serão apagados. Isso não pode ser desfeito.', 'Excluir', true);
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
      <Header title="Editar perfil" />

      <View style={s.photo}>
        <Pressable onPress={pickPhoto}>
          <Avatar name={name || me.name} url={me.avatarUrl} size={112} />
          <View style={s.camera}>
            <Ionicons name="camera" size={17} color={colors.onAccent} />
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: space.lg }}>
          <Pressable onPress={pickPhoto} hitSlop={8}>
            <Muted style={{ color: colors.cream, fontWeight: '600' }}>Trocar e ajustar foto</Muted>
          </Pressable>
          {me.avatarUrl && (
            <Pressable onPress={removePhoto} hitSlop={8}>
              <Muted style={{ color: colors.danger }}>Remover</Muted>
            </Pressable>
          )}
        </View>
      </View>

      <ListGroup>
        <FormRow label="Nome" value={name} onChangeText={setName} maxLength={60} />
        <FormRow label="Usuário" value={username} onChangeText={(t) => setUsername(t.toLowerCase())} autoCapitalize="none" maxLength={20} />
        <FormRow label="Bio" value={bio} onChangeText={setBio} maxLength={160} placeholder="Seu estilo de jogo" />
        <FormRow label="E-mail" value={session?.user.email ?? ''} editable={false} last />
      </ListGroup>
      <Muted>Usuário: só letras minúsculas, números, ponto e underline.</Muted>

      <ErrorText>{error}</ErrorText>
      <Button label="Salvar alterações" loading={busy} onPress={save} style={{ borderRadius: 999 }} />

      <View style={{ minHeight: space.xl * 2 }} />
      <Button label="Excluir conta" variant="dark" onPress={deleteAccount} style={{ borderRadius: 999 }} />
    </Screen>
  );
}

function getSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => Image.getSize(uri, (width, height) => resolve({ width, height }), reject));
}

const s = StyleSheet.create({
  photo: { alignItems: 'center', gap: space.md },
  camera: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
});
