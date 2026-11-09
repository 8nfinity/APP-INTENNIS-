import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Sub, Text } from '@/components/ui';
import { installApp, useInstall } from '@/lib/install';
import { colors, radius, space } from '@/lib/theme';

const ICON = require('../assets/images/icon.png');
const KEY = 'install-banner-dismissed';

function dismissedBefore() {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

// Aviso para instalar o webapp na tela inicial (só no navegador, fora do app instalado).
export function InstallBanner() {
  const { show } = useInstall();
  const [hidden, setHidden] = useState(dismissedBefore);
  if (!show || hidden) return null;

  const close = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      // sem armazenamento local: o aviso volta na próxima visita
    }
  };

  return (
    <View style={s.box}>
      <Image source={ICON} style={s.icon} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '500', fontSize: 13.5 }}>Instale o In Tennis</Text>
        <Sub style={{ fontSize: 11.5, lineHeight: 15 }}>Ícone na tela inicial e abre em tela cheia.</Sub>
      </View>
      <Pressable onPress={installApp} style={s.btn}>
        <Text style={{ color: colors.onLime, fontWeight: '700', fontSize: 12.5 }}>Instalar</Text>
      </Pressable>
      <Pressable onPress={close} hitSlop={10}>
        <Ionicons name="close" size={17} color={colors.forestMuted} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  icon: { width: 40, height: 40, borderRadius: 10 },
  btn: { backgroundColor: colors.lime, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
