import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Largura máxima da "coluna do app" no navegador. Em telas maiores (tablet, notebook)
// o app fica centralizado nessa coluna em vez de esticar até as bordas.
export const MAX_FRAME = 560;

// Medidas do aparelho: tela útil, recortes (notch, barra do iPhone) e tamanho da tela.
export function useLayout() {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const frameW = Platform.OS === 'web' ? Math.min(winW, MAX_FRAME) : winW;
  // margem lateral: 16 em telas normais, 12 em telas muito estreitas, mais o recorte lateral (modo paisagem)
  const base = frameW < 340 ? 12 : 16;
  const padL = base + insets.left;
  const padR = base + insets.right;
  return {
    insets,
    winW,
    winH,
    frameW,
    padL,
    padR,
    contentW: frameW - padL - padR,
    compact: frameW < 360, // celulares pequenos (iPhone SE, Android básicos)
    short: winH < 700, // telas curtas ou celular deitado
    wide: Platform.OS === 'web' && winW > MAX_FRAME,
  };
}
