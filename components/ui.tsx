import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createContext, ReactNode, useContext } from 'react';
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

import { Logo } from '@/components/Logo';
import { PhotoBackdrop } from '@/components/PhotoBackdrop';
import { useLayout } from '@/lib/layout';
import { PhotoName } from '@/lib/photos';
import { FONT, colors, radius, space } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;
export type Tone = 'light' | 'dark';

// Tela clara (padrão) ou escura (fotos). Os componentes ajustam as cores sozinhos.
const ToneContext = createContext<Tone>('light');
export const useTone = () => useContext(ToneContext);

// ---------- texto ----------
export function Text({ style, serif, italic, ...props }: TextProps & { serif?: boolean; italic?: boolean }) {
  const tone = useTone();
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const w = Number(flat.fontWeight === 'bold' ? 700 : (flat.fontWeight ?? 400));
  const family = serif
    ? italic
      ? FONT.serifItalic
      : w >= 500
        ? FONT.serifMedium
        : FONT.serif
    : w >= 700
      ? FONT.sansBold
      : w >= 500
        ? FONT.sansMedium
        : FONT.sans;
  // limite no aumento da fonte do sistema: respeita acessibilidade sem quebrar o layout
  return (
    <RNText
      maxFontSizeMultiplier={1.25}
      {...props}
      style={[{ color: tone === 'dark' ? colors.onForest : colors.ink }, style, { fontFamily: family, fontWeight: undefined }]}
    />
  );
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const dark = useTone() === 'dark';
  return (
    <Text style={[{ fontSize: 10, fontWeight: '700', letterSpacing: 1.7, textTransform: 'uppercase', color: dark ? colors.forestMuted : colors.muted }, style]}>
      {children}
    </Text>
  );
}

export function Headline({ children, serif, style }: { children: ReactNode; serif?: boolean; style?: StyleProp<TextStyle> }) {
  return (
    <Text serif={serif} style={[{ fontSize: serif ? 40 : 30, lineHeight: serif ? 42 : 34, letterSpacing: serif ? -0.8 : -1, fontWeight: '400' }, style]}>
      {children}
    </Text>
  );
}

export function Sub({ children, style, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const dark = useTone() === 'dark';
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontSize: 13, lineHeight: 19, color: dark ? colors.forestMuted : colors.muted }, style]}>
      {children}
    </Text>
  );
}
export const Muted = Sub;

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ fontSize: 18, fontWeight: '500', letterSpacing: -0.3 }, style]}>{children}</Text>;
}

// título de seção com link à direita ("Ranking completo" ... "Meus desafios")
export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const dark = useTone() === 'dark';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md }}>
      <Title>{title}</Title>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: dark ? colors.lime : colors.forest2 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={{ color: colors.danger, fontSize: 13 }}>{children}</Text>;
}

// ---------- barra do topo ----------
export function RoundButton({ icon, onPress, onLight, label }: { icon: IconName; onPress: () => void; onLight?: boolean; label?: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [s.round, onLight ? s.roundLight : s.roundDark, { opacity: pressed ? 0.8 : 1 }]}>
      <Ionicons name={icon} size={18} color={onLight ? colors.ink : colors.onForest} />
    </Pressable>
  );
}

export const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

