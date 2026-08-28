import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { COURTS, DATES, HOURS, MATCH_TYPES } from '../../data/buscarPartidoData';
import { partidoService } from '../../services/partidoService';
import { DEPORTE_DEFAULT } from '../../constants/maestro';

const TABS = ['Rankeado', 'Amistoso'];
const FILTER_KEYS = ['cancha', 'fecha', 'hora', 'partido'];
const FILTER_LABELS = { cancha: 'Cancha', fecha: 'Fecha', hora: 'Hora', partido: 'Partido' };

// --- Funciones de ayuda para limpiar los datos del backend ---
function formatFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  if (fecha.includes('T')) {
    const [year, month, day] = fecha.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }
  return fecha;
}

function formatHora(hora) {
  if (!hora) return 'Sin hora';
  if (hora.split(':').length >= 2) {
    const partes = hora.split(':');
    return `${partes[0]}:${partes[1]}`; // Toma solo HH:mm
  }
  return hora;
}
// -----------------------------------------------------------

function getFilteredPlayers(filters, base) {
  return base.filter(p => {
    // TODO: Los filtros visuales están desactivados temporalmente porque los formatos
    // de fecha/cancha del backend no coinciden con los valores de los modales estáticos.
    // Reactivar una vez que los modales usen datos reales del backend.
    // if (filters.cancha && p.club !== filters.cancha) return false;
    // if (filters.fecha && p.date !== filters.fecha) return false;
    // if (filters.hora && p.time !== filters.hora) return false;
    // if (filters.partido && p.matchType !== filters.partido) return false;
    return true;
  });
}

function FilterChip({ label, active, onPress, onRemove }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={active ? onRemove : onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}{active ? '  ×' : ''}
      </Text>
    </TouchableOpacity>
  );
}

