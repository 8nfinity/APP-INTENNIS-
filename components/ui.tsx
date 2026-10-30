import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { colors, radius, space } from '@/lib/theme';
import { Player } from '@/lib/types';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.title, style]}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.muted, style]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        primary ? s.btnPrimary : s.btnGhost,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
        style,
      ]}>
      <Text style={[s.btnText, { color: primary ? colors.onBall : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && { color: colors.onBall }]}>{label}</Text>
    </Pressable>
  );
}

export function Avatar({ player, size = 40 }: { player: Pick<Player, 'name' | 'color'>; size?: number }) {
  const initials = player.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: player.color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: '#101010', fontWeight: '800', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = colors.ball }: { value: number; color?: string }) {
  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export function formatBRL(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13 },
  btn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: radius.pill, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.ball },
  btnGhost: { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border },
  btnText: { fontSize: 15, fontWeight: '800' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.ball, borderColor: colors.ball },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});
