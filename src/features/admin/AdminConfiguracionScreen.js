// NUEVO (07) / REDISEÑO (08): Administración > Configuración.
// Solo lo necesario, agrupado por secciones con su explicación:
// puntos de amistosos (individual 2 de 3 / 3 de 5, dobles 2 de 3), puntos de liga,
// reglas del set, plazos de partidos, clases y registro.
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

const ICONO_SECCION = {
  PUNTOS_INDIVIDUAL: 'person-outline',
  PUNTOS_DOBLES: 'people-outline',
  PUNTOS_LIGA: 'trophy-outline',
  REGLAS: 'tennisball-outline',
  PARTIDOS: 'calendar-outline',
  CLASES: 'school-outline',
  REGISTRO: 'id-card-outline',
};

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
      setValores(Object.fromEntries(lista.map(c => [c.codigo, limpiarNumero(c.valor_numerico)])));
    } catch (e) {
      Alert.alert(t('admin.configTitulo'), e.message);
    } finally {
      setCargando(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function guardar(c) {
    const texto = String(valores[c.codigo] ?? '').trim().replace(',', '.');
    const numero = Number(texto);
    if (texto === '' || !Number.isFinite(numero) || numero < 0) {
      Alert.alert(t('admin.configTitulo'), t('admin.valorInvalido'));
      return;
    }
    setGuardando(c.codigo);
    try {
      await adminService.guardarConfiguracion({ codigo: c.codigo, valorNumerico: numero });
      setItems(prev => prev.map(x => (x.codigo === c.codigo ? { ...x, valor_numerico: numero } : x)));
    } catch (e) {
      Alert.alert(t('comun.error'), e.message);
    } finally {
      setGuardando(null);
    }
  }

  // Agrupar por sección (ya vienen ordenadas)
  const secciones = [];
  items.forEach(c => {
    let s = secciones.find(x => x.clave === c.seccion);
    if (!s) { s = { clave: c.seccion, items: [] }; secciones.push(s); }
    s.items.push(c);
  });

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
            {secciones.map(s => (
              <View key={s.clave} style={styles.seccion}>
                <View style={styles.seccionCabecera}>
                  <View style={styles.seccionIcono}>
                    <Ionicons name={ICONO_SECCION[s.clave] ?? 'options-outline'} size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.seccionTitulo}>{t(`admin.secciones.${s.clave}.titulo`, { defaultValue: s.clave })}</Text>
                    <Text style={styles.seccionTexto}>{t(`admin.secciones.${s.clave}.texto`, { defaultValue: '' })}</Text>
                  </View>
                </View>

                {s.items.map((c, i) => {
                  const cambiado = String(valores[c.codigo] ?? '') !== limpiarNumero(c.valor_numerico);
                  return (
                    <View key={c.codigo} style={[styles.fila, i > 0 && styles.filaBorde]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nombre}>{c.nombre}</Text>
                        {c.descripcion ? <Text style={styles.descripcion}>{c.descripcion}</Text> : null}
                      </View>
                      <View style={styles.inputCaja}>
                        <TextInput
                          style={styles.input}
                          keyboardType="decimal-pad"
                          value={String(valores[c.codigo] ?? '')}
                          onChangeText={v => setValores(prev => ({ ...prev, [c.codigo]: v }))}
                        />
                        {c.unidad ? <Text style={styles.unidad}>{c.unidad}</Text> : null}
                      </View>
                      {cambiado && (
                        <TouchableOpacity style={styles.btn} disabled={guardando === c.codigo} onPress={() => guardar(c)}>
                          {guardando === c.codigo
                            ? <ActivityIndicator color={colors.primary} size="small" />
                            : <Ionicons name="checkmark" size={18} color={colors.primary} />}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
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

  seccion: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 14 },
  seccionCabecera: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  seccionIcono: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  seccionTitulo: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  seccionTexto: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },

  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  filaBorde: { borderTopWidth: 1, borderTopColor: colors.border },
  nombre: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  descripcion: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  inputCaja: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 10 },
  input: { minWidth: 46, paddingVertical: 8, fontSize: 15, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
  unidad: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
