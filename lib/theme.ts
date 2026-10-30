export const colors = {
  bg: '#050505',
  surface: '#0E0E0E',
  card: '#141414',
  cardAlt: '#1D1D1D',
  border: '#262626',
  text: '#FFFFFF',
  muted: '#8C8C8C',
  accent: '#E4FF1A',
  onAccent: '#0A0A00',
  hot: '#FF5A1F',
  success: '#3DDC84',
  danger: '#FF5C5C',
  gold: '#FFD04A',
  silver: '#C5CDD3',
  bronze: '#D08A4E',
  // nomes antigos, mantidos como atalho
  ball: '#E4FF1A',
  onBall: '#0A0A00',
  clay: '#FF5A1F',
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const type = {
  display: { fontSize: 38, fontWeight: '900' as const, letterSpacing: -1.5, color: colors.text },
  h1: { fontSize: 28, fontWeight: '900' as const, letterSpacing: -0.8, color: colors.text },
  h2: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.3, color: colors.text },
};
