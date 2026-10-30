// Guarda a foto escolhida até a tela de ajuste abrir. No navegador a imagem vem
// como data: URI (pode ter vários MB), grande demais para ir como parâmetro de rota.
export type PendingImage = { uri: string; width: number; height: number };

let pending: PendingImage | null = null;

export function setPendingImage(img: PendingImage) {
  pending = img;
}

export function takePendingImage(): PendingImage | null {
  const img = pending;
  pending = null;
  return img;
}
