import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../constants';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// 'YYYY-MM-DD' o 'YYYY-MM-DDT00:00:00' → Date local (sin desfase de zona horaria)
export function parseFecha(valor) {
  if (!valor) return null;
  const [y, m, d] = String(valor).split('T')[0].split('-').map(n => parseInt(n, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function isoFecha(valor) {
  return valor ? String(valor).split('T')[0] : null;
}

export function formatFechaCorta(valor) {
  const d = parseFecha(valor);
  return d ? `${d.getDate()} ${MESES[d.getMonth()]}` : '--';
}

export function formatRangoFechas(inicio, fin) {
  if (!inicio) return 'Fechas por anunciar';
  if (!fin) return `Desde el ${formatFechaCorta(inicio)}`;
  return `${formatFechaCorta(inicio)} al ${formatFechaCorta(fin)}`;
}

export function formatHora(hora) {
  return hora ? String(hora).substring(0, 5) : '--';
}

export function formatMoneda(monto, moneda = 'PEN') {
  const n = Number(monto ?? 0);
  if (n <= 0) return 'Gratis';
  const simbolo = moneda === 'PEN' ? 'S/' : moneda === 'USD' ? 'US$' : moneda;
  return `${simbolo} ${n.toFixed(2)}`;
}

export function formatPuntos(p) {
  const n = Number(p ?? 0);
  return n > 0 ? `+${n}` : `${n}`;
}

// Motivos que devuelve sp_liga_tabla (motivo_bloqueo)
export const MOTIVOS_BLOQUEO = {
  OK:                { corto: null,              largo: null },
  ES_USTED:          { corto: 'Tú',              largo: null },
  NO_INSCRITO:       { corto: 'Inscríbete',      largo: 'Necesitas una inscripción activa en esta liga para retar.' },
  RIVAL_NO_INSCRITO: { corto: 'No disponible',   largo: 'Este jugador no está activo en la liga.' },
  LIGA_NO_EN_CURSO:  { corto: 'Sin empezar',     largo: 'La liga todavía no está en curso.' },
  MINIMO_JUGADORES:  { corto: 'Faltan jugadores', largo: 'La liga empieza cuando se alcance el mínimo de jugadores inscritos.' },
  RETO_EN_CURSO:     { corto: 'Reto activo',     largo: 'Ya tienen un reto pendiente o un partido por jugar. Termínalo antes de volver a retarlo.' },
  FUERA_DE_RANGO:    { corto: 'Fuera de rango',  largo: 'Solo puedes retar a jugadores cercanos a tu posición en la tabla.' },
};

// Logo del auspiciador dentro de un recuadro blanco.
// - size: alto del recuadro; width: ancho (para logos horizontales, por defecto = size)
// - Si no hay logo o la imagen no carga, muestra las iniciales de la marca.
export function SponsorLogo({ nombre, logoUrl, size = 28, width, dark = false }) {
  const [fallo, setFallo] = useState(false);
  useEffect(() => { setFallo(false); }, [logoUrl]);
  const ancho = width ?? size;

  if (logoUrl && !fallo) {
    return (
      <View style={[stylesLogo.tile, { width: ancho, height: size, padding: Math.max(3, Math.round(size * 0.1)) }]}>
        <Image
          source={{ uri: logoUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
          onError={() => setFallo(true)}
        />
      </View>
    );
  }
  const iniciales = String(nombre ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
  return (
    <View
      style={[
        stylesLogo.fallback,
        { width: ancho, height: size, backgroundColor: dark ? 'rgba(255,255,255,0.15)' : colors.dark },
      ]}
    >
      <Text style={[stylesLogo.fallbackText, { fontSize: size * 0.38 }]}>{iniciales}</Text>
    </View>
  );
}

const stylesLogo = StyleSheet.create({
  tile: { borderRadius: 8, backgroundColor: '#FFFFFF', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  fallback: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: '#FFFFFF', fontWeight: '800' },
});