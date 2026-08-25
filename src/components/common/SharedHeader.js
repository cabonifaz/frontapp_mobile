import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';

export const HEADER_BG = colors.dark;

// 1. MAPEO DE TUS IMÁGENES LOCALES
const AVATARES = {
  'avatar_femenino_1.png': require('../../../assets/avatar_femenino_1.png'),
  'avatar_femenino_2.png': require('../../../assets/avatar_femenino_2.png'),
  'avatar_femenino_3.png': require('../../../assets/avatar_femenino_3.png'),
  'avatar_masculino_1.png': require('../../../assets/avatar_masculino_1.png'),
  'avatar_masculino_2.png': require('../../../assets/avatar_masculino_2.png'),
  'avatar_masculino_3.png': require('../../../assets/avatar_masculino_3.png'),
  'avatar_general.png': require('../../../assets/avatar_general.png'),
};

export function SharedHeader({ nombre, deporte, ranking, calificacion, nivel, puntos, fotoPerfil, genero }) {
  
  // Imprimimos en consola para depurar qué está llegando exactamente desde la BD
  console.log("DATOS DE CABECERA -> Nombre:", nombre, "| Género recibido:", genero);

  const obtenerFoto = () => {
    // 1. Si el usuario ya subió una foto real a internet
    if (fotoPerfil && fotoPerfil.startsWith('http')) return { uri: fotoPerfil };
    
    // 2. Si la base de datos guardó el nombre exacto del archivo
    if (fotoPerfil && AVATARES[fotoPerfil]) return AVATARES[fotoPerfil];
    
    const cantidadLetras = nombre ? nombre.length : 0;
    
    const masculinos = [
      AVATARES['avatar_masculino_1.png'],
      AVATARES['avatar_masculino_2.png'],
      AVATARES['avatar_masculino_3.png']
    ];
    
    const femeninos = [
      AVATARES['avatar_femenino_1.png'],
      AVATARES['avatar_femenino_2.png'],
      AVATARES['avatar_femenino_3.png']
    ];

    // Normalizamos el texto
    const gen = genero ? String(genero).trim().toLowerCase() : '';

    if (gen === 'm' || gen === 'masculino' || gen === 'hombre' || gen === '1') {
      return masculinos[cantidadLetras % 3];
    }
    
    if (gen === 'f' || gen === 'femenino' || gen === 'mujer' || gen === '2') {
      return femeninos[cantidadLetras % 3];
    }
    
    // CORRECCIÓN: Si la BD aún no manda el género, por defecto usamos los MASCULINOS 
    // para evitar que te muestre un avatar de mujer por error.
    return masculinos[cantidadLetras % 3];
  };

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Image
          source={obtenerFoto()}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.sport}>{deporte ?? 'Frontón'}</Text>
          <Text style={styles.name}>Hola {nombre ?? '...'}</Text>
          <View style={styles.statsRow}>
            <Ionicons name="trophy" size={14} color="#DDDDDD" />
            <Text style={styles.statText}> {ranking ?? 'N/R'}</Text>
            <Text style={{ width: 12 }} />
            <Ionicons name="star" size={14} color="#DDDDDD" />
            <Text style={styles.statText}> {calificacion != null ? Number(calificacion).toFixed(1) : '0.0'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightBadge}>
        <View style={styles.levelCircle}>
          <Text style={styles.levelNum}>{nivel ?? '--'}</Text>
        </View>
        <Text style={styles.ptsLabel}>{puntos != null ? `${puntos} pts` : '-- pts'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: HEADER_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#333',
  },
  sport: {
    fontSize: 12,
    color: '#DDDDDD',
    marginBottom: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#DDDDDD',
  },
  rightBadge: {
    alignItems: 'center',
  },
  levelCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: colors.accent,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ptsLabel: {
    fontSize: 11,
    color: '#DDDDDD',
    marginTop: 4,
  },
});