import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ImageBackground, ActivityIndicator, RefreshControl, Dimensions, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { SharedHeader, HEADER_BG } from '../../components/common/SharedHeader';
import { ACTION_CARDS } from '../../data/homeData';
import { usuarioService } from '../../services/usuarioService';
import { solicitudService } from '../../services/solicitudService';
// NUEVO (040 / 041)
import { resultadoService } from '../../services/resultadoService';
import { notificacionService } from '../../services/notificacionService';
import { MatchCard } from '../results/ResultadosScreen';
import { registrarPush, abrirSiVinoDeNotificacion, actualizarBadge } from '../../utils/pushNotifications';
// NUEVO (07): en vivo y deporte activo
import { enVivoService } from '../../services/enVivoService';
import { nombreDeporteActivo } from '../../utils/deporteActivo';
import { PuntoEnVivo } from '../live/PartidoEnVivoScreen';

const CARD_W = Math.round(Dimensions.get('window').width * 0.82);

// NUEVO (040): carrusel de últimos resultados (amigos y seguidos primero)
function CarruselResultados({ items, onPress }) {
  const { t } = useTranslation();
  if (!items.length) return null;
  return (
    <>
      <Text style={styles.sectionTitle}>{t('home.ultimosResultados')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        style={styles.carrusel}
        contentContainerStyle={styles.carruselContent}
      >
        {items.map(m => (
          <View key={m.id_resultado} style={{ width: CARD_W }}>
            {m.relacion === 'AMIGO' || m.relacion === 'SIGUIENDO' ? (
              <View style={styles.relacionChip}>
                <Ionicons name={m.relacion === 'AMIGO' ? 'people' : 'eye'} size={11} color={colors.textSecondary} />
                <Text style={styles.relacionText}>
                  {m.relacion === 'AMIGO' ? t('home.relacion.amigo') : t('home.relacion.siguiendo')}
                </Text>
              </View>
            ) : (
              <View style={styles.relacionChip} />
            )}
            {/* NUEVO: si el partido tiene foto del encuentro, va arriba de la tarjeta */}
            {m.foto_encuentro ? (
              <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(m)} style={styles.carruselFotoWrap}>
                <Image source={{ uri: m.foto_encuentro }} style={styles.carruselFoto} />
                <MatchCard match={m} onPress={() => onPress(m)} style={[styles.carruselCard, styles.carruselCardConFoto]} />
              </TouchableOpacity>
            ) : (
              <MatchCard match={m} onPress={() => onPress(m)} style={styles.carruselCard} />
            )}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

function NivelProgress({ percent = 0, size = 54 }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const c = size / 2;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={c} cy={c} r={radius} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={c} cy={c} r={radius}
        stroke={colors.accent}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PhotoCard({ card, onPress }) {
  const { t } = useTranslation();
  // NUEVO (idiomas): si existe traducción para esta tarjeta se usa; si no, el texto original
  const titulo    = t(`home.tarjetas.${card.id}.titulo`,    { defaultValue: card.title });
  const subtitulo = card.subtitle ? t(`home.tarjetas.${card.id}.subtitulo`, { defaultValue: card.subtitle }) : null;
  return (
    <TouchableOpacity
      style={[styles.photoCard, { height: card.height }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <ImageBackground source={{ uri: card.uri }} style={StyleSheet.absoluteFillObject} imageStyle={{ borderRadius: 16 }}>
        <View style={styles.cardOverlay} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{titulo}</Text>
          {subtitulo && (
            <View style={styles.cardSubRow}>
              <View style={styles.greenDot} />
              <Text style={styles.cardSub}>{subtitulo}</Text>
            </View>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }) {
  const { t } = useTranslation();   // NUEVO: idiomas
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [solicitudesCount, setSolicitudesCount] = useState(0);
  const [feed, setFeed] = useState([]);              // NUEVO (040)
  const [notifCount, setNotifCount] = useState(0);   // NUEVO (041)
  const [vivosCount, setVivosCount] = useState(0);   // NUEVO (07)

  // NUEVO (041): registrar este celular para push y abrir la bandeja si se entró tocando un aviso
  useEffect(() => {
    registrarPush();
    abrirSiVinoDeNotificacion();
  }, []);

  const leftCards = [ACTION_CARDS[0], ACTION_CARDS[2]];
  const rightCards = [ACTION_CARDS[1], ACTION_CARDS[3]];

  const cargarDatos = useCallback(async () => {
    try {
      let raw = await usuarioService.menuPrincipal();
      if (!raw || raw === '') {
        try { raw = await usuarioService.perfil(); } catch { raw = null; }
      }
      if (raw) {
        setUsuario({
          nombre:           raw.nombre_usuario ?? raw.nombre ?? raw.nombre_completo?.split(' ')[0] ?? null,
          foto_perfil_url:  raw.foto_perfil_url ?? null,
          genero:           raw.genero ?? raw.sexo ?? null,
          deporte:          raw.deporte ?? nombreDeporteActivo() ?? 'Frontón',
          ranking:          raw.posicion_ranking ?? raw.ranking ?? null,
          calificacion:     raw.calificacion_promedio ?? raw.calificacion ?? null,
          nivel:            raw.nivel_actual ?? raw.nivel_calculado ?? raw.nivel ?? null,
          puntos:           raw.puntos_totales ?? raw.puntaje_total ?? raw.puntos ?? null,
          porcentaje_nivel: raw.progreso_nivel_pct ?? raw.progreso_nivel_porcentaje ?? raw.porcentaje_nivel ?? 0,
        });
      }

      // NUEVO (040 / 041): carrusel y contador de notificaciones (si fallan, el Home sigue)
      const [resFeed, resNotif, resVivos] = await Promise.all([
        resultadoService.feed(15).catch(() => []),
        notificacionService.noLeidas().catch(() => null),
        enVivoService.listar().catch(() => []),   // NUEVO (07)
      ]);
      setVivosCount(Array.isArray(resVivos) ? resVivos.filter(v => v.estado_vivo === 'EN_JUEGO').length : 0);
      setFeed(Array.isArray(resFeed) ? resFeed : []);
      const totalNotif = Number(resNotif?.total ?? 0);
      setNotifCount(totalNotif);
      actualizarBadge(totalNotif);

      const solicitudes = await solicitudService.listarPendientes();
      if (Array.isArray(solicitudes)) {
        setSolicitudesCount(solicitudes.length);
      } else if (typeof solicitudes === 'number') {
        setSolicitudesCount(solicitudes);
      }
    } catch (e) {
      console.log('Error al cargar datos en Home:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargarDatos(); }, [cargarDatos]));
  const onRefresh = useCallback(() => { setRefreshing(true); cargarDatos(); }, [cargarDatos]);

  const pctNivel = usuario?.porcentaje_nivel ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <SharedHeader
        nombre={usuario?.nombre} deporte={usuario?.deporte} ranking={usuario?.ranking}
        calificacion={usuario?.calificacion} nivel={usuario?.nivel} puntos={usuario?.puntos}
        fotoPerfil={usuario?.foto_perfil_url} genero={usuario?.genero}
      />
      <View style={styles.sheet}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          >
            {/* NUEVO (041): campana de notificaciones */}
            <View style={styles.titleRow}>
              <Text style={[styles.sectionTitle, { marginBottom: 0, flex: 1 }]}>{t('home.tusEstadisticas')}</Text>
              {/* NUEVO (07): partidos en vivo de amigos y seguidos */}
              <TouchableOpacity
                style={[styles.vivoBtn, vivosCount > 0 && styles.vivoBtnActivo]}
                onPress={() => navigation.navigate('EnVivo')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {vivosCount > 0 ? <PuntoEnVivo size={8} /> : <Ionicons name="radio-outline" size={16} color={colors.textPrimary} />}
                <Text style={[styles.vivoBtnTxt, vivosCount > 0 && { color: '#FFFFFF' }]}>
                  {vivosCount > 0 ? t('vivo.enVivoN', { n: vivosCount }) : t('vivo.enVivoCorto')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => navigation.navigate('Notificaciones')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={notifCount > 0 ? 'notifications' : 'notifications-outline'} size={24} color={colors.textPrimary} />
                {notifCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={styles.statTopRow}>
                  <Text style={styles.statNumber}>{usuario?.ranking ?? t('header.sinRanking')}</Text>
                  <Ionicons name="trophy" size={20} color={colors.textPrimary} style={{ marginLeft: 6, marginTop: 6 }} />
                </View>
                <Text style={styles.statLabel}>{t('perfil.ranking')}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statTopRow}>
                  <View>
                    <Text style={styles.statNumber}>{usuario?.nivel ?? '--'}</Text>
                    <Text style={styles.statLabel}>{t('perfil.nivel')}</Text>
                  </View>
                  <View style={{ alignItems: 'center', marginLeft: 'auto' }}>
                    <View style={styles.progressWrapper}>
                      <NivelProgress percent={pctNivel} />
                      <Text style={styles.progressPct}>{pctNivel}%</Text>
                    </View>
                    <Text style={styles.nivelPts}>{usuario?.puntos != null ? `${usuario.puntos} pts` : '-- pts'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* NUEVO (040) */}
            <CarruselResultados
              items={feed}
              onPress={(m) => navigation.navigate('DetalleResultado', { match: m })}
            />

            <Text style={styles.sectionTitle}>{t('home.queDeseas')}</Text>
            <View style={styles.grid}>
              <View style={styles.gridCol}>
                {leftCards.map((c) => (
                  <PhotoCard key={c.id} card={c} onPress={() => c.route && navigation.navigate(c.route)} />
                ))}
              </View>
              <View style={styles.gridCol}>
                {rightCards.map((c) => (
                  <PhotoCard key={c.id} card={c} onPress={() => c.route && navigation.navigate(c.route)} />
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {!loading && (
          <TouchableOpacity
            style={styles.fabContainer}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MisSolicitudes')}
          >
            {solicitudesCount > 0 && (
              <View style={styles.fabBadge}>
                <Text style={styles.fabBadgeText}>{solicitudesCount}</Text>
              </View>
            )}
            <MaterialCommunityIcons name="tennis" size={32} color={colors.dark} style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: HEADER_BG },
  sheet: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 88 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  statTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: colors.textPrimary },
  statLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  progressWrapper: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  progressPct: { position: 'absolute', fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  nivelPts: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  grid: { flexDirection: 'row', gap: 12 },

  // NUEVO (041): campana
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  vivoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, borderRadius: 20, paddingHorizontal: 12,
    backgroundColor: colors.surface, marginRight: 8,
  },
  vivoBtnActivo: { backgroundColor: colors.dark },
  vivoBtnTxt: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  bellBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  bellBadge: {
    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  bellBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  // NUEVO (040): carrusel
  carrusel: { marginHorizontal: -20, marginBottom: 28 },
  carruselContent: { paddingHorizontal: 20, gap: 12 },
  carruselCard: { marginBottom: 0 },
  carruselFotoWrap: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.surface },
  carruselFoto: { width: '100%', height: 150 },
  carruselCardConFoto: { borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  relacionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 18, marginBottom: 4, marginLeft: 4 },
  relacionText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  gridCol: { flex: 1, gap: 12 },
  photoCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#333' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.36)', borderRadius: 16 },
  cardContent: { position: 'absolute', bottom: 12, left: 12, right: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  cardSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.positive },
  cardSub: { fontSize: 12, color: '#FFFFFF' },

  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    backgroundColor: '#E53935',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: colors.background,
  },
  fabBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});