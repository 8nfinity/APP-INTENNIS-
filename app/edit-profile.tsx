import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Muted } from '@/components/ui';
import { useStore } from '@/lib/store';
import { colors, space } from '@/lib/theme';

export default function EditProfileScreen() {
  const { me, players, updateProfile } = useStore();
  const [name, setName] = useState(me.name);
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio);

  const save = () => {
    const handle = username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    if (!name.trim() || handle.length < 3) {
      Alert.alert('Confira os dados', 'Informe um nome e um usuário com pelo menos 3 caracteres.');
      return;
    }
    if (players.some((p) => p.id !== me.id && p.username === handle)) {
      Alert.alert('Usuário já existe', 'Escolha outro nome de usuário.');
      return;
    }
    updateProfile({ name: name.trim(), username: handle, bio: bio.trim() });
    router.back();
  };

  return (
    <View style={s.screen}>
      <Text style={s.label}>Nome</Text>
      <TextInput value={name} onChangeText={setName} style={s.input} placeholderTextColor={colors.muted} />
      <Text style={s.label}>Usuário</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={s.input}
        placeholderTextColor={colors.muted}
      />
      <Muted>Só letras minúsculas, números, ponto e underline.</Muted>
      <Text style={s.label}>Bio</Text>
      <TextInput value={bio} onChangeText={setBio} multiline style={[s.input, { minHeight: 80 }]} placeholderTextColor={colors.muted} />
      <Button label="Salvar" onPress={save} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.lg, gap: space.sm },
  label: { color: colors.muted, fontWeight: '700', marginTop: space.sm },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 12,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
