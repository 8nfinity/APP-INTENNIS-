import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { PhotoBackdrop } from '@/components/PhotoBackdrop';
import { Button, Text } from '@/components/ui';
import { useLayout } from '@/lib/layout';
import { colors, space } from '@/lib/theme';

// Abertura: foto de página inteira, lema do clube e os dois caminhos (criar conta / entrar).
export default function Welcome() {
  const { insets, padL, padR, short, compact } = useLayout();
  const big = short || compact ? 44 : 56;
  return (
    <View style={{ flex: 1, backgroundColor: colors.forest }}>
      <PhotoBackdrop kind="welcome" />
      {/* rola quando a tela é curta demais para tudo caber (celular pequeno ou deitado) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24, paddingLeft: padL + 8, paddingRight: padR + 8, gap: space.xl }]}>
        <View style={s.top}>
          <Logo variant="full" height={58} />
          <Text style={s.tagline}>{'Tênis.\nEncontros.\nHistórias.'}</Text>
        </View>

        <View style={{ gap: space.md }}>
          <Text serif style={{ fontSize: big, lineHeight: big + 2, letterSpacing: -1.2, color: colors.onForest }}>
            {'Are you\nIN'}
            <Text serif style={{ fontSize: big, color: colors.lime }}>
              .
            </Text>
            ?
          </Text>
          <Text style={{ fontSize: 13.5, color: colors.onForest, lineHeight: 19 }}>Mais do que tênis, um lugar para pertencer.</Text>
          <Text style={{ fontSize: 12, color: colors.forestMuted, lineHeight: 17 }}>Reserve quadras, jogue com a galera e suba no ranking.</Text>
        </View>

        <View style={{ gap: space.md }}>
          <Button label="Criar minha conta" arrow onPress={() => router.push('/signup')} />
          <Button label="Já tenho conta" variant="dark" onPress={() => router.push('/login')} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tagline: { fontSize: 9, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: colors.forestMuted, textAlign: 'right', lineHeight: 13, marginTop: 6 },
});
