import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Button, ErrorText, Eyebrow, Field, Headline, InfoBox, Screen, Sub, Text } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { notify } from '@/lib/dialog';
import { IMAGE_TYPES, VIDEO_TYPES, uploadAsset } from '@/lib/media';
import { colors, radius, space } from '@/lib/theme';
import { Post } from '@/lib/types';

const MAX_BYTES = 20 * 1024 * 1024;

export default function NewPost() {
  const { session } = useAuth();
  const [text, setText] = useState('');
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return notify('Permissão necessária', 'Autorize o acesso às fotos para anexar mídia.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 });
    if (res.canceled) return;
    const a = res.assets[0];
    const mime = a.mimeType ?? (a.type === 'video' ? 'video/mp4' : 'image/jpeg');
    if (!IMAGE_TYPES[mime] && !VIDEO_TYPES[mime]) return setError('Formato não suportado. Use JPG, PNG, WEBP ou MP4.');
    if (a.fileSize && a.fileSize > MAX_BYTES) return setError('Arquivo muito grande. O limite é 20 MB.');
    setError(null);
    setAsset({ ...a, mimeType: mime });
  };

  const publish = async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      let mediaUrl: string | undefined;
      let tag: Post['tag'] = 'jogo';
      if (asset) {
        const mime = asset.mimeType!;
        tag = mime.startsWith('video') ? 'video' : 'foto';
        mediaUrl = await uploadAsset({ bucket: 'posts', userId: session.user.id, uri: asset.uri, mime, ext: IMAGE_TYPES[mime] ?? VIDEO_TYPES[mime], maxBytes: MAX_BYTES });
      }
      await api('/posts', { method: 'POST', body: { text: text.trim(), tag, mediaUrl } });
      router.back();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 8 }}>
        <Eyebrow>Compartilhe seu momento</Eyebrow>
        <Headline>De dentro da quadra.</Headline>
      </View>

      <Field label="O que rolou no seu jogo?" value={text} onChangeText={setText} multiline maxLength={1000} placeholder="Aquele ponto que valeu o treino…" />

      <View style={{ gap: 6 }}>
        <Sub style={{ fontSize: 11.5 }}>Foto ou vídeo (opcional)</Sub>
        <Pressable onPress={pick} style={s.file}>
          <View style={s.fileBtn}>
            <Text style={{ fontSize: 12, fontWeight: '500' }}>Escolher arquivo</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, flex: 1 }} numberOfLines={1}>
            {asset ? (asset.fileName ?? 'Arquivo selecionado') : 'Nenhum arquivo escolhido'}
          </Text>
        </Pressable>
        {asset && (asset.type === 'video' ? <View style={[s.preview, { alignItems: 'center', justifyContent: 'center' }]}><Text>🎬 Vídeo selecionado</Text></View> : <Image source={{ uri: asset.uri }} style={s.preview} />)}
      </View>

      <InfoBox>Fotos (JPG, PNG, WEBP) e vídeos MP4 de até 20 MB.</InfoBox>
      <ErrorText>{error}</ErrorText>
      <Button label="Publicar no feed" loading={busy} disabled={!text.trim() && !asset} onPress={publish} />
    </Screen>
  );
}

const s = StyleSheet.create({
  file: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.field, borderRadius: 14, padding: 10 },
  fileBtn: { backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 7 },
  preview: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: colors.sage },
});
