import Svg, { Line, Rect } from 'react-native-svg';

// Quadra vista de cima, na cor do piso. Faz o papel da foto do serviço (referência LUXE).
const SURFACE: Record<string, string> = { saibro: '#B8603A', 'rápida': '#2F5D7C', rapida: '#2F5D7C', grama: '#3E6B45' };

export function CourtArt({ surface, size = 96 }: { surface: string; size?: number }) {
  const fill = SURFACE[surface.toLowerCase()] ?? '#35523E';
  const w = size;
  const h = size;
  const m = size * 0.14; // margem até a linha de fundo
  const L = { stroke: '#F4F3EC', strokeWidth: 1.6, strokeOpacity: 0.9 };
  return (
    <Svg width={w} height={h}>
      <Rect x={0} y={0} width={w} height={h} rx={14} fill={fill} />
      <Rect x={m} y={m} width={w - 2 * m} height={h - 2 * m} fill="none" {...L} />
      <Line x1={m * 1.6} y1={m} x2={m * 1.6} y2={h - m} {...L} />
      <Line x1={w - m * 1.6} y1={m} x2={w - m * 1.6} y2={h - m} {...L} />
      <Line x1={m} y1={h / 2} x2={w - m} y2={h / 2} stroke="#F4F3EC" strokeWidth={2.4} />
      <Line x1={m * 1.6} y1={h * 0.32} x2={w - m * 1.6} y2={h * 0.32} {...L} />
      <Line x1={m * 1.6} y1={h * 0.68} x2={w - m * 1.6} y2={h * 0.68} {...L} />
      <Line x1={w / 2} y1={h * 0.32} x2={w / 2} y2={h * 0.68} {...L} />
    </Svg>
  );
}
