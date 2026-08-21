import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ImageBackground, Dimensions, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { usuarioService } from '../../services/usuarioService';
import { resultadoService } from '../../services/resultadoService';

const SCREEN_W   = Dimensions.get('window').width;
const COVER_H    = 220;
const AVATAR_SIZE = 126;
const TABS = ['Estadísticas', 'Detalles', 'Resultados'];

// URLs por defecto (A futuro, es mejor usar require('../../assets/mi-imagen.png'))
const COVER_DEFAULT = 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80';
const AVATAR_DEFAULT = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxUzKngXZcLOT11hp0FMnpwDtCusZVoIm2kCLfXtUfDg&s=10';

function NivelRing({ percent, size = 72 }) {
  const sw = 7;
  const r  = (size - sw) / 2;
  const circ   = 2 * Math.PI * r;
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
          : <Ionicons name={icon} size={20} color={colors.textPrimary} />
        }
        <Text style={styles.statRowLabel}>{label}</Text>
      </View>
      <Text style={styles.statRowValue}>{value ?? 0}</Text>
    </View>
  );
}

function ScoreChip({ value, highlight }) {
  return (
    <View style={[styles.chip, highlight && styles.chipHL]}>
      <Text style={[styles.chipText, highlight && styles.chipTextHL]}>{value}</Text>
    </View>
  );
}

function ResultadoCard({ match }) {
  const fecha = match.fecha_partido ? new Date(match.fecha_partido) : null;
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const day   = fecha ? fecha.getDate() : '--';
  const month = fecha ? months[fecha.getMonth()] : '';

  const sL = match.sets_local     ?? 0;
  const sV = match.sets_visitante ?? 0;

  return (
    <View style={styles.matchCard}>
      <View style={styles.matchDate}>
        <Text style={styles.matchDay}>{day}</Text>
        <Text style={styles.matchMonth}>{month}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.matchPlayerRow}>
          <Text style={styles.matchName}>{match.jugador_local ?? 'Local'}</Text>
          <ScoreChip value={sL} highlight={sL > sV} />
        </View>
        <View style={[styles.matchPlayerRow, { marginTop: 6 }]}>
          <Text style={styles.matchName}>{match.jugador_visitante ?? 'Visitante'}</Text>
          <ScoreChip value={sV} highlight={sV > sL} />
        </View>
      </View>
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

function ResultadosTab({ resultados, loading }) {
  if (loading) return <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 32 }} />;
  if (!resultados.length) return (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={40} color={colors.textSecondary} />
      <Text style={styles.emptyText}>Sin resultados registrados</Text>
    </View>
  );
  return (
    <View style={styles.tabContent}>
      {resultados.map((m, i) => <ResultadoCard key={m.id_resultado ?? i} match={m} />)}
    </View>
  );
}

export function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab]   = useState('Estadísticas');
  const [profile, setProfile]       = useState(null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingRes, setLoadingRes] = useState(false);

  // CAMBIO 1: useFocusEffect en vez de useEffect, para recargar cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      let isMounted = true; // Previene "Memory Leaks" si el usuario sale rápido

      const cargarDatos = async () => {
        setLoading(true);
        setLoadingRes(true);

        try {
          // Promise.all ejecuta ambas consultas al mismo tiempo
          const [resPerfil, resResultados] = await Promise.all([
            usuarioService.perfil().catch(() => null),
            resultadoService.listar().catch(() => [])
          ]);

          if (isMounted) {
            if (resPerfil) {
              setProfile({
                nombre:             resPerfil.nombre_completo      ?? resPerfil.nombre             ?? 'Mi perfil',
                avatar:             resPerfil.foto_perfil_url      ?? null,
                coverUri:           null,
                ranking:            resPerfil.posicion_ranking     ?? resPerfil.ranking            ?? null,
                pts:                resPerfil.puntaje_total        ?? resPerfil.puntos             ?? 0,
                nivel:              resPerfil.nivel_calculado      ?? resPerfil.nivel              ?? null,
                progresoNivel:      resPerfil.progreso_nivel_porcentaje ?? resPerfil.porcentaje_nivel ?? 0,
                partidos:           resPerfil.total_partidos       ?? resPerfil.partidos_totales   ?? 0,
                partidosRankeados:  resPerfil.partidos_rankeados   ?? 0,
                victorias:          resPerfil.victorias_totales    ?? resPerfil.victorias          ?? 0,
                victoriasRankeadas: resPerfil.victorias_rankeadas  ?? 0,
                deporte:            resPerfil.deporte_nombre       ?? resPerfil.deporte            ?? 'Frontón',
                sobreMi:            resPerfil.bio_profesor         ?? resPerfil.descripcion        ?? null,
                calificacion:       resPerfil.calificacion_promedio != null
                                      ? Number(resPerfil.calificacion_promedio).toFixed(1)
                                      : null,
              });
            }

            setResultados(Array.isArray(resResultados) ? resResultados : []);
          }
        } catch (error) {
          console.error("Error cargando perfil:", error);
        } finally {
          if (isMounted) {
            setLoading(false);
            setLoadingRes(false);
          }
        }
      };

      cargarDatos();

      return () => {
        isMounted = false; // Se ejecuta al perder el foco / desmontar
      };
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const p = profile ?? {};

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* CAMBIO 2: Uso de constante para la imagen por defecto */}
        <ImageBackground source={{ uri: p.coverUri ?? COVER_DEFAULT }} style={styles.cover}>
          <SafeAreaView style={styles.headerSafeArea}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation.navigate('Settings')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.sheet}>

          <View style={styles.avatarWrap}>
            {/* CAMBIO 2: Uso de constante para el avatar por defecto */}
            <Image
              source={{ uri: p.avatar ?? AVATAR_DEFAULT }}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile', { profile: p })}
            >
              <Ionicons name="pencil" size={15} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={14} color={colors.primary} />
            <Text style={styles.rankBadgeText}>{p.ranking ?? 'N/R'}</Text>
          </View>

          <Text style={styles.name}>{p.nombre ?? 'Mi perfil'}</Text>
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
          {activeTab === 'Resultados'   && <ResultadosTab   resultados={resultados} loading={loadingRes} />}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  cover: { width: SCREEN_W, height: COVER_H },
  headerSafeArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  circleBtn: {
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
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4, borderColor: colors.background,
    backgroundColor: '#ccc',
  },
  editBtn: {
    position: 'absolute', top: 6, right: -2,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 4,
  },

  rankBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7,
    gap: 6, marginBottom: 12,
  },
  rankBadgeText: { fontSize: 16, fontWeight: 'bold', color: colors.primary },

  name:    { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
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
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14, padding: 16, marginBottom: 10, width: '100%',
  },
  statRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statRowLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  statRowValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  sobreMiCard: {
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, marginTop: 10, width: '100%',
  },
  sobreMiTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  sobreMiText:  { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },

  matchCard: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 14, padding: 14, marginBottom: 10,
    gap: 12, width: '100%',
  },
  matchDate: {
    width: 52, height: 52, backgroundColor: '#E4E4E4',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  matchDay:   { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, lineHeight: 22 },
  matchMonth: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  matchPlayerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchName: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.textPrimary },

  chip: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: '#E4E4E4',
    alignItems: 'center', justifyContent: 'center',
  },
  chipHL:     { backgroundColor: colors.accent },
  chipText:   { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  chipTextHL: { fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 48, gap: 12 },
  emptyText:  { fontSize: 15, color: colors.textSecondary },
});