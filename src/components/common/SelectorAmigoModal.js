import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { amistadService } from '../../services/amistadService';
import { getAvatarSource } from '../../utils/avatars';

/**
 * Lista de amigos para elegir compañero o rival.
 * `excluir`: ids de usuario que no deben aparecer.
 */
export function SelectorAmigoModal({ visible, titulo = 'Elige un amigo', excluir = [], onClose, onSelect, onSinAmigos }) {
  const [amigos, setAmigos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setSearch('');
    amistadService.listarAmigos()
      .then(res => setAmigos(Array.isArray(res) ? res : []))
      .catch(() => setAmigos([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const term = search.trim().toLowerCase();
  const disponibles = amigos.filter(a => !excluir.includes(a.id_usuario));
  const filtrados = term
    ? disponibles.filter(a => (a.nombre_completo ?? '').toLowerCase().includes(term))
    : disponibles;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>{titulo}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {disponibles.length > 0 && (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar amigo"
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              underlineColorAndroid="transparent"
            />
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : disponibles.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={44} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No tienes amigos disponibles</Text>
            <Text style={styles.emptyText}>
              Envía solicitudes de amistad desde el perfil de los jugadores del ranking.
            </Text>
            {onSinAmigos && (
              <TouchableOpacity style={styles.accentBtn} onPress={onSinAmigos}>
                <Text style={styles.accentBtnText}>Ir al ranking</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {filtrados.map(a => (
              <TouchableOpacity key={a.id_usuario} style={styles.card} onPress={() => onSelect(a)}>
                <Image source={getAvatarSource(a.foto_perfil_url)} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{a.nombre_completo}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="trophy" size={13} color={colors.textSecondary} />
                    <Text style={styles.meta}> {a.posicion_ranking ?? 'N/R'}   {Number(a.puntaje_total ?? 0).toFixed(1)} pts</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, flex: 1, paddingRight: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 28,
    paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 20, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 10,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ccc' },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 13, color: colors.textSecondary },
  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 40, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  accentBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 16, paddingHorizontal: 40 },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});