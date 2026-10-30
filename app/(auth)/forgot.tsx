import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Button, ErrorText, Field, H1, Muted, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, space } from '@/lib/theme';

export default function Forgot() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) return setError('Informe seu e-mail.');
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar o e-mail.');
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
        <H1>Recuperar senha</H1>
        <Muted>Enviaremos um link para você criar uma nova senha.</Muted>
      </View>
      {sent ? (
        <Muted style={{ fontSize: 15, color: colors.text }}>
          Se existir uma conta com esse e-mail, o link já está a caminho. Confira também o spam.
        </Muted>
      ) : (
        <>
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="voce@email.com"
          />
          <ErrorText>{error}</ErrorText>
          <Button label="Enviar link" loading={busy} onPress={submit} />
        </>
      )}
    </Screen>
  );
}
