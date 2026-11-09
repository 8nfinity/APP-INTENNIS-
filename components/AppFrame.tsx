import { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MAX_FRAME } from '@/lib/layout';
import { colors } from '@/lib/theme';

// No navegador, centraliza o app numa coluna de largura máxima (como um celular) quando a
// tela é maior que isso. No celular a coluna ocupa a tela toda e o fundo nem aparece.
//
// Importante: no navegador o Expo Router instala um provedor de áreas seguras que devolve
// SEMPRE zero. Sem o provedor real abaixo, o webapp instalado no iPhone (tela cheia) ficaria
// com o conteúdo por baixo do notch/ilha dinâmica e da barra inferior. O provedor real lê o
// `env(safe-area-inset-*)` do aparelho.
export function AppFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={s.outer}>
      <View style={s.inner}>
        <SafeAreaProvider>{children}</SafeAreaProvider>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', backgroundColor: '#E4E8DA' },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_FRAME,
    backgroundColor: colors.paper,
    // só aparece quando sobra espaço dos lados
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