export function TopBar({ back = true, transparent }: { back?: boolean; transparent?: boolean }) {
  const { insets, padL, padR } = useLayout();
  return (
    <View
      style={[
        s.bar,
        { paddingTop: insets.top + 10, paddingLeft: padL + 4, paddingRight: padR + 4 },
        transparent ? null : { backgroundColor: colors.forest, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
      ]}>
      <Logo variant="mark" height={30} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {back && <RoundButton icon="arrow-back" label="Voltar" onPress={goBack} />}
        <RoundButton icon="notifications-outline" label="Avisos" onPress={() => router.push('/avisos')} />
      </View>
    </View>
  );
}

// ---------- tela ----------
export function Screen({
  children,
  tone = 'light',
  bar = true,
  back = true,
  photo,
  refreshing,
  onRefresh,
  tab = false,
  padTop,
}: {
  children: ReactNode;
  tone?: Tone;
  bar?: boolean;
  back?: boolean;
  photo?: PhotoName;
  refreshing?: boolean;
  onRefresh?: () => void;
  tab?: boolean; // dentro das abas: a barra de abas já cuida da margem de baixo
  padTop?: boolean; // sem barra de topo: reserva a área do notch
}) {
  const { insets, padL, padR } = useLayout();
  const dark = tone === 'dark';
  return (
    <ToneContext.Provider value={tone}>
      <View style={{ flex: 1, backgroundColor: dark ? colors.forest : colors.paper }}>
        {dark && <PhotoBackdrop kind="court" photo={photo} />}
        {bar && <TopBar back={back} transparent={dark} />}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: padL + 4,
              paddingRight: padR + 4,
              paddingTop: bar ? 22 : padTop === false ? 16 : insets.top + 16,
              paddingBottom: tab ? 28 : 36 + insets.bottom,
              gap: space.lg,
            }}
            refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={dark ? colors.onForest : colors.forest} /> : undefined}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ToneContext.Provider>
  );
}

// ---------- cartões e etiquetas ----------
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const dark = useTone() === 'dark';
  return <View style={[s.card, dark && s.cardDark, style]}>{children}</View>;
}

export function Tag({ label, tone = 'lime' }: { label: string; tone?: 'lime' | 'sage' }) {
  return (
    <View style={[s.tag, tone === 'sage' && { backgroundColor: colors.sage }]}>
      <Text style={{ fontSize: 10, fontWeight: '500', color: '#4E6030' }}>{label}</Text>
    </View>
  );
}

export function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={{ fontSize: 22, fontWeight: '400', letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 10.5, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function Banner({ icon = 'time-outline', children }: { icon?: IconName; children: ReactNode }) {
  return (
    <View style={s.banner}>
      <Ionicons name={icon} size={17} color={colors.amberText} />
      <Text style={{ fontSize: 12.5, color: colors.amberText, flex: 1 }}>{children}</Text>
    </View>
  );
}

export function InfoBox({ children }: { children: ReactNode }) {
  return (
    <View style={s.info}>
      <Text style={{ fontSize: 11.5, lineHeight: 16, color: '#59685C' }}>{children}</Text>
    </View>
  );
}

// ---------- botões ----------
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
  variant?: 'primary' | 'dark' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  arrow?: boolean;
  trailing?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || loading;
  const fg = variant === 'primary' ? colors.onLime : variant === 'dark' ? colors.onForest : variant === 'danger' ? colors.danger : colors.ink;
  const split = !!trailing;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && { backgroundColor: colors.lime },
        variant === 'dark' && { backgroundColor: colors.forest2 },
        variant === 'ghost' && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
        variant === 'danger' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(192,70,58,0.4)' },
        split && { justifyContent: 'space-between', paddingHorizontal: 22 },
        { opacity: off ? 0.5 : pressed ? 0.88 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          <Text style={{ fontSize: 14.5, fontWeight: '700', color: fg }}>{label}</Text>
          {(arrow || split) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {trailing ? <Text style={{ fontSize: 14.5, fontWeight: '700', color: fg }}>{trailing}</Text> : null}
              <Ionicons name="arrow-forward" size={17} color={fg} />
            </View>
          )}
        </>
      )}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  const dark = useTone() === 'dark';
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.chip,
        dark ? { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.16)' } : { backgroundColor: colors.sage, borderColor: colors.sage },
        active && { backgroundColor: colors.lime, borderColor: colors.lime },
      ]}>
      {icon && <Ionicons name={icon} size={14} color={active ? colors.onLime : dark ? colors.onForest : colors.ink} />}
      <Text style={{ fontSize: 12.5, fontWeight: '500', color: active ? colors.onLime : dark ? colors.onForest : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

// Abas em pílula: "Geral | Este mês", "Publicações | Reservas | Conquistas".
export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  const dark = useTone() === 'dark';
  return (
    <View style={[s.seg, dark ? { backgroundColor: 'rgba(255,255,255,0.1)' } : { backgroundColor: colors.sage }]}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[s.segItem, on && (dark ? { backgroundColor: colors.lime } : { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 })]}>
            <Text style={{ fontSize: 12.5, fontWeight: on ? '700' : '500', color: on ? (dark ? colors.onLime : colors.ink) : dark ? colors.forestMuted : colors.muted }} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- campos ----------
export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string | null }) {
  const dark = useTone() === 'dark';
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 11.5, color: dark ? colors.forestMuted : colors.muted }}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.soft}
        maxFontSizeMultiplier={1.25}
        {...props}
        style={[
          s.input,
          dark && { backgroundColor: 'rgba(255,255,255,0.1)', color: colors.onForest },
          error ? { borderColor: colors.danger } : null,
          props.multiline && { minHeight: 96, textAlignVertical: 'top' },
        ]}
      />
      <ErrorText>{error}</ErrorText>
    </View>
  );
}

