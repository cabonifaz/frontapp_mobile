import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SharedHeader, HEADER_BG } from '../../components/common/SharedHeader';
import { TABS, PARTIDOS_DATA, CLASES_DATA } from '../../data/partidosData';
import { partidoService } from '../../services/partidoService';

function AppointmentCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.75 : 1}>
      <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Ionicons name="trophy" size={13} color={colors.textPrimary} style={{ marginLeft: 6 }} />
          <Text style={styles.cardRanking}> {item.ranking}</Text>
        </View>
        <Text style={styles.cardClub}>{item.club}</Text>
        <View style={styles.cardDateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.cardMeta}> {item.date}</Text>
          <Text style={{ width: 12 }} />
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.cardMeta}> {item.time}</Text>
        </View>
      </View>
      {item.live && <View style={styles.liveDot} />}
    </TouchableOpacity>
  );
}

function Section({ data, onPressItem }) {
  return (
    <>
      {data.map((section) => (
        <View key={section.section}>
          <Text style={styles.sectionLabel}>{section.section}</Text>
          {section.items.map((item) => (
            <AppointmentCard key={item.id} item={item} onPress={onPressItem ? () => onPressItem(item) : null} />
          ))}
        </View>
      ))}
    </>
  );
}

export function PartidosScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Partidos');
  const [partidos, setPartidos] = useState(PARTIDOS_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'Partidos') return;
    setLoading(true);
    partidoService.listarMisPartidos()
      .then(res => setPartidos(res?.length ? res : PARTIDOS_DATA))
      .catch(() => setPartidos(PARTIDOS_DATA))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safe}>
      <SharedHeader />
      <View style={styles.sheet}>

        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.tabItem}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
              {activeTab === t && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 20 }}>
          <Text style={styles.pageTitle}>{activeTab}</Text>
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <Section
              data={activeTab === 'Partidos' ? partidos : CLASES_DATA}
              onPressItem={activeTab === 'Clases'
                ? (item) => navigation.navigate('DetalleClase', { clase: item })
                : (item) => navigation.navigate('DetallePartido', { partido: item })}
            />
          )}
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
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    gap: 14,
  },
  cardAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
  },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  cardRanking: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  cardClub: { fontSize: 13, color: colors.textSecondary, marginBottom: 5, fontStyle: 'italic' },
  cardDateRow: { flexDirection: 'row', alignItems: 'center' },
  cardMeta: { fontSize: 13, color: colors.textSecondary },
  liveDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.error,
  },
});
