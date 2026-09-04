import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, ImageBackground, Dimensions, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { claseService } from '../../services/claseService';
import { getAvatarSource } from '../../utils/avatars';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 200;
const AVATAR_SIZE = 110;

const COVER_DEFAULT = 'https://images.unsplash.com/photo-1495555961986-b22e827a8f31?w=800&q=80';

function PuntosScreen({ onVolver }) {
  return (
    <View style={styles.puntosContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.puntosCircle}>
          <Ionicons name="star" size={72} color={colors.accent} />
        </View>
        <Text style={styles.puntosTitle}>¡Genial!</Text>
        <Text style={styles.puntosSubtitle}>
          Has ganado <Text style={styles.puntosNum}>100 pts.</Text>
        </Text>
        <Text style={styles.puntosNote}>
          Completa más clases o juega más partidas para ganar más.
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onVolver}>
        <Text style={styles.accentBtnText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

export function DetalleClaseScreen({ navigation, route }) {
  const claseParams = route?.params?.clase ?? {};
  const idClase = claseParams.id_clase ?? claseParams.id_encuentro ?? claseParams.id ?? null;

  const [detalle, setDetalle] = useState(null);
  const [idUsuarioActual, setIdUsuarioActual] = useState(null);
  const [completada, setCompletada] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [completando, setCompletando] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('id_usuario').then(id => setIdUsuarioActual(Number(id)));
  }, []);

  useEffect(() => {
    if (!idClase) return;
    claseService.detalle(idClase)
      .then(res => { if (res) setDetalle(res); })
      .catch(() => {});
  }, [idClase]);

  const d = detalle ?? claseParams;

  // Determinar si soy alumno o profesor (null = aún cargando, no mostrar botones)
  const soyAlumno = idUsuarioActual != null && d.id_alumno != null
    ? Number(d.id_alumno) === idUsuarioActual
    : null;

  // Datos del "otro" participante
  const nombreOtro = soyAlumno
    ? (d.nombre_profesor ?? d.nombre_rival ?? d.rival ?? 'Profesor')
    : (d.nombre_alumno  ?? d.nombre_rival ?? d.rival ?? 'Alumno');

  const fotoOtro = soyAlumno
    ? (d.foto_profesor ?? d.foto_perfil_url_rival ?? null)
    : (d.foto_alumno   ?? d.foto_perfil_url_rival ?? null);

  const rankingOtro = soyAlumno
    ? (d.ranking_profesor ?? d.ranking_rival ?? '--')
    : (d.ranking_alumno   ?? d.ranking_rival ?? '--');

  const nombreCancha  = d.nombre_cancha ?? d.lugar ?? 'Cancha';
  const direccion     = d.descripcion   ?? d.direccion ?? d.address ?? '';
  const fecha         = d.fecha_clase   ?? d.fecha_partido ?? d.fecha ?? '--';
  const hora          = typeof (d.hora_clase ?? d.hora_partido ?? d.hora) === 'string'
    ? (d.hora_clase ?? d.hora_partido ?? d.hora ?? '--').substring(0, 5)
    : '--';
  const coverUri      = d.foto_cancha_url ?? COVER_DEFAULT;

  function formatFecha(f) {
    if (!f || f === '--') return '--';
    const [year, month, day] = (f.split('T')[0]).split('-').map(Number);
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${day} ${months[month - 1]} ${year}`;
  }

  async function handleCancelar() {
    Alert.alert('Cancelar clase', '¿Seguro que quieres cancelar esta clase?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive',
        onPress: async () => {
          try {
            setCancelando(true);
            if (idClase) await claseService.cancelar(idClase);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message ?? 'No se pudo cancelar la clase.');
          } finally {
            setCancelando(false);
          }
        },
      },
    ]);
  }

  async function handleCompletar() {
    try {
      setCompletando(true);
      if (idClase) await claseService.completar(idClase);
      setCompletada(true);
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo marcar la clase como completada.');
    } finally {
      setCompletando(false);
    }
  }

  function handleChatear() {
    navigation.navigate('MatchChat', {
      idClase,
      rival: {
        name:   nombreOtro,
        avatar: fotoOtro,
      },
    });
  }

  if (completada) {
    return (
      <SafeAreaView style={styles.safe}>
        <PuntosScreen onVolver={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: coverUri }} style={styles.cover}>
        <SafeAreaView>
          <View style={styles.coverHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            {/* Botón de chat en la esquina superior derecha */}
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={handleChatear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <View style={styles.sheet}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Image source={getAvatarSource(fotoOtro)} style={styles.avatar} />
          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={13} color={colors.primary} />
            <Text style={styles.rankBadgeText}> {rankingOtro}</Text>
          </View>
        </View>

        <Text style={styles.name}>{nombreOtro}</Text>
        {soyAlumno !== null && (
          <Text style={styles.role}>{soyAlumno ? 'Profesor' : 'Alumno'}</Text>
        )}

        <Text style={styles.sectionTitle}>Detalles de la clase</Text>

        <View style={styles.detailCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailMain}>{nombreCancha}</Text>
            {!!direccion && (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailSub}> {direccion}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rowCards}>
          <View style={[styles.detailCard, { flex: 1, marginRight: 10 }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {formatFecha(fecha)}</Text>
          </View>
          <View style={[styles.detailCard, { flex: 1 }]}>
            <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {hora}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelar} disabled={cancelando}>
          <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.cancelBtnText}>{cancelando ? 'Cancelando...' : 'Cancelar clase'}</Text>
        </TouchableOpacity>

        {soyAlumno === false && (
          <TouchableOpacity style={styles.completadaBtn} onPress={handleCompletar} disabled={completando}>
            <Ionicons name="checkmark" size={20} color={colors.primary} />
            <Text style={styles.completadaBtnText}>{completando ? 'Guardando...' : 'Clase completada'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: colors.background },
  cover: { width: SCREEN_W, height: COVER_H },
  coverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  chatBtn: {
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
    paddingHorizontal: 20,
    paddingTop: AVATAR_SIZE / 2 + 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'absolute',
    top: -(AVATAR_SIZE / 2),
    alignSelf: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: colors.background,
    backgroundColor: '#ccc',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 8,
  },
  rankBadgeText: { fontSize: 15, fontWeight: 'bold', color: colors.primary },

  name: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 8, marginBottom: 2 },
  role: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },

  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: colors.textPrimary,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  detailCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, gap: 10, marginBottom: 10, width: '100%',
  },
  rowCards: { flexDirection: 'row', width: '100%' },
  detailMain: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  detailSub: { fontSize: 13, color: colors.textSecondary },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 30, paddingVertical: 16, width: '100%', marginBottom: 12,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  completadaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.accent,
    borderRadius: 30, paddingVertical: 18, width: '100%',
  },
  completadaBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },

  puntosContainer: { flex: 1, paddingHorizontal: 32, paddingBottom: 40, paddingTop: 20 },
  puntosCircle: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#FFF8DC', alignItems: 'center',
    justifyContent: 'center', marginBottom: 32,
  },
  puntosTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  puntosSubtitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  puntosNum: { color: colors.accent },
  puntosNote: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  accentBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center' },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
