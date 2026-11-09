// Fotos do clube, usadas nas telas (jogador sacando, quadra de saibro, quadra rápida).
// Para trocar uma foto, substitua o arquivo em assets/images mantendo o mesmo nome.
export const PHOTOS = {
  player: require('../assets/images/photo-player.jpg'),
  clay: require('../assets/images/photo-clay.jpg'),
  green: require('../assets/images/photo-green.jpg'),
};

export type PhotoName = keyof typeof PHOTOS;

// Qual foto combina com o piso da quadra ("Saibro" = terra batida, "Rápida" = piso verde)
export const photoForSurface = (surface?: string): PhotoName => (/r[aá]pida|dura|sint/i.test(surface ?? '') ? 'green' : 'clay');
