import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Image, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SharedHeader, HEADER_BG } from '../../components/common/SharedHeader';
import { DATE_FILTERS } from '../../data/resultadosData';
import { resultadoService } from '../../services/resultadoService';
import { useUsuario } from '../../hooks/useUsuario';
import { getAvatarSource } from '../../utils/avatars';

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

function formatSectionDate(dateStr) {
  if (!dateStr || dateStr === 'Sin fecha') return dateStr;
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function formatDay(dateStr) {
  if (!dateStr) return { day: '--', month: '---' };
  const [year, month, day] = (dateStr.split('T')[0]).split('-').map(Number);
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  return { day: String(day).padStart(2, '0'), month: months[month - 1] };
}

function groupByDate(items) {
  const map = {};
  items.forEach(item => {
    const key = (item.fecha_partido ?? '').split('T')[0] || 'Sin fecha';
    if (!map[key]) map[key] = { label: formatSectionDate(key), items: [] };
    map[key].items.push(item);
  });
  return Object.values(map);
}

function MatchCard({ match, onPress }) {
  const { day, month } = formatDay(match.fecha_partido);

  const sets = [
    [match.set1_local, match.set1_visitante],
    [match.set2_local, match.set2_visitante],
    [match.set3_local, match.set3_visitante],
  ].filter(([l, v]) => l != null || v != null);

  return (
    <TouchableOpacity style={styles.matchCard} onPress={onPress} activeOpacity={0.75}>
      {/* Bloque de fecha */}
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateMonth}>{month}</Text>
      </View>

      {/* Contenido del partido */}
      <View style={styles.matchContent}>
        {/* Fila jugador local */}
        <View style={styles.playerRow}>
          <Image source={getAvatarSource(match.foto_local)} style={styles.playerAvatar} />
          <Text style={styles.playerName} numberOfLines={1}>{match.jugador_local}</Text>
          <View style={styles.scoresRow}>
            {sets.map(([l], i) => (
              <View key={i} style={styles.scoreBox}>
                <Text style={styles.scoreNum}>{l ?? '-'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Fila jugador visitante */}
        <View style={styles.playerRow}>
          <Image source={getAvatarSource(match.foto_visitante)} style={styles.playerAvatar} />
          <Text style={styles.playerName} numberOfLines={1}>{match.jugador_visitante}</Text>
          <View style={styles.scoresRow}>
            {sets.map(([, v], i) => (
              <View key={i} style={styles.scoreBox}>
                <Text style={styles.scoreNum}>{v ?? '-'}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ResultadosScreen({ navigation }) {
  const usuario = useUsuario();
  const [activeFilter, setActiveFilter] = useState('Hoy');
  const [busqueda, setBusqueda] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setData([]);
      const filtroFecha = getDateParam(activeFilter);
      resultadoService.listar({ filtroFecha, busquedaNombre: busqueda || null })
        .then(res => setData(Array.isArray(res) ? res : []))
        .catch(() => setData([]))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [activeFilter, busqueda]);

  const grouped = groupByDate(data);

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.pageTitle}>Resultados</Text>

          {/* Buscador */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar jugador"
              placeholderTextColor={colors.textSecondary}
              value={busqueda}
              onChangeText={setBusqueda}
              returnKeyType="search"
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros de fecha */}
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

          {/* Contenido */}
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
          ) : grouped.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay resultados</Text>
            </View>
          ) : (
            grouped.map(group => (
              <View key={group.label}>
                <Text style={styles.sectionLabel}>{group.label}</Text>
                {group.items.map(m => (
                  <MatchCard
                    key={m.id_resultado}
                    match={m}
                    onPress={() => navigation.navigate('DetalleResultado', { match: m })}
                  />
                ))}
              </View>
            ))
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
    overflow: 'hidden',
  },
  content: { paddingHorizontal: 20, paddingTop: 24 },

  pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 16 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },

  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
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

  sectionLabel: {
    fontSize: 15, fontWeight: 'bold', color: colors.textPrimary,
    marginTop: 8, marginBottom: 10,
  },

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

  matchContent: { flex: 1, gap: 6 },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#ccc',
  },
  playerName: {
    flex: 1,
    fontSize: 13, fontWeight: '600', color: colors.textPrimary,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 4,
  },
  scoreBox: {
    width: 26, height: 26,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: {
    fontSize: 12, fontWeight: '700', color: colors.textPrimary,
  },

  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
