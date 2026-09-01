import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { maestroService } from '../../services/maestroService';

const HORAS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function getNextDays(n = 14) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    days.push({ key: String(i), day: d.getDate(), month: MESES[d.getMonth()], iso: `${yyyy}-${mm}-${dd}` });
  }
  return days;
}

const DAYS = getNextDays(14);

function CanchaModal({ visible, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [canchas, setCanchas] = useState([]);
  const [loadingCanchas, setLoadingCanchas] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoadingCanchas(true);
    maestroService.canchas()
      .then(res => setCanchas(Array.isArray(res) ? res : []))
      .catch(() => setCanchas([]))
      .finally(() => setLoadingCanchas(false));
  }, [visible]);

  const filtered = canchas.filter(c =>
    (c.nombre ?? c.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Selecciona una cancha</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.dark} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cancha"
            placeholderTextColor="#9E9E9E"
            value={search}
            onChangeText={setSearch}
            underlineColorAndroid="transparent"
          />
        </View>
        {loadingCanchas ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView>
            {filtered.map((c, i) => {
              const id      = c.id_maestro ?? c.id ?? String(i);
              const nombre  = c.nombre ?? c.name ?? 'Cancha';
              const address = c.descripcion ?? c.valor ?? c.address ?? '';
              const fotoUri = c.foto_url ?? c.uri ?? null;
              return (
                <TouchableOpacity
                  key={id}
                  style={styles.courtCard}
                  onPress={() => onSelect({ id, nombre, address, fotoUri })}
                >
                  {fotoUri ? (
                    <Image source={{ uri: fotoUri }} style={styles.courtImg} />
                  ) : (
                    <View style={[styles.courtImg, { backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="tennisball-outline" size={28} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courtName}>{nombre}</Text>
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.courtAddress}> {address}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export function TomarClaseScreen({ navigation }) {
  const [cancha, setCancha] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [horas, setHoras] = useState([]);
  const [showCanchaModal, setShowCanchaModal] = useState(false);

  const canSearch = !!cancha && !!fecha && horas.length > 0;

  function toggleHora(h) {
    setHoras(prev =>
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tomar una clase</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Cancha */}
        <TouchableOpacity style={styles.canchaCard} onPress={() => setShowCanchaModal(true)} activeOpacity={0.8}>
          {cancha?.fotoUri ? (
            <Image source={{ uri: cancha.fotoUri }} style={styles.canchaImg} />
          ) : (
            <View style={[styles.canchaImg, styles.canchaImgPlaceholder]}>
              <Ionicons name={cancha ? 'tennisball-outline' : 'image-outline'} size={28} color={colors.textSecondary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.canchaName}>
              {cancha ? cancha.nombre : 'Selecciona una cancha'}
            </Text>
            <Text style={styles.canchaHint}>
              {cancha ? 'Toca para cambiar' : 'Toca para seleccionar una cancha'}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.mandatoryNote}>
          Es mandatorio para el usuario que busca tomar una clase separar la cancha elegida por un medio independiente.
        </Text>

        {/* Fecha */}
        <Text style={styles.sectionTitle}>Selecciona una fecha cercana</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hChipRow}
          style={styles.hScroll}
        >
          {DAYS.map(d => {
            const active = fecha?.key === d.key;
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.dateChip, active && styles.dateChipActive]}
                onPress={() => setFecha(d)}
              >
                <Text style={[styles.dateChipNum, active && styles.dateChipNumActive]}>{d.day}</Text>
                <Text style={[styles.dateChipMonth, active && styles.dateChipMonthActive]}>{d.month}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Horas — selección múltiple */}
        <Text style={styles.sectionTitle}>Selecciona horas disponibles</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hChipRow}
          style={styles.hScroll}
        >
          {HORAS.map(h => {
            const active = horas.includes(h);
            return (
              <TouchableOpacity
                key={h}
                style={[styles.horaChip, active && styles.horaChipActive]}
                onPress={() => toggleHora(h)}
              >
                <Text style={[styles.horaChipText, active && styles.horaChipTextActive]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
          disabled={!canSearch}
          onPress={() => navigation.navigate('ProfesoresDisponibles', { cancha, fecha, horas })}
        >
          <Text style={[styles.searchBtnText, !canSearch && styles.searchBtnTextDisabled]}>
            Buscar profesores
          </Text>
        </TouchableOpacity>
      </View>

      <CanchaModal
        visible={showCanchaModal}
        onClose={() => setShowCanchaModal(false)}
        onSelect={c => { setCancha(c); setShowCanchaModal(false); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  canchaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 14,
    marginBottom: 14,
  },
  canchaImg: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#ccc' },
  canchaImgPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canchaName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  canchaHint: { fontSize: 13, color: colors.textSecondary },

  mandatoryNote: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },

  hScroll: { marginHorizontal: -20, marginBottom: 24 },
  hChipRow: { paddingHorizontal: 20, gap: 10 },

  dateChip: {
    width: 68,
    height: 72,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipActive: { backgroundColor: colors.dark },
  dateChipNum: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  dateChipNumActive: { color: '#FFFFFF' },
  dateChipMonth: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  dateChipMonthActive: { color: '#FFFFFF' },

  horaChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horaChipActive: { backgroundColor: colors.dark },
  horaChipText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  horaChipTextActive: { color: '#FFFFFF', fontWeight: '600' },

  bottomBar: { paddingHorizontal: 20, paddingVertical: 16 },
  searchBtn: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  searchBtnDisabled: { backgroundColor: colors.surface },
  searchBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  searchBtnTextDisabled: { color: colors.textSecondary },

  // Modal cancha
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, flex: 1, paddingRight: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  courtCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
    gap: 14,
  },
  courtImg: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#ccc' },
  courtName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  courtAddress: { fontSize: 13, color: colors.textSecondary },
});
