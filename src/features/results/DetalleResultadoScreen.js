import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../../constants';
import { resultadoService } from '../../services/resultadoService';
import { getAvatarSource } from '../../utils/avatars';

function formatFecha(dateStr) {
  if (!dateStr) return '--';
  const [year, month, day] = (dateStr.split('T')[0]).split('-').map(Number);
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${day} ${months[month - 1]} ${year}`;
}

function RankingBadge({ ranking }) {
  if (ranking == null) return null;
  return (
    <View style={styles.rankBadge}>
      <Ionicons name="trophy" size={13} color={colors.primary} />
      <Text style={styles.rankBadgeText}> {ranking}</Text>
    </View>
  );
}

export function DetalleResultadoScreen({ navigation, route }) {
  const { match } = route.params ?? {};
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Resultados');
  const [idUsuarioActual, setIdUsuarioActual] = useState(null);

  useEffect(() => {
    SecureStore.getItemAsync('id_usuario').then(id => setIdUsuarioActual(Number(id)));
  }, []);

  useEffect(() => {
    if (!match?.id_partido) { setLoading(false); return; }
    resultadoService.detalle(match.id_partido)
      .then(res => setDetalle(res ?? null))
      .catch(() => setDetalle(null))
      .finally(() => setLoading(false));
  }, [match?.id_partido]);

  const d = detalle ?? match ?? {};

  // Si el usuario logueado es el visitante, intercambiamos los lados
  const soyVisitante = idUsuarioActual != null &&
    d.id_jugador_local != null &&
    Number(d.id_jugador_local) !== idUsuarioActual;

  const jugadorYo     = soyVisitante ? (d.jugador_visitante ?? 'Jugador 2') : (d.jugador_local     ?? 'Jugador 1');
  const jugadorRival  = soyVisitante ? (d.jugador_local     ?? 'Jugador 1') : (d.jugador_visitante ?? 'Jugador 2');
  const fotoYo        = soyVisitante ? (d.foto_visitante    ?? null)        : (d.foto_local        ?? null);
  const fotoRival     = soyVisitante ? (d.foto_local        ?? null)        : (d.foto_visitante    ?? null);
  const puntosYo      = soyVisitante ? (d.puntos_visitante  ?? '--')        : (d.puntos_local      ?? '--');
  const puntosRival   = soyVisitante ? (d.puntos_local      ?? '--')        : (d.puntos_visitante  ?? '--');
  const rankingYo     = soyVisitante ? (d.ranking_visitante ?? null)        : (d.ranking_local     ?? null);
  const rankingRival  = soyVisitante ? (d.ranking_local     ?? null)        : (d.ranking_visitante ?? null);

  const jugadorLocal     = jugadorYo;
  const jugadorVisitante = jugadorRival;
  const fotoLocal        = fotoYo;
  const fotoVisitante    = fotoRival;
  const puntosLocal      = puntosYo;
  const puntosVisitante  = puntosRival;
  const rankingLocal     = rankingYo;
  const rankingVisitante = rankingRival;

  const sets = soyVisitante ? [
    [d.set1_visitante ?? match?.set1_visitante, d.set1_local ?? match?.set1_local],
    [d.set2_visitante ?? match?.set2_visitante, d.set2_local ?? match?.set2_local],
    [d.set3_visitante ?? match?.set3_visitante, d.set3_local ?? match?.set3_local],
  ].filter(([l, v]) => l != null || v != null) : [
    [d.set1_local ?? match?.set1_local, d.set1_visitante ?? match?.set1_visitante],
    [d.set2_local ?? match?.set2_local, d.set2_visitante ?? match?.set2_visitante],
    [d.set3_local ?? match?.set3_local, d.set3_visitante ?? match?.set3_visitante],
  ].filter(([l, v]) => l != null || v != null);

  const setsLocal      = soyVisitante ? (d.sets_visitante ?? match?.sets_visitante ?? 0) : (d.sets_local     ?? match?.sets_local     ?? 0);
  const setsVisitante  = soyVisitante ? (d.sets_local     ?? match?.sets_local     ?? 0) : (d.sets_visitante ?? match?.sets_visitante ?? 0);

  // Iniciales para el nombre abreviado (R. Pino)
  function abreviar(nombre) {
    if (!nombre) return '';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0];
    return `${partes[0][0]}. ${partes.slice(1).join(' ')}`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.playersRow}>
          {/* Local */}
          <View style={styles.playerCol}>
            <View style={styles.avatarWrap}>
              <Image source={getAvatarSource(fotoLocal)} style={styles.heroAvatar} />
              <RankingBadge ranking={rankingLocal} />
            </View>
            <Text style={styles.heroName}>{abreviar(jugadorLocal)}</Text>
            <Text style={styles.heroPts}>{puntosLocal} pts</Text>
          </View>

          <Text style={styles.vsLabel}>VS</Text>

          {/* Visitante */}
          <View style={styles.playerCol}>
            <View style={styles.avatarWrap}>
              <Image source={getAvatarSource(fotoVisitante)} style={styles.heroAvatar} />
              <RankingBadge ranking={rankingVisitante} />
            </View>
            <Text style={[styles.heroName, styles.heroNameBold]}>{abreviar(jugadorVisitante)}</Text>
            <Text style={styles.heroPts}>{puntosVisitante} pts</Text>
          </View>
        </View>
      </View>

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Tabs */}
        <View style={styles.tabBar}>
          {['Resultados', 'Detalles'].map(t => (
            <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
              {activeTab === t && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {activeTab === 'Resultados' ? (
              <>
                <Text style={styles.sectionTitle}>Resultados</Text>

                {sets.length === 0 ? (
                  <Text style={styles.noDataText}>Sin resultados registrados</Text>
                ) : (
                  sets.map(([l, v], i) => (
                    <View key={i} style={styles.setRow}>
                      <Image source={getAvatarSource(fotoLocal)} style={styles.setAvatar} />
                      <View style={styles.scoreBox}>
                        <Text style={styles.scoreNum}>{l ?? '-'}</Text>
                      </View>
                      <Text style={styles.scoreSep}>:</Text>
                      <View style={styles.scoreBox}>
                        <Text style={styles.scoreNum}>{v ?? '-'}</Text>
                      </View>
                      <Image source={getAvatarSource(fotoVisitante)} style={styles.setAvatar} />
                    </View>
                  ))
                )}

                <Text style={styles.sectionTitle}>Resultado Final</Text>
                <View style={styles.setRow}>
                  <View style={[styles.scoreBox, styles.scoreBoxFinal]}>
                    <Text style={styles.scoreNumFinal}>{setsLocal}</Text>
                  </View>
                  <Text style={styles.scoreSep}>:</Text>
                  <View style={[styles.scoreBox, styles.scoreBoxFinal]}>
                    <Text style={styles.scoreNumFinal}>{setsVisitante}</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Fotos del encuentro */}
                <View style={styles.photosPlaceholder}>
                  <Ionicons name="image-outline" size={36} color={colors.textSecondary} />
                  <Text style={styles.photosPlaceholderText}>Fotos del encuentro</Text>
                </View>

                {/* Comentario */}
                {d.comentario_rival ? (
                  <>
                    <Text style={styles.sectionTitle}>Comentarios</Text>
                    <View style={styles.comentarioCard}>
                      <Image source={getAvatarSource(fotoLocal)} style={styles.comentAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.comentNombre}>{jugadorLocal}</Text>
                        <Text style={styles.comentTexto}>{d.comentario_rival}</Text>
                      </View>
                    </View>
                  </>
                ) : null}

                {/* Detalles del partido */}
                <Text style={styles.sectionTitle}>Detalles del partido</Text>
                <View style={styles.detalleCard}>
                  <Text style={styles.canchaName}>{d.nombre_cancha ?? '--'}</Text>
                  {d.cancha_direccion ? (
                    <View style={styles.detalleRow}>
                      <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
                      <Text style={styles.detalleText}> {d.cancha_direccion}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.detalleMetaRow}>
                  <View style={styles.detalleMetaBox}>
                    <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
                    <Text style={styles.detalleMetaText}>{formatFecha(d.fecha_partido ?? match?.fecha_partido)}</Text>
                  </View>
                  <View style={styles.detalleMetaBox}>
                    <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
                    <Text style={styles.detalleMetaText}>{(d.hora_partido ?? '--').substring(0, 5)}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },

  hero: {
    backgroundColor: colors.dark,
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backBtn: { marginBottom: 12 },

  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerCol: { alignItems: 'center', flex: 1 },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  heroAvatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#FFFFFF',
    backgroundColor: '#555',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: -16,
  },
  rankBadgeText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  heroName: { fontSize: 16, fontWeight: '500', color: '#FFFFFF', marginTop: 4 },
  heroNameBold: { fontWeight: '700' },
  heroPts: { fontSize: 13, color: '#AAAAAA', marginTop: 2 },
  vsLabel: { fontSize: 18, fontWeight: '700', color: '#AAAAAA', marginHorizontal: 8 },

  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 16, position: 'relative' },
  tabText: { fontSize: 16, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: colors.accent, borderRadius: 2,
  },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  sectionTitle: {
    fontSize: 17, fontWeight: 'bold', color: colors.textPrimary,
    marginBottom: 16, marginTop: 8,
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  setAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ccc' },
  scoreBox: {
    width: 52, height: 52,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBoxFinal: { width: 64, height: 64, borderRadius: 12 },
  scoreNum: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  scoreNumFinal: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary },
  scoreSep: { fontSize: 24, fontWeight: 'bold', color: colors.textSecondary },

  noDataText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 20 },

  photosPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  photosPlaceholderText: { fontSize: 14, color: colors.textSecondary },

  comentarioCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  comentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc' },
  comentNombre: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  comentTexto: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  detalleCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  canchaName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  detalleRow: { flexDirection: 'row', alignItems: 'center' },
  detalleText: { fontSize: 13, color: colors.textSecondary },

  detalleMetaRow: { flexDirection: 'row', gap: 12 },
  detalleMetaBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  detalleMetaText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
