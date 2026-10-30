import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, ErrorText, Field, Muted, Screen } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { useAuth, useMe } from '@/lib/auth';
import { notify } from '@/lib/dialog';
import { IMAGE_TYPES, uploadAsset } from '@/lib/media';
import { colors, space } from '@/lib/theme';

export default function EditProfile() {
  const me = useMe();
  const { refreshPlayer, session } = useAuth();
  const [name, setName] = useState(me.name);
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(me.avatarUrl);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A foto é enviada e salva na hora, sem precisar apertar "Salvar".
  const changePhoto = async () => {
    if (!session) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify('Permissão necessária', 'Autorize o acesso às fotos para escolher sua foto de perfil.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    const mime = a.mimeType && IMAGE_TYPES[a.mimeType] ? a.mimeType : 'image/jpeg';
    setPhotoBusy(true);
    setError(null);
    try {
      const url = await uploadAsset({
        bucket: 'avatars',
        userId: session.user.id,
        uri: a.uri,
        mime,
        ext: IMAGE_TYPES[mime],
        maxBytes: 5 * 1024 * 1024,
      });
      await api('/me', { method: 'PATCH', body: { avatarUrl: url } });
      setAvatarUrl(url);
      await refreshPlayer();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    try {
      await api('/me', { method: 'PATCH', body: { avatarUrl: null } });
      setAvatarUrl(null);
      await refreshPlayer();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setPhotoBusy(false);
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

  return (
    <Screen padTop={false}>
      <View style={s.photo}>
        <Pressable onPress={changePhoto} disabled={photoBusy}>
          <Avatar name={name || me.name} url={avatarUrl} size={120} />
          <View style={s.camera}>
            <Ionicons name={photoBusy ? 'hourglass' : 'camera'} size={20} color={colors.onAccent} />
          </View>
        </Pressable>
        <Button label={photoBusy ? 'Enviando...' : 'Trocar foto'} variant="ghost" onPress={changePhoto} disabled={photoBusy} />
        {avatarUrl && <Button label="Remover foto" variant="danger" onPress={removePhoto} disabled={photoBusy} />}
        <Muted>JPG, PNG ou WEBP de até 5 MB.</Muted>
      </View>

      <Field label="Nome" value={name} onChangeText={setName} maxLength={60} />
      <Field label="Usuário" value={username} onChangeText={(t) => setUsername(t.toLowerCase())} autoCapitalize="none" maxLength={20} />
      <Muted>Só letras minúsculas, números, ponto e underline.</Muted>
      <Field label="Bio" value={bio} onChangeText={setBio} multiline maxLength={160} />
      <ErrorText>{error}</ErrorText>
      <Button label="Salvar" loading={busy} onPress={save} />
    </Screen>
  );
}

const s = StyleSheet.create({
  photo: { alignItems: 'center', gap: space.sm },
  camera: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
});
