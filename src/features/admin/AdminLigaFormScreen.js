// NUEVO (08): Administración > crear o editar una liga (torneo individual o de dobles):
// nombre, estado, fechas, lugar, cupo, niveles, cuota, premio, instrucciones de pago, imagen,
// y el auspiciador (nombre, logo y enlace a su página). Al editar, muestra los participantes.
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Switch, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { adminService } from '../../services/adminService';
import { uploadImage } from '../../services/cloudinaryService';
import { elegirUnaImagen } from '../../utils/elegirImagen';
import { getAvatarSource } from '../../utils/avatars';
import { formatFechaCorta } from './AdminLigasScreen';

const ESTADOS = ['LIGA_PROXIMAMENTE', 'LIGA_INSCRIPCION_ABIERTA', 'LIGA_EN_CURSO', 'LIGA_FINALIZADA'];

// "dd/mm/aaaa" -> "aaaa-mm-dd" (o null si está vacío; undefined si es inválido)
function aIso(texto) {
  const v = String(texto ?? '').trim();
  if (!v) return null;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, d, mes, a] = m.map(Number);
  const f = new Date(a, mes - 1, d);
  if (f.getMonth() !== mes - 1) return undefined;
  return `${a}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function Campo({ etiqueta, ayuda, children }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      {children}
      {ayuda ? <Text style={styles.ayuda}>{ayuda}</Text> : null}
    </View>
  );
}

function Entrada(props) {
  return <TextInput placeholderTextColor={colors.textSecondary} {...props} style={[styles.input, props.style]} />;
}

export function AdminLigaFormScreen({ navigation, route }) {
  const { t } = useTranslation();
  const liga = route?.params?.liga ?? null;
  const editando = !!liga?.id_liga;

  const [f, setF] = useState({
    nombre: liga?.nombre ?? '',
    descripcion: liga?.descripcion ?? '',
    es_dobles: Number(liga?.es_dobles ?? 0) === 1,
    estado_liga: liga?.estado_liga ?? 'LIGA_PROXIMAMENTE',
    visible: liga ? Number(liga.visible) === 1 : true,
    fecha_inicio: liga?.fecha_inicio ? formatFechaCorta(liga.fecha_inicio) : '',
    fecha_fin: liga?.fecha_fin ? formatFechaCorta(liga.fecha_fin) : '',
    lugar: liga?.lugar ?? '',
    cupo_maximo: liga?.cupo_maximo != null ? String(liga.cupo_maximo) : '',
    nivel_min: String(liga?.nivel_min ?? 1),
    nivel_max: String(liga?.nivel_max ?? 10),
    cuota_inscripcion: liga?.cuota_inscripcion != null ? String(Number(liga.cuota_inscripcion)) : '0',
    premio: liga?.premio ?? '',
    instrucciones_pago: liga?.instrucciones_pago ?? '',
    imagen_url: liga?.imagen_url ?? '',
    auspiciador_nombre: liga?.auspiciador_nombre ?? '',
    auspiciador_logo_url: liga?.auspiciador_logo_url ?? '',
    auspiciador_sitio_web: liga?.auspiciador_sitio_web ?? '',
  });
  const set = (k) => (v) => setF(prev => ({ ...prev, [k]: v }));
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(null);   // 'logo' | 'imagen'
  const [participantes, setParticipantes] = useState([]);

  useEffect(() => {
    if (!editando) return;
    adminService.participantesLiga(liga.id_liga)
      .then(r => setParticipantes(Array.isArray(r) ? r : []))
      .catch(() => setParticipantes([]));
  }, [editando, liga?.id_liga]);

  async function subir(campo, tipo) {
    const uri = await elegirUnaImagen(t(tipo === 'logo' ? 'admin.liga.logo' : 'admin.liga.imagen'));
    if (!uri) return;
    try {
      setSubiendo(tipo);
      const url = await uploadImage(uri);
      set(campo)(url);
    } catch (e) {
      Alert.alert(t('admin.ligasTitulo'), e.message);
    } finally {
      setSubiendo(null);
    }
  }

  async function guardar() {
    if (!f.nombre.trim()) { Alert.alert(t('admin.ligasTitulo'), t('admin.liga.errorNombre')); return; }
    const inicio = aIso(f.fecha_inicio);
    const fin = aIso(f.fecha_fin);
    if (inicio === undefined || fin === undefined) { Alert.alert(t('admin.ligasTitulo'), t('admin.liga.errorFecha')); return; }
    const web = f.auspiciador_sitio_web.trim();
    if (web && !/^https?:\/\//i.test(web)) { Alert.alert(t('admin.ligasTitulo'), t('admin.liga.errorWeb')); return; }
    const num = (v) => (String(v).trim() === '' ? null : Number(String(v).replace(',', '.')));

    setGuardando(true);
    try {
      const res = await adminService.guardarLiga({
        id_liga: liga?.id_liga ?? null,
        nombre: f.nombre.trim(),
        descripcion: f.descripcion.trim() || null,
        es_dobles: f.es_dobles ? 1 : 0,
        estado_liga: f.estado_liga,
        visible: f.visible ? 1 : 0,
        fecha_inicio: inicio,
        fecha_fin: fin,
        lugar: f.lugar.trim() || null,
        cupo_maximo: num(f.cupo_maximo),
        nivel_min: num(f.nivel_min) ?? 1,
        nivel_max: num(f.nivel_max) ?? 10,
        cuota_inscripcion: num(f.cuota_inscripcion) ?? 0,
        premio: f.premio.trim() || null,
        instrucciones_pago: f.instrucciones_pago.trim() || null,
        imagen_url: f.imagen_url || null,
        auspiciador_nombre: f.auspiciador_nombre.trim() || null,
        auspiciador_logo_url: f.auspiciador_logo_url || null,
        auspiciador_sitio_web: web || null,
      });
      Alert.alert(t('admin.ligasTitulo'), res?.mensaje ?? t('admin.guardado'), [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert(t('comun.error'), e.message);
    } finally {
      setGuardando(false);
    }
  }

  const verPerfil = (id, nombre, foto) =>
    navigation.navigate('PlayerProfile', { player: { id_usuario: id, nombre, avatar: foto } });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{editando ? t('admin.liga.editar') : t('admin.liga.nueva')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          {/* General */}
          <Text style={styles.seccion}>{t('admin.liga.seccionGeneral')}</Text>
          <Campo etiqueta={t('admin.liga.nombre')}>
            <Entrada value={f.nombre} onChangeText={set('nombre')} placeholder={t('admin.liga.nombreEjemplo')} />
          </Campo>
          <Campo etiqueta={t('admin.liga.modalidad')} ayuda={f.es_dobles ? t('admin.liga.ayudaDobles') : t('admin.liga.ayudaIndividual')}>
            <View style={styles.chips}>
              {[false, true].map(v => (
                <TouchableOpacity key={String(v)} style={[styles.chip, f.es_dobles === v && styles.chipOn]} onPress={() => set('es_dobles')(v)}>
                  <Text style={[styles.chipTxt, f.es_dobles === v && styles.chipTxtOn]}>{v ? t('admin.liga.dobles') : t('admin.liga.individual')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Campo>
          <Campo etiqueta={t('admin.liga.estado')}>
            <View style={styles.chips}>
              {ESTADOS.map(e => (
                <TouchableOpacity key={e} style={[styles.chip, f.estado_liga === e && styles.chipOn]} onPress={() => set('estado_liga')(e)}>
                  <Text style={[styles.chipTxt, f.estado_liga === e && styles.chipTxtOn]}>{t(`admin.liga.estados.${e}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Campo>
          <View style={styles.switchFila}>
            <View style={{ flex: 1 }}>
              <Text style={styles.etiqueta}>{t('admin.liga.visible')}</Text>
              <Text style={styles.ayuda}>{t('admin.liga.ayudaVisible')}</Text>
            </View>
            <Switch value={f.visible} onValueChange={set('visible')} trackColor={{ true: colors.accent }} />
          </View>
          <Campo etiqueta={t('admin.liga.descripcion')}>
            <Entrada value={f.descripcion} onChangeText={set('descripcion')} multiline style={styles.multilinea} />
          </Campo>

          {/* Cuándo y dónde */}
          <Text style={styles.seccion}>{t('admin.liga.seccionCuando')}</Text>
          <View style={styles.dosColumnas}>
            <View style={{ flex: 1 }}>
              <Campo etiqueta={t('admin.liga.inicio')}>
                <Entrada value={f.fecha_inicio} onChangeText={set('fecha_inicio')} placeholder="dd/mm/aaaa" keyboardType="numbers-and-punctuation" />
              </Campo>
            </View>
            <View style={{ flex: 1 }}>
              <Campo etiqueta={t('admin.liga.fin')}>
                <Entrada value={f.fecha_fin} onChangeText={set('fecha_fin')} placeholder="dd/mm/aaaa" keyboardType="numbers-and-punctuation" />
              </Campo>
            </View>
          </View>
          <Campo etiqueta={t('admin.liga.lugar')}>
            <Entrada value={f.lugar} onChangeText={set('lugar')} placeholder={t('admin.liga.lugarEjemplo')} />
          </Campo>

          {/* Participantes y nivel */}
          <Text style={styles.seccion}>{t('admin.liga.seccionParticipantes')}</Text>
          <View style={styles.dosColumnas}>
            <View style={{ flex: 1 }}>
              <Campo etiqueta={f.es_dobles ? t('admin.liga.cupoEquipos') : t('admin.liga.cupo')} ayuda={t('admin.liga.ayudaCupo')}>
                <Entrada value={f.cupo_maximo} onChangeText={set('cupo_maximo')} keyboardType="number-pad" />
              </Campo>
            </View>
            <View style={{ flex: 1 }}>
              <Campo etiqueta={t('admin.liga.niveles')}>
                <View style={styles.dosColumnas}>
                  <Entrada value={f.nivel_min} onChangeText={set('nivel_min')} keyboardType="number-pad" style={{ flex: 1 }} />
                  <Text style={styles.guion}>–</Text>
                  <Entrada value={f.nivel_max} onChangeText={set('nivel_max')} keyboardType="number-pad" style={{ flex: 1 }} />
                </View>
              </Campo>
            </View>
          </View>

          {/* Inscripción y premio */}
          <Text style={styles.seccion}>{t('admin.liga.seccionPago')}</Text>
          <Campo etiqueta={t('admin.liga.cuota')} ayuda={f.es_dobles ? t('admin.liga.ayudaCuotaDobles') : t('admin.liga.ayudaCuota')}>
            <Entrada value={f.cuota_inscripcion} onChangeText={set('cuota_inscripcion')} keyboardType="decimal-pad" />
          </Campo>
          <Campo etiqueta={t('admin.liga.instrucciones')}>
            <Entrada value={f.instrucciones_pago} onChangeText={set('instrucciones_pago')} multiline style={styles.multilinea}
              placeholder={t('admin.liga.instruccionesEjemplo')} />
          </Campo>
          <Campo etiqueta={t('admin.liga.premio')}>
            <Entrada value={f.premio} onChangeText={set('premio')} placeholder={t('admin.liga.premioEjemplo')} />
          </Campo>
          <Campo etiqueta={t('admin.liga.imagen')}>
            <TouchableOpacity style={styles.subir} onPress={() => subir('imagen_url', 'imagen')} disabled={!!subiendo}>
              {f.imagen_url ? <Image source={{ uri: f.imagen_url }} style={styles.imagen} /> : null}
              {subiendo === 'imagen' ? <ActivityIndicator color={colors.primary} /> : (
                <View style={styles.subirFila}>
                  <Ionicons name="image-outline" size={18} color={colors.primary} />
                  <Text style={styles.subirTxt}>{f.imagen_url ? t('admin.liga.cambiarImagen') : t('admin.liga.subirImagen')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Campo>

          {/* Auspiciador */}
          <Text style={styles.seccion}>{t('admin.liga.seccionAuspiciador')}</Text>
          <Campo etiqueta={t('admin.liga.auspiciador')} ayuda={t('admin.liga.ayudaAuspiciador')}>
            <Entrada value={f.auspiciador_nombre} onChangeText={set('auspiciador_nombre')} placeholder={t('admin.liga.auspiciadorEjemplo')} />
          </Campo>
          <Campo etiqueta={t('admin.liga.logo')}>
            <TouchableOpacity style={[styles.subir, styles.subirLogo]} onPress={() => subir('auspiciador_logo_url', 'logo')} disabled={!!subiendo}>
              {f.auspiciador_logo_url ? <Image source={{ uri: f.auspiciador_logo_url }} style={styles.logo} resizeMode="contain" /> : null}
              {subiendo === 'logo' ? <ActivityIndicator color={colors.primary} /> : (
                <View style={styles.subirFila}>
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                  <Text style={styles.subirTxt}>{f.auspiciador_logo_url ? t('admin.liga.cambiarLogo') : t('admin.liga.subirLogo')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Campo>
          <Campo etiqueta={t('admin.liga.web')} ayuda={t('admin.liga.ayudaWeb')}>
            <Entrada value={f.auspiciador_sitio_web} onChangeText={set('auspiciador_sitio_web')} placeholder="https://..."
              autoCapitalize="none" keyboardType="url" />
          </Campo>

          <TouchableOpacity style={styles.guardar} onPress={guardar} disabled={guardando || !!subiendo}>
            {guardando ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.guardarTxt}>{t('admin.liga.guardar')}</Text>}
          </TouchableOpacity>

          {/* Participantes inscritos */}
          {editando && (
            <>
              <Text style={styles.seccion}>{t('admin.liga.inscritos', { n: participantes.length })}</Text>
              {participantes.length === 0 ? (
                <Text style={styles.ayuda}>{t('admin.liga.sinInscritos')}</Text>
              ) : participantes.map(p => (
                <TouchableOpacity key={p.id_liga_inscripcion} style={styles.participante}
                  onPress={() => verPerfil(p.id_usuario, p.nombre_jugador, p.foto_jugador)}>
                  <Image source={getAvatarSource(p.foto_jugador)} style={styles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pNombre} numberOfLines={1}>
                      {p.nombre_jugador}{p.nombre_companero ? ` y ${p.nombre_companero}` : ''}
                    </Text>
                    <Text style={styles.pSub}>
                      {p.estado_nombre}{p.estado_codigo === 'INSC_ACTIVA' ? ` · ${p.puntos} pts · ${p.partidos_ganados}G ${p.partidos_perdidos}P` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.irPagos} onPress={() => navigation.navigate('AdminInscripciones')}>
                <Text style={styles.irPagosTxt}>{t('admin.liga.irPagos')}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitulo: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  contenido: { padding: 16, paddingBottom: 60 },
  seccion: { fontSize: 13, fontWeight: '900', color: colors.textSecondary, letterSpacing: 0.8, marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  campo: { marginBottom: 12 },
  etiqueta: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  ayuda: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 16 },
  input: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.textPrimary },
  multilinea: { minHeight: 70, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.dark },
  chipTxt: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  chipTxtOn: { color: '#FFFFFF' },
  switchFila: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  dosColumnas: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  guion: { fontSize: 16, color: colors.textSecondary },
  subir: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, alignItems: 'center', gap: 10 },
  subirLogo: { minHeight: 70, justifyContent: 'center' },
  subirFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subirTxt: { fontSize: 14, fontWeight: '700', color: colors.primary },
  imagen: { width: '100%', height: 140, borderRadius: 10 },
  logo: { width: 140, height: 60 },
  guardar: { backgroundColor: colors.accent, borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  guardarTxt: { fontSize: 16, fontWeight: '900', color: colors.primary },
  participante: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ccc' },
  pNombre: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  pSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  irPagos: { alignSelf: 'center', marginTop: 14, padding: 8 },
  irPagosTxt: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, textDecorationLine: 'underline' },
});
