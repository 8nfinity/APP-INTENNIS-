import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/Logo';
import { Button, Display, Muted, Text } from '@/components/ui';
import { colors, space } from '@/lib/theme';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      {/* verde da marca no topo, escurecendo até o fundo do app */}
      <LinearGradient pointerEvents="none" colors={[colors.brand, colors.bg]} locations={[0, 0.75]} style={StyleSheet.absoluteFill} />

      <View style={s.logo}>
        <Logo size={72} />
      </View>

      <View style={{ gap: space.md }}>
        <Display style={{ fontSize: 56, lineHeight: 56 }}>
          Are you{'\n'}IN<Text style={{ color: colors.accent, fontSize: 56, fontWeight: '900' }}>.</Text>?
        </Display>
        <Muted style={{ fontSize: 16, color: colors.cream }}>Mais do que tênis, um lugar para pertencer.</Muted>
        <Muted style={{ fontSize: 14 }}>Reserve quadras, jogue com a galera e suba no ranking.</Muted>
      </View>

      <View style={{ gap: space.md }}>
        <Button label="Criar minha conta" arrow onPress={() => router.push('/signup')} />
        <Button label="Já tenho conta" variant="ghost" onPress={() => router.push('/login')} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.xl, justifyContent: 'space-between' },
  logo: { alignItems: 'center', marginTop: space.xl },
});
