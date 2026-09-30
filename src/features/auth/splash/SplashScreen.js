import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RankedLogo, RANKED_LIME } from '../../../components/common/RankedLogo';
import { authService } from '../../../services/authService';
import { cargarIdiomaGuardado } from '../../../i18n';

const BG = '#0D1C27';

export function SplashScreen({ navigation }) {
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      // NUEVO: aplica el idioma que eligió el usuario antes de mostrar la app
      await cargarIdiomaGuardado();
      const loggedIn = await authService.isLoggedIn();
      navigation.replace(loggedIn ? 'MainTabs' : 'Login');
    })();
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.band1} />
      <View style={styles.band2} />
      <View style={styles.band3} />
      <View style={styles.center}>
        <RankedLogo size={52} />
        <Text style={styles.tagline}>{t('splash.lema')}</Text>
      </View>
      <ActivityIndicator size="large" color={RANKED_LIME} style={styles.loader} />
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
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5, marginTop: 18 },

  loader: { position: 'absolute', bottom: 80 },
});