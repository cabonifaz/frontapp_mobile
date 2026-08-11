import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, ImageBackground, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 200;
const AVATAR_SIZE = 110;

function PuntosScreen({ onVolver }) {
  return (
    <View style={styles.puntosContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.puntosCircle}>
          <Ionicons name="star" size={72} color={colors.accent} />
        </View>
        <Text style={styles.puntosTitle}>¡Genial!</Text>
        <Text style={styles.puntosSubtitle}>
          Has ganado <Text style={styles.puntosNum}>100 pts.</Text>
        </Text>
        <Text style={styles.puntosNote}>
          Completa más clases o juega más partidas para ganar más.
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onVolver}>
        <Text style={styles.accentBtnText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

export function DetalleClaseScreen({ navigation, route }) {
  const clase = route?.params?.clase ?? {};
  const [completada, setCompletada] = useState(false);

  const profesor = {
    name: clase.name ?? 'O. Bendezú',
    ranking: clase.ranking ?? 33,
    avatar: clase.avatar ?? 'https://i.pravatar.cc/150?img=40',
    club: clase.club ?? 'Club Terrazas',
    address: clase.address ?? 'Malecón 28 de Julio 390',
    date: clase.date ?? '15 Feb',
    time: clase.time ?? '15:00',
    coverUri: 'https://images.unsplash.com/photo-1495555961986-b22e827a8f31?w=800&q=80',
  };

  if (completada) {
    return (
      <SafeAreaView style={styles.safe}>
        <PuntosScreen onVolver={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      {/* Cover */}
      <ImageBackground source={{ uri: profesor.coverUri }} style={styles.cover}>
        <SafeAreaView>
          <View style={styles.coverHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Image source={{ uri: profesor.avatar }} style={styles.avatar} />
          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={13} color={colors.primary} />
            <Text style={styles.rankBadgeText}> {profesor.ranking}</Text>
          </View>
        </View>

        <Text style={styles.name}>{profesor.name}</Text>
        <Text style={styles.role}>Profesor</Text>

        <Text style={styles.sectionTitle}>Detalles de la clase</Text>

        {/* Cancha */}
        <View style={styles.detailCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailMain}>{profesor.club}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.detailSub}> {profesor.address}</Text>
            </View>
          </View>
        </View>

        {/* Fecha y hora */}
        <View style={styles.rowCards}>
          <View style={[styles.detailCard, { flex: 1, marginRight: 10 }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {profesor.date}</Text>
          </View>
          <View style={[styles.detailCard, { flex: 1 }]}>
            <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {profesor.time}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Botones */}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.cancelBtnText}>Cancelar clase</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.completadaBtn} onPress={() => setCompletada(true)}>
          <Ionicons name="checkmark" size={20} color={colors.primary} />
          <Text style={styles.completadaBtnText}>Clase completada</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: colors.background },
  cover: { width: SCREEN_W, height: COVER_H },
  coverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },

  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: AVATAR_SIZE / 2 + 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'absolute',
    top: -(AVATAR_SIZE / 2),
    alignSelf: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: colors.background,
    backgroundColor: '#ccc',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 8,
  },
  rankBadgeText: { fontSize: 15, fontWeight: 'bold', color: colors.primary },

  name: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 8, marginBottom: 2 },
  role: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 10,
    width: '100%',
  },
  rowCards: { flexDirection: 'row', width: '100%' },
  detailMain: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  detailSub: { fontSize: 13, color: colors.textSecondary },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    borderRadius: 30,
    paddingVertical: 16,
    width: '100%',
    marginBottom: 12,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  completadaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    width: '100%',
  },
  completadaBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },

  // Puntos
  puntosContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
  },
  puntosCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFF8DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  puntosTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  puntosSubtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  puntosNum: { color: colors.accent },
  puntosNote: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  accentBtn: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
