import { useState } from 'react';
import { View } from 'react-native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button, ErrorText, Eyebrow, Field, Headline, Sub } from '@/components/ui';
import { useAuth } from '@/lib/auth';

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
    <AuthLayout line="Tudo tem solução" heading="Vamos te colocar de volta.">
      <View style={{ gap: 6 }}>
        <Eyebrow>Recuperar senha</Eyebrow>
        <Headline>Enviaremos um link para uma nova senha.</Headline>
      </View>
      {sent ? (
        <Sub style={{ fontSize: 14, lineHeight: 20 }}>Se existir uma conta com esse e-mail, o link já está a caminho. Confira também o spam.</Sub>
      ) : (
        <>
          <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="voce@exemplo.com" />
          <ErrorText>{error}</ErrorText>
          <Button label="Enviar link" arrow loading={busy} onPress={submit} />
        </>
      )}
    </AuthLayout>
  );
}
