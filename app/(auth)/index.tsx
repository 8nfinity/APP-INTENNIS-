import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { Button, Display, Muted, Text } from '@/components/ui';
import { useLayout } from '@/lib/layout';
import { colors, space } from '@/lib/theme';

export default function Welcome() {
  const { insets, padL, padR, short, compact } = useLayout();
  const big = short || compact ? 40 : 56; // tamanho do título em telas curtas/estreitas
  return (
    <View style={s.screen}>
      {/* verde da marca no topo, escurecendo até o fundo do app */}
      <LinearGradient pointerEvents="none" colors={[colors.brand, colors.bg]} locations={[0, 0.75]} style={StyleSheet.absoluteFill} />
      {/* rola quando a tela é curta demais para tudo caber (celular pequeno ou deitado) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, paddingLeft: padL + 8, paddingRight: padR + 8, gap: space.xl },
        ]}>
        <View style={s.logo}>
          <Logo size={short ? 48 : 72} />
        </View>

        <View style={{ gap: space.md }}>
          <Display style={{ fontSize: big, lineHeight: big }}>
            Are you{'\n'}IN<Text style={{ color: colors.lime, fontSize: big, fontWeight: '800' }}>.</Text>?
          </Display>
          <Muted style={{ fontSize: 16, color: colors.cream }}>Mais do que tênis, um lugar para pertencer.</Muted>
          <Muted style={{ fontSize: 14 }}>Reserve quadras, jogue com a galera e suba no ranking.</Muted>
        </View>

        <View style={{ gap: space.md }}>
          <Button label="Criar minha conta" arrow onPress={() => router.push('/signup')} />
          <Button label="Já tenho conta" variant="ghost" onPress={() => router.push('/login')} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'space-between' },
  logo: { alignItems: 'center', marginTop: space.md },
});
