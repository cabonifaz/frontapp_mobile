import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../../constants';
import { resultadoService } from '../../services/resultadoService';
import { getAvatarSource } from '../../utils/avatars';

function formatFecha(dateStr) {
  if (!dateStr) return '--';
  const [year, month, day] = (String(dateStr).split('T')[0]).split('-').map(Number);
  const months = i18n.t('fechas.mesesAbrev', { returnObjects: true });
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

// NUEVO: avatar de un lado (1 foto en singles, 2 superpuestas en dobles)
function AvatarLado({ foto, foto2, esDobles, ranking }) {
  if (esDobles) {
    return (
      <View style={styles.avatarWrap}>
        <View style={styles.parejaWrap}>
          <Image source={getAvatarSource(foto)} style={[styles.parejaAvatar, { left: 0, top: 0 }]} />
          <Image source={getAvatarSource(foto2)} style={[styles.parejaAvatar, { right: 0, bottom: 0 }]} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.avatarWrap}>
      <Image source={getAvatarSource(foto)} style={styles.heroAvatar} />
      <RankingBadge ranking={ranking} />
    </View>
  );
}

export function DetalleResultadoScreen({ navigation, route }) {
  const { t } = useTranslation();   // NUEVO: idiomas
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
  const esDobles = Number(d.es_dobles ?? 0) === 1;

  // ¿Mi lado es el visitante? La base de datos lo indica (soy_local), también en dobles.
  // Respaldo: comparar con el jugador local (versión anterior del SP).
  const soyVisitante = d.soy_local != null
    ? Number(d.soy_local) === 0
    : (idUsuarioActual != null && d.id_jugador_local != null && Number(d.id_jugador_local) !== idUsuarioActual);

  const jugadorYo     = soyVisitante ? (d.jugador_visitante ?? t('detalleRes.jugador2')) : (d.jugador_local     ?? t('detalleRes.jugador1'));
  const jugadorRival  = soyVisitante ? (d.jugador_local     ?? t('detalleRes.jugador1')) : (d.jugador_visitante ?? t('detalleRes.jugador2'));
  const fotoYo        = soyVisitante ? (d.foto_visitante    ?? null)        : (d.foto_local        ?? null);
  const fotoRival     = soyVisitante ? (d.foto_local        ?? null)        : (d.foto_visitante    ?? null);
  const fotoYo2       = soyVisitante ? (d.foto_visitante_2  ?? null)        : (d.foto_local_2      ?? null);
  const fotoRival2    = soyVisitante ? (d.foto_local_2      ?? null)        : (d.foto_visitante_2  ?? null);
  const puntosYo      = soyVisitante ? (d.puntos_visitante  ?? '--')        : (d.puntos_local      ?? '--');
  const puntosRival   = soyVisitante ? (d.puntos_local      ?? '--')        : (d.puntos_visitante  ?? '--');
  const rankingYo     = soyVisitante ? (d.ranking_visitante ?? null)        : (d.ranking_local     ?? null);
  const rankingRival  = soyVisitante ? (d.ranking_local     ?? null)        : (d.ranking_visitante ?? null);

  const sets = [1, 2, 3, 4, 5].map(n => soyVisitante
    ? [d[`set${n}_visitante`] ?? match?.[`set${n}_visitante`], d[`set${n}_local`] ?? match?.[`set${n}_local`]]
    : [d[`set${n}_local`]     ?? match?.[`set${n}_local`],     d[`set${n}_visitante`] ?? match?.[`set${n}_visitante`]]
  ).filter(([l, v]) => l != null || v != null);

  const setsYo    = soyVisitante ? (d.sets_visitante ?? match?.sets_visitante ?? 0) : (d.sets_local     ?? match?.sets_local     ?? 0);
  const setsRival = soyVisitante ? (d.sets_local     ?? match?.sets_local     ?? 0) : (d.sets_visitante ?? match?.sets_visitante ?? 0);

  // Nombre abreviado (R. Pino). En dobles se muestra la pareja completa ("Beto y Ana").
  function abreviar(nombre) {
    if (!nombre) return '';
    if (esDobles) return nombre;
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0];
    return `${partes[0][0]}. ${partes.slice(1).join(' ')}`;
  }

  const formatPts = (v) => (v === '--' || v == null ? '--' : Number(v).toFixed(1));

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

        {esDobles && (
          <View style={styles.doblesChip}>
            <Ionicons name="people" size={12} color={colors.accent} />
            <Text style={styles.doblesChipText}>{t('detalleRes.dobles')}</Text>
          </View>
        )}

        <View style={styles.playersRow}>
          {/* Mi lado */}
          <View style={styles.playerCol}>
            <AvatarLado foto={fotoYo} foto2={fotoYo2} esDobles={esDobles} ranking={rankingYo} />
            <Text style={styles.heroName} numberOfLines={2}>{abreviar(jugadorYo)}</Text>
            {!esDobles && <Text style={styles.heroPts}>{formatPts(puntosYo)} pts</Text>}
          </View>

          <Text style={styles.vsLabel}>VS</Text>

          {/* Rival */}
          <View style={styles.playerCol}>
            <AvatarLado foto={fotoRival} foto2={fotoRival2} esDobles={esDobles} ranking={rankingRival} />
            <Text style={[styles.heroName, styles.heroNameBold]} numberOfLines={2}>{abreviar(jugadorRival)}</Text>
            {!esDobles && <Text style={styles.heroPts}>{formatPts(puntosRival)} pts</Text>}
          </View>
        </View>
      </View>

      {/* Sheet */}
      <View style={styles.sheet}>
        <View style={styles.tabBar}>
          {['Resultados', 'Detalles'].map(tb => (
            <TouchableOpacity key={tb} style={styles.tabItem} onPress={() => setActiveTab(tb)}>
              <Text style={[styles.tabText, activeTab === tb && styles.tabTextActive]}>{t(`detalleRes.tabs.${tb}`)}</Text>
              {activeTab === tb && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {activeTab === 'Resultados' ? (
              <>
                <Text style={styles.sectionTitle}>{t('detalleRes.resultadoFinal')}</Text>
                <View style={styles.resultadoFinalRow}>
                  <Text style={styles.resultadoFinalNum}>{setsYo}</Text>
                  <Text style={styles.resultadoFinalSep}> – </Text>
                  <Text style={styles.resultadoFinalNum}>{setsRival}</Text>
                </View>

                {sets.length === 0 ? (
                  <Text style={styles.noDataText}>{t('detalleRes.sinSets')}</Text>
                ) : (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('detalleRes.sets')}</Text>
                    {sets.map(([l, v], i) => (
                      <View key={i} style={styles.setRow}>
                        <Text style={styles.setLabel}>{t('detalleRes.set', { n: i + 1 })}</Text>
                        <Image source={getAvatarSource(fotoYo)} style={styles.setAvatar} />
                        <View style={styles.scoreBox}>
                          <Text style={styles.scoreNum}>{l ?? '-'}</Text>
                        </View>
                        <Text style={styles.scoreSep}>–</Text>
                        <View style={styles.scoreBox}>
                          <Text style={styles.scoreNum}>{v ?? '-'}</Text>
                        </View>
                        <Image source={getAvatarSource(fotoRival)} style={styles.setAvatar} />
                      </View>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                <View style={styles.photosPlaceholder}>
                  <Ionicons name="image-outline" size={36} color={colors.textSecondary} />
                  <Text style={styles.photosPlaceholderText}>{t('detalleRes.fotos')}</Text>
                </View>

                {/* Comentario: lo escribió quien publicó el resultado (lado local) */}
                {d.comentario_rival ? (
                  <>
                    <Text style={styles.sectionTitle}>{t('detalleRes.comentarios')}</Text>
                    <View style={styles.comentarioCard}>
                      <Image source={getAvatarSource(d.foto_local)} style={styles.comentAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.comentNombre}>
                          {esDobles ? String(d.jugador_local ?? '').split(' y ')[0] : d.jugador_local}
                        </Text>
                        <Text style={styles.comentTexto}>{d.comentario_rival}</Text>
                      </View>
                    </View>
                  </>
                ) : null}

                <Text style={styles.sectionTitle}>{t('detalleRes.detalles')}</Text>
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
                    <Text style={styles.detalleMetaText}>{String(d.hora_partido ?? '--').substring(0, 5)}</Text>
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

  hero: { backgroundColor: colors.dark, paddingTop: 8, paddingBottom: 28, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },

  doblesChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
    borderWidth: 1, borderColor: colors.accent, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12,
  },
  doblesChipText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.6 },

  playersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerCol: { alignItems: 'center', flex: 1 },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  heroAvatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#555',
  },
  // NUEVO: dos fotos superpuestas para una pareja
  parejaWrap: { width: 110, height: 100 },
  parejaAvatar: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    borderWidth: 3, borderColor: colors.dark, backgroundColor: '#555',
  },
  rankBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: -16,
  },
  rankBadgeText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  heroName: { fontSize: 16, fontWeight: '500', color: '#FFFFFF', marginTop: 4, textAlign: 'center' },
  heroNameBold: { fontWeight: '700' },
  heroPts: { fontSize: 13, color: '#AAAAAA', marginTop: 2 },
  vsLabel: { fontSize: 18, fontWeight: '700', color: '#AAAAAA', marginHorizontal: 8 },

  sheet: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
  },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 20 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 16, position: 'relative' },
  tabText: { fontSize: 16, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent, borderRadius: 2 },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 16, marginTop: 8 },

  resultadoFinalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  resultadoFinalNum: { fontSize: 72, fontWeight: 'bold', color: colors.textPrimary },
  resultadoFinalSep: { fontSize: 48, fontWeight: 'bold', color: colors.textSecondary, marginHorizontal: 4 },

  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
  setLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, width: 52, marginRight: 4 },
  setAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccc' },
  scoreBox: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  scoreSep: { fontSize: 20, fontWeight: 'bold', color: colors.textSecondary },

  noDataText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 20 },

  photosPlaceholder: {
    backgroundColor: colors.surface, borderRadius: 14, height: 140,
    alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20,
  },
  photosPlaceholderText: { fontSize: 14, color: colors.textSecondary },

  comentarioCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, gap: 12, alignItems: 'flex-start', marginBottom: 12,
  },
  comentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc' },
  comentNombre: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  comentTexto: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  detalleCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12 },
  canchaName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  detalleRow: { flexDirection: 'row', alignItems: 'center' },
  detalleText: { fontSize: 13, color: colors.textSecondary },

  detalleMetaRow: { flexDirection: 'row', gap: 12 },
  detalleMetaBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
  },
  detalleMetaText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});