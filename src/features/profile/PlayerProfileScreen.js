import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ImageBackground, Dimensions, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { rankingService } from '../../services/rankingService';
import { amistadService } from '../../services/amistadService';
import { getAvatarSource } from '../../utils/avatars';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H  = 220;
const AVATAR_SIZE = 126;
const TABS = ['Estadísticas', 'Detalles'];

const COVER_DEFAULT = 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80';

function NivelRing({ percent, size = 72 }) {
  const sw = 7;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - (percent || 0) / 100);
  const c = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={c} cy={c} r={r} stroke="#E0E0E0" strokeWidth={sw} fill="none" />
        <Circle cx={c} cy={c} r={r} stroke={colors.accent} strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textPrimary }}>
            {percent ?? 0}%
          </Text>
        </View>
      </View>
    </View>
  );
}

function StatRow({ icon, mci, label, value }) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statRowLeft}>
        {mci
          ? <MaterialCommunityIcons name={icon} size={20} color={colors.textPrimary} />
          : <Ionicons name={icon} size={20} color={colors.textPrimary} />}
        <Text style={styles.statRowLabel}>{label}</Text>
      </View>
      <Text style={styles.statRowValue}>{value ?? 0}</Text>
    </View>
  );
}

function EstadisticasTab({ p }) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.statCardsRow}>
        <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
            <Text style={styles.bigNum}>{p.ranking ?? 'N/R'}</Text>
            <Ionicons name="trophy" size={18} color={colors.textPrimary} style={{ marginLeft: 6, marginTop: 8 }} />
          </View>
          <Text style={styles.statCardLabel}>Ranking</Text>
        </View>
        <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.bigNum}>{p.nivel ?? '--'}</Text>
            <View style={{ marginLeft: 12, alignItems: 'center' }}>
              <NivelRing percent={p.progresoNivel} />
              <Text style={styles.nivelPts}>{Number(p.pts ?? 0).toFixed(1)} pts</Text>
            </View>
          </View>
          <Text style={styles.statCardLabel}>Nivel</Text>
        </View>
      </View>
      <StatRow mci icon="tennis"         label="Partidos"            value={p.partidos} />
      <StatRow     icon="trophy-outline" label="Partidos rankeados"  value={p.partidosRankeados} />
      <StatRow     icon="ribbon-outline" label="Victorias rankeadas" value={p.victoriasRankeadas} />
      <StatRow     icon="ribbon-outline" label="Victorias"           value={p.victorias} />
    </View>
  );
}

function DetallesTab({ p }) {
  return (
    <View style={styles.tabContent}>
      <StatRow mci icon="tennis" label="Deporte Favorito" value={p.deporte ?? 'Frontón'} />
      {p.sobreMi ? (
        <View style={styles.sobreMiCard}>
          <Text style={styles.sobreMiTitle}>Sobre mí</Text>
          <Text style={styles.sobreMiText}>{p.sobreMi}</Text>
        </View>
      ) : null}
    </View>
  );
}

// NUEVO: calificación como jugador y, si aplica, como profesor
function Calificaciones({ p }) {
  const fmt = (v) => (v != null ? Number(v).toFixed(1) : '—');
  return (
    <View style={styles.califRow}>
      <View style={styles.califChip}>
        <Ionicons name="star" size={14} color={colors.accent} />
        <Text style={styles.califValor}>{fmt(p.califJugador)}</Text>
        <Text style={styles.califTexto}>
          {p.totalCalifJugador > 0 ? `jugador · ${p.totalCalifJugador}` : 'sin calificaciones'}
        </Text>
      </View>
      {p.esProfesor && (
        <View style={styles.califChip}>
          <Ionicons name="school" size={14} color={colors.accent} />
          <Text style={styles.califValor}>{fmt(p.califProfesor)}</Text>
          <Text style={styles.califTexto}>
            {p.totalCalifProfesor > 0 ? `profesor · ${p.totalCalifProfesor}` : 'profesor'}
          </Text>
        </View>
      )}
    </View>
  );
}

