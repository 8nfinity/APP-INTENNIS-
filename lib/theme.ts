export const colors = {
  // Identidade In Tennis Club: verde-floresta e branco-creme. O amarelo-bola é só destaque.
  bg: '#0A120D',
  surface: '#0F1A13',
  card: '#14221A',
  cardAlt: '#1B2D22',
  border: 'rgba(244,243,236,0.10)',
  text: '#F4F3EC',
  cream: '#F4F3EC',
  brand: '#253A2B',
  muted: '#8CA091',
  accent: '#D4F23C',
  onAccent: '#0F1A13',
  hot: '#FF5A1F',
  success: '#3DDC84',
  danger: '#FF5C5C',
  gold: '#FFD04A',
  silver: '#C5CDD3',
  bronze: '#D08A4E',
};

export const radius = { sm: 12, md: 18, lg: 28, xl: 36, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const FONT = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  bold: 'Outfit_700Bold',
  extra: 'Outfit_800ExtraBold',
  black: 'Outfit_900Black',
};

export const type = {
  display: { fontSize: 44, fontWeight: '900' as const, letterSpacing: -2, lineHeight: 46, color: colors.text },
  h1: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -1.2, color: colors.text },
  h2: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.4, color: colors.text },
};
