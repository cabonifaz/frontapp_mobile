import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ImageBackground, Dimensions, SafeAreaView, ActivityIndicator,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { rankingService } from '../../services/rankingService';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H  = 220;
const AVATAR_SIZE = 126;
const TABS = ['Estadísticas', 'Detalles'];

const COVER_DEFAULT = 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80';
const AVATAR_DEFAULT = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxUzKngXZcLOT11hp0FMnpwDtCusZVoIm2kCLfXtUfDg&s=10';

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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idUsuario = basicData.id_usuario ?? null;
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
        });
      })
      .catch(() => setProfile(buildBasicProfile(basicData)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const p = profile ?? {};

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
            <Image
              source={p.avatar ? { uri: p.avatar } : { uri: AVATAR_DEFAULT }}
              style={styles.avatar}
            />
          </View>

          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={14} color={colors.primary} />
            <Text style={styles.rankBadgeText}>{p.ranking ?? 'N/R'}</Text>
          </View>

          <Text style={styles.name}>{p.nombre ?? 'Jugador'}</Text>
          <Text style={styles.ptsText}>{Number(p.pts ?? 0).toFixed(1)} pts</Text>

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

          <TouchableOpacity
            style={styles.retarBtn}
            onPress={() => navigation.navigate('RankedMatch')}
            activeOpacity={0.85}
          >
            <Ionicons name="tennisball-outline" size={20} color={colors.primary} />
            <Text style={styles.retarBtnText}>Buscar partido para retar</Text>
          </TouchableOpacity>

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
  ptsText: { fontSize: 15, color: colors.textSecondary, marginBottom: 20 },
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
});
