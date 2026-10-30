// NUEVO (08): Administración > Ligas y torneos. Lista de ligas (individual y dobles)
// con su estado, auspiciador e inscritos; desde aquí se crea o edita cada una.
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { adminService } from '../../services/adminService';
import { SponsorLogo } from '../ranking/ligaUtils';

const COLOR_ESTADO = {
  LIGA_EN_CURSO: '#2ECC71',
  LIGA_INSCRIPCION_ABIERTA: '#F5B800',
  LIGA_PROXIMAMENTE: '#7CC4FF',
  LIGA_FINALIZADA: '#9AA5B1',
};

export function formatFechaCorta(f) {
  if (!f) return '--';
  const [y, m, d] = String(f).split('T')[0].split('-');
  return d && m && y ? `${d}/${m}/${y}` : String(f);
}

export function AdminLigasScreen({ navigation }) {
  const { t } = useTranslation();
  const [ligas, setLigas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await adminService.ligas();
      setLigas(Array.isArray(res) ? res : []);
    } catch (e) {
      Alert.alert(t('admin.ligasTitulo'), e.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  function renderItem({ item: l }) {
    const color = COLOR_ESTADO[l.estado_liga] ?? colors.textSecondary;
    return (
      <TouchableOpacity style={[styles.card, Number(l.visible) !== 1 && { opacity: 0.55 }]}
        onPress={() => navigation.navigate('AdminLigaForm', { liga: l })} activeOpacity={0.85}>
        <View style={styles.cardTop}>
          {l.auspiciador_nombre
            ? <SponsorLogo nombre={l.auspiciador_nombre} logoUrl={l.auspiciador_logo_url} size={34} width={60} />
            : <View style={styles.sinLogo}><Ionicons name="trophy" size={20} color={colors.primary} /></View>}
          <View style={{ flex: 1 }}>
            <Text style={styles.nombre} numberOfLines={1}>{l.nombre}</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {Number(l.es_dobles) === 1 ? t('admin.liga.dobles') : t('admin.liga.individual')}
              {' · '}{Number(l.num_sets) === 3 ? t('detalle.formato3') : t('detalle.formato5')}
              {l.lugar ? ` · ${l.lugar}` : ''}
            </Text>
          </View>
          <View style={[styles.estado, { borderColor: color }]}>
            <Text style={[styles.estadoTxt, { color }]}>{l.estado_liga_nombre}</Text>
          </View>
        </View>
        <View style={styles.cardPie}>
          <View style={styles.dato}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.datoTxt}>{formatFechaCorta(l.fecha_inicio)} – {formatFechaCorta(l.fecha_fin)}</Text>
          </View>
          <View style={styles.dato}>
            <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.datoTxt}>{l.inscritos_activos}{l.cupo_maximo ? `/${l.cupo_maximo}` : ''}</Text>
          </View>
          {Number(l.pagos_pendientes) > 0 && (
            <View style={styles.pendiente}>
              <Text style={styles.pendienteTxt}>{t('admin.liga.pagosPendientes', { n: l.pagos_pendientes })}</Text>
            </View>
          )}
          {Number(l.visible) !== 1 && <Text style={styles.oculta}>{t('admin.liga.oculta')}</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{t('admin.ligasTitulo')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminLigaForm', { liga: null })} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="add-circle" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      {cargando ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ligas}
          keyExtractor={l => String(l.id_liga)}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} tintColor={colors.accent} />}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="trophy-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.vacioTxt}>{t('admin.liga.vacio')}</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.nueva} onPress={() => navigation.navigate('AdminLigaForm', { liga: null })}>
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={styles.nuevaTxt}>{t('admin.liga.nueva')}</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitulo: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  lista: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sinLogo: { width: 60, height: 34, borderRadius: 8, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  estado: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  estadoTxt: { fontSize: 11, fontWeight: '800' },
  cardPie: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  datoTxt: { fontSize: 12, color: colors.textSecondary },
  pendiente: { backgroundColor: '#FFE9B3', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  pendienteTxt: { fontSize: 11, fontWeight: '800', color: '#8A6100' },
  oculta: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
  vacio: { alignItems: 'center', marginTop: 40, gap: 10 },
  vacioTxt: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  nueva: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accent, borderRadius: 26, paddingVertical: 14, marginTop: 8 },
  nuevaTxt: { fontSize: 15, fontWeight: '800', color: colors.primary },
});
