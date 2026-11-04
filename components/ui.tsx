import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import Svg, { Circle, Line } from 'react-native-svg';

import { avatarColor } from '@/lib/game';
import { useLayout } from '@/lib/layout';
import { FONT, colors, radius, space, type } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

// Texto com a fonte Outfit. A fonte certa é escolhida pelo fontWeight do estilo.
export function Text({ style, ...props }: TextProps) {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const w = Number(flat.fontWeight === 'bold' ? 700 : (flat.fontWeight ?? 400));
  const family = w >= 900 ? FONT.black : w >= 800 ? FONT.extra : w >= 700 ? FONT.bold : w >= 500 ? FONT.medium : FONT.regular;
  // limite no aumento da fonte do sistema: respeita acessibilidade sem quebrar o layout
  return <RNText maxFontSizeMultiplier={1.25} {...props} style={[{ color: colors.text }, style, { fontFamily: family, fontWeight: undefined }]} />;
}

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
  tab?: boolean;
}) {
  const { insets, padL, padR } = useLayout();
  return (
    <View style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.content,
            {
              paddingLeft: padL,
              paddingRight: padR,
              // topo: área do notch/ilha dinâmica. Base: telas com abas já têm a barra; as demais
              // precisam da faixa do indicador de início do iPhone / gestos do Android
              paddingTop: padTop ? insets.top + 12 : space.lg,
              paddingBottom: (tab ? 32 : 48) + (tab ? 0 : insets.bottom),
            },
          ]}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.cream} /> : undefined}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Cabeçalho das telas internas: botão redondo de voltar + título centralizado (referências Settings/Edit Profile).