// ---------- avatar ----------
export function Avatar({ name, url, size = 44, ring }: { name: string; url?: string | null; size?: number; ring?: string }) {
  const border = ring ? { borderWidth: 2, borderColor: ring } : null;
  if (url) return <Image source={{ uri: url }} style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.sage }, border]} />;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#DCE5C4', alignItems: 'center', justifyContent: 'center' }, border]}>
      <Text style={{ color: '#44582F', fontWeight: '500', fontSize: size * 0.34 }}>{initials}</Text>
    </View>
  );
}

// ---------- listas (Configurações) ----------
export function ListRow({ label, value, onPress, danger, last }: { label: string; value?: string; onPress?: () => void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.row, !last && s.rowBorder, pressed && { opacity: 0.6 }]}>
      <Text style={{ flex: 1, fontSize: 13.5, color: danger ? colors.danger : colors.forest2 }}>{label}</Text>
      {value ? <Text style={{ fontSize: 12, color: colors.muted }}>{value}</Text> : null}
      {onPress ? <Text style={{ fontSize: 13, color: colors.muted }}>↗</Text> : null}
    </Pressable>
  );
}

// ---------- estados ----------
export function Loading() {
  return (
    <View style={{ padding: 36, alignItems: 'center' }}>
      <ActivityIndicator color={colors.forest2} size="large" />
    </View>
  );
}

export function Empty({ icon = 'tennisball-outline', title, hint }: { icon?: IconName; title: string; hint?: string }) {
  const dark = useTone() === 'dark';
  return (
    <View style={{ alignItems: 'center', gap: 8, padding: 28 }}>
      <Ionicons name={icon} size={32} color={dark ? colors.forestMuted : colors.soft} />
      <Text style={{ fontSize: 15, fontWeight: '500' }}>{title}</Text>
      {hint && <Sub style={{ textAlign: 'center' }}>{hint}</Sub>}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card style={{ gap: space.md, alignItems: 'center' }}>
      <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
      <Text style={{ textAlign: 'center' }}>{message}</Text>
      <Button label="Tentar de novo" variant="ghost" onPress={onRetry} />
    </Card>
  );
}

export function formatBRL(n: number) {
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  roundDark: { backgroundColor: 'rgba(244,245,238,0.14)' },
  roundLight: { backgroundColor: colors.sage },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border },
  cardDark: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' },
  tag: { alignSelf: 'flex-start', backgroundColor: colors.limeSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 6 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.amber, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  info: { backgroundColor: colors.field, borderRadius: 14, padding: 14 },
  btn: { minHeight: 52, paddingVertical: 13, paddingHorizontal: 22, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1 },
  seg: { flexDirection: 'row', borderRadius: radius.pill, padding: 4 },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: radius.pill },
  // 16px: abaixo disso o Safari do iPhone dá zoom automático ao tocar no campo
  input: { backgroundColor: colors.field, color: colors.ink, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, borderWidth: 1, borderColor: 'transparent', fontSize: 16, fontFamily: FONT.sansMedium },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
});
