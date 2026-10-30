import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Chip, ErrorText, Field, Muted, Screen, Title } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { notify } from '@/lib/dialog';
import { colors, space } from '@/lib/theme';

export default function MatchResult() {
  const { matchId, name } = useLocalSearchParams<{ matchId: string; name: string }>();
  const [result, setResult] = useState<'vitoria' | 'derrota'>('vitoria');
  const [score, setScore] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/matches/${matchId}/report`, { method: 'POST', body: { result, score: score.trim() } });
      notify('Resultado enviado', `${name} precisa confirmar para os pontos serem somados.`);
      router.back();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Screen padTop={false}>
      <Card>
        <Muted>Seu jogo contra</Muted>
        <Title style={{ fontSize: 24 }}>{name}</Title>
      </Card>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Chip label="Venci" active={result === 'vitoria'} onPress={() => setResult('vitoria')} />
        <Chip label="Perdi" active={result === 'derrota'} onPress={() => setResult('derrota')} />
      </View>
      <Field label="Placar" value={score} onChangeText={setScore} placeholder="ex: 6-4 3-6 7-5" maxLength={40} />
      <Muted style={{ color: colors.muted }}>
        Os pontos só entram depois que o adversário confirmar o resultado. Isso evita placares inventados.
      </Muted>
      <ErrorText>{error}</ErrorText>
      <Button label="Enviar resultado" loading={busy} onPress={save} />
    </Screen>
  );
}
