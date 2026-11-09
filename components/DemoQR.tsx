import Svg, { Rect } from 'react-native-svg';

import { colors } from '@/lib/theme';

// QR code ilustrativo (o pagamento ainda é de demonstração). Gerado a partir do id da
// reserva, só para a tela ficar completa. NÃO é um código de pagamento real.
export function DemoQR({ seed, size = 132 }: { seed: string; size?: number }) {
  const N = 21;
  let h = 7;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 2147483647;
  const rnd = () => {
    h = (h * 48271) % 2147483647;
    return h / 2147483647;
  };
  const finder = (x: number, y: number) => x < 8 && y < 8 ? true : x > N - 9 && y < 8 ? true : x < 8 && y > N - 9 ? true : false;
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && rnd() > 0.52) cells.push({ x, y });
  const c = size / N;
  const eye = (x: number, y: number) => (
    <>
      <Rect x={x * c} y={y * c} width={7 * c} height={7 * c} fill={colors.forest} />
      <Rect x={(x + 1) * c} y={(y + 1) * c} width={5 * c} height={5 * c} fill="#fff" />
      <Rect x={(x + 2) * c} y={(y + 2) * c} width={3 * c} height={3 * c} fill={colors.forest} />
    </>
  );
  return (
    <Svg width={size} height={size}>
      <Rect width={size} height={size} fill="#fff" />
      {cells.map((k) => (
        <Rect key={`${k.x}-${k.y}`} x={k.x * c} y={k.y * c} width={c} height={c} fill={colors.forest} />
      ))}
      {eye(0, 0)}
      {eye(N - 7, 0)}
      {eye(0, N - 7)}
    </Svg>
  );
}
