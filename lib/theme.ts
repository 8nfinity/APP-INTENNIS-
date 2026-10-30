export const colors = {
  bg: '#060606',
  surface: '#101010',
  card: '#151515',
  cardAlt: '#1E1E1E',
  border: 'rgba(255,255,255,0.09)',
  text: '#FFFFFF',
  muted: '#8E8E8E',
  accent: '#E4FF1A',
  onAccent: '#0A0A00',
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
