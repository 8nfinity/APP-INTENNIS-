import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';

import { avatarColor } from '@/lib/game';
import { FONT, colors, radius, space, type } from '@/lib/theme';

// Texto com a fonte Outfit. A fonte certa é escolhida pelo fontWeight do estilo.
export function Text({ style, ...props }: TextProps) {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const w = Number(flat.fontWeight === 'bold' ? 700 : (flat.fontWeight ?? 400));
  const family = w >= 900 ? FONT.black : w >= 800 ? FONT.extra : w >= 700 ? FONT.bold : w >= 500 ? FONT.medium : FONT.regular;
  return <RNText {...props} style={[{ color: colors.text }, style, { fontFamily: family, fontWeight: undefined }]} />;
}

// Fundo preto com brilhos amarelos nos cantos, como nas referências.
export function Screen({
  children,
  refreshing,
  onRefresh,
  padTop = true,
  tab = false,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  padTop?: boolean;
  tab?: boolean; // tela dentro das abas: deixa espaço para a barra flutuante
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.screen}>
      <LinearGradient pointerEvents="none" colors={['rgba(228,255,26,0.20)', 'rgba(228,255,26,0)']} style={s.glowTop} />
      <LinearGradient pointerEvents="none" colors={['rgba(228,255,26,0)', 'rgba(228,255,26,0.09)']} style={s.glowBottom} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.content,
            { paddingTop: padTop ? insets.top + 16 : space.lg, paddingBottom: tab ? 130 : 48 },
          ]}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined
          }>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// default: vidro escuro | glow: borda quente no topo (referência 1) | hero: painel amarelo (referência 3)
export function Card({
  children,
  style,
  glow,
  hero,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  hero?: boolean;
}) {
  if (hero) return <View style={[s.card, s.hero, style]}>{children}</View>;
  return (
    <LinearGradient
      colors={glow ? ['rgba(228,255,26,0.30)', 'rgba(228,255,26,0.05)', 'rgba(255,255,255,0.02)'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.025)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[s.card, glow && { borderColor: 'rgba(228,255,26,0.38)' }, style]}>
      {children}
    </LinearGradient>
  );
}

export function Display({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.display, style]}>{children}</Text>;
}
export function H1({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.h1, style]}>{children}</Text>;
}
export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.h2, style]}>{children}</Text>;
}
export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.muted, style]}>{children}</Text>;
}
export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={s.error}>{children}</Text>;
}

// Botão em pílula, com círculo de seta opcional (como o "Get Started" da referência 1).
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  arrow,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'dark';
  disabled?: boolean;
  loading?: boolean;
  arrow?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || loading;
  const onAccent = variant === 'primary';
  const fg = onAccent ? colors.onAccent : variant === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && s.btnPrimary,
        variant === 'ghost' && s.btnGhost,
        variant === 'dark' && s.btnDark,
        variant === 'danger' && s.btnDanger,
        arrow && { justifyContent: 'space-between', paddingRight: 8 },
        { opacity: off ? 0.45 : pressed ? 0.88 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} style={{ flex: 1 }} />
      ) : (
        <>
          <Text style={[s.btnText, { color: fg }, arrow && { marginLeft: 12 }]}>{label}</Text>
          {arrow && (
            <View style={[s.btnCircle, { backgroundColor: onAccent ? colors.onAccent : colors.accent }]}>
              <Ionicons name="arrow-forward" size={20} color={onAccent ? colors.accent : colors.onAccent} />
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

// Botão redondo pequeno com seta/ícone.
export function CircleButton({ icon = 'arrow-forward', onPress, size = 44 }: { icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; size?: number }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 }]}>
      <Ionicons name={icon} size={size * 0.46} color={colors.onAccent} />
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[s.input, error ? { borderColor: colors.danger } : null, props.multiline && { minHeight: 96, textAlignVertical: 'top' }]}
      />
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

export function Avatar({ name, url, size = 44 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.cardAlt }} />;
  }
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#0A0A00', fontWeight: '900', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = colors.accent, track }: { value: number; color?: string; track?: string }) {
  return (
    <View style={[s.track, track ? { backgroundColor: track } : null]}>
      <View style={[s.fill, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

// Medidor circular com marcas ao redor (referência 3). Pensado para ficar sobre o painel amarelo.
export function Gauge({ value, size = 230, children }: { value: number; size?: number; children?: ReactNode }) {
  const c = size / 2;
  const r = size * 0.36;
  const circ = 2 * Math.PI * r;
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * 2 * Math.PI;
    const long = i % 5 === 0;
    const r1 = r + 14;
    const r2 = r + (long ? 28 : 21);
    return { x1: c + r1 * Math.cos(a), y1: c + r1 * Math.sin(a), x2: c + r2 * Math.cos(a), y2: c + r2 * Math.sin(a), w: long ? 2.4 : 1.4 };
  });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {ticks.map((t, i) => (
          <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#0A0A00" strokeWidth={t.w} opacity={0.7} />
        ))}
        <Circle cx={c} cy={c} r={r} stroke="#0A0A00" strokeOpacity={0.14} strokeWidth={9} fill="none" />
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke="#0A0A00"
          strokeWidth={9}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circ * Math.max(0.02, Math.min(1, value))} ${circ}`}
          rotation={-90}
          origin={`${c}, ${c}`}
        />
      </Svg>
      {children}
    </View>
  );
}

// Quadro de número grande, como o "Monthly Review" da referência 1.
export function StatTile({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <Card glow={accent} style={s.tile}>
      <Text style={[s.tileValue, accent && { color: colors.accent }]}>{value}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </Card>
  );
}

export function Loading() {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export function Empty({ icon = 'tennisball-outline', title, hint }: { icon?: keyof typeof Ionicons.glyphMap; title: string; hint?: string }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={36} color={colors.muted} />
      <Text style={[type.h2, { fontSize: 17 }]}>{title}</Text>
      {hint && <Muted style={{ textAlign: 'center' }}>{hint}</Muted>}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card style={{ gap: space.md, alignItems: 'center' }}>
      <Ionicons name="cloud-offline-outline" size={32} color={colors.danger} />
      <Text style={{ color: colors.text, textAlign: 'center' }}>{message}</Text>
      <Button label="Tentar de novo" variant="ghost" onPress={onRetry} />
    </Card>
  );
}

export function formatBRL(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  glowTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 340 },
  glowBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 420 },
  content: { paddingHorizontal: space.lg, gap: space.lg },
  card: {
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  hero: { backgroundColor: colors.accent, borderColor: colors.accent, borderRadius: radius.xl, padding: space.xl },
  muted: { color: colors.muted, fontSize: 13 },
  error: { color: colors.danger, fontSize: 13 },
  btn: {
    minHeight: 58,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: { backgroundColor: colors.accent },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: colors.border },
  btnDark: { backgroundColor: '#0A0A00' },
  btnDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  btnText: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  btnCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  label: { color: colors.muted, fontWeight: '700', fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    fontFamily: FONT.medium,
  },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  tile: { flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 26, gap: 4 },
  tileValue: { fontSize: 38, fontWeight: '900', letterSpacing: -1.5, color: colors.text },
  tileLabel: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  empty: { alignItems: 'center', gap: 8, padding: 32 },
});
