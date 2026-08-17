import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { authService } from '../../services/authService';

export function SettingsScreen({ navigation }) {

  async function handleLogout() {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que deseas salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive",
          onPress: async () => {
            try {
              await authService.logout();
            } catch (error) {
              console.log('Error al cerrar sesión:', error);
            }
            // Al estar en el Stack principal, se usa directamente navigation.reset
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } 
        }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Configuración</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* CONTENIDO */}
      <View style={styles.content}>
        <TouchableOpacity style={styles.optionRow} onPress={() => {}}>
          <View style={styles.optionLeft}>
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.optionText}>Notificaciones</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={() => {}}>
          <View style={styles.optionLeft}>
            <Ionicons name="lock-closed-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.optionText}>Privacidad y Seguridad</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#E53935" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  content: { padding: 20 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { fontSize: 16, color: colors.textPrimary },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 10, width: '100%',
    backgroundColor: '#FFF0F0',
    borderRadius: 14, paddingVertical: 16,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#E53935' },
});