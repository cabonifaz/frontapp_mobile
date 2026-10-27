// NUEVO (07): menú de Administración (solo cuentas con usuario.es_admin = 1)
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { adminService } from '../../services/adminService';
import { enVivoService } from '../../services/enVivoService';

function Opcion({ icono, titulo, detalle, contador, onPress }) {
  return (
    <TouchableOpacity style={styles.opcion} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.icono}><Ionicons name={icono} size={22} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.detalle}>{detalle}</Text>
      </View>
      {contador > 0 && (
        <View style={styles.badge}><Text style={styles.badgeTxt}>{contador > 99 ? '99+' : contador}</Text></View>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function AdminScreen({ navigation }) {
  const { t } = useTranslation();
  const [pendientes, setPendientes] = useState(0);
  const [vivos, setVivos] = useState(0);

  useFocusEffect(useCallback(() => {
    adminService.inscripciones('PENDIENTES').then(r => setPendientes(Array.isArray(r) ? r.length : 0)).catch(() => {});
    enVivoService.listar().then(r => setVivos(Array.isArray(r) ? r.filter(x => x.estado_vivo === 'EN_JUEGO').length : 0)).catch(() => {});
  }, []));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{t('admin.titulo')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.intro}>{t('admin.intro')}</Text>
        <Opcion
          icono="radio"
          titulo={t('admin.vivoTitulo')}
          detalle={t('admin.vivoDetalle')}
          contador={vivos}
          onPress={() => navigation.navigate('EnVivo', { admin: true })}
        />
        <Opcion
          icono="cash-outline"
          titulo={t('admin.pagosTitulo')}
          detalle={t('admin.pagosDetalle')}
          contador={pendientes}
          onPress={() => navigation.navigate('AdminInscripciones')}
        />
        <Opcion
          icono="settings-outline"
          titulo={t('admin.configTitulo')}
          detalle={t('admin.configDetalle')}
          onPress={() => navigation.navigate('AdminConfiguracion')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitulo: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  contenido: { padding: 16 },
  intro: { fontSize: 13, color: colors.textSecondary, marginBottom: 16, lineHeight: 19 },
  opcion: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface,
    borderRadius: 16, padding: 16, marginBottom: 12,
  },
  icono: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  detalle: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  badge: { backgroundColor: '#FF3B30', borderRadius: 11, minWidth: 22, height: 22, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
