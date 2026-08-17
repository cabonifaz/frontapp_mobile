import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../../../services/authService';

const BG = '#0D1C27';

export function SplashScreen({ navigation }) {
  useEffect(() => {
    authService.isLoggedIn().then(loggedIn => {
      navigation.replace(loggedIn ? 'MainTabs' : 'Login');
    });
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.band1} />
      <View style={styles.band2} />
      <View style={styles.band3} />
      <View style={styles.center}>
        <MaterialCommunityIcons name="tennis" size={72} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.name}>Avosports</Text>
        <Text style={styles.tagline}>Desafía. Compite. Asciende.</Text>
      </View>
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },

  band1: {
    position: 'absolute', width: 350, height: 1600,
    backgroundColor: 'rgba(255,255,255,0.045)',
    transform: [{ rotate: '32deg' }], top: -500, left: -80,
  },
  band2: {
    position: 'absolute', width: 350, height: 1600,
    backgroundColor: 'rgba(255,255,255,0.03)',
    transform: [{ rotate: '32deg' }], top: -300, left: 230,
  },
  band3: {
    position: 'absolute', width: 350, height: 1600,
    backgroundColor: 'rgba(255,255,255,0.025)',
    transform: [{ rotate: '32deg' }], top: -100, left: 540,
  },

  center: { alignItems: 'center' },
  icon: { marginBottom: 16 },
  name: { fontSize: 40, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 },

  loader: { position: 'absolute', bottom: 80 },
});
