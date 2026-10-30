import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Muted, Text } from '@/components/ui';
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
        <Text style={{ fontWeight: '700' }}>Instale o In Tennis</Text>
        <Muted style={{ fontSize: 12 }}>Ícone na tela inicial e abre em tela cheia.</Muted>
      </View>
      <Pressable onPress={installApp} style={s.btn}>
        <Text style={s.btnText}>Instalar</Text>
      </Pressable>
      <Pressable onPress={close} hitSlop={10}>
        <Ionicons name="close" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(244,243,236,0.18)' },
  icon: { width: 42, height: 42, borderRadius: 10 },
  btn: { backgroundColor: colors.cream, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { color: colors.onAccent, fontWeight: '700', fontSize: 13 },
});
