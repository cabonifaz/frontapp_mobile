import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { COURTS } from '../../data/buscarPartidoData';
import { partidoService } from '../../services/partidoService';
import { TIPOS_JUEGO, DEPORTE_DEFAULT } from '../../constants/maestro';

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

const TIPO_JUEGO_MAP = {
  '1 vs 1': TIPOS_JUEGO.UNO_VS_UNO,
  '2 vs 2': TIPOS_JUEGO.DOBLES,
};

const DAYS = getNextDays(14);

function CanchaModal({ visible, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const filtered = COURTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
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
        <ScrollView>
          {filtered.map(c => (
            <TouchableOpacity key={c.id} style={styles.courtCard} onPress={() => onSelect(c)}>
              <Image source={{ uri: c.uri }} style={styles.courtImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.courtName}>{c.name}</Text>
                <View style={styles.addressRow}>
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

function SuccessScreen({ onPress }) {
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.successCircle}>
          <MaterialCommunityIcons name="tennis" size={72} color={colors.dark} />
        </View>
        <Text style={styles.successTitle}>{'¡Genial!\nHas creado una partida'}</Text>
        <Text style={styles.successSubtitle}>
          Acepta al jugador con el que desees jugar desde "Mis Solicitudes"
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={() => onPress('MisSolicitudes')}>
        <Text style={styles.accentBtnText}>Ir a mis solicitudes</Text>
      </TouchableOpacity>
    </View>
  );
}

export function CrearPartidoScreen({ navigation, route }) {
  const tipo = route?.params?.tipo ?? 'Rankeado';
  const [cancha, setCancha] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const [tipoJuego, setTipoJuego] = useState('1 vs 1');
  const [showCanchaModal, setShowCanchaModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [creando, setCreando] = useState(false);

  const canConfirm = !!cancha && !!fecha && !!hora;

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <SuccessScreen onPress={(dest) => navigation.navigate(dest)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Partido {tipo}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Reglas de matchmaking — solo para Rankeado */}
        {tipo === 'Rankeado' && (
          <View style={styles.matchmakingCard}>
            <View style={styles.matchmakingHeader}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
              <Text style={styles.matchmakingTitle}>Reglas de matchmaking</Text>
            </View>
            <View style={styles.matchmakingRow}>
              <Ionicons name="trophy-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.matchmakingText}>Se emparejará con jugadores dentro de ±3 posiciones de tu ranking</Text>
            </View>
            <View style={styles.matchmakingRow}>
              <Ionicons name="ribbon-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.matchmakingText}>El resultado afecta tu posición en el ranking global</Text>
            </View>
            <View style={styles.matchmakingRow}>
              <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.matchmakingText}>Debes ingresar el resultado dentro de 12 horas del partido</Text>
            </View>
          </View>
        )}

        {/* Cancha */}
        <TouchableOpacity style={styles.canchaCard} onPress={() => setShowCanchaModal(true)} activeOpacity={0.8}>
          {cancha ? (
            <Image source={{ uri: cancha.uri }} style={styles.canchaImg} />
          ) : (
            <View style={[styles.canchaImg, styles.canchaImgPlaceholder]}>
              <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.canchaName}>
              {cancha ? cancha.name : 'Selecciona una cancha'}
            </Text>
            <Text style={styles.canchaHint}>
              {cancha ? 'Toca para cambiar' : 'Toca para seleccionar una cancha'}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.mandatoryNote}>
          Es mandatorio para el anfitrión del partido separar la cancha elegida por un medio independiente.
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

        {/* Hora */}
        <Text style={styles.sectionTitle}>Selecciona horas disponibles</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hChipRow}
          style={styles.hScroll}
        >
          {HORAS.map(h => {
            const active = hora === h;
            return (
              <TouchableOpacity
                key={h}
                style={[styles.horaChip, active && styles.horaChipActive]}
                onPress={() => setHora(h)}
              >
                <Text style={[styles.horaChipText, active && styles.horaChipTextActive]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tipo de juego */}
        <Text style={styles.sectionTitle}>Selecciona tipo de juego</Text>
        <View style={styles.toggle}>
          {['1 vs 1', '2 vs 2'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.toggleBtn, tipoJuego === t && styles.toggleBtnActive]}
              onPress={() => setTipoJuego(t)}
            >
              <Text style={[styles.toggleText, tipoJuego === t && styles.toggleTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón confirmar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          disabled={!canConfirm}
          onPress={async () => {
            try {
              setCreando(true);
              const datos = {
                id_cancha:     cancha.id,
                fecha:         fecha.iso,
                hora,
                id_tipo_juego: TIPO_JUEGO_MAP[tipoJuego] ?? TIPOS_JUEGO.UNO_VS_UNO,
                id_deporte:    DEPORTE_DEFAULT,
              };
              if (tipo === 'Rankeado') {
                await partidoService.crearRankeado(datos);
              } else {
                await partidoService.crearAmistoso(datos);
              }
              setSuccess(true);
            } catch (e) {
              Alert.alert('Error', e.message ?? 'No se pudo crear el partido.');
            } finally {
              setCreando(false);
            }
          }}
        >
          <Text style={[styles.confirmBtnText, !canConfirm && styles.confirmBtnTextDisabled]}>
            {creando ? 'Creando...' : 'Confirmar'}
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

  matchmakingCard: {
    backgroundColor: colors.accentLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  matchmakingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  matchmakingTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  matchmakingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  matchmakingText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 },

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

  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 28,
  },
  toggleBtnActive: { backgroundColor: colors.dark },
  toggleText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: '#FFFFFF' },

  bottomBar: { paddingHorizontal: 20, paddingVertical: 16 },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: colors.surface },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  confirmBtnTextDisabled: { color: colors.textSecondary },

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

  // Success
  successContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
  },
  successCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  accentBtn: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
