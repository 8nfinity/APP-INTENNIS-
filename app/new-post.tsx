import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Chip, Muted } from '@/components/ui';
import { useStore } from '@/lib/store';
import { colors, radius, space } from '@/lib/theme';
import { Post } from '@/lib/types';

const TAGS: { key: Post['tag']; label: string }[] = [
  { key: 'jogo', label: 'Jogo' },
  { key: 'treino', label: 'Treino' },
  { key: 'foto', label: 'Foto' },
  { key: 'video', label: 'Vídeo' },
];

export default function NewPostScreen() {
  const { addPost } = useStore();
  const [text, setText] = useState('');
  const [score, setScore] = useState('');
  const [tag, setTag] = useState<Post['tag']>('jogo');
  const [imageUri, setImageUri] = useState<string | undefined>();

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para anexar mídia.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 });
    if (!res.canceled) {
      const asset = res.assets[0];
      setImageUri(asset.uri);
      if (asset.type === 'video') setTag('video');
    }
  };

  const publish = () => {
    addPost({ text: text.trim(), tag, imageUri, score: score.trim() || undefined });
    router.back();
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.row}>
        {TAGS.map((t) => (
          <Chip key={t.key} label={t.label} active={tag === t.key} onPress={() => setTag(t.key)} />
        ))}
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Como foi o jogo?"
        placeholderTextColor={colors.muted}
        multiline
        style={[s.input, { minHeight: 110, textAlignVertical: 'top' }]}
      />
      {tag === 'jogo' && (
        <TextInput
          value={score}
          onChangeText={setScore}
          placeholder="Placar (opcional)"
          placeholderTextColor={colors.muted}
          style={s.input}
        />
      )}
      {imageUri && <Image source={{ uri: imageUri }} style={s.preview} />}
      <Button label={imageUri ? 'Trocar mídia' : 'Anexar foto ou vídeo'} variant="ghost" onPress={pick} />
      {tag === 'video' && imageUri && <Muted>O vídeo aparece como miniatura nesta versão.</Muted>}
      <Button label="Publicar" onPress={publish} disabled={!text.trim() && !imageUri} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 12,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preview: { width: '100%', height: 220, borderRadius: radius.md },
});
