import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ImageBackground, Dimensions, ActivityIndicator, SafeAreaView,
} from 'react-native';
import Svg, { Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { PROFILE_MOCK } from '../../data/profileData';
import { usuarioService } from '../../services/usuarioService';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 220;
const AVATAR_SIZE = 126;
const TABS = ['Estadísticas', 'Detalles', 'Resultados'];

// ─── Anillo de nivel ───────────────────────────────────────────────────────────
function NivelRing({ percent, size = 72 }) {
  const sw = 7;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  const c = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={c} cy={c} r={r} stroke="#E0E0E0" strokeWidth={sw} fill="none" />
        <Circle
          cx={c} cy={c} r={r}
          stroke={colors.accent} strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textPrimary }}>
            {percent}%
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Gráfico de ranking ────────────────────────────────────────────────────────
function RankingChart({ data }) {
  const CARD_PAD = 32;
  const W = SCREEN_W - 40 - CARD_PAD;
  const H = 70;
  const PT = 22;
  const PX = 8;
  const svgW = W - PX * 2;
  const svgH = H + PT + 6;

  const positions = data.map(d => d.pos);
  const minP = Math.min(...positions);
  const maxP = Math.max(...positions);
  const range = maxP - minP || 1;
  const xStep = svgW / (data.length - 1);

  const pts = data.map((d, i) => ({
    x: PX + i * xStep,
    y: PT + ((d.pos - minP) / range) * H,
    pos: d.pos,
  }));

  const polyStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <View>
      <Svg width={W} height={svgH}>
        <Polyline
          points={polyStr}
          fill="none"
          stroke={colors.accent}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.y} r={5} fill={colors.accent} />
            <SvgText
              x={p.x} y={p.y - 9}
              textAnchor="middle" fontSize={10}
              fill={colors.textSecondary} fontWeight="600"
            >
              {p.pos}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: PX }}>
        {data.map(d => (
          <Text key={d.mes} style={styles.chartLabel}>{d.mes}</Text>
        ))}
      </View>
    </View>
  );
}

// ─── Fila de estadística ───────────────────────────────────────────────────────
function StatRow({ icon, mci, label, value }) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statRowLeft}>
        {mci
          ? <MaterialCommunityIcons name={icon} size={20} color={colors.textPrimary} />
          : <Ionicons name={icon} size={20} color={colors.textPrimary} />
        }
        <Text style={styles.statRowLabel}>{label}</Text>
      </View>
      <Text style={styles.statRowValue}>{value}</Text>
    </View>
  );
}

// ─── Chip de puntaje ───────────────────────────────────────────────────────────
function ScoreChip({ value, highlight }) {
  return (
    <View style={[styles.chip, highlight && styles.chipHL]}>
      <Text style={[styles.chipText, highlight && styles.chipTextHL]}>{value}</Text>
    </View>
  );
}

