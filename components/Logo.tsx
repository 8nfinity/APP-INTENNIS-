import { Image } from 'react-native';

// Logo oficial do In Tennis Club (creme, fundo transparente) para usar sobre o verde da marca.
const LOGO = require('../assets/images/logo.png');
const RATIO = 491 / 372; // largura / altura do arquivo

export function Logo({ size = 40 }: { size?: number }) {
  // `size` é a altura do logo
  return <Image source={LOGO} style={{ height: size * 1.9, width: size * 1.9 * RATIO }} resizeMode="contain" />;
}
