import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Button, ErrorText, Field, H1, Muted, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, space } from '@/lib/theme';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return setError('Informe e-mail e senha.');
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Logo size={36} />
      <View style={{ gap: space.xs }}>
        <H1>Bem-vindo de volta</H1>
        <Muted>Entre para reservar sua quadra e ver o ranking.</Muted>
      </View>
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="voce@email.com"
      />
      <Field
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        placeholder="Sua senha"
        onSubmitEditing={submit}
      />
      <ErrorText>{error}</ErrorText>
      <Button label="Entrar" arrow loading={busy} onPress={submit} />
      <Link href="/forgot" style={{ alignSelf: 'center' }}>
        <Text style={{ color: colors.muted }}>Esqueci minha senha</Text>
      </Link>
      <Link href="/signup" style={{ alignSelf: 'center' }}>
        <Text style={{ color: colors.muted }}>
          Não tem conta? <Text style={{ color: colors.accent, fontWeight: '800' }}>Criar agora</Text>
        </Text>
      </Link>
    </Screen>
  );
}
