import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';

const PROFESORES_MOCK = [
  {
    id: '1',
    name: 'O. Bendezú',
    fullName: 'Osman Bendezú',
    ranking: 27,
    club: 'Club Real Lima',
    date: '15 Feb',
    time: '15:00',
    avatar: 'https://i.pravatar.cc/150?img=40',
    timeAgo: 'Hace 15 min.',
  },
];

function ProfesorCard({ profesor, onSolicitar }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: profesor.avatar }} style={styles.cardAvatar} />
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName}>{profesor.name}</Text>
          <Ionicons name="trophy" size={13} color={colors.textPrimary} style={{ marginLeft: 6 }} />
          <Text style={styles.cardRanking}> {profesor.ranking}</Text>
        </View>
        <Text style={styles.cardClub}>{profesor.club}</Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.cardMeta}> {profesor.date}</Text>
          <Text style={{ width: 10 }} />
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.cardMeta}> {profesor.time}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.timeAgo}>{profesor.timeAgo}</Text>
        <TouchableOpacity style={styles.solicitarBtn} onPress={onSolicitar}>
          <Text style={styles.solicitarText}>Solicitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SuccessScreen({ profesor, onPress }) {
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.successCircle}>
          <Image source={{ uri: profesor.avatar }} style={styles.successAvatar} />
        </View>
        <Text style={styles.successTitle}>
          {'¡Genial!\n'}{profesor.fullName} ha aceptado la clase
        </Text>
        <Text style={styles.successSubtitle}>
          Ponte de acuerdo con él desde "Mis partidos".
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onPress}>
        <Text style={styles.accentBtnText}>Ir a mis partidos</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ProfesoresDisponiblesScreen({ navigation, route }) {
  const [profesorAceptado, setProfesorAceptado] = useState(null);

  if (profesorAceptado) {
    return (
      <SafeAreaView style={styles.safe}>
        <SuccessScreen
          profesor={profesorAceptado}
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
        <Text style={styles.headerTitle}>Profesores disponibles</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {PROFESORES_MOCK.map(p => (
          <ProfesorCard
            key={p.id}
            profesor={p}
            onSolicitar={() => setProfesorAceptado(p)}
          />
        ))}
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

  content: { paddingHorizontal: 20, paddingTop: 20 },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  cardAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ccc' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  cardRanking: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cardClub: { fontSize: 13, color: colors.textSecondary, marginBottom: 5, fontStyle: 'italic' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  cardMeta: { fontSize: 12, color: colors.textSecondary },
  cardRight: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' },
  timeAgo: { fontSize: 11, color: colors.textSecondary },
  solicitarBtn: {
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  solicitarText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

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
  successAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
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
