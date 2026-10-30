// Identidade In Tennis Club sobre a base escura das referências:
// creme = seleção e botões (onde as referências usam dourado/lime),
// verde-floresta = blocos da marca, lime = só pontos e números positivos.
export const colors = {
  bg: '#0A0D0B',
  surface: '#111512',
  card: '#161B17',
  cardAlt: '#1E2420',
  border: 'rgba(244,243,236,0.08)',
  text: '#F4F3EC',
  cream: '#F4F3EC',
  muted: '#8B948D',
  brand: '#253A2B',
  brandLight: '#35523E',
  accent: '#F4F3EC',
  onAccent: '#18291D',
  lime: '#C8E64A',
  hot: '#E8955F',
  success: '#7FD39A',
  danger: '#FF6B6B',
  gold: '#E9C46A',
  silver: '#C5CDD3',
  bronze: '#D08A4E',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const FONT = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  bold: 'Outfit_700Bold',
  extra: 'Outfit_800ExtraBold',
  black: 'Outfit_900Black',
};

export const type = {
  display: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1, lineHeight: 40, color: colors.text },
  h1: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8, color: colors.text },
  h2: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, color: colors.text },
};
