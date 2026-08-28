import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, ImageBackground, Dimensions, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { partidoService } from '../../services/partidoService';
import { authService } from '../../services/authService'; // para saber quién está logueado

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 200;
const AVATAR_SIZE = 90;

// A. Avatares vinculados en assets/
const AVATARES_LOCALES = {
  avatar_general:     require('../../../assets/avatar_general.png'),
  avatar_masculino_1: require('../../../assets/avatar_masculino_1.png'),
  avatar_masculino_2: require('../../../assets/avatar_masculino_2.png'),
  avatar_masculino_3: require('../../../assets/avatar_masculino_3.png'),
  avatar_femenino_1:  require('../../../assets/avatar_femenino_1.png'),
  avatar_femenino_2:  require('../../../assets/avatar_femenino_2.png'),
  avatar_femenino_3:  require('../../../assets/avatar_femenino_3.png'),
};

// Lista de avatares por defecto para alternar
const AVATARES_DEFECTO = [
  AVATARES_LOCALES.avatar_masculino_1,
  AVATARES_LOCALES.avatar_masculino_2,
  AVATARES_LOCALES.avatar_masculino_3,
  AVATARES_LOCALES.avatar_femenino_1,
  AVATARES_LOCALES.avatar_femenino_2,
];

const obtenerFuenteImagen = (foto, nombre = '') => {
  // 1. Si tiene foto subida a Cloudinary
  if (foto && (foto.startsWith('http://') || foto.startsWith('https://'))) {
    return { uri: foto };
  }

  // 2. Si tiene asignado un avatar específico en BD
  if (foto && AVATARES_LOCALES[foto]) {
    return AVATARES_LOCALES[foto];
  }

  // 3. Si no tiene ninguna foto, usamos el avatar general (morado)
  // para mantener consistencia absoluta con la pantalla de perfil.
  return AVATARES_LOCALES.avatar_general;
};

