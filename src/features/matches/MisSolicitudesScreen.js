import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { PROFILE_MOCK } from '../../data/profileData';

const PARTIDO_CREADO = {
  cancha: 'Club Terrazas Miraflores',
  uri: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=200&q=80',
  date: '15 Feb',
  time: '15:00',
};

const FECHAS = ['15 Feb', '17 Feb', '19 Feb'];

const RETADORES = [
  { id: '1', name: 'R. Pino', fullName: 'Renato Pino', ranking: 33, club: 'Club Terrazas Miraflores', date: '12 Feb', time: '15:00', avatar: 'https://i.pravatar.cc/150?img=17' },
  { id: '2', name: 'A. Ortiz', fullName: 'Alonso Ortiz', ranking: 32, club: 'Club Terrazas Miraflores', date: '12 Feb', time: '15:00', avatar: 'https://i.pravatar.cc/150?img=22' },
  { id: '3', name: 'O. Bendezú', fullName: 'Osman Bendezú', ranking: 33, club: 'Club Terrazas Miraflores', date: '15 Feb', time: '15:00', avatar: 'https://i.pravatar.cc/150?img=40' },
];

function SuccessScreen({ retador, onPress }) {
  const firstName = retador.fullName.split(' ')[0];
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.vsCircle}>
          <Image source={{ uri: PROFILE_MOCK.avatar }} style={styles.vsAvatar} />
          <Text style={styles.vsText}>vs</Text>
          <Image source={{ uri: retador.avatar }} style={styles.vsAvatar} />
        </View>
        <Text style={styles.successTitle}>
          Has aceptado a{'\n'}{firstName} como retador
        </Text>
        <Text style={styles.successSubtitle}>
          Chatea con él para ponerte de acuerdo desde "Mis partidos".
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onPress}>
        <Text style={styles.accentBtnText}>Ir a mis partidos</Text>
      </TouchableOpacity>
    </View>
  );
}

export function MisSolicitudesScreen({ navigation }) {
  const [fechaActiva, setFechaActiva] = useState('15 Feb');
  const [retadorAceptado, setRetadorAceptado] = useState(null);
  const [cancelado, setCancelado] = useState(false);

  if (retadorAceptado) {
    return (
      <SafeAreaView style={styles.safe}>
        <SuccessScreen
          retador={retadorAceptado}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Partidos' })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis solicitudes</Text>
      </View>

      {/* Tabs de fecha */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fechaTabRow}
        style={styles.fechaTabScroll}
      >
        {FECHAS.map(f => (
          <TouchableOpacity
            key={f}
            style={styles.fechaTab}
            onPress={() => setFechaActiva(f)}
          >
            <Text style={[styles.fechaTabText, fechaActiva === f && styles.fechaTabTextActive]}>{f}</Text>
            {fechaActiva === f && <View style={styles.fechaTabIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Partido creado */}
        {!cancelado ? (
          <View style={styles.partidoCard}>
            <Image source={{ uri: PARTIDO_CREADO.uri }} style={styles.partidoImg} />
            <View style={styles.partidoInfo}>
              <Text style={styles.partidoCancha}>{PARTIDO_CREADO.cancha}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.metaText}> {PARTIDO_CREADO.date}</Text>
                <Text style={{ width: 10 }} />
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.metaText}> {PARTIDO_CREADO.time}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setCancelado(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle-outline" size={26} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.partidoCard, { opacity: 0.4 }]}>
            <View style={[styles.partidoImg, { backgroundColor: '#ccc' }]} />
            <Text style={styles.partidoCancha}>Partido cancelado</Text>
          </View>
        )}

        {/* Jugadores retándote */}
        <Text style={styles.sectionTitle}>Jugadores retándote</Text>
        {RETADORES.map(r => (
          <View key={r.id} style={styles.retadorCard}>
            <Image source={{ uri: r.avatar }} style={styles.retadorAvatar} />
            <View style={styles.retadorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.retadorName}>{r.name}</Text>
                <Ionicons name="trophy" size={13} color={colors.textPrimary} style={{ marginLeft: 6 }} />
                <Text style={styles.retadorRanking}> {r.ranking}</Text>
              </View>
              <Text style={styles.retadorClub}>{r.club}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.metaText}> {r.date}</Text>
                <Text style={{ width: 10 }} />
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.metaText}> {r.time}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.aceptarBtn} onPress={() => setRetadorAceptado(r)}>
              <Text style={styles.aceptarText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
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

  fechaTabScroll: { borderBottomWidth: 1, borderBottomColor: colors.border },
  fechaTabRow: { paddingHorizontal: 20 },
  fechaTab: {
    paddingVertical: 14,
    marginRight: 24,
    position: 'relative',
  },
  fechaTabText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  fechaTabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  fechaTabIndicator: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },

  content: { paddingHorizontal: 20, paddingTop: 16 },

  partidoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 14,
    marginBottom: 24,
  },
  partidoImg: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#ccc' },
  partidoInfo: { flex: 1 },
  partidoCancha: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },

  retadorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  retadorAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ccc' },
  retadorInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  retadorName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  retadorRanking: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  retadorClub: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontStyle: 'italic' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: colors.textSecondary },

  aceptarBtn: {
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  aceptarText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

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
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#ccc',
    borderWidth: 3, borderColor: '#FFFFFF',
  },
  vsText: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
  successTitle: {
    fontSize: 24, fontWeight: 'bold', color: colors.textPrimary,
    textAlign: 'center', lineHeight: 32, marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  accentBtn: {
    backgroundColor: colors.accent,
    borderRadius: 30, paddingVertical: 18, alignItems: 'center',
  },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
