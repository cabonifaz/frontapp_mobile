import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, ImageBackground, Dimensions, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { PROFILE_MOCK } from '../../data/profileData';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 200;
const AVATAR_SIZE = 90;

export function DetallePartidoScreen({ navigation, route }) {
  const item = route?.params?.partido ?? {};

  const rival = {
    name: item.name ?? 'Renato Pino',
    ranking: item.ranking ?? 33,
    pts: item.pts ?? 177,
    avatar: item.avatar ?? 'https://i.pravatar.cc/150?img=17',
  };

  const yo = {
    name: PROFILE_MOCK.nombre,
    ranking: PROFILE_MOCK.ranking,
    pts: PROFILE_MOCK.pts,
    avatar: PROFILE_MOCK.avatar,
  };

  const partido = {
    club: item.club ?? 'Club Terrazas Miraflores',
    address: 'Malecón 28 de Julio 390',
    date: item.date ?? '12 Feb 2024',
    time: item.time ?? '15:00',
    coverUri: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
  };

  return (
    <View style={styles.root}>
      {/* Cover */}
      <ImageBackground source={{ uri: partido.coverUri }} style={styles.cover}>
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
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>

        {/* Dos jugadores */}
        <View style={styles.playersRow}>
          {/* Jugador izquierda (yo) */}
          <View style={styles.playerCol}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: yo.avatar }} style={styles.avatar} />
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={11} color={colors.primary} />
                <Text style={styles.rankBadgeText}> {yo.ranking}</Text>
              </View>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{yo.name.split(' ')[0]}</Text>
            <Text style={styles.playerPts}>{yo.pts} pts</Text>
          </View>

          <Text style={styles.vsLabel}>vs</Text>

          {/* Rival (derecha) */}
          <View style={styles.playerCol}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: rival.avatar }} style={styles.avatar} />
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={11} color={colors.primary} />
                <Text style={styles.rankBadgeText}> {rival.ranking}</Text>
              </View>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{rival.name.split(' ')[0]}</Text>
            <Text style={styles.playerPts}>{rival.pts} pts</Text>
          </View>
        </View>

        {/* Detalles */}
        <Text style={styles.sectionTitle}>Detalles del partido</Text>

        <View style={styles.detailCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailMain}>{partido.club}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.detailSub}> {partido.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rowCards}>
          <View style={[styles.detailCard, { flex: 1, marginRight: 10 }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {partido.date}</Text>
          </View>
          <View style={[styles.detailCard, { flex: 1 }]}>
            <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {partido.time}</Text>
          </View>
        </View>

        <Text style={styles.mandatoryNote}>
          Es mandatorio para los competidores colocar los resultados hasta 12 hrs luego del encuentro.
        </Text>

        {/* Botones */}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.cancelBtnText}>Cancelar partido</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resultadosBtn}
          onPress={() => navigation.navigate('ColocarResultados', { partido: { ...rival, ...partido } })}
        >
          <Ionicons name="scoreboard-outline" size={20} color={colors.primary} />
          <Text style={styles.resultadosBtnText}>Colocar resultados</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  cover: { width: SCREEN_W, height: COVER_H },
  coverHeader: {
    flexDirection: 'row',
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
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },

  playersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
    width: '100%',
  },
  playerCol: { alignItems: 'center', flex: 1 },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#ccc',
    borderWidth: 3, borderColor: colors.background,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  rankBadgeText: { fontSize: 13, fontWeight: 'bold', color: colors.primary },
  vsLabel: {
    fontSize: 18, fontWeight: 'bold', color: colors.textSecondary,
    alignSelf: 'center', marginTop: AVATAR_SIZE / 2 - 10,
  },
  playerName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  playerPts: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: colors.textPrimary,
    alignSelf: 'flex-start', marginBottom: 12,
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

  mandatoryNote: {
    fontSize: 13, color: colors.textSecondary,
    lineHeight: 19, marginBottom: 24,
    alignSelf: 'flex-start',
  },

  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 30, paddingVertical: 16,
    width: '100%', marginBottom: 12,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  resultadosBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 30, paddingVertical: 18,
    width: '100%',
  },
  resultadosBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
