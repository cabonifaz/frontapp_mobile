// NUEVO (07): Administración > Pagos e inscripciones a ligas (partidos rankeados).
// El admin revisa quién se inscribió, valida el pago (activa la inscripción) o la rechaza.
// El jugador recibe una notificación en ambos casos.
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert,
  Modal, TextInput, Linking, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { adminService } from '../../services/adminService';
import { getAvatarSource } from '../../utils/avatars';

const FILTROS = ['PENDIENTES', 'ACTIVAS', 'TODAS'];

function formatFecha(f) {
  if (!f) return '';
  const d = new Date(String(f).replace(' ', 'T'));
  if (isNaN(d.getTime())) return String(f).substring(0, 10);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const COLOR_ESTADO = {
  INSC_PENDIENTE_PAGO: '#F5B800',
  INSC_ACTIVA: '#2ECC71',
  INSC_RECHAZADA: '#D93025',
};

export function AdminInscripcionesScreen({ navigation }) {
  const { t } = useTranslation();
  const [filtro, setFiltro] = useState('PENDIENTES');
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [validar, setValidar] = useState(null);   // { item, monto, referencia }
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async (f = filtro) => {
    try {
      const res = await adminService.inscripciones(f);
      setItems(Array.isArray(res) ? res : []);
    } catch (e) {
      Alert.alert(t('admin.titulo'), e.message);
      setItems([]);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [filtro, t]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  function cambiarFiltro(f) {
    setFiltro(f);
    setCargando(true);
    cargar(f);
  }

  async function confirmarValidacion() {
    setGuardando(true);
    try {
      const monto = validar.monto.trim() === '' ? null : Number(validar.monto.replace(',', '.'));
      if (monto != null && (isNaN(monto) || monto < 0)) {
        Alert.alert(t('admin.pagosTitulo'), t('admin.montoInvalido'));
        return;
      }
      const res = await adminService.validarPago(validar.item.id_liga_inscripcion, {
        monto, referencia: validar.referencia.trim() || null,
      });
      setValidar(null);
      Alert.alert(t('admin.pagosTitulo'), res?.mensaje ?? t('admin.pagoValidado'));
      cargar();
    } catch (e) {
      Alert.alert(t('comun.error'), e.message);
    } finally {
      setGuardando(false);
    }
  }

  function rechazar(item) {
    Alert.alert(t('admin.rechazarTitulo'), t('admin.rechazarMensaje', { nombre: item.nombre_jugador, liga: item.nombre_liga }), [
      { text: t('comun.cancelar'), style: 'cancel' },
      {
        text: t('admin.rechazar'),
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.rechazar(item.id_liga_inscripcion);
            cargar();
          } catch (e) {
            Alert.alert(t('comun.error'), e.message);
          }
        },
      },
    ]);
  }

  function contactar(tel) {
    const num = String(tel ?? '').replace(/[^\d+]/g, '');
    if (!num) return;
    Alert.alert(tel, undefined, [
      { text: t('admin.llamar'), onPress: () => Linking.openURL(`tel:${num}`) },
      { text: 'WhatsApp', onPress: () => Linking.openURL(`https://wa.me/${num.replace('+', '')}`) },
      { text: t('comun.cancelar'), style: 'cancel' },
    ]);
  }

  const verPerfil = (id, nombre, foto) =>
    navigation.navigate('PlayerProfile', { player: { id_usuario: id, nombre, avatar: foto } });

  function renderItem({ item }) {
    const pendiente = item.estado_codigo === 'INSC_PENDIENTE_PAGO';
    const cuota = `${item.moneda ?? 'PEN'} ${Number(item.cuota_inscripcion ?? 0).toFixed(2)}`;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <TouchableOpacity onPress={() => verPerfil(item.id_usuario, item.nombre_jugador, item.foto_jugador)}>
            <Image source={getAvatarSource(item.foto_jugador)} style={styles.avatar} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.nombre} numberOfLines={1}>{item.nombre_jugador}</Text>
            {item.nombre_companero ? (
              <Text style={styles.sub} numberOfLines={1}>{t('admin.conCompanero', { nombre: item.nombre_companero })}</Text>
            ) : null}
            <Text style={styles.liga} numberOfLines={1}>
              {item.nombre_liga}{Number(item.es_dobles) === 1 ? ` · ${t('vivo.dobles')}` : ''}
            </Text>
          </View>
          <View style={[styles.estado, { borderColor: COLOR_ESTADO[item.estado_codigo] ?? colors.border }]}>
            <Text style={[styles.estadoTxt, { color: COLOR_ESTADO[item.estado_codigo] ?? colors.textSecondary }]}>{item.estado_nombre}</Text>
          </View>
        </View>

        <View style={styles.datos}>
          <Text style={styles.dato}><Text style={styles.datoLabel}>{t('admin.cuota')}: </Text>{cuota}</Text>
          <Text style={styles.dato}><Text style={styles.datoLabel}>{t('admin.inscrito')}: </Text>{formatFecha(item.fecha_inscripcion)}</Text>
          {item.monto_pagado != null && (
            <Text style={styles.dato}><Text style={styles.datoLabel}>{t('admin.pagado')}: </Text>{`${item.moneda ?? 'PEN'} ${Number(item.monto_pagado).toFixed(2)}`}{item.referencia_pago ? ` · ${item.referencia_pago}` : ''}</Text>
          )}
          {item.correo_jugador ? <Text style={styles.dato} numberOfLines={1}>{item.correo_jugador}</Text> : null}
          {item.telefono_jugador ? (
            <TouchableOpacity onPress={() => contactar(item.telefono_jugador)} style={styles.telefono}>
              <Ionicons name="call-outline" size={14} color={colors.textPrimary} />
              <Text style={styles.telefonoTxt}>{item.telefono_jugador}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {pendiente && (
          <View style={styles.acciones}>
            <TouchableOpacity style={styles.btnRechazar} onPress={() => rechazar(item)}>
              <Text style={styles.btnRechazarTxt}>{t('admin.rechazar')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnValidar}
              onPress={() => setValidar({ item, monto: String(Number(item.cuota_inscripcion ?? 0)), referencia: '' })}
            >
              <Ionicons name="checkmark" size={18} color={colors.primary} />
              <Text style={styles.btnValidarTxt}>{t('admin.validarPago')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{t('admin.pagosTitulo')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filtros}>
        {FILTROS.map(f => (
          <TouchableOpacity key={f} style={[styles.filtro, filtro === f && styles.filtroOn]} onPress={() => cambiarFiltro(f)}>
            <Text style={[styles.filtroTxt, filtro === f && styles.filtroTxtOn]}>{t(`admin.filtros.${f}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id_liga_inscripcion)}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} tintColor={colors.accent} />}
          ListEmptyComponent={<Text style={styles.vacio}>{t(`admin.vacio.${filtro}`)}</Text>}
        />
      )}

      <Modal visible={!!validar} transparent animationType="fade" onRequestClose={() => setValidar(null)}>
        <View style={styles.modalFondo}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>{t('admin.validarPago')}</Text>
            <Text style={styles.modalSub}>{validar?.item?.nombre_jugador} · {validar?.item?.nombre_liga}</Text>
            <Text style={styles.inputLabel}>{t('admin.montoRecibido')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={validar?.monto ?? ''}
              onChangeText={v => setValidar(x => ({ ...x, monto: v }))}
            />
            <Text style={styles.inputLabel}>{t('admin.referencia')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('admin.referenciaEjemplo')}
              placeholderTextColor={colors.textSecondary}
              value={validar?.referencia ?? ''}
              onChangeText={v => setValidar(x => ({ ...x, referencia: v }))}
            />
            <View style={styles.acciones}>
              <TouchableOpacity style={styles.btnRechazar} onPress={() => setValidar(null)} disabled={guardando}>
                <Text style={styles.btnRechazarTxt}>{t('comun.cancelar')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnValidar} onPress={confirmarValidacion} disabled={guardando}>
                {guardando ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.btnValidarTxt}>{t('admin.confirmar')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitulo: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  filtros: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  filtro: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.surface },
  filtroOn: { backgroundColor: colors.dark },
  filtroTxt: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  filtroTxtOn: { color: '#FFFFFF' },
  lista: { padding: 16, paddingBottom: 40 },
  vacio: { textAlign: 'center', color: colors.textSecondary, marginTop: 40, fontSize: 14 },

  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ccc' },
  nombre: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary },
  liga: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', marginTop: 1 },
  estado: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  estadoTxt: { fontSize: 11, fontWeight: '800' },
  datos: { marginTop: 10, gap: 3 },
  dato: { fontSize: 13, color: colors.textPrimary },
  datoLabel: { color: colors.textSecondary },
  telefono: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, alignSelf: 'flex-start' },
  telefonoTxt: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textDecorationLine: 'underline' },
  acciones: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnRechazar: { flex: 1, borderRadius: 22, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5, borderColor: colors.textPrimary },
  btnRechazarTxt: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  btnValidar: { flex: 1.4, flexDirection: 'row', gap: 6, borderRadius: 22, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  btnValidarTxt: { fontSize: 14, fontWeight: '800', color: colors.primary },

  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: colors.background, borderRadius: 20, padding: 20 },
  modalTitulo: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  modalSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 10 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary },
});
