import React from 'react';
import { Image } from 'react-native';

// Colores de la marca Ranked (medidos del logo oficial)
export const RANKED_LIME = '#ABEE38';
export const RANKED_NAVY = '#0D111D';

// Proporción ancho/alto de assets/ranked-logo.png
const PROPORCION = 5.028;

/**
 * Logo completo "RANKED" (letras blancas + barras verdes, fondo transparente).
 * Pensado para fondos oscuros (login, pantalla de carga).
 * `size` controla la altura de las letras; el ancho se calcula solo.
 */
export function RankedLogo({ size = 40 }) {
  const alto = size * 1.25;          // incluye las barras sobre la K
  return (
    <Image
      source={require('../../../assets/ranked-logo.png')}
      style={{ width: alto * PROPORCION, height: alto }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Ranked"
    />
  );
}