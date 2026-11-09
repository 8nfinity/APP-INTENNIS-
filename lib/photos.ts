// Fotos do clube (jogador sacando, quadras de saibro, etc.).
// Enquanto uma foto não for configurada aqui, o app mostra uma ilustração no lugar.
// Para usar uma foto: suba o arquivo (Supabase Storage, bucket público) e cole a URL abaixo.
export const PHOTOS: {
  welcome: string | null; // tela de entrada (jogador sacando na quadra de saibro)
  court: string | null; // fundo da tela de reservas e foto das quadras
  event: string | null; // foto padrão dos eventos
} = {
  welcome: null,
  court: null,
  event: null,
};
