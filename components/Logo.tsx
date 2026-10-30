import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

// Logo provisório em texto ("IN." + "TENNIS CLUB"). Para usar o logo oficial,
// troque o conteúdo deste componente por um <Image source={require(...)} />:
// o app inteiro passa a usar o novo logo.
export function Logo({ size = 40, tagline = true }: { size?: number; tagline?: boolean }) {
  return (
    <View>
      <Text style={[s.mark, { fontSize: size, lineHeight: size * 1.05 }]}>
        IN<Text style={{ color: colors.accent }}>.</Text>
      </Text>
      {tagline && <Text style={[s.sub, { fontSize: Math.max(9, size * 0.24) }]}>TENNIS CLUB</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  mark: { color: colors.text, fontWeight: '900', letterSpacing: -2 },
  sub: { color: colors.muted, fontWeight: '800', letterSpacing: 3, marginTop: -2 },
});
