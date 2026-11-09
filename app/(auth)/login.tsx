import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button, ErrorText, Eyebrow, Field, Headline, Text } from '@/components/ui';
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
    <AuthLayout line="Que bom te ver de novo" heading="Sua quadra te espera.">
      <View style={{ gap: 6 }}>
        <Eyebrow>Bem-vindo de volta</Eyebrow>
        <Headline>Seu próximo jogo começa aqui.</Headline>
      </View>
      <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="voce@exemplo.com" />
      <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" placeholder="Sua senha" onSubmitEditing={submit} />
      <ErrorText>{error}</ErrorText>
      <Button label="Entrar" arrow loading={busy} onPress={submit} />
      <View style={{ gap: space.md, alignItems: 'center' }}>
        <Link href="/forgot">
          <Text style={{ fontSize: 12.5, color: colors.muted }}>Esqueci minha senha</Text>
        </Link>
        <Link href="/signup">
          <Text style={{ fontSize: 12.5, color: colors.muted }}>
            Não tem conta? <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.forest2 }}>Criar agora</Text>
          </Text>
        </Link>
      </View>
    </AuthLayout>
  );
}
