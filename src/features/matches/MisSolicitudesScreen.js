import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { solicitudService } from '../../services/solicitudService';
import { partidoService } from '../../services/partidoService';
import { claseService } from '../../services/claseService';
import { getAvatarSource } from '../../utils/avatars';

const DIAS  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatFecha(isoString) {
  if (!isoString) return '--';
  const cleanIso = isoString.split('T')[0];
  const parts = cleanIso.split('-');
  if (parts.length === 3) {
    const year  = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day   = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d)) {
      return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}, ${d.getFullYear()}`;
    }
  }
  const d = new Date(isoString);
  if (isNaN(d)) return isoString;
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}, ${d.getFullYear()}`;
}

function SuccessScreen({ retador, onPress }) {
  const firstName = (retador.nombre ?? retador.fullName ?? 'el retador').split(' ')[0];
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.vsCircle}>
          <Image
            source={getAvatarSource(retador.foto_perfil_url)}
            style={styles.vsAvatar}
          />
        </View>
        <Text style={styles.successTitle}>
          Has aceptado a{'\n'}{firstName} como retador
        </Text>
        <Text style={styles.successSubtitle}>
          Chatea con él para ponerte de acuerdo desde "Mis partidos".
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onPress}>
        <Text style={styles.accentBtnText}>Ir a mis partidos</Text>
      </TouchableOpacity>
    </View>
  );
}

function ClaseSuccessScreen({ alumno, onPress }) {
  const firstName = (alumno.nombre_alumno ?? alumno.nombre ?? 'el alumno').split(' ')[0];
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.vsCircle}>
          <Image
            source={getAvatarSource(alumno.foto_alumno ?? alumno.foto_perfil_url)}
            style={styles.vsAvatar}
          />
        </View>
        <Text style={styles.successTitle}>
          ¡Genial!{'\n'}Has aceptado la clase de {firstName}
        </Text>
        <Text style={styles.successSubtitle}>
          Puedes chatear con tu alumno desde la sección de clases.
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onPress}>
        <Text style={styles.accentBtnText}>Ir a mis partidos</Text>
      </TouchableOpacity>
    </View>
  );
}