function PlayerCard({ player, onPress, onRetarPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <Image source={{ uri: player.avatar }} style={styles.cardAvatar} />
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Ionicons name="trophy" size={13} color={colors.textPrimary} style={{ marginLeft: 6 }} />
          <Text style={styles.playerRanking}> {player.ranking}</Text>
        </View>
        <Text style={styles.playerClub} numberOfLines={1}>{player.club}</Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}> {player.date}</Text>
          <Text style={{ width: 10 }} />
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.metaText}> {player.time}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.timeAgo}>Hace 15 min.</Text>
        <TouchableOpacity style={styles.retarBtn} onPress={onRetarPress}>
          <Text style={styles.retarText}>Retar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function CanchaModal({ visible, onClose, onAdd }) {
  const [search, setSearch] = useState('');
  const filtered = COURTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Selecciona una cancha</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalSearchBar}>
          <Ionicons name="search" size={18} color={colors.dark} />
          <TextInput style={styles.modalSearchInput} placeholder="Buscar cancha" placeholderTextColor="#9E9E9E" value={search} onChangeText={setSearch} />
        </View>
        <ScrollView style={styles.modalScroll}>
          {filtered.map(c => (
            <TouchableOpacity key={c.id} style={styles.courtCard} onPress={() => onAdd(c.name)}>
              <Image source={{ uri: c.uri }} style={styles.courtImg} />
              <View style={styles.courtInfo}>
                <Text style={styles.courtName}>{c.name}</Text>
                <View style={styles.courtAddressRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.courtAddress}> {c.address}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function FechaModal({ visible, onClose, onAdd }) {
  const [selected, setSelected] = useState('12');
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Selecciona una fecha</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
        </View>
        <View style={styles.dateGrid}>
          {DATES.map(d => (
            <TouchableOpacity key={d} style={[styles.dateCell, selected === d && styles.dateCellActive]} onPress={() => setSelected(d)}>
              <Text style={[styles.dateNum, selected === d && styles.dateNumActive]}>{d}</Text>
              <Text style={[styles.dateMonth, selected === d && styles.dateMonthActive]}>FEB</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.addFilterBtn} onPress={() => onAdd(`${selected} Feb`)}>
            <Text style={styles.addFilterText}>Añadir filtro</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function HoraModal({ visible, onClose, onAdd }) {
  const [selected, setSelected] = useState('15:00');
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Selecciona horas</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
        </View>
        <View style={styles.hourGrid}>
          {HOURS.map(h => (
            <TouchableOpacity key={h} style={[styles.hourCell, selected === h && styles.hourCellActive]} onPress={() => setSelected(h)}>
              <Text style={[styles.hourText, selected === h && styles.hourTextActive]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.addFilterBtn} onPress={() => onAdd(selected)}>
            <Text style={styles.addFilterText}>Añadir filtro</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function PartidoModal({ visible, onClose, onAdd }) {
  const [selected, setSelected] = useState('1 vs 1');
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Tipo de partido</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
        </View>
        <View style={styles.radioList}>
          {MATCH_TYPES.map(type => (
            <TouchableOpacity key={type} style={styles.radioOption} onPress={() => setSelected(type)}>
              <View style={[styles.radioOuter, selected === type && styles.radioOuterActive]}>
                {selected === type && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.addFilterBtn} onPress={() => onAdd(selected)}>
            <Text style={styles.addFilterText}>Añadir filtro</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function BuscarPartidoScreen({ navigation, route }) {
  const initialTab = route?.params?.tab || 'Rankeado';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filters, setFilters] = useState({ cancha: null, fecha: null, hora: null, partido: null });
  const [openModal, setOpenModal] = useState(null);
  const [basePlayers, setBasePlayers] = useState([]);
  const [loading, setLoading] = useState(false);

  const players = getFilteredPlayers(filters, basePlayers);
  const hasFilters = Object.values(filters).some(Boolean);

  useEffect(() => {
    setBasePlayers([]);
    setLoading(true);
    const call = activeTab === 'Rankeado'
      ? partidoService.buscarRankeado({ idDeporte: DEPORTE_DEFAULT })
      : partidoService.buscarAmistoso({ idDeporte: DEPORTE_DEFAULT });

    call
      .then(res => {
        if (Array.isArray(res) && res.length) {
          const normalized = res.map(p => ({
            id:         p.id_partido,
            id_partido: p.id_partido,
            id_usuario: p.id_usuario,
            name:       p.nombre_completo ?? p.name ?? 'N/A',
            avatar:     p.foto_perfil_url ?? p.avatar ?? null,
            ranking:    p.posicion_ranking ?? p.ranking ?? null,
            pts:        p.puntaje_total   ?? p.pts    ?? null,
            club:       p.cancha ?? p.nombre_cancha ?? p.ubicacion ?? 'Cancha no especificada',
            date:       formatFecha(p.fecha_partido ?? p.date),
            time:       formatHora(p.hora_partido ?? p.time),
          }));
          setBasePlayers(normalized);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab]);

  function applyFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setOpenModal(null);
  }

  function removeFilter(key) {
    setFilters(prev => ({ ...prev, [key]: null }));
  }

  function switchTab(tab) {
    setActiveTab(tab);
    setFilters({ cancha: null, fecha: null, hora: null, partido: null });
    setOpenModal(null);
  }

  const btnText = activeTab === 'Rankeado'
    ? 'Crear Partido Rankeado'
    : hasFilters ? 'Buscar Partido Amistoso' : 'Crear Partido Amistoso';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar partido</Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => switchTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>
          Partidos {activeTab === 'Rankeado' ? 'rankeados' : 'amistosos'}
        </Text>
        <View style={styles.countRow}>
          <View style={styles.greenDot} />
          <Text style={styles.countText}>
            {players.length > 0
              ? `${players.length} ${activeTab === 'Rankeado' ? 'jugadores de tu nivel' : 'buscando partido'}`
              : 'Sin partidos disponibles'}
          </Text>
        </View>

        {activeTab === 'Amistoso' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.chipScroll}>
            {FILTER_KEYS.map(key => (
              <FilterChip key={key} label={FILTER_LABELS[key]} active={!!filters[key]} onPress={() => setOpenModal(key)} onRemove={() => removeFilter(key)} />
            ))}
          </ScrollView>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : players.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="tennisball-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No hay partidos disponibles</Text>
          </View>
        ) : (
          players.map(p => (
            <PlayerCard
              key={p.id}
              player={p}
              onPress={() => navigation.navigate('PlayerProfile', { player: { nombre: p.name ?? p.nombre_usuario, pts: p.pts ?? p.puntaje_total, ranking: p.ranking ?? p.posicion_ranking, avatar: p.avatar ?? p.foto_perfil_url, id_usuario: p.id_usuario ?? p.id_jugador } })}
              onRetarPress={() => navigation.navigate('RetarJugador', { player: p })}
            />
          ))
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => navigation.navigate('CrearPartido', { tipo: activeTab })}>
          <Ionicons name="person-add-outline" size={20} color={colors.primary} />
          <Text style={styles.bottomBtnText}>{btnText}</Text>
        </TouchableOpacity>
      </View>

      <CanchaModal visible={openModal === 'cancha'} onClose={() => setOpenModal(null)} onAdd={v => applyFilter('cancha', v)} />
      <FechaModal visible={openModal === 'fecha'} onClose={() => setOpenModal(null)} onAdd={v => applyFilter('fecha', v)} />
      <HoraModal visible={openModal === 'hora'} onClose={() => setOpenModal(null)} onAdd={v => applyFilter('hora', v)} />
      <PartidoModal visible={openModal === 'partido'} onClose={() => setOpenModal(null)} onAdd={v => applyFilter('partido', v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabText: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent, borderRadius: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 6 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.positive },
  countText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  chipScroll: { marginHorizontal: -20, marginBottom: 16 },
  chipRow: { paddingHorizontal: 20, gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.dark },
  chipText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 12, alignItems: 'center', gap: 12 },
  cardAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ccc' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  playerName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  playerRanking: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  playerClub: { fontSize: 13, color: colors.textSecondary, marginBottom: 5, fontStyle: 'italic' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: colors.textSecondary },
  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' },
  timeAgo: { fontSize: 11, color: colors.textSecondary },
  retarBtn: { borderWidth: 1.5, borderColor: colors.textPrimary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  retarText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  emptyState: { alignItems: 'center', marginTop: 48, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  bottomBar: { paddingHorizontal: 20, paddingVertical: 16 },
  bottomBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  bottomBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, flex: 1, paddingRight: 12 },
  modalScroll: { flex: 1 },
  modalSearchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 28, paddingHorizontal: 16, paddingVertical: 12, gap: 10, marginHorizontal: 20, marginBottom: 16 },
  modalSearchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  courtCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginHorizontal: 20, marginBottom: 12, alignItems: 'center', gap: 14 },
  courtImg: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#ccc' },
  courtInfo: { flex: 1 },
  courtName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  courtAddressRow: { flexDirection: 'row', alignItems: 'center' },
  courtAddress: { fontSize: 13, color: colors.textSecondary },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  dateCell: { width: '22%', aspectRatio: 1, backgroundColor: colors.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateCellActive: { backgroundColor: colors.dark },
  dateNum: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  dateNumActive: { color: '#FFFFFF' },
  dateMonth: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  dateMonthActive: { color: '#FFFFFF' },
  hourGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  hourCell: { width: '22%', paddingVertical: 13, backgroundColor: colors.surface, borderRadius: 24, alignItems: 'center' },
  hourCellActive: { backgroundColor: colors.dark },
  hourText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  hourTextActive: { color: '#FFFFFF', fontWeight: '600' },
  radioList: { paddingHorizontal: 20, gap: 10 },
  radioOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 18, gap: 14 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: colors.textPrimary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textPrimary },
  radioText: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  modalFooter: { paddingHorizontal: 20, paddingVertical: 20 },
  addFilterBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  addFilterText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});