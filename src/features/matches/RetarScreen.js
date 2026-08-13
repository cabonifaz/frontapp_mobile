import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { PROFILE_MOCK } from '../../data/profileData';
import { partidoService } from '../../services/partidoService';

function SuccessScreen({ player, onVolver }) {
  const firstName = player.name?.split(' ')[0] ?? player.name;
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.vsCircle}>
          <Image source={{ uri: PROFILE_MOCK.avatar }} style={styles.vsAvatar} />
          <Text style={styles.vsText}>vs</Text>
          <Image source={{ uri: player.avatar }} style={styles.vsAvatar} />
        </View>
        <Text style={styles.successTitle}>{'Has retado a\n'}{firstName}</Text>
        <Text style={styles.successSubtitle}>
          Espera a que {firstName} responda para poder ponerte de acuerdo con él.
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onVolver}>
        <Text style={styles.accentBtnText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

export function RetarScreen({ navigation, route }) {
  const player = route?.params?.player ?? {};
  const firstName = player.name?.split(' ')[0] ?? 'este jugador';
  const [success, setSuccess] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  async function handleConfirmar() {
    try {
      setConfirmando(true);
      const idPartido = player.id ?? player.id_partido ?? null;
      if (idPartido) await partidoService.postular(idPartido);
      setSuccess(true);
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo enviar el reto.');
    } finally {
      setConfirmando(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <SuccessScreen player={player} onVolver={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retar a {firstName}</Text>
      </View>

      <View style={styles.content}>
        {/* Jugador */}
        <TouchableOpacity
          style={styles.playerCard}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('PlayerProfile', {
            player: { nombre: player.name ?? player.nombre_usuario, pts: player.pts ?? player.puntaje_total ?? 177, ranking: player.ranking ?? player.posicion_ranking, avatar: player.avatar ?? player.foto_perfil_url, id_usuario: player.id_usuario ?? player.id_jugador }
          })}
        >
          <Image source={{ uri: player.avatar }} style={styles.playerAvatar} />
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{player.name}</Text>
            <View style={styles.rankRow}>
              <Ionicons name="trophy" size={14} color={colors.textPrimary} />
              <Text style={styles.rankText}> {player.ranking}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Detalles del partido */}
        <Text style={styles.sectionTitle}>Detalles del partido</Text>

        <View style={styles.detailCard}>
          <Ionicons name="location-outline" size={18} color={colors.textPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailMain}>{player.club}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.detailCard, { flex: 1, marginRight: 10 }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}>{player.date}</Text>
          </View>
          <View style={[styles.detailCard, { flex: 1 }]}>
            <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}>{player.time}</Text>
          </View>
        </View>

        {player.matchType && (
          <View style={styles.detailCard}>
            <Ionicons name="people-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}>{player.matchType}</Text>
          </View>
        )}

        <Text style={styles.note}>
          Al confirmar le enviarás un reto a {firstName}. Él podrá aceptarlo o rechazarlo.
        </Text>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmar} disabled={confirmando}>
          <Text style={styles.confirmBtnText}>{confirmando ? 'Enviando...' : 'Confirmar reto'}</Text>
        </TouchableOpacity>
      </View>
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

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 28,
  },
  playerAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ccc' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  rankRow: { flexDirection: 'row', alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },

  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 10,
  },
  detailRow: { flexDirection: 'row', marginBottom: 0 },
  detailMain: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  note: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: 12,
  },

  bottomBar: { paddingHorizontal: 20, paddingVertical: 16 },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },

  // Success
  successContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
  },
  vsCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E8E8E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  vsAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ccc',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  vsText: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
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
