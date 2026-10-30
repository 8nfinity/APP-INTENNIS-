import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '@/lib/theme';

// Bola de tênis com brilho, usada na abertura do app.
export function TennisBall({ size = 280 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="-60 -60 320 320">
      <Defs>
        <RadialGradient id="glow" cx="100" cy="100" r="160" gradientUnits="userSpaceOnUse">
          <Stop offset="0.45" stopColor={colors.accent} stopOpacity="0.38" />
          <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="ball" cx="70" cy="65" r="130" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#F6FF7A" />
          <Stop offset="0.55" stopColor={colors.accent} />
          <Stop offset="1" stopColor="#9DB300" />
        </RadialGradient>
      </Defs>
      <Circle cx="100" cy="100" r="160" fill="url(#glow)" />
      <Circle cx="100" cy="100" r="92" fill="url(#ball)" />
      <Path d="M22 48 C 78 82, 78 118, 22 152" stroke="#F4FFB8" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9" />
      <Path d="M178 48 C 122 82, 122 118, 178 152" stroke="#F4FFB8" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.9" />
    </Svg>
  );
}
