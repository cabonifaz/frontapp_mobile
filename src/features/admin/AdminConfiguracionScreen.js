// NUEVO (07): Administración > Configuración de la app (tabla maestra CAT_CONFIGURACION):
// puntos por victoria, horas para confirmar resultados, puntos para ganar un set, etc.
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { adminService } from '../../services/adminService';

const limpiarNumero = (v) => (v == null ? '' : String(Number(v)));

export function AdminConfiguracionScreen({ navigation }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [valores, setValores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const res = await adminService.configuraciones();
      const lista = Array.isArray(res) ? res : [];
      setItems(lista);
      setValores(Object.fromEntries(lista.map(c => [c.codigo, c.valor_numerico != null ? limpiarNumero(c.valor_numerico) : (c.valor ?? '')])));
    } catch (e) {
      Alert.alert(t('admin.configTitulo'), e.message);
    } finally {
      setCargando(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function guardar(c) {
    const texto = String(valores[c.codigo] ?? '').trim();
    const esNumero = c.valor_numerico != null;
    const numero = Number(texto.replace(',', '.'));
    if (esNumero && (texto === '' || isNaN(numero))) {
      Alert.alert(t('admin.configTitulo'), t('admin.valorInvalido'));
      return;
    }
    setGuardando(c.codigo);
    try {
      await adminService.guardarConfiguracion({
        codigo: c.codigo,
        valor: esNumero ? c.valor : texto,
        valorNumerico: esNumero ? numero : null,
      });
      setItems(prev => prev.map(x => (x.codigo === c.codigo
        ? { ...x, valor_numerico: esNumero ? numero : x.valor_numerico, valor: esNumero ? x.valor : texto }
        : x)));
      Alert.alert(t('admin.configTitulo'), t('admin.guardado'));
    } catch (e) {
      Alert.alert(t('comun.error'), e.message);
    } finally {
      setGuardando(null);
    }
  }

  const original = (c) => (c.valor_numerico != null ? limpiarNumero(c.valor_numerico) : (c.valor ?? ''));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{t('admin.configTitulo')}</Text>
        <View style={{ width: 24 }} />
      </View>
      {cargando ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
            <Text style={styles.intro}>{t('admin.configIntro')}</Text>
            {items.map(c => {
              const cambiado = String(valores[c.codigo] ?? '') !== original(c);
              return (
                <View key={c.codigo} style={styles.card}>
                  <Text style={styles.nombre}>{c.nombre}</Text>
                  {c.descripcion ? <Text style={styles.descripcion}>{c.descripcion}</Text> : null}
                  <View style={styles.fila}>
                    <TextInput
                      style={styles.input}
                      keyboardType={c.valor_numerico != null ? 'decimal-pad' : 'default'}
                      value={String(valores[c.codigo] ?? '')}
                      onChangeText={v => setValores(prev => ({ ...prev, [c.codigo]: v }))}
                    />
                    <TouchableOpacity
                      style={[styles.btn, !cambiado && styles.btnOff]}
                      disabled={!cambiado || guardando === c.codigo}
                      onPress={() => guardar(c)}
                    >
                      {guardando === c.codigo
                        ? <ActivityIndicator color={colors.primary} size="small" />
                        : <Text style={styles.btnTxt}>{t('admin.guardar')}</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitulo: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  contenido: { padding: 16, paddingBottom: 60 },
  intro: { fontSize: 13, color: colors.textSecondary, marginBottom: 14, lineHeight: 19 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10 },
  nombre: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  descripcion: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 17 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.textPrimary },
  btn: { backgroundColor: colors.accent, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, minWidth: 84, alignItems: 'center' },
  btnOff: { opacity: 0.4 },
  btnTxt: { fontSize: 14, fontWeight: '800', color: colors.primary },
});
