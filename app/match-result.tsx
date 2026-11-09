import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, ErrorText, Eyebrow, Field, Headline, InfoBox, Screen, Segmented, Sub, Text } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { notify } from '@/lib/dialog';

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
    <Screen>
      <View style={{ gap: 8 }}>
        <Eyebrow>Fim de papo</Eyebrow>
        <Headline>Como foi o jogo?</Headline>
      </View>
      <Card>
        <Sub>Seu jogo contra</Sub>
        <Text style={{ fontSize: 22, letterSpacing: -0.4, marginTop: 2 }}>{name}</Text>
      </Card>
      <Segmented options={[{ key: 'vitoria', label: 'Venci' }, { key: 'derrota', label: 'Perdi' }]} value={result} onChange={setResult} />
      <Field label="Placar" value={score} onChangeText={setScore} placeholder="ex: 6-4 3-6 7-5" maxLength={40} />
      <InfoBox>Os pontos só entram depois que o adversário confirmar o resultado. Isso evita placares inventados.</InfoBox>
      <ErrorText>{error}</ErrorText>
      <Button label="Enviar resultado" arrow loading={busy} onPress={save} />
    </Screen>
  );
}