export function MisSolicitudesScreen({ navigation }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retadorAceptado, setRetadorAceptado] = useState(null);
  const [accionLoading, setAccionLoading] = useState(null);
  const [solicitudesClase, setSolicitudesClase] = useState([]);
  const [claseAceptada, setClaseAceptada] = useState(null);
  const [accionClaseLoading, setAccionClaseLoading] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [res, claseRes] = await Promise.allSettled([
        solicitudService.misSolicitudes(),
        claseService.solicitudesProfesor(),
      ]);
      if (res.status === 'fulfilled') setDatos(res.value);
      else setDatos(null);
      if (claseRes.status === 'fulfilled' && Array.isArray(claseRes.value)) {
        setSolicitudesClase(claseRes.value);
      } else {
        setSolicitudesClase([]);
      }
    } catch {
      setDatos(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      cargar();
    }, [cargar])
  );

  // Soportar lista de partidos (partidos) o un único partido por retrocompatibilidad
  const partidos = datos?.partidos ?? (datos?.partido ? [datos.partido] : []);
  const solicitudes = datos?.solicitudes ?? datos?.postulantes ?? [];
  // Solo mostrar la sección de partidos si el SP la incluye en la respuesta
  const haySeccionPartidos = datos != null && (datos.partidos !== undefined || datos.partido !== undefined);

  const fechas = solicitudes.length > 0
    ? [...new Set(solicitudes.map(s => s.fecha ?? s.date).filter(Boolean))]
    : [];
  const [fechaActiva, setFechaActiva] = useState(null);

  React.useEffect(() => {
    if (fechas.length > 0 && !fechaActiva) setFechaActiva(fechas[0]);
  }, [fechas.length]);

  const solicitudesFiltradas = fechaActiva
    ? solicitudes.filter(s => (s.fecha ?? s.date) === fechaActiva)
    : solicitudes;

  async function handleAceptar(solicitud) {
    const idSolicitud = solicitud.id_solicitud ?? solicitud.id;
    const idRetador   = solicitud.id_usuario   ?? solicitud.id_usuario_retador;
    try {
      setAccionLoading(idSolicitud);
      await solicitudService.aceptar(idSolicitud, idRetador);
      setRetadorAceptado(solicitud);
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo aceptar al retador.');
    } finally {
      setAccionLoading(null);
    }
  }

  async function handleRechazar(solicitud) {
    const idSolicitud = solicitud.id_solicitud ?? solicitud.id;
    const idRetador   = solicitud.id_usuario   ?? solicitud.id_usuario_retador;
    try {
      setAccionLoading(idSolicitud);
      await solicitudService.rechazar(idSolicitud, idRetador);
      setDatos(prev => ({
        ...prev,
        solicitudes: (prev?.solicitudes ?? []).filter(s => (s.id_solicitud ?? s.id) !== idSolicitud),
      }));
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo rechazar al retador.');
    } finally {
      setAccionLoading(null);
    }
  }

  async function handleAceptarClase(solicitudClase) {
    const idClase = solicitudClase.id_clase ?? solicitudClase.id;
    try {
      setAccionClaseLoading(idClase);
      await claseService.aceptar(idClase);
      setClaseAceptada(solicitudClase);
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo aceptar la clase.');
    } finally {
      setAccionClaseLoading(null);
    }
  }

  async function handleRechazarClase(solicitudClase) {
    const idClase = solicitudClase.id_clase ?? solicitudClase.id;
    Alert.alert('Rechazar clase', '¿Seguro que quieres rechazar esta solicitud?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, rechazar', style: 'destructive',
        onPress: async () => {
          try {
            setAccionClaseLoading(idClase);
            await claseService.cancelar(idClase);
            setSolicitudesClase(prev => prev.filter(sc => (sc.id_clase ?? sc.id) !== idClase));
          } catch (e) {
            Alert.alert('Error', e.message ?? 'No se pudo rechazar la clase.');
          } finally {
            setAccionClaseLoading(null);
          }
        },
      },
    ]);
  }

  async function handleCancelarPartido(partidoItem) {
    const idPartido = partidoItem.id_partido ?? partidoItem.id;
    Alert.alert('Cancelar partido', '¿Seguro que quieres cancelar este partido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive',
        onPress: async () => {
          try {
            await partidoService.cancelar(idPartido);
            setDatos(prev => ({
              ...prev,
              partidos: (prev?.partidos ?? []).filter(p => (p.id_partido ?? p.id) !== idPartido),
              partido: null,
            }));
          } catch (e) {
            Alert.alert('Error', e.message ?? 'No se pudo cancelar el partido.');
          }
        },
      },
    ]);
  }

  if (claseAceptada) {
    return (
      <SafeAreaView style={styles.safe}>
        <ClaseSuccessScreen
          alumno={claseAceptada}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Partidos' })}
        />
      </SafeAreaView>
    );
  }

  if (retadorAceptado) {
    return (
      <SafeAreaView style={styles.safe}>
        <SuccessScreen
          retador={retadorAceptado}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Partidos' })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis solicitudes</Text>
      </View>

      {fechas.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fechaTabRow}
          style={styles.fechaTabScroll}
        >
          {fechas.map(f => (
            <TouchableOpacity key={f} style={styles.fechaTab} onPress={() => setFechaActiva(f)}>
              <Text style={[styles.fechaTabText, fechaActiva === f && styles.fechaTabTextActive]}>
                {formatFecha(f)}
              </Text>
              {fechaActiva === f && <View style={styles.fechaTabIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Listado de Partidos Creados (Buscando Oponente) */}
          {haySeccionPartidos && (
            partidos.length > 0 ? (
              partidos.map((p, idx) => {
                const pId = p.id_partido ?? p.id ?? idx;
                return (
                  <View key={pId} style={styles.partidoCard}>
                    <Image
                      source={{ uri: p.foto_cancha_url ?? p.uri ?? 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=200&q=80' }}
                      style={styles.partidoImg}
                    />
                    <View style={styles.partidoInfo}>
                      <Text style={styles.partidoCancha}>{p.nombre_cancha ?? p.cancha ?? 'Cancha'}</Text>
                      <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                        <Text style={styles.metaText}> {formatFecha(p.fecha ?? p.fecha_partido)}</Text>
                        <Text style={{ width: 10 }} />
                        <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                        <Text style={styles.metaText}> {p.hora ?? p.hora_partido ?? '--'}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleCancelarPartido(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle-outline" size={26} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No tienes partidos activos buscando oponente</Text>
              </View>
            )
          )}

          {/* Jugadores retándote */}
          {solicitudesFiltradas.length > 0 && (
            <Text style={styles.sectionTitle}>Jugadores retándote</Text>
          )}
          {solicitudesFiltradas.map((s, i) => {
            const idSolicitud = s.id_solicitud ?? s.id ?? String(i);
            const cargando = accionLoading === idSolicitud;
            return (
              <View key={idSolicitud} style={styles.retadorCard}>
                <Image
                  source={getAvatarSource(s.foto_perfil_url)}
                  style={styles.retadorAvatar}
                />
                <View style={styles.retadorInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.retadorName}>
                      {s.apellidos ? `${s.nombre ?? ''} ${s.apellidos}`.trim() : (s.nombre ?? s.name ?? 'Jugador')}
                    </Text>
                    <Ionicons name="trophy" size={13} color={colors.textPrimary} style={{ marginLeft: 6 }} />
                    <Text style={styles.retadorRanking}> {s.ranking ?? '--'}</Text>
                  </View>
                  <Text style={styles.retadorClub}>{s.nombre_cancha ?? s.club ?? ''}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}> {formatFecha(s.fecha ?? s.date)}</Text>
                    <Text style={{ width: 10 }} />
                    <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}> {s.hora ?? s.time ?? '--'}</Text>
                  </View>
                </View>
                <View style={styles.accionesCol}>
                  <TouchableOpacity
                    style={[styles.aceptarBtn, cargando && { opacity: 0.5 }]}
                    onPress={() => handleAceptar(s)}
                    disabled={cargando}
                  >
                    {cargando
                      ? <ActivityIndicator size="small" color={colors.textPrimary} />
                      : <Text style={styles.aceptarText}>Aceptar</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rechazarBtn, cargando && { opacity: 0.5 }]}
                    onPress={() => handleRechazar(s)}
                    disabled={cargando}
                  >
                    <Text style={styles.rechazarText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {!loading && solicitudesFiltradas.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay jugadores retándote aún</Text>
            </View>
          )}

          {/* Solicitudes de clase (solo profesores) */}
          {solicitudesClase.length > 0 && (
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Solicitudes de clase</Text>
          )}
          {solicitudesClase.map((sc, i) => {
            const idClase = sc.id_clase ?? sc.id ?? String(i);
            const cargandoClase = accionClaseLoading === idClase;
            const hora = typeof (sc.hora_clase ?? sc.hora) === 'string'
              ? (sc.hora_clase ?? sc.hora ?? '--').substring(0, 5)
              : '--';
            return (
              <View key={idClase} style={styles.retadorCard}>
                <Image
                  source={getAvatarSource(sc.foto_alumno ?? sc.foto_perfil_url)}
                  style={styles.retadorAvatar}
                />
                <View style={styles.retadorInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.retadorName}>{sc.nombre_alumno ?? sc.nombre ?? 'Alumno'}</Text>
                    <Ionicons name="trophy" size={13} color={colors.textPrimary} style={{ marginLeft: 6 }} />
                    <Text style={styles.retadorRanking}> {sc.ranking_alumno ?? sc.ranking ?? '--'}</Text>
                  </View>
                  <Text style={styles.retadorClub}>{sc.nombre_cancha ?? sc.lugar ?? ''}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}> {formatFecha(sc.fecha_clase ?? sc.fecha)}</Text>
                    <Text style={{ width: 10 }} />
                    <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}> {hora}</Text>
                  </View>
                </View>
                <View style={styles.accionesCol}>
                  <TouchableOpacity
                    style={[styles.aceptarBtn, cargandoClase && { opacity: 0.5 }]}
                    onPress={() => handleAceptarClase(sc)}
                    disabled={cargandoClase}
                  >
                    {cargandoClase
                      ? <ActivityIndicator size="small" color={colors.textPrimary} />
                      : <Text style={styles.aceptarText}>Aceptar</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rechazarBtn, cargandoClase && { opacity: 0.5 }]}
                    onPress={() => handleRechazarClase(sc)}
                    disabled={cargandoClase}
                  >
                    <Text style={styles.rechazarText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },

  fechaTabScroll: { flex: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
  fechaTabRow: { paddingHorizontal: 20 },
  fechaTab: { paddingVertical: 14, marginRight: 24, position: 'relative' },
  fechaTabText: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  fechaTabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  fechaTabIndicator: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: colors.accent, borderRadius: 2,
  },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 16 },

  partidoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, gap: 14, marginBottom: 12,
  },
  partidoImg: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#ccc' },
  partidoInfo: { flex: 1 },
  partidoCancha: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },

  emptyCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 24, alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 14, color: colors.textSecondary },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 12 },

  retadorCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, gap: 12, marginBottom: 12,
  },
  retadorAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ccc' },
  retadorInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  retadorName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  retadorRanking: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  retadorClub: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, fontStyle: 'italic' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: colors.textSecondary },

  accionesCol: { alignItems: 'center', gap: 8 },
  aceptarBtn: {
    borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    minWidth: 80, alignItems: 'center',
  },
  aceptarText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  rechazarBtn: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    minWidth: 80, alignItems: 'center',
  },
  rechazarText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },

  successContainer: { flex: 1, paddingHorizontal: 32, paddingBottom: 40, paddingTop: 20 },
  vsCircle: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#E8E8E8', alignItems: 'center',
    justifyContent: 'center', marginBottom: 32,
  },
  vsAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ccc', borderWidth: 3, borderColor: '#FFFFFF' },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, textAlign: 'center', lineHeight: 32, marginBottom: 12 },
  successSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  accentBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center' },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});