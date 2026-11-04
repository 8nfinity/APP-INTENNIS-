import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Button, Card, ErrorText, Field, H1, Muted, Screen, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, space } from '@/lib/theme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!EMAIL.test(email.trim())) return setError('Informe um e-mail válido.');
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return setError('A senha precisa ter pelo menos 8 caracteres, com letras e números.');
    }
    if (password !== confirm) return setError('As senhas não conferem.');
    setBusy(true);
    setError(null);
    try {
      const { needsConfirm } = await signUp(email, password);
      if (needsConfirm) setSent(true);
      // sem confirmação por e-mail: a sessão já começa e o app segue para criar o perfil
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar a conta.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <Logo size={30} />
        <Card glow style={{ gap: space.md }}>
          <Ionicons name="mail" size={32} color={colors.accent} />
          <H1>Confirme seu e-mail</H1>
          <Muted style={{ fontSize: 15 }}>
            Enviamos um link para {email.trim()}. Abra o e-mail, confirme e volte aqui para entrar.
          </Muted>
        </Card>
        <Button label="Ir para o login" onPress={() => router.replace('/login')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Logo size={30} />
      <View style={{ gap: space.xs }}>
        <H1>Crie sua conta</H1>
        <Muted>Leva menos de um minuto.</Muted>
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
        autoComplete="new-password"
        textContentType="newPassword"
        placeholder="Mínimo 8 caracteres"
      />
      <Muted style={{ marginTop: -8 }}>Use letras e números.</Muted>
      <Field
        label="Repita a senha"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        placeholder="Repita a senha"
        onSubmitEditing={submit}
      />
      <ErrorText>{error}</ErrorText>
      <Button label="Criar conta" arrow loading={busy} onPress={submit} />
      <Link href="/login" style={{ alignSelf: 'center' }}>
        <Text style={{ color: colors.muted }}>
          Já tem conta? <Text style={{ color: colors.accent, fontWeight: '800' }}>Entrar</Text>
        </Text>
      </Link>
    </Screen>
  );
}