// ─── Tarjeta de resultado ──────────────────────────────────────────────────────
function MatchCard({ match }) {
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchDate}>
        <Text style={styles.matchDay}>{match.day}</Text>
        <Text style={styles.matchMonth}>{match.month}</Text>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        {match.players.map((p, i) => (
          <View key={i} style={styles.matchPlayerRow}>
            <Image source={{ uri: p.avatar }} style={styles.matchAvatar} />
            <Text style={styles.matchName}>{p.name}</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {p.scores.map((s, j) => {
                const max = Math.max(...match.players.map(pl => pl.scores[j]));
                return <ScoreChip key={j} value={s} highlight={s === max} />;
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Tab: Estadísticas ─────────────────────────────────────────────────────────
function EstadisticasTab({ p }) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.statCardsRow}>
        {/* Ranking */}
        <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
            <Text style={styles.bigNum}>{p.ranking ?? 'N/R'}</Text>
            <Ionicons name="trophy" size={18} color={colors.textPrimary} style={{ marginLeft: 6, marginTop: 8 }} />
          </View>
          <Text style={styles.statCardLabel}>Ranking</Text>
        </View>
        {/* Nivel */}
        <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.bigNum}>{p.nivel}</Text>
            <View style={{ marginLeft: 12, alignItems: 'center' }}>
              <NivelRing percent={p.progresoNivel} />
              <Text style={styles.nivelPts}>{p.puntajeNivel} pts</Text>
            </View>
          </View>
          <Text style={styles.statCardLabel}>Nivel</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Ranking</Text>
        <Text style={styles.chartYear}>2024</Text>
        <RankingChart data={p.rankingHistory} />
      </View>

      <StatRow mci icon="tennis"         label="Partidos"            value={p.partidos} />
      <StatRow     icon="trophy-outline" label="Partidos rankeados"  value={p.partidosRankeados} />
      <StatRow     icon="ribbon-outline" label="Victorias rankeadas" value={p.victoriasRankeadas} />
      <StatRow     icon="ribbon-outline" label="Victorias"           value={p.victorias} />
    </View>
  );
}

// ─── Tab: Detalles ─────────────────────────────────────────────────────────────
function DetallesTab({ p }) {
  return (
    <View style={styles.tabContent}>
      <StatRow mci icon="tennis" label="Deporte Favorito" value={p.deporte} />
      <View style={styles.sobreMiCard}>
        <Text style={styles.sobreMiTitle}>Sobre mi</Text>
        <Text style={styles.sobreMiText}>{p.sobreMi}</Text>
      </View>
    </View>
  );
}

// ─── Tab: Resultados ───────────────────────────────────────────────────────────
function ResultadosTab({ p }) {
  return (
    <View style={styles.tabContent}>
      {p.resultados.map(m => <MatchCard key={m.id} match={m} />)}
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────
export function ProfileScreen({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('Estadísticas');
  const [profile, setProfile] = useState(PROFILE_MOCK);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    usuarioService.perfil()
      .then(res => {
        if (res) setProfile({
          ...PROFILE_MOCK,
          nombre:            res.nombre           ?? res.nombre_completo                  ?? PROFILE_MOCK.nombre,
          avatar:            res.foto_perfil_url  ?? PROFILE_MOCK.avatar,
          ranking:           res.ranking          ?? res.posicion_ranking                 ?? PROFILE_MOCK.ranking,
          pts:               res.puntos           ?? res.puntaje_total                    ?? PROFILE_MOCK.pts,
          nivel:             res.nivel            ?? res.nivel_calculado                  ?? PROFILE_MOCK.nivel,
          progresoNivel:     res.porcentaje_nivel ?? res.progreso_nivel_porcentaje         ?? PROFILE_MOCK.progresoNivel,
          puntajeNivel:      res.puntos           ?? res.puntaje_total                    ?? PROFILE_MOCK.puntajeNivel,
          partidos:          res.partidos_totales  ?? res.total_partidos                  ?? PROFILE_MOCK.partidos,
          partidosRankeados: res.partidos_rankeados ?? PROFILE_MOCK.partidosRankeados,
          victorias:         res.victorias         ?? res.victorias_totales             ?? PROFILE_MOCK.victorias,
          victoriasRankeadas:res.victorias_rankeadas ?? PROFILE_MOCK.victoriasRankeadas,
          deporte:           res.deporte_nombre   ?? res.deporte                          ?? PROFILE_MOCK.deporte,
          sobreMi:           res.descripcion      ?? res.bio_profesor                     ?? PROFILE_MOCK.sobreMi,
          rankingHistory:    res.historial_ranking ?? PROFILE_MOCK.rankingHistory,
          resultados:        res.resultados        ?? PROFILE_MOCK.resultados,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* Imagen de fondo */}
        <ImageBackground source={{ uri: profile.coverUri }} style={styles.cover}>
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

        {/* Hoja blanca */}
        <View style={styles.sheet}>

          {/* Avatar + botón editar */}
          <View style={styles.avatarWrap}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile', { profile })}
            >
              <Ionicons name="pencil" size={15} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Badge de ranking */}
          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={14} color={colors.primary} />
            <Text style={styles.rankBadgeText}>{profile.ranking}</Text>
          </View>

          <Text style={styles.name}>{profile.nombre}</Text>
          <Text style={styles.ptsText}>{profile.pts} pts</Text>

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {TABS.map(tab => (
              <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <>
              {activeTab === 'Estadísticas' && <EstadisticasTab p={profile} />}
              {activeTab === 'Detalles'     && <DetallesTab     p={profile} />}
              {activeTab === 'Resultados'   && <ResultadosTab   p={profile} />}
            </>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: colors.background,
    backgroundColor: '#ccc',
  },
  editBtn: {
    position: 'absolute',
    top: 6,
    right: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },

  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
    gap: 6,
    marginBottom: 12,
  },
  rankBadgeText: { fontSize: 16, fontWeight: 'bold', color: colors.primary },

  name: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  ptsText: { fontSize: 15, color: colors.textSecondary, marginBottom: 20 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  tabItem: {
    flex: 1, alignItems: 'center',
    paddingVertical: 14, position: 'relative',
  },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: colors.accent, borderRadius: 2,
  },

  tabContent: { width: '100%', paddingTop: 16 },

  // Stat cards row
  statCardsRow: { flexDirection: 'row', marginBottom: 12 },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  bigNum: { fontSize: 36, fontWeight: 'bold', color: colors.textPrimary },
  statCardLabel: { fontSize: 14, color: colors.textSecondary },
  nivelPts: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },

  // Chart
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: '100%',
  },
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary },
  chartYear: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
  chartLabel: { fontSize: 10, color: colors.textSecondary },

  // Stat rows
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    width: '100%',
  },
  statRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statRowLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  statRowValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  // Sobre mi
  sobreMiCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    width: '100%',
  },
  sobreMiTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  sobreMiText: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },

  // Match card
  matchCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    width: '100%',
  },
  matchDate: {
    width: 52, height: 52,
    backgroundColor: '#E4E4E4',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchDay: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, lineHeight: 22 },
  matchMonth: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  matchPlayerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccc' },
  matchName: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.textPrimary },

  chip: {
    width: 26, height: 26, borderRadius: 6,
    backgroundColor: '#E4E4E4',
    alignItems: 'center', justifyContent: 'center',
  },
  chipHL: { backgroundColor: colors.accent },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  chipTextHL: { fontWeight: 'bold' },
});
