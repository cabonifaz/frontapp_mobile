import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, ImageBackground, Dimensions, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { partidoService } from '../../services/partidoService';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 200;
const AVATAR_SIZE = 90;

export function DetallePartidoScreen({ navigation, route }) {
  const item = route?.params?.partido ?? {};

  console.log('DATOS DEL PARTIDO RECIBIDOS:', item);

  const [cancelando, setCancelando] = useState(false);

  // Formateo seguro de fecha
  const limpiarFecha = (fechaStr) => {
    if (!fechaStr) return '--';
    const str = String(fechaStr);
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    return str;
  };

  // Formateo seguro de hora
  const limpiarHora = (horaStr) => {
    if (!horaStr) return '--';
    const str = String(horaStr).trim();
    if (str.includes('T')) return str.split('T')[1].substring(0, 5);
    return str.length > 5 ? str.substring(0, 5) : str;
  };

  const rival = {
    name:    item.nombre_rival ?? item.rival_nombre ?? item.name ?? item.contrincante ?? 'Rival',
    ranking: item.ranking_rival ?? item.rankingRival ?? item.ranking ?? '--',
    pts:     item.puntos_rival ?? item.puntosRival ?? item.pts ?? 0,
    avatar:  item.foto_rival ?? item.avatar_rival ?? item.avatar ?? 'https://i.pravatar.cc/150?img=17',
  };

  const yo = {
    name:    item.nombre_yo ?? item.usuario_nombre ?? item.name_yo ?? 'Tú',
    ranking: item.ranking_yo ?? item.rankingYo ?? '--',
    pts:     item.puntos_yo ?? item.puntosYo ?? item.pts_yo ?? 0,
    avatar:  item.foto_yo ?? item.avatar_yo ?? 'https://i.pravatar.cc/150?img=1',
  };

  const partido = {
    id:       item.id_partido ?? item.id_encuentro ?? item.id ?? null,
    club:     item.nombre_cancha ?? item.lugar ?? item.club ?? item.cancha ?? 'Cancha',
    address:  item.direccion_cancha ?? item.address ?? item.direccion ?? '',
    date:     limpiarFecha(item.fecha_partido ?? item.fecha ?? item.date),
    time:     limpiarHora(item.hora_partido ?? item.hora ?? item.time),
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

        {/* Dos jugadores */}
        <View style={styles.playersRow}>
          {/* Jugador izquierda (yo) */}
          <View style={styles.playerCol}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: yo.avatar }} style={styles.avatar} />
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={11} color={colors.primary} />
                <Text style={styles.rankBadgeText}> {yo.ranking}</Text>
              </View>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{String(yo.name || 'Tú').split(' ')[0]}</Text>
            <Text style={styles.playerPts}>{yo.pts} pts</Text>
          </View>

          <Text style={styles.vsLabel}>vs</Text>

          {/* Rival (derecha) */}
          <View style={styles.playerCol}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: rival.avatar }} style={styles.avatar} />
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={11} color={colors.primary} />
                <Text style={styles.rankBadgeText}> {rival.ranking}</Text>
              </View>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{String(rival.name || 'Rival').split(' ')[0]}</Text>
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

        {/* Botón de Chat */}
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => navigation.navigate('MatchChat', { partidoId: partido.id, rivalName: rival.name })}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.chatBtnText}>Abrir Chat del Partido</Text>
        </TouchableOpacity>

        {/* Botones */}
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => navigation.navigate('Chat', { idPartido: partido.id, rival })}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
          <Text style={styles.chatBtnText}>Chat con rival</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelar} disabled={cancelando}>
          <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.cancelBtnText}>{cancelando ? 'Cancelando...' : 'Cancelar partido'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resultadosBtn}
          onPress={() => navigation.navigate('ColocarResultados', { partido: { ...rival, ...partido } })}
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
    justifyContent: 'center', // Corregido de 'justify' a 'justifyContent'
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