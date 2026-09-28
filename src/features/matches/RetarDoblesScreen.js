import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SelectorAmigoModal } from '../../components/common/SelectorAmigoModal';
import { doblesService, primerNombre } from '../../services/doblesService';
import { getAvatarSource } from '../../utils/avatars';

// Retar una convocatoria de dobles: el retador elige a su compañero (amigo),
// que debe aceptar; luego la pareja creadora decide.
export function RetarDoblesScreen({ navigation, route }) {
  const conv = route?.params?.convocatoria ?? {};
  const onRetadoExitoso = route?.params?.onRetadoExitoso;

  const [companero, setCompanero] = useState(null);
  const [showSelector, setShowSelector] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const excluir = [conv.id_usuario, conv.id_companero].filter(Boolean);

  async function handleRetar() {
    if (!companero) return;
    try {
      setEnviando(true);
      await doblesService.postular(conv.id_partido, companero.id_usuario);
      onRetadoExitoso?.();
      setEnviado(true);
    } catch (e) {
      Alert.alert('No se pudo enviar el reto', e.message ?? 'Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={styles.successCircle}>
              <Ionicons name="people" size={72} color={colors.dark} />
            </View>
            <Text style={styles.successTitle}>¡Reto enviado!</Text>
            <Text style={styles.successSubtitle}>
              Cuando {primerNombre(companero?.nombre_completo)} acepte ser tu compañero,
              {' '}{primerNombre(conv.nombre_completo)} y {primerNombre(conv.nombre_companero)} decidirán si aceptan el reto.
            </Text>
          </View>
          <TouchableOpacity style={styles.accentBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.accentBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retar en dobles</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pareja que convoca */}
        <Text style={styles.sectionTitle}>Pareja rival</Text>
        <View style={styles.parejaCard}>
          {[
            { nombre: conv.nombre_completo, foto: conv.foto_perfil_url },
            { nombre: conv.nombre_companero, foto: conv.foto_companero },
          ].map((j, i) => (
            <View key={i} style={styles.jugador}>
              <Image source={getAvatarSource(j.foto)} style={styles.avatar} />
              <Text style={styles.jugadorNombre} numberOfLines={1}>{j.nombre ?? 'Jugador'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={15} color={colors.textPrimary} />
            <Text style={styles.infoText} numberOfLines={1}>{conv.club ?? conv.nombre_cancha ?? 'Cancha'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={15} color={colors.textPrimary} />
            <Text style={styles.infoText}>{conv.date ?? '--'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={15} color={colors.textPrimary} />
            <Text style={styles.infoText}>{conv.time ?? '--'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="tennisball-outline" size={15} color={colors.textPrimary} />
            <Text style={styles.infoText}>{Number(conv.num_sets) === 3 ? '2 de 3 sets' : '3 de 5 sets'}</Text>
          </View>
        </View>

        {/* Mi compañero */}
        <Text style={styles.sectionTitle}>Tu compañero</Text>
        <TouchableOpacity style={styles.slot} onPress={() => setShowSelector(true)} activeOpacity={0.8}>
          {companero ? (
            <Image source={getAvatarSource(companero.foto_perfil_url)} style={styles.slotAvatar} />
          ) : (
            <View style={[styles.slotAvatar, styles.slotPlaceholder]}>
              <Ionicons name="person-add-outline" size={24} color={colors.textSecondary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.slotName}>{companero ? companero.nombre_completo : 'Selecciona un amigo'}</Text>
            <Text style={styles.slotHint}>
              {companero ? 'Toca para cambiar' : 'Recibirá una invitación y debe aceptarla'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.note}>
          El partido se confirma cuando tu compañero acepte y la pareja rival apruebe el reto.
          Luego podrán coordinar los 4 por el chat del partido.
        </Text>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, (!companero || enviando) && styles.confirmBtnDisabled]}
          disabled={!companero || enviando}
          onPress={handleRetar}
        >
          {enviando
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={[styles.confirmBtnText, !companero && styles.confirmBtnTextDisabled]}>Enviar reto</Text>}
        </TouchableOpacity>
      </View>

      <SelectorAmigoModal
        visible={showSelector}
        titulo="¿Quién será tu compañero?"
        excluir={excluir}
        onClose={() => setShowSelector(false)}
        onSelect={a => { setCompanero(a); setShowSelector(false); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 8 },

  parejaCard: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 18, marginBottom: 14,
  },
  jugador: { alignItems: 'center', width: '45%' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ccc', marginBottom: 8 },
  jugadorNombre: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },

  slot: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 12,
  },
  slotAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ccc' },
  slotPlaceholder: { backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  slotName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  slotHint: { fontSize: 12, color: colors.textSecondary },

  note: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  bottomBar: { paddingHorizontal: 20, paddingVertical: 16 },
  confirmBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center', minHeight: 56, justifyContent: 'center' },
  confirmBtnDisabled: { backgroundColor: colors.surface },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  confirmBtnTextDisabled: { color: colors.textSecondary },

  successContainer: { flex: 1, paddingHorizontal: 32, paddingBottom: 40, paddingTop: 20 },
  successCircle: {
    width: 160, height: 160, borderRadius: 80, backgroundColor: colors.accentLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  successSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  accentBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center' },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});