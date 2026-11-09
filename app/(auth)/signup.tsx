import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button, Eyebrow, ErrorText, Field, Headline, Sub, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, space } from '@/lib/theme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (name.trim().length < 2) return setError('Como você gosta de ser chamado?');
    if (!EMAIL.test(email.trim())) return setError('Informe um e-mail válido.');
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return setError('A senha precisa ter pelo menos 8 caracteres, com letras e números.');
    }
    setBusy(true);
    setError(null);
    try {
      const { needsConfirm } = await signUp(email, password, name.trim());
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
      <AuthLayout line="Quase lá" heading="Confirme seu e-mail.">
        <View style={{ gap: space.md }}>
          <Ionicons name="mail-outline" size={30} color={colors.forest2} />
          <Headline>Enviamos um link para você.</Headline>
          <Sub style={{ fontSize: 14, lineHeight: 20 }}>
            Abra o e-mail enviado para {email.trim()}, confirme e volte aqui para entrar.
          </Sub>
        </View>
        <Button label="Ir para o login" arrow onPress={() => router.replace('/login')} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout line="Jogue. Conecte. Pertença." heading="O tênis é só o começo.">
      <View style={{ gap: 6 }}>
        <Eyebrow>Entre para o clube</Eyebrow>
        <Headline>Seu próximo capítulo começa na quadra.</Headline>
      </View>
      <Field label="Seu nome" value={name} onChangeText={setName} placeholder="Como você gosta de ser chamado?" maxLength={60} autoComplete="name" />
      <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="voce@exemplo.com" />
      <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="Pelo menos 8 caracteres" onSubmitEditing={submit} />
      <Sub style={{ marginTop: -8, fontSize: 11.5 }}>Use letras e números.</Sub>
      <ErrorText>{error}</ErrorText>
      <Button label="Criar minha conta" arrow loading={busy} onPress={submit} />
      <Link href="/login" style={{ alignSelf: 'center' }}>
        <Text style={{ fontSize: 12.5, color: colors.muted }}>
          Já tem conta? <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.forest2 }}>Entrar</Text>
        </Text>
      </Link>
    </AuthLayout>
  );
}
