import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { PhotoBackdrop } from '@/components/PhotoBackdrop';
import { Text, goBack } from '@/components/ui';
import { useLayout } from '@/lib/layout';
import { colors, space } from '@/lib/theme';

// Layout das telas de cadastro, login e perfil: foto no topo com o lema do clube e,
// por cima, o cartão claro com o formulário.
export function AuthLayout({ children, line, heading, back = true }: { children: ReactNode; line: string; heading: string; back?: boolean }) {
  const { insets, padL, padR, short } = useLayout();
  return (
    <View style={{ flex: 1, backgroundColor: colors.forest }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ height: (short ? 190 : 250) + insets.top, justifyContent: 'space-between', paddingTop: insets.top + 12, paddingBottom: 44, paddingLeft: padL + 4, paddingRight: padR + 4 }}>
            <PhotoBackdrop kind="auth" focus="top" />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {back ? (
                <Pressable onPress={goBack} hitSlop={8} style={s.pill}>
                  <Ionicons name="arrow-back" size={13} color={colors.onForest} />
                  <Text style={{ fontSize: 11, color: colors.onForest }}>Voltar</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Logo variant="full" height={44} />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 9.5, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: colors.forestMuted }}>{line}</Text>
              <Text serif style={{ fontSize: 28, lineHeight: 30, color: colors.onForest }}>
                {heading}
              </Text>
            </View>
          </View>
          <View style={[s.sheet, { paddingLeft: padL + 8, paddingRight: padR + 8, paddingBottom: 28 + insets.bottom }]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(244,245,238,0.16)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  sheet: { flexGrow: 1, marginTop: -28, backgroundColor: colors.paper, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 26, gap: space.lg },
});
