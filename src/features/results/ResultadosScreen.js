import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SharedHeader, HEADER_BG } from '../../components/common/SharedHeader';
import { DATE_FILTERS } from '../../data/resultadosData';
import { resultadoService } from '../../services/resultadoService';
import { useUsuario } from '../../hooks/useUsuario';

function getDateParam(filter) {
  const hoy = new Date();
  if (filter === 'Hoy') return hoy.toISOString().split('T')[0];
  if (filter === 'Ayer') {
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    return ayer.toISOString().split('T')[0];
  }
  return null;
}

function formatDay(dateStr) {
  if (!dateStr) return { day: '--', month: '---' };
  const d = new Date(dateStr);
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  return { day: String(d.getDate()).padStart(2, '0'), month: months[d.getMonth()] };
}

function MatchCard({ match }) {
  const { day, month } = formatDay(match.fecha_partido);
  const sL = match.sets_local ?? 0;
  const sV = match.sets_visitante ?? 0;
  return (
    <View style={styles.matchCard}>
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateMonth}>{month}</Text>
      </View>
      <View style={styles.matchInfo}>
        <View style={styles.vsRow}>
          <Text style={styles.playerName} numberOfLines={1}>{match.jugador_local}</Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={styles.playerName} numberOfLines={1}>{match.jugador_visitante}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.setsRow}>
            <View style={[styles.setsBadge, sL > sV && styles.setsBadgeWin]}>
              <Text style={[styles.setsNum, sL > sV && styles.setsNumWin]}>{sL}</Text>
            </View>
            <Text style={styles.setsSep}>-</Text>
            <View style={[styles.setsBadge, sV > sL && styles.setsBadgeWin]}>
              <Text style={[styles.setsNum, sV > sL && styles.setsNumWin]}>{sV}</Text>
            </View>
          </View>
          {match.estado_resultado ? (
            <Text style={styles.estadoText}>{match.estado_resultado}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function ResultadosScreen({ navigation }) {
  const usuario = useUsuario();
  const [activeFilter, setActiveFilter] = useState('Hoy');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData([]);
    const filtroFecha = getDateParam(activeFilter);
    resultadoService.listar({ filtroFecha })
      .then(res => setData(Array.isArray(res) ? res : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [activeFilter]);

  return (
    <SafeAreaView style={styles.safe}>
      <SharedHeader
        nombre={usuario?.nombre}
        deporte={usuario?.deporte}
        ranking={usuario?.ranking}
        calificacion={usuario?.calificacion}
        nivel={usuario?.nivel}
        puntos={usuario?.puntos}
        fotoPerfil={usuario?.foto_perfil_url}
      />
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Resultados</Text>

          <View style={styles.filterRow}>
            {DATE_FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
          ) : data.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay resultados</Text>
            </View>
          ) : (
            data.map((m) => <MatchCard key={m.id_resultado} match={m} />)
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: HEADER_BG },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    overflow: 'hidden',
  },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterBtnActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  filterText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    alignItems: 'center',
  },
  dateBlock: {
    width: 44,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 8,
  },
  dateDay: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  dateMonth: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  matchInfo: { flex: 1, gap: 8 },
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  vsText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  setsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  setsBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  setsBadgeWin: { backgroundColor: colors.accent, borderColor: colors.accent },
  setsNum: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  setsNumWin: { color: colors.primary },
  setsSep: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  estadoText: { fontSize: 12, color: colors.textSecondary },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