export function DetallePartidoScreen({ navigation, route }) {
  const itemInicial = route?.params?.partido ?? {};
  const [item, setItem] = useState(itemInicial);
  const [cargando, setCargando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [usuarioActualId, setUsuarioActualId] = useState(null);

  const partidoId = itemInicial.id_partido ?? itemInicial.id_encuentro ?? itemInicial.id;

  useEffect(() => {
    async function obtenerIdUsuario() {
      try {
        const id = await authService.getUserId();
        setUsuarioActualId(id);
      } catch (e) {
        console.log('Error al obtener ID del usuario actual:', e);
      }
    }
    obtenerIdUsuario();
  }, []);

  useEffect(() => {
    async function cargarDetalle() {
      if (!partidoId) return;
      try {
        setCargando(true);
        const res = await partidoService.obtenerDetalle(partidoId);
        const data = res?.data ?? res;
        console.log('📌 DATOS DEL PARTIDO RECIBIDOS:', data);
        if (data && typeof data === 'object') {
          setItem((prev) => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.log('Error al obtener detalle del partido:', error);
      } finally {
        setCargando(false);
      }
    }
    cargarDetalle();
  }, [partidoId]);

  const limpiarFecha = (fechaStr) => {
    if (!fechaStr) return '--';
    const str = String(fechaStr).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    return str;
  };

  const limpiarHora = (horaStr) => {
    if (!horaStr) return '--';
    const str = String(horaStr).trim();
    if (str.includes('T')) return str.split('T')[1].substring(0, 5);
    return str.length > 5 ? str.substring(0, 5) : str;
  };

  // Identificamos al creador con el campo real de la BD
  const idCreador = item.id_creador ?? item.id_usuario_creador;

  const esMiCreacion =
    idParticipante != null && usuarioActualId != null
      ? Number(usuarioActualId) !== Number(idParticipante)
      : false;

  // Datos "en bruto" de cada rol del partido
  const datosCreador = {
    id:      idCreador,
    name:    item.creador ?? item.nombre_yo ?? 'Creador',
    ranking: item.ranking_creador ?? item.ranking_yo ?? '--',
    pts:     item.puntos_creador ?? item.puntos_yo ?? 0,
    avatar:  item.foto_perfil_url_creador ?? item.foto_yo ?? null,
  };

  // 🟢 CORREGIDO: id y avatar apuntaban a columnas equivocadas del SP actualizado
  const datosParticipante = {
    id:      item.id_usuario_rival ?? item.id_rival ?? item.id_usuario, // id_usuario queda como fallback legacy
    name:    item.participante ?? item.rival ?? item.nombre_rival ?? 'Participante',
    ranking: item.ranking_rival ?? '--',
    pts:     item.puntos_rival ?? 0,
    // foto_perfil_url en el SP corresponde al CREADOR, no al rival: usar el alias correcto
    avatar:  item.foto_perfil_url_rival ?? item.foto_perfil_url_rival_alt ?? item.foto_rival ?? null,
  };

  // "yo" y "rival" dependen de quién está logueado, no de un orden fijo
  const yo    = esMiCreacion ? datosCreador : datosParticipante;
  const rival = esMiCreacion ? datosParticipante : datosCreador;

  const partido = {
    id:       partidoId,
    club:     item.nombre_cancha ?? item.cancha ?? item.lugar ?? item.club ?? 'Cancha',
    address:  item.direccion_cancha ?? item.direccion ?? '',
    date:     limpiarFecha(item.fecha_partido ?? item.fecha),
    time:     limpiarHora(item.hora_partido ?? item.hora),
    coverUri: item.foto_cancha_url ?? item.coverUri ?? 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
  };

  async function handleCancelar() {
    Alert.alert('Cancelar partido', '¿Seguro que quieres cancelar este partido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive',
        onPress: async () => {
          try {
            setCancelando(true);
            if (partido.id) await partidoService.cancelar(partido.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message ?? 'No se pudo cancelar el partido.');
          } finally {
            setCancelando(false);
          }
        },
      },
    ]);
  }

  if (usuarioActualId === null) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Cover */}
      <ImageBackground source={{ uri: partido.coverUri }} style={styles.cover}>
        <SafeAreaView>
          <View style={styles.coverHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Sheet */}
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        {cargando && <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 12 }} />}

        {/* Dos jugadores */}
        <View style={styles.playersRow}>
          <View style={styles.playerCol}>
            <View style={styles.avatarWrap}>
              <Image source={obtenerFuenteImagen(yo.avatar, yo.name)} style={styles.avatar} />
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={11} color={colors.primary} />
                <Text style={styles.rankBadgeText}> {yo.ranking}</Text>
              </View>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{String(yo.name).split(' ')[0]}</Text>
            <Text style={styles.playerPts}>{yo.pts} pts</Text>
          </View>

          <Text style={styles.vsLabel}>vs</Text>

          <View style={styles.playerCol}>
            <View style={styles.avatarWrap}>
              <Image source={obtenerFuenteImagen(rival.avatar, rival.name)} style={styles.avatar} />
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={11} color={colors.primary} />
                <Text style={styles.rankBadgeText}> {rival.ranking}</Text>
              </View>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{String(rival.name).split(' ')[0]}</Text>
            <Text style={styles.playerPts}>{rival.pts} pts</Text>
          </View>
        </View>

        {/* Detalles */}
        <Text style={styles.sectionTitle}>Detalles del partido</Text>

        <View style={styles.detailCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailMain}>{partido.club}</Text>
            {partido.address ? (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailSub}> {partido.address}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.rowCards}>
          <View style={[styles.detailCard, { flex: 1, marginRight: 10 }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {partido.date}</Text>
          </View>
          <View style={[styles.detailCard, { flex: 1 }]}>
            <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {partido.time}</Text>
          </View>
        </View>

        <Text style={styles.mandatoryNote}>
          Es mandatorio para los competidores colocar los resultados hasta 12 hrs luego del encuentro.
        </Text>

        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => {
            navigation.navigate('MatchChat', {
              idPartido: partido.id,
              rival: {
                name: rival.name,
                avatar: rival.avatar,
              },
            });
          }}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.chatBtnText}>Abrir Chat del Partido</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelar} disabled={cancelando}>
          <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.cancelBtnText}>{cancelando ? 'Cancelando...' : 'Cancelar partido'}</Text>
        </TouchableOpacity>

        {/* 🟢 CORREGIDO: se envía item completo (trae los sets y estado de resultado)
            además de yo/rival ya resueltos, para no depender de adivinar nombres de campo
            del lado de ColocarResultadosScreen */}
        <TouchableOpacity
          style={styles.resultadosBtn}
          onPress={() => navigation.navigate('ColocarResultados', {
            partido: {
              ...item,
              ...partido,
              id_partido: partido.id,
              yo,
              rival,
            },
          })}
        >
          <Ionicons name="trophy-outline" size={20} color={colors.primary} />
          <Text style={styles.resultadosBtnText}>Colocar resultados</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  cover: { width: SCREEN_W, height: COVER_H },
  coverHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
    width: '100%',
  },
  playerCol: { alignItems: 'center', flex: 1 },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#ccc',
    borderWidth: 3, borderColor: colors.background,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  rankBadgeText: { fontSize: 13, fontWeight: 'bold', color: colors.primary },
  vsLabel: {
    fontSize: 18, fontWeight: 'bold', color: colors.textSecondary,
    alignSelf: 'center', marginTop: AVATAR_SIZE / 2 - 10,
  },
  playerName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  playerPts: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: colors.textPrimary,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 10,
    width: '100%',
  },
  rowCards: { flexDirection: 'row', width: '100%' },
  detailMain: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  detailSub: { fontSize: 13, color: colors.textSecondary },
  mandatoryNote: {
    fontSize: 13, color: colors.textSecondary,
    lineHeight: 19, marginBottom: 24,
    alignSelf: 'flex-start',
  },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 30, paddingVertical: 16,
    width: '100%', marginBottom: 12,
  },
  chatBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 30, paddingVertical: 16,
    width: '100%', marginBottom: 12,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  resultadosBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 30, paddingVertical: 18,
    width: '100%',
  },
  resultadosBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});