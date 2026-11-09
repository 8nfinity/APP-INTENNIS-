import { Image } from 'react-native';

// Logo do In Tennis Club (creme, com o ponto verde-limão do protótipo), fundo transparente,
// para usar sobre o verde da marca. 'mark' = só o "IN."; 'full' = "IN." com "TENNIS CLUB".
const MARK = require('../assets/images/logo-mark-lime.png');
const FULL = require('../assets/images/logo-lime.png');
const RATIO = { mark: 521 / 331, full: 720 / 545 };

export function Logo({ variant = 'mark', height = 32 }: { variant?: 'mark' | 'full'; height?: number }) {
  return <Image source={variant === 'mark' ? MARK : FULL} style={{ height, width: height * RATIO[variant] }} resizeMode="contain" />;
}
