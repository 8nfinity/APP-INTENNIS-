import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/Logo';
import { Button, Display, Muted } from '@/components/ui';
import { colors, space } from '@/lib/theme';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(228,255,26,0.30)', 'rgba(228,255,26,0)']}
        style={s.glow}
      />
      <Logo size={56} />

      <View style={s.ball}>
        <Ionicons name="tennisball" size={120} color={colors.accent} />
      </View>

      <View style={{ gap: space.md }}>
        <Display>
          Are you{'\n'}IN<Text style={{ color: colors.accent }}>.</Text>?
        </Display>
        <Muted style={{ fontSize: 15 }}>Mais do que tênis, um lugar para pertencer.</Muted>
        <Muted>Reserve quadras, jogue com a galera, suba no ranking.</Muted>
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
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
  ball: { alignItems: 'center', opacity: 0.95 },
});
