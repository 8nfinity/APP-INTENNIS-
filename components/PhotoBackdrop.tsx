import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { PHOTOS } from '@/lib/photos';
import { colors } from '@/lib/theme';

type Kind = 'welcome' | 'court' | 'event';

// Fundo de foto das telas (jogador sacando, quadra de saibro...). Usa a foto configurada em
// lib/photos.ts; enquanto não houver foto, desenha uma ilustração de quadra no lugar.
const PALETTE: Record<Kind, [string, string]> = {
  welcome: ['#2B3E2C', '#7C4128'], // folhagem no alto, saibro embaixo
  court: ['#223A2D', '#16281F'],
  event: ['#2F4A35', '#9A5A36'],
};

function CourtLines({ opacity = 0.14 }: { opacity?: number }) {
  const L = { stroke: '#F4F5EE', strokeOpacity: opacity, strokeWidth: 0.35 };
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
      <Rect x={12} y={8} width={76} height={92} fill="none" {...L} />
      <Line x1={20} y1={8} x2={20} y2={100} {...L} />
      <Line x1={80} y1={8} x2={80} y2={100} {...L} />
      <Line x1={20} y1={34} x2={80} y2={34} {...L} />
      <Line x1={20} y1={72} x2={80} y2={72} {...L} />
      <Line x1={50} y1={34} x2={50} y2={72} {...L} />
      <Line x1={6} y1={52} x2={94} y2={52} stroke="#F4F5EE" strokeOpacity={opacity + 0.06} strokeWidth={0.6} />
    </Svg>
  );
}

export function PhotoBackdrop({ kind = 'court', style, fade = true }: { kind?: Kind; style?: StyleProp<ViewStyle>; fade?: boolean }) {
  const url = PHOTOS[kind === 'welcome' ? 'welcome' : kind === 'event' ? 'event' : 'court'];
  const [a, b] = PALETTE[kind];
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {url ? (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <>
          <LinearGradient colors={[a, b]} style={StyleSheet.absoluteFill} />
          <CourtLines />
        </>
      )}
      {/* escurece para o texto branco ficar legível; na abertura deixa a foto aparecer mais */}
      <LinearGradient
        colors={
          kind === 'welcome' && fade
            ? ['rgba(22,40,31,0.08)', 'rgba(22,40,31,0.3)', 'rgba(22,40,31,0.94)']
            : ['rgba(22,40,31,0.35)', fade ? 'rgba(22,40,31,0.82)' : 'rgba(22,40,31,0.2)', fade ? colors.forest : 'rgba(22,40,31,0.2)']
        }
        locations={kind === 'welcome' && fade ? [0, 0.42, 1] : [0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