// NUEVO: acciones de amistad según el estado de la relación
function AmistadAcciones({ estado, cargando, nombre, onAgregar, onCancelar, onAceptar, onRechazar, onEliminar }) {
  if (!estado || estado === 'MISMO_USUARIO') return null;

  if (cargando) {
    return (
      <View style={styles.amistadRow}>
        <ActivityIndicator size="small" color={colors.textPrimary} />
      </View>
    );
  }

  if (estado === 'PENDIENTE_RECIBIDA') {
    return (
      <View style={styles.amistadRecibida}>
        <Text style={styles.amistadRecibidaText}>{nombre} te envió una solicitud de amistad</Text>
        <View style={styles.amistadRow}>
          <TouchableOpacity style={[styles.amistadBtn, styles.amistadBtnFilled]} onPress={onAceptar}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.amistadBtnTextFilled}>Aceptar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.amistadBtn} onPress={onRechazar}>
            <Text style={styles.amistadBtnText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const config = {
    NINGUNA:           { icon: 'person-add-outline', label: 'Agregar amigo',    onPress: onAgregar },
    PENDIENTE_ENVIADA: { icon: 'time-outline',       label: 'Solicitud enviada', onPress: onCancelar },
    AMIGOS:            { icon: 'people',             label: 'Amigos',           onPress: onEliminar },
  }[estado];

  if (!config) return null;

  return (
    <View style={styles.amistadRow}>
      <TouchableOpacity
        style={[styles.amistadBtn, estado === 'AMIGOS' && styles.amistadBtnAmigos]}
        onPress={config.onPress}
      >
        <Ionicons name={config.icon} size={16} color={colors.textPrimary} />
        <Text style={styles.amistadBtnText}>{config.label}</Text>
      </TouchableOpacity>
    </View>
  );
}

function buildBasicProfile(basicData) {
  return {
    nombre:             basicData.nombre   ?? 'Jugador',
    avatar:             basicData.avatar   ?? null,
    coverUri:           COVER_DEFAULT,
    ranking:            basicData.ranking  ?? null,
    pts:                basicData.pts      ?? 0,
    nivel:              null,
    progresoNivel:      0,
    partidos:           0,
    partidosRankeados:  0,
    victorias:          0,
    victoriasRankeadas: 0,
    deporte:            'Frontón',
    sobreMi:            null,
  };
}

export function PlayerProfileScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('Estadísticas');
  const basicData = route.params?.player ?? {};
  const idUsuario = basicData.id_usuario ?? null;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // NUEVO: estado de amistad
  const [estadoAmistad, setEstadoAmistad] = useState(null);
  const [idAmistad, setIdAmistad] = useState(null);
  const [accionAmistad, setAccionAmistad] = useState(false);

  const refrescarAmistad = useCallback(async () => {
    if (!idUsuario) return;
    try {
      const res = await amistadService.estado(idUsuario);
      setEstadoAmistad(res?.estado ?? null);
      setIdAmistad(res?.idAmistad ?? null);
    } catch {
      setEstadoAmistad(null);
    }
  }, [idUsuario]);

  useEffect(() => {
    refrescarAmistad();

    if (!idUsuario) {
      setProfile(buildBasicProfile(basicData));
      setLoading(false);
      return;
    }
    rankingService.perfil(idUsuario)
      .then(res => {
        if (!res) {
          setProfile(buildBasicProfile(basicData));
          return;
        }
        setProfile({
          nombre:             res.nombre_completo          ?? basicData.nombre  ?? 'Jugador',
          avatar:             res.foto_perfil_url          ?? basicData.avatar  ?? null,
          coverUri:           COVER_DEFAULT,
          ranking:            res.posicion_ranking         ?? basicData.ranking ?? null,
          pts:                res.puntaje_total            ?? basicData.pts     ?? 0,
          nivel:              res.nivel_calculado          ?? null,
          progresoNivel:      res.progreso_nivel_porcentaje ?? 0,
          partidos:           res.total_partidos           ?? 0,
          partidosRankeados:  res.partidos_rankeados       ?? 0,
          victorias:          res.victorias_totales        ?? res.victorias     ?? 0,
          victoriasRankeadas: res.victorias_rankeadas      ?? 0,
          deporte:            res.deporte_nombre           ?? res.deporte       ?? 'Frontón',
          sobreMi:            res.bio_profesor             ?? res.descripcion   ?? null,
          // NUEVO: calificaciones
          califJugador:       res.calificacion_jugador ?? null,
          totalCalifJugador:  res.total_calificaciones_jugador ?? 0,
          califProfesor:      res.calificacion_profesor ?? null,
          totalCalifProfesor: res.total_calificaciones_profesor ?? 0,
          esProfesor:         Number(res.es_profesor ?? 0) === 1,
        });
      })
      .catch(() => setProfile(buildBasicProfile(basicData)))
      .finally(() => setLoading(false));
  }, []);

  const p = profile ?? {};
  const firstName = String(p.nombre ?? 'Jugador').split(' ')[0];

  async function ejecutarAccion(fn) {
    try {
      setAccionAmistad(true);
      await fn();
      await refrescarAmistad();
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo completar la acción.');
      await refrescarAmistad();
    } finally {
      setAccionAmistad(false);
    }
  }

  const onAgregar = () => ejecutarAccion(async () => {
    const res = await amistadService.enviarSolicitud(idUsuario);
    if (res?.estado === 'AMIGOS') {
      Alert.alert('¡Ahora son amigos!', `${firstName} también te había enviado una solicitud.`);
    }
  });

  const onCancelar = () => Alert.alert('Cancelar solicitud', `¿Quieres cancelar la solicitud enviada a ${firstName}?`, [
    { text: 'No', style: 'cancel' },
    { text: 'Sí, cancelar', style: 'destructive', onPress: () => ejecutarAccion(() => amistadService.eliminar(idUsuario)) },
  ]);

  const onAceptar  = () => ejecutarAccion(() => amistadService.responder(idAmistad, true));
  const onRechazar = () => ejecutarAccion(() => amistadService.responder(idAmistad, false));

  const onEliminar = () => Alert.alert('Eliminar amigo', `¿Quieres eliminar a ${firstName} de tus amigos?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => ejecutarAccion(() => amistadService.eliminar(idUsuario)) },
  ]);

  function retarAmistoso() {
    navigation.navigate('CrearPartido', {
      tipo: 'Amistoso',
      amigo: {
        id_usuario:       idUsuario,
        nombre_completo:  p.nombre,
        foto_perfil_url:  p.avatar,
        posicion_ranking: p.ranking,
        puntaje_total:    p.pts,
      },
    });
  }

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const sonAmigos = estadoAmistad === 'AMIGOS';
  const esMiPerfil = estadoAmistad === 'MISMO_USUARIO';

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        <ImageBackground source={{ uri: p.coverUri ?? COVER_DEFAULT }} style={styles.cover}>
          <SafeAreaView>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.sheet}>

          <View style={styles.avatarWrap}>
            <Image source={getAvatarSource(p.avatar)} style={styles.avatar} />
          </View>

          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={14} color={colors.primary} />
            <Text style={styles.rankBadgeText}>{p.ranking ?? 'N/R'}</Text>
          </View>

          <Text style={styles.name}>{p.nombre ?? 'Jugador'}</Text>
          <Text style={styles.ptsText}>{Number(p.pts ?? 0).toFixed(1)} pts</Text>

          {/* NUEVO: calificaciones */}
          <Calificaciones p={p} />

          <AmistadAcciones
            estado={estadoAmistad}
            cargando={accionAmistad}
            nombre={firstName}
            onAgregar={onAgregar}
            onCancelar={onCancelar}
            onAceptar={onAceptar}
            onRechazar={onRechazar}
            onEliminar={onEliminar}
          />

          <View style={styles.tabBar}>
            {TABS.map(tab => (
              <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'Estadísticas' && <EstadisticasTab p={p} />}
          {activeTab === 'Detalles'     && <DetallesTab     p={p} />}

          {!esMiPerfil && (
            sonAmigos ? (
              <>
                <TouchableOpacity style={styles.retarBtn} onPress={retarAmistoso} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="tennis" size={20} color={colors.primary} />
                  <Text style={styles.retarBtnText}>Retar a un amistoso</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => navigation.navigate('RankedMatch')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryBtnText}>Ver ligas de ranking</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.retarBtn}
                onPress={() => navigation.navigate('RankedMatch')}
                activeOpacity={0.85}
              >
                <Ionicons name="trophy-outline" size={20} color={colors.primary} />
                <Text style={styles.retarBtnText}>Ver ligas de ranking</Text>
              </TouchableOpacity>
            )
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  cover: { width: SCREEN_W, height: COVER_H },
  backBtn: {
    marginTop: 8, marginLeft: 20,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: AVATAR_SIZE / 2 + 20,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'absolute',
    top: -(AVATAR_SIZE / 2),
    alignSelf: 'center',
  },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4, borderColor: colors.background,
    backgroundColor: '#ccc',
  },
  rankBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7,
    gap: 6, marginBottom: 12,
  },
  rankBadgeText: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  name: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  ptsText: { fontSize: 15, color: colors.textSecondary, marginBottom: 10 },

  // NUEVO: calificaciones
  califRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap', justifyContent: 'center' },
  califChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5,
  },
  califValor: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  califTexto: { fontSize: 12, color: colors.textSecondary },

  // Amistad
  amistadRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20, minHeight: 38 },
  amistadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.textPrimary, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  amistadBtnAmigos: { borderColor: colors.border, backgroundColor: colors.surface },
  amistadBtnFilled: { backgroundColor: colors.accent, borderColor: colors.accent },
  amistadBtnText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  amistadBtnTextFilled: { fontSize: 14, fontWeight: '700', color: colors.primary },
  amistadRecibida: {
    width: '100%', alignItems: 'center',
    backgroundColor: colors.accentLight, borderRadius: 16,
    paddingTop: 14, paddingHorizontal: 14, marginBottom: 20,
  },
  amistadRecibidaText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 10, textAlign: 'center' },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: colors.border,
    width: '100%',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: colors.accent, borderRadius: 2,
  },
  tabContent: { width: '100%', paddingTop: 16 },
  statCardsRow: { flexDirection: 'row', marginBottom: 12 },
  statCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  bigNum: { fontSize: 36, fontWeight: 'bold', color: colors.textPrimary },
  statCardLabel: { fontSize: 14, color: colors.textSecondary },
  nivelPts: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  statRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 10, width: '100%',
  },
  statRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statRowLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  statRowValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  sobreMiCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    marginTop: 10, width: '100%',
  },
  sobreMiTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  sobreMiText: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },

  retarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    width: '100%',
    marginTop: 24,
  },
  retarBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  secondaryBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 30, paddingVertical: 16,
    width: '100%', marginTop: 12,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
});