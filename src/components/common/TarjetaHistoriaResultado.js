// NUEVO (043): tarjeta para compartir un resultado en historias de Instagram.
// Se dibuja fuera de la pantalla a 360x640 (proporción 9:16) y se captura a 1080x1920.
import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { RankedLogo, RANKED_LIME, RANKED_NAVY } from './RankedLogo';
import { getAvatarSource } from '../../utils/avatars';

export const HISTORIA_ANCHO = 360;
export const HISTORIA_ALTO = 640;

function Lado({ foto, foto2, nombre, esDobles, ganador, onImagenLista }) {
  return (
    <View style={styles.lado}>
      <View style={styles.avatares}>
        <Image
          source={getAvatarSource(foto)}
          style={[styles.avatar, ganador && styles.avatarGanador]}
          onLoadEnd={onImagenLista}
        />
        {esDobles && (
          <Image
            source={getAvatarSource(foto2)}
            style={[styles.avatar, styles.avatarPareja, ganador && styles.avatarGanador]}
            onLoadEnd={onImagenLista}
          />
        )}
      </View>
      <Text style={[styles.nombre, ganador && styles.nombreGanador]} numberOfLines={2}>{nombre}</Text>
    </View>
  );
}

/**
 * props:
 *  yo / rival: { nombre, foto, foto2 }
 *  setsYo, setsRival, sets: [[mio, rival], ...]
 *  fecha (texto ya formateado), tipo (texto), fondo (url de foto del encuentro o null)
 *  textos: { gane, perdi, final } (ya traducidos)
 *  onImagenLista: se llama cada vez que termina de cargar una imagen
 */
export const TarjetaHistoriaResultado = forwardRef(function TarjetaHistoriaResultado(
  { yo, rival, setsYo, setsRival, sets, fecha, tipo, esDobles, fondo, textos, onImagenLista },
  ref,
) {
  const gane = Number(setsYo) > Number(setsRival);
  const perdi = Number(setsYo) < Number(setsRival);

  return (
    <View ref={ref} collapsable={false} style={styles.tarjeta}>
      {fondo ? (
        <>
          <Image source={{ uri: fondo }} style={StyleSheet.absoluteFill} resizeMode="cover" onLoadEnd={onImagenLista} />
          <View style={[StyleSheet.absoluteFill, styles.velo]} />
        </>
      ) : (
        <View style={styles.franja} />
      )}

      <View style={styles.cabecera}>
        <RankedLogo size={26} />
      </View>

      <View style={styles.centro}>
        {(gane || perdi) && (
          <View style={[styles.chip, gane ? styles.chipGane : styles.chipPerdi]}>
            <Text style={[styles.chipTexto, gane && { color: RANKED_NAVY }]}>
              {gane ? textos.gane : textos.perdi}
            </Text>
          </View>
        )}

        <View style={styles.jugadores}>
          <Lado {...yo} esDobles={esDobles} ganador={gane} onImagenLista={onImagenLista} />
          <Text style={styles.vs}>VS</Text>
          <Lado {...rival} esDobles={esDobles} ganador={perdi} onImagenLista={onImagenLista} />
        </View>

        <Text style={styles.etiquetaFinal}>{textos.final}</Text>
        <View style={styles.marcador}>
          <Text style={[styles.marcadorNum, gane && styles.marcadorLima]}>{setsYo}</Text>
          <Text style={styles.marcadorSep}>–</Text>
          <Text style={[styles.marcadorNum, perdi && styles.marcadorLima]}>{setsRival}</Text>
        </View>

        {sets.length > 0 && (
          <View style={styles.setsFila}>
            {sets.map(([a, b], i) => (
              <View key={i} style={styles.setCaja}>
                <Text style={styles.setTexto}>{a ?? '-'}-{b ?? '-'}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.pie}>
        <Text style={styles.pieTexto}>{[tipo, fecha].filter(Boolean).join('  ·  ')}</Text>
        <View style={styles.pieLinea} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  tarjeta: {
    width: HISTORIA_ANCHO, height: HISTORIA_ALTO, backgroundColor: RANKED_NAVY,
    overflow: 'hidden', justifyContent: 'space-between',
  },
  velo: { backgroundColor: 'rgba(13,17,29,0.72)' },
  franja: {
    position: 'absolute', width: 520, height: 120, top: 150, left: -80,
    backgroundColor: RANKED_LIME, opacity: 0.08, transform: [{ rotate: '-18deg' }],
  },

  cabecera: { alignItems: 'center', paddingTop: 48 },

  centro: { alignItems: 'center', paddingHorizontal: 20 },
  chip: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 22 },
  chipGane: { backgroundColor: RANKED_LIME },
  chipPerdi: { borderWidth: 1.5, borderColor: '#FFFFFF' },
  chipTexto: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },

  jugadores: { flexDirection: 'row', alignItems: 'flex-start', width: '100%' },
  lado: { flex: 1, alignItems: 'center' },
  avatares: { flexDirection: 'row', marginBottom: 10 },
  avatar: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)', backgroundColor: '#1E2433',
  },
  avatarPareja: { marginLeft: -22 },
  avatarGanador: { borderColor: RANKED_LIME },
  nombre: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  nombreGanador: { fontWeight: '900' },
  vs: { color: 'rgba(255,255,255,0.55)', fontSize: 16, fontWeight: '900', marginTop: 28 },

  etiquetaFinal: {
    color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800',
    letterSpacing: 2, marginTop: 34,
  },
  marcador: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  marcadorNum: { color: '#FFFFFF', fontSize: 84, fontWeight: '900' },
  marcadorLima: { color: RANKED_LIME },
  marcadorSep: { color: 'rgba(255,255,255,0.5)', fontSize: 56, fontWeight: '300', marginHorizontal: 14 },

  setsFila: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 },
  setCaja: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  setTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  pie: { alignItems: 'center', paddingBottom: 44 },
  pieTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  pieLinea: { width: 40, height: 4, borderRadius: 2, backgroundColor: RANKED_LIME, marginTop: 12 },
});
