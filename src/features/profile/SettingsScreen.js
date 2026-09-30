import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { authService } from '../../services/authService';
import { SelectorIdioma } from '../../components/common/SelectorIdioma';

export function SettingsScreen({ navigation }) {
  const { t } = useTranslation();

  // Cierre de sesión normal (Un solo clic para volver a entrar)
  async function handleLogout() {
    Alert.alert(
      t('ajustes.cerrarSesion'),
      t('ajustes.cerrarSesionMensaje'),
      [
        { text: t('comun.cancelar'), style: 'cancel' },
        {
          text: t('ajustes.salir'),
          onPress: async () => {
            await authService.logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  }

  // Cambio de cuenta (Obliga a elegir otra cuenta de Google o Facebook)
  async function handleSwitchAccount() {
    Alert.alert(
      t('ajustes.cambiarCuenta'),
      t('ajustes.cambiarCuentaMensaje'),
      [
        { text: t('comun.cancelar'), style: 'cancel' },
        {
          text: t('ajustes.cambiarCuentaBoton'),
          style: 'destructive',
          onPress: async () => {
            await authService.logoutAndSwitch();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('ajustes.titulo')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* NUEVO: idioma de la aplicación */}
        <SelectorIdioma />

        <TouchableOpacity style={styles.optionRow} onPress={() => {}}>
          <View style={styles.optionLeft}>
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.optionText}>{t('ajustes.notificaciones')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => {}}>
          <View style={styles.optionLeft}>
            <Ionicons name="lock-closed-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.optionText}>{t('ajustes.privacidad')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* 1. BOTÓN CERRAR SESIÓN (Mantiene credenciales de redes) */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={colors.textPrimary} />
          <Text style={styles.logoutText}>{t('ajustes.cerrarSesion')}</Text>
        </TouchableOpacity>

        {/* 2. BOTÓN CAMBIAR DE CUENTA (Limpia credenciales de redes) */}
        <TouchableOpacity style={styles.switchBtn} onPress={handleSwitchAccount} activeOpacity={0.8}>
          <Ionicons name="swap-horizontal-outline" size={20} color="#E53935" />
          <Text style={styles.switchText}>{t('ajustes.cambiarCuenta')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  content: { padding: 20 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { fontSize: 16, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 10, width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14, paddingVertical: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  switchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 12, width: '100%',
    backgroundColor: '#FFF0F0',
    borderRadius: 14, paddingVertical: 16,
  },
  switchText: { fontSize: 15, fontWeight: '600', color: '#E53935' },
});