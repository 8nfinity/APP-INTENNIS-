import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useLayout } from '@/lib/layout';
import { PHOTOS, PhotoName } from '@/lib/photos';

// Fundo de foto das telas e cartões. `kind` define o quanto a foto é escurecida:
// welcome = abertura | auth = topo do cadastro | court = tela de reservas (tela cheia escura)
// card = foto com título por cima | plain = foto limpa
export type BackdropKind = 'welcome' | 'auth' | 'court' | 'card' | 'plain';

const OVERLAY: Record<BackdropKind, { colors: [string, string, string]; locations: [number, number, number] }> = {
  welcome: { colors: ['rgba(22,40,31,0.10)', 'rgba(22,40,31,0.28)', 'rgba(22,40,31,0.95)'], locations: [0, 0.4, 0.92] },
  auth: { colors: ['rgba(22,40,31,0.32)', 'rgba(22,40,31,0.12)', 'rgba(22,40,31,0.80)'], locations: [0, 0.4, 1] },
  court: { colors: ['rgba(22,40,31,0.50)', 'rgba(22,40,31,0.80)', 'rgba(22,40,31,0.94)'], locations: [0, 0.45, 1] },
  card: { colors: ['rgba(22,40,31,0)', 'rgba(22,40,31,0.08)', 'rgba(22,40,31,0.62)'], locations: [0, 0.45, 1] },
  plain: { colors: ['rgba(22,40,31,0)', 'rgba(22,40,31,0)', 'rgba(22,40,31,0)'], locations: [0, 0.5, 1] },
};

// largura / altura de cada foto (usado para ancorar a foto no topo)
const ASPECT: Record<PhotoName, number> = { player: 900 / 1350, clay: 1200 / 800, green: 1200 / 800 };

const DEFAULT_PHOTO: Record<BackdropKind, PhotoName> = { welcome: 'player', auth: 'player', court: 'clay', card: 'clay', plain: 'clay' };

export function PhotoBackdrop({
  kind = 'court',
  photo,
  focus = 'center',
  style,
}: {
  kind?: BackdropKind;
  photo?: PhotoName;
  focus?: 'top' | 'center'; // parte da foto que fica visível ao cortar
  style?: StyleProp<ViewStyle>;
}) {
  const o = OVERLAY[kind];
  // Largura e altura explícitas: sem elas o navegador mostra a foto no tamanho original, sem ajustar.
  // objectPosition/backgroundPosition escolhem a parte da foto que fica visível (só no navegador;
  // no celular a foto fica centralizada).
  const name = photo ?? DEFAULT_PHOTO[kind];
  // focus="top": a foto ocupa a largura toda, ancorada no topo, e o excesso de baixo é cortado
  // (mostra a parte de cima da foto, onde está o rosto e a raquete)
  const { frameW } = useLayout();
  const imgStyle =
    focus === 'top'
      ? { position: 'absolute' as const, top: 0, left: 0, width: frameW, height: frameW / ASPECT[name] }
      : [StyleSheet.absoluteFill, { width: '100%' as const, height: '100%' as const }];
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#16281F', overflow: 'hidden' }, style]}>
      <Image source={PHOTOS[name]} style={imgStyle} resizeMode="cover" />
      <LinearGradient colors={o.colors} locations={o.locations} style={StyleSheet.absoluteFill} />
    </View>
  );
}
