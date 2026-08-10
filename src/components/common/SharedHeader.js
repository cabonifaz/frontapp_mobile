import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';

export const HEADER_BG = colors.dark;

export function SharedHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=32' }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.sport}>Tenis</Text>
          <Text style={styles.name}>Hola Javier</Text>
          <View style={styles.statsRow}>
            <Ionicons name="trophy" size={14} color="#DDDDDD" />
            <Text style={styles.statText}> 33</Text>
            <Text style={{ width: 12 }} />
            <Ionicons name="star" size={14} color="#DDDDDD" />
            <Text style={styles.statText}> 4.5</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightBadge}>
        <View style={styles.levelCircle}>
          <Text style={styles.levelNum}>17</Text>
        </View>
        <Text style={styles.ptsLabel}>1050 pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: HEADER_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#333',
  },
  sport: {
    fontSize: 12,
    color: '#DDDDDD',
    marginBottom: 2,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#DDDDDD',
  },
  rightBadge: {
    alignItems: 'center',
  },
  levelCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: colors.accent,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ptsLabel: {
    fontSize: 11,
    color: '#DDDDDD',
    marginTop: 4,
  },
});
