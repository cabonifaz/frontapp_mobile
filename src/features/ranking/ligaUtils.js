import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import i18n from '../../i18n';
import { colors } from '../../constants';

// NUEVO (idiomas): meses según el idioma elegido
const MESES = () => i18n.t('fechas.mesesAbrev', { returnObjects: true });

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
  return d ? `${d.getDate()} ${MESES()[d.getMonth()]}` : '--';
}

export function formatRangoFechas(inicio, fin) {
  if (!inicio) return i18n.t('fechasLiga.porAnunciar');
  if (!fin) return i18n.t('fechasLiga.desde', { fecha: formatFechaCorta(inicio) });
  return i18n.t('fechasLiga.rango', { inicio: formatFechaCorta(inicio), fin: formatFechaCorta(fin) });
}

export function formatHora(hora) {
  return hora ? String(hora).substring(0, 5) : '--';
}

export function formatMoneda(monto, moneda = 'PEN') {
  const n = Number(monto ?? 0);
  if (n <= 0) return i18n.t('fechasLiga.gratis');
  const simbolo = moneda === 'PEN' ? 'S/' : moneda === 'USD' ? 'US$' : moneda;
  return `${simbolo} ${n.toFixed(2)}`;
}

export function formatPuntos(p) {
  const n = Number(p ?? 0);
  return n > 0 ? `+${n}` : `${n}`;
}

// Motivos que devuelve sp_liga_tabla (motivo_bloqueo).
// NUEVO (idiomas): los códigos del backend no cambian; cada uno apunta a sus textos
// traducidos (motivos.<clave> y motivos.<clave>_largo).
export const MOTIVOS_BLOQUEO = {
  OK:                { clave: null,                largo: false },
  ES_USTED:          { clave: 'es_usted',          largo: false },
  NO_INSCRITO:       { clave: 'no_inscrito',       largo: true },
  RIVAL_NO_INSCRITO: { clave: 'rival_no_inscrito', largo: true },
  LIGA_NO_EN_CURSO:  { clave: 'liga_no_en_curso',  largo: true },
  MINIMO_JUGADORES:  { clave: 'minimo_jugadores',  largo: true },
  RETO_EN_CURSO:     { clave: 'reto_en_curso',     largo: true },
  FUERA_DE_RANGO:    { clave: 'fuera_de_rango',    largo: true },
};

// Devuelve { corto, largo } ya traducidos para un código de motivo_bloqueo
export function motivoBloqueo(codigo) {
  const m = MOTIVOS_BLOQUEO[codigo];
  if (!m) return { corto: i18n.t('motivos.bloqueado'), largo: null };
  if (!m.clave) return { corto: null, largo: null };
  return {
    corto: i18n.t(`motivos.${m.clave}`),
    largo: m.largo ? i18n.t(`motivos.${m.clave}_largo`) : null,
  };
}

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