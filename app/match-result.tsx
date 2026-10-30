import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { Avatar, Button, Card, Chip, Muted, Title } from '@/components/ui';
import { POINTS } from '@/lib/data';
import { useStore } from '@/lib/store';
import { colors, space } from '@/lib/theme';

export default function MatchResultScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { matches, players, finishMatch } = useStore();
  const match = matches.find((m) => m.id === matchId);
  const [result, setResult] = useState<'vitoria' | 'derrota'>('vitoria');
  const [score, setScore] = useState('');

  if (!match) return null;
  const opp = players.find((p) => p.id === match.opponentId)!;

  const save = () => {
    finishMatch(match.id, result, score.trim());
    const pts = result === 'vitoria' ? POINTS.vitoria : POINTS.derrota;
    Alert.alert(result === 'vitoria' ? 'Vitória! 🎉' : 'Bom jogo!', `+${pts} pontos no ranking.`);
    router.back();
  };

  return (
    <View style={s.screen}>
      <Card style={s.opp}>
        <Avatar player={opp} size={48} />
        <Title>vs {opp.name}</Title>
      </Card>
      <View style={s.row}>
        <Chip label="Venci" active={result === 'vitoria'} onPress={() => setResult('vitoria')} />
        <Chip label="Perdi" active={result === 'derrota'} onPress={() => setResult('derrota')} />
      </View>
      <TextInput
        value={score}
        onChangeText={setScore}
        placeholder="Placar, ex: 6-4 3-6 7-5"
        placeholderTextColor={colors.muted}
        style={s.input}
      />
      <Muted>Nesta versão o resultado vale na hora. Em produção, o adversário confirma antes de os pontos serem somados.</Muted>
      <Button label="Salvar resultado" onPress={save} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.lg, gap: space.lg },
  opp: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', gap: space.sm },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 12,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
