import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ImageBackground,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SharedHeader, HEADER_BG } from '../../components/common/SharedHeader';
import { ACTION_CARDS } from '../../data/homeData';

function NivelProgress({ percent = 77, size = 54 }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const c = size / 2;
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={c} cy={c} r={radius} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={c} cy={c} r={radius}
        stroke={colors.accent}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PhotoCard({ card, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.photoCard, { height: card.height }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <ImageBackground
        source={{ uri: card.uri }}
        style={StyleSheet.absoluteFill}
        imageStyle={{ borderRadius: 16 }}
      >
        <View style={styles.cardOverlay} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          {card.subtitle && (
            <View style={styles.cardSubRow}>
              <View style={styles.greenDot} />
              <Text style={styles.cardSub}>{card.subtitle}</Text>
            </View>
          )}
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }) {
  const leftCards = [ACTION_CARDS[0], ACTION_CARDS[2]];
  const rightCards = [ACTION_CARDS[1], ACTION_CARDS[3]];

  return (
    <SafeAreaView style={styles.safe}>
      <SharedHeader />
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          <Text style={styles.sectionTitle}>Tus estadísticas</Text>

          <View style={styles.statsRow}>
            {/* Ranking card */}
            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <Text style={styles.statNumber}>33</Text>
                <Ionicons name="trophy" size={20} color={colors.textPrimary} style={{ marginLeft: 6, marginTop: 6 }} />
                <Text style={styles.statArrow}>  ↑ 3</Text>
              </View>
              <Text style={styles.statLabel}>Ranking</Text>
            </View>

            {/* Nivel card */}
            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <View>
                  <Text style={styles.statNumber}>17</Text>
                  <Text style={styles.statLabel}>Nivel</Text>
                </View>
                <View style={{ alignItems: 'center', marginLeft: 'auto' }}>
                  <View style={styles.progressWrapper}>
                    <NivelProgress percent={77} />
                    <Text style={styles.progressPct}>77%</Text>
                  </View>
                  <Text style={styles.nivelPts}>1050 pts</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>¿Qué deseas hacer hoy?</Text>

          <View style={styles.grid}>
            <View style={styles.gridCol}>
              {leftCards.map((c, i) => (
                <PhotoCard
                  key={c.id}
                  card={c}
                  onPress={() => c.route && navigation.navigate(c.route)}
                />
              ))}
            </View>
            <View style={styles.gridCol}>
              {rightCards.map((c) => (
                <PhotoCard
                  key={c.id}
                  card={c}
                  onPress={() => c.route && navigation.navigate(c.route)}
                />
              ))}
            </View>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: HEADER_BG,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statArrow: {
    fontSize: 14,
    color: colors.positive,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressWrapper: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPct: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  nivelPts: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCol: {
    flex: 1,
    gap: 12,
  },
  photoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.36)',
    borderRadius: 16,
  },
  cardContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.positive,
  },
  cardSub: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});
