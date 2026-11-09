import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { FONT, colors } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta tela não existe.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Voltar ao início</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: colors.paper },
  title: { fontSize: 20, fontFamily: FONT.sansMedium, color: colors.ink },
  link: { marginTop: 15, paddingVertical: 15 },
  linkText: { fontSize: 14, fontFamily: FONT.sansMedium, color: colors.forest2 },
});
