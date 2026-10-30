import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { Button, Chip, ErrorText, Field, Muted, Screen } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';
import { Post } from '@/lib/types';

const TAGS: { key: Post['tag']; label: string }[] = [
  { key: 'jogo', label: 'Jogo' },
  { key: 'treino', label: 'Treino' },
  { key: 'foto', label: 'Foto' },
  { key: 'video', label: 'Vídeo' },
];
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
};

export default function NewPost() {
  const { session } = useAuth();
  const [text, setText] = useState('');
  const [score, setScore] = useState('');
  const [tag, setTag] = useState<Post['tag']>('jogo');
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para anexar mídia.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 });
    if (res.canceled) return;
    const a = res.assets[0];
    const mime = a.mimeType ?? (a.type === 'video' ? 'video/mp4' : 'image/jpeg');
    if (!ALLOWED[mime]) return setError('Formato não suportado. Use JPG, PNG, WEBP ou MP4.');
    if (a.fileSize && a.fileSize > MAX_BYTES) return setError('Arquivo muito grande. O limite é 20 MB.');
    setError(null);
    setAsset({ ...a, mimeType: mime });
    setTag(mime.startsWith('video') ? 'video' : tag === 'video' ? 'foto' : tag);
  };

  const publish = async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      let mediaUrl: string | undefined;
      if (asset) {
        const mime = asset.mimeType!;
        const path = `${session.user.id}/${Date.now()}.${ALLOWED[mime]}`;
        const bytes = await (await fetch(asset.uri)).arrayBuffer();
        if (bytes.byteLength > MAX_BYTES) throw new Error('Arquivo muito grande. O limite é 20 MB.');
        const { error: upErr } = await supabase.storage.from('posts').upload(path, bytes, { contentType: mime });
        if (upErr) throw new Error('Não foi possível enviar a mídia. Tente de novo.');
        mediaUrl = supabase.storage.from('posts').getPublicUrl(path).data.publicUrl;
      }
      await api('/posts', { method: 'POST', body: { text: text.trim(), tag, score: score.trim(), mediaUrl } });
      router.back();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Screen padTop={false}>
      <View style={s.row}>
        {TAGS.map((t) => (
          <Chip key={t.key} label={t.label} active={tag === t.key} onPress={() => setTag(t.key)} />
        ))}
      </View>
      <Field label="Legenda" value={text} onChangeText={setText} multiline maxLength={1000} placeholder="Como foi o jogo?" />
      {tag === 'jogo' && <Field label="Placar (opcional)" value={score} onChangeText={setScore} maxLength={40} placeholder="ex: 6-4 3-6 7-5" />}
      {asset &&
        (asset.type === 'video' ? (
          <View style={[s.preview, s.videoPh]}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>🎬 Vídeo selecionado</Text>
          </View>
        ) : (
          <Image source={{ uri: asset.uri }} style={s.preview} />
        ))}
      <Button label={asset ? 'Trocar mídia' : 'Anexar foto ou vídeo'} variant="ghost" onPress={pick} />
      <Muted>JPG, PNG, WEBP ou MP4 de até 20 MB.</Muted>
      <ErrorText>{error}</ErrorText>
      <Button label="Publicar" loading={busy} disabled={!text.trim() && !asset} onPress={publish} />
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  preview: { width: '100%', height: 220, borderRadius: radius.md },
  videoPh: { backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
});
