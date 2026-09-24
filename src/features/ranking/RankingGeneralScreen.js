import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { TEMPORADAS, FILTERS, PLAYER_DATA } from '../../data/rankingData';
import { rankingService } from '../../services/rankingService';
import { getAvatarSource } from '../../utils/avatars';

// Ranking general por puntaje total (el que estaba antes en la pestaña Ranking).
// Independiente de los puntos de liga.

function Podium({ players, onPress }) {
  if (!players || players.length < 3) return null;
  const top3 = players.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]];
  const stepHeights = [54, 80, 36];
  const avatarSizes = [64, 72, 64];
  const badgeColors = ['#888888', colors.accent, '#CD7F32'];

  return (
    <View style={styles.podiumCard}>
      <View style={styles.podiumStepsRow}>
        {order.map((p, i) => (
          <TouchableOpacity key={`${p.id_usuario ?? p.name}_${i}`} style={styles.podiumCol} onPress={() => onPress(p)} activeOpacity={0.75}>
            <View style={styles.podiumAvatarWrap}>
              <Image
                source={getAvatarSource(p.avatar)}
                style={[styles.podiumAvatar, { width: avatarSizes[i], height: avatarSizes[i], borderRadius: avatarSizes[i] / 2 }]}
              />
              <View style={[styles.posBadge, { backgroundColor: badgeColors[i] }]}>
                <Text style={styles.posBadgeText}>{p.pos}</Text>
              </View>
            </View>
            <View style={[styles.podiumStep, { height: stepHeights[i] }]} />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.podiumNamesRow}>
        {order.map((p, i) => (
          <TouchableOpacity key={`${p.id_usuario ?? p.name}_n${i}`} style={styles.podiumNameCol} onPress={() => onPress(p)} activeOpacity={0.75}>
            <Text style={styles.podiumName} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.podiumPts}>{Number(p.pts ?? 0).toFixed(1)} pts</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PlayerRow({ player, onPress }) {
  return (
    <TouchableOpacity style={styles.playerRow} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.playerPos}>{player.pos}</Text>
      <Image source={getAvatarSource(player.avatar)} style={styles.playerAvatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
        <Text style={styles.playerPts}>{Number(player.pts ?? 0).toFixed(1)} pts</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function RankingGeneralScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('General');
  const [temporada, setTemporada] = useState('Verano 2024');
  const [showModal, setShowModal] = useState(false);
  const [tempSelected, setTempSelected] = useState('Verano 2024');
  const [allPlayers, setAllPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const filtroGenero = filter === 'Masculino' ? 'Masculino'
      : filter === 'Femenino' ? 'Femenino' : null;
    setLoading(true);
    setSearch('');
    rankingService.listar({ filtroGenero, tamanoPagina: 50 })
      .then(data => {
        const normalized = (Array.isArray(data) ? data : []).map((p, index) => ({
          name:       p.nombre_completo ?? p.nombre_usuario ?? p.name ?? 'N/A',
          avatar:     p.foto_perfil_url ?? p.avatar ?? null,
          pts:        p.puntos          ?? p.puntaje_total  ?? p.pts ?? 0,
          pos:        index + 1,
          id_usuario: p.id_usuario,
        }));
        setAllPlayers(normalized.length ? normalized : (PLAYER_DATA[filter] ?? []));
      })
      .catch(() => setAllPlayers(PLAYER_DATA[filter] ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  const term = search.trim().toLowerCase();
  const players = term
    ? allPlayers.filter(p => String(p.name).toLowerCase().includes(term))
    : allPlayers;

  const abrirPerfil = (p) => navigation.navigate('PlayerProfile', {
    player: { nombre: p.name, pts: p.pts, ranking: p.pos, avatar: p.avatar, id_usuario: p.id_usuario },
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ranking general</Text>
        <TouchableOpacity style={styles.tempBtn} onPress={() => { setTempSelected(temporada); setShowModal(true); }}>
          <Text style={styles.tempText}>{temporada}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
      >
        <Text style={styles.hint}>Todos los jugadores ordenados por su puntaje general. No incluye los puntos de liga.</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textPrimary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar jugador"
            placeholderTextColor="#9E9E9E"
            underlineColorAndroid="transparent"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#9E9E9E" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : players.length === 0 ? (
          <Text style={styles.emptyText}>{term ? `Sin resultados para "${search}"` : 'No hay jugadores en el ranking aún'}</Text>
        ) : (
          <>
            {!term && players.length >= 3 && <Podium players={players} onPress={abrirPerfil} />}
            {(term ? players : players.length >= 3 ? players.slice(3) : players).map((p) => (
              <PlayerRow key={p.id_usuario ?? p.pos} player={p} onPress={() => abrirPerfil(p)} />
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 40 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona la temporada</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {TEMPORADAS.map((t) => (
              <TouchableOpacity key={t} style={styles.modalOption} onPress={() => setTempSelected(t)}>
                <View style={[styles.radioOuter, tempSelected === t && styles.radioOuterActive]}>
                  {tempSelected === t && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.modalOptionText}>{t}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.filterApplyBtn}
              onPress={() => { setTemporada(tempSelected); setShowModal(false); }}
            >
              <Text style={styles.filterApplyText}>Filtrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  tempBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tempText: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },

  content: { paddingHorizontal: 24, paddingTop: 4 },
  hint: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 28,
    paddingHorizontal: 16, paddingVertical: 12, gap: 10, marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  filterBtnActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  filterText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },

  podiumCard: {
    backgroundColor: colors.surface, borderRadius: 20,
    paddingTop: 20, paddingHorizontal: 12, paddingBottom: 16, marginBottom: 16,
  },
  podiumStepsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  podiumCol: { flex: 1, alignItems: 'center' },
  podiumAvatarWrap: { marginBottom: 6, alignItems: 'center' },
  podiumAvatar: { backgroundColor: '#ccc' },
  posBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  posBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  podiumStep: { width: '100%', backgroundColor: '#DCDCDC', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  podiumNamesRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  podiumNameCol: { flex: 1, alignItems: 'center' },
  podiumName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  podiumPts: { fontSize: 11, color: colors.textSecondary },

  playerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, marginBottom: 10, gap: 14,
  },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 40, fontSize: 15 },
  playerPos: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, width: 26 },
  playerAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ccc' },
  playerName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  playerPts: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, minHeight: '55%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 16,
    backgroundColor: colors.surface, borderRadius: 14, marginBottom: 10,
  },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  modalOptionText: { fontSize: 15, color: colors.textPrimary },
  filterApplyBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginTop: 16 },
  filterApplyText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});