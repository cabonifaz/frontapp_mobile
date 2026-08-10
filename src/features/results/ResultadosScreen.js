import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SharedHeader, HEADER_BG } from '../../components/common/SharedHeader';
import { DATE_FILTERS, MATCHES_BY_FILTER } from '../../data/resultadosData';

function ScoreChip({ value }) {
  return (
    <View style={styles.scoreChip}>
      <Text style={styles.scoreText}>{value}</Text>
    </View>
  );
}

function MatchCard({ match }) {
  return (
    <View style={styles.matchCard}>
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{match.day}</Text>
        <Text style={styles.dateMonth}>{match.month}</Text>
      </View>
      <View style={styles.matchPlayers}>
        {match.players.map((p, i) => (
          <View key={i} style={styles.playerRow}>
            <Image source={{ uri: p.avatar }} style={styles.playerAvatar} />
            <Text style={styles.playerName}>{p.name}</Text>
            <View style={styles.scoresRow}>
              {p.scores.map((s, j) => <ScoreChip key={j} value={s} />)}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ResultadosScreen() {
  const [activeFilter, setActiveFilter] = useState('Hoy');
  const data = MATCHES_BY_FILTER[activeFilter];

  return (
    <SafeAreaView style={styles.safe}>
      <SharedHeader />
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false}>

          <Text style={styles.pageTitle}>Resultados</Text>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#0D1C27" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar jugador"
              placeholderTextColor="#9E9E9E"
              underlineColorAndroid="transparent"
            />
          </View>

          <View style={styles.filterRow}>
            {DATE_FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.dateLabel}>{data.label}</Text>

          {data.matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: HEADER_BG },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    overflow: 'hidden',
  },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterBtnActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  filterText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  dateLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  matchCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    alignItems: 'center',
  },
  dateBlock: {
    width: 44,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 8,
  },
  dateDay: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  dateMonth: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  matchPlayers: { flex: 1, gap: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccc' },
  playerName: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.textPrimary },
  scoresRow: { flexDirection: 'row', gap: 4 },
  scoreChip: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
});