export function Header({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={s.header}>
      <RoundButton icon="arrow-back" onPress={onBack ?? (() => router.back())} />
      <Text style={s.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ width: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function RoundButton({ icon, onPress, label, active }: { icon: IconName; onPress: () => void; label?: string; active?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => [s.round, label && s.roundWide, active && { backgroundColor: colors.cream }, { opacity: pressed ? 0.8 : 1 }]}>
      <Ionicons name={icon} size={20} color={active ? colors.onAccent : colors.text} />
      {label ? <Text style={[s.roundLabel, active && { color: colors.onAccent }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function Card({ children, style, glow, hero }: { children: ReactNode; style?: StyleProp<ViewStyle>; glow?: boolean; hero?: boolean }) {
  return <View style={[s.card, glow && s.cardGlow, hero && s.hero, style]}>{children}</View>;
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
export function Section({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.section, style]}>{children}</Text>;
}
export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={s.error}>{children}</Text>;
}

// Botão principal. `trailing` mostra um valor à direita (ex.: "R$ 80 →", como o "Pay Deposit" da referência).
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  arrow,
  trailing,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'dark' | 'light';
  disabled?: boolean;
  loading?: boolean;
  arrow?: boolean;
  trailing?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || loading;
  const fg =
    variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : variant === 'light' ? colors.danger : colors.text;
  const split = arrow || !!trailing;
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
        variant === 'light' && s.btnLight,
        split && { justifyContent: 'space-between', paddingHorizontal: 20 },
        { opacity: off ? 0.45 : pressed ? 0.88 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} style={{ flex: 1 }} />
      ) : (
        <>
          <Text style={[s.btnText, { color: fg }]}>{label}</Text>
          {split && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {trailing ? <Text style={[s.btnText, { color: fg }]}>{trailing}</Text> : null}
              <Ionicons name="arrow-forward" size={20} color={fg} />
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

export function CircleButton({ icon = 'arrow-forward', onPress, size = 44 }: { icon?: IconName; onPress: () => void; size?: number }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 }]}>
      <Ionicons name={icon} size={size * 0.46} color={colors.onAccent} />
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      {icon && <Ionicons name={icon} size={15} color={active ? colors.onAccent : colors.text} />}
      <Text style={[s.chipText, active && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

// Pílulas de abas, como "Feed / Challenge / Badge" da referência de perfil.
export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string; icon?: IconName }[]; value: T; onChange: (k: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
      {options.map((o) => (
        <Chip key={o.key} label={o.label} icon={o.icon} active={o.key === value} onPress={() => onChange(o.key)} />
      ))}
    </View>
  );
}

// Etapas no topo do agendamento (referência LUXE).
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View style={s.stepper}>
      {steps.map((label, i) => {
        const done = i < current;
        const on = i === current;
        return (
          <View key={label} style={{ flex: 1, alignItems: 'center' }}>
            <View style={s.stepLineWrap}>
              <View style={[s.stepLine, { opacity: i === 0 ? 0 : 1 }, (done || on) && { backgroundColor: colors.cream }]} />
              <View style={[s.stepDot, (done || on) && { borderColor: colors.cream }, done && { backgroundColor: colors.cream }]} />
              <View style={[s.stepLine, { opacity: i === steps.length - 1 ? 0 : 1 }, done && { backgroundColor: colors.cream }]} />
            </View>
            <Text style={[s.stepLabel, (done || on) && { color: colors.cream }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Lista agrupada (referência Settings).
export function ListGroup({ children }: { children: ReactNode }) {
  return <View style={s.group}>{children}</View>;
}
export function ListRow({
  icon,
  label,
  value,
  onPress,
  danger,
  last,
  right,
}: {
  icon?: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
  right?: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.row, !last && s.rowBorder, pressed && { backgroundColor: 'rgba(244,243,236,0.04)' }]}>
      {icon && <Ionicons name={icon} size={19} color={danger ? colors.danger : colors.muted} />}
      <Text style={[s.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null)}
    </Pressable>
  );
}

// Linha de formulário: rótulo à esquerda, campo à direita (referência Edit Profile).
export function FormRow({ label, last, ...props }: TextInputProps & { label: string; last?: boolean }) {
  return (
    <View style={[s.row, !last && s.rowBorder, props.multiline && { alignItems: 'flex-start' }]}>
      <Text style={[s.formLabel, props.multiline && { paddingTop: 2 }]}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} maxFontSizeMultiplier={1.25} {...props} style={[s.formInput, props.editable === false && { color: colors.muted }]} />
    </View>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        maxFontSizeMultiplier={1.25}
        {...props}
        style={[s.input, error ? { borderColor: colors.danger } : null, props.multiline && { minHeight: 96, textAlignVertical: 'top' }]}
      />
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

export function Avatar({ name, url, size = 44, ring }: { name: string; url?: string | null; size?: number; ring?: string }) {
  const border = ring ? { borderWidth: 2, borderColor: ring } : null;
  if (url) {
    return <Image source={{ uri: url }} style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.cardAlt }, border]} />;
  }
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name), alignItems: 'center', justifyContent: 'center' }, border]}>
      <Text style={{ color: colors.onAccent, fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = colors.cream, track }: { value: number; color?: string; track?: string }) {
  return (
    <View style={[s.track, track ? { backgroundColor: track } : null]}>
      <View style={[s.fill, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

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
          <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={colors.cream} strokeWidth={t.w} opacity={0.45} />
        ))}
        <Circle cx={c} cy={c} r={r} stroke={colors.cream} strokeOpacity={0.14} strokeWidth={9} fill="none" />
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={colors.lime}
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

export function StatTile({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <Card style={s.tile}>
      <Text style={[s.tileValue, accent && { color: colors.lime }]}>{value}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </Card>
  );
}

export function Loading() {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator color={colors.cream} size="large" />
    </View>
  );
}

export function Empty({ icon = 'tennisball-outline', title, hint }: { icon?: IconName; title: string; hint?: string }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={34} color={colors.muted} />
      <Text style={[type.h2, { fontSize: 17 }]}>{title}</Text>
      {hint && <Muted style={{ textAlign: 'center' }}>{hint}</Muted>}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card style={{ gap: space.md, alignItems: 'center' }}>
      <Ionicons name="cloud-offline-outline" size={30} color={colors.danger} />
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
  content: { gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  headerTitle: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 18, fontWeight: '700' },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  roundWide: { width: undefined, paddingHorizontal: 14 },
  roundLabel: { color: colors.text, fontWeight: '700', fontSize: 14 },
  card: { borderRadius: radius.lg, padding: space.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  cardGlow: { borderColor: 'rgba(244,243,236,0.22)' },
  hero: { backgroundColor: colors.brand, borderColor: 'rgba(244,243,236,0.14)', borderRadius: radius.xl, padding: space.xl },
  muted: { color: colors.muted, fontSize: 13 },
  section: { color: colors.text, fontSize: 17, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13 },
  btn: { minHeight: 56, paddingVertical: 14, paddingHorizontal: 24, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnPrimary: { backgroundColor: colors.cream },
  btnGhost: { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border },
  btnDark: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,107,107,0.5)' },
  btnLight: { backgroundColor: colors.cream, borderRadius: radius.pill },
  btnText: { fontSize: 16, fontWeight: '700' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.cream, borderColor: colors.cream },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  stepper: { flexDirection: 'row' },
  stepLineWrap: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stepLine: { flex: 1, height: 1.5, backgroundColor: 'rgba(244,243,236,0.18)' },
  stepDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(244,243,236,0.3)' },
  stepLabel: { color: colors.muted, fontSize: 12, marginTop: 8, fontWeight: '500' },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, minHeight: 54, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  rowValue: { color: colors.muted, fontSize: 14 },
  formLabel: { color: colors.muted, fontSize: 14, width: 96 },
  // 16px: abaixo disso o Safari do iPhone dá zoom automático ao tocar no campo
  formInput: { flex: 1, color: colors.text, fontSize: 16, textAlign: 'right', fontFamily: FONT.medium, paddingVertical: 0 },
  label: { color: colors.muted, fontWeight: '600', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    fontFamily: FONT.medium,
  },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(244,243,236,0.12)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  tile: { flex: 1, minWidth: '22%', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 6, gap: 2 },
  tileValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6, color: colors.text },
  tileLabel: { color: colors.muted, fontSize: 12 },
  empty: { alignItems: 'center', gap: 8, padding: 32 },
});
