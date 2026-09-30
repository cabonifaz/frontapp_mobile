import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { colors } from '../../constants';
import { solicitudService } from '../../services/solicitudService';
import { partidoService } from '../../services/partidoService';
import { claseService } from '../../services/claseService';
import { doblesService, primerNombre } from '../../services/doblesService';
import { ligaService } from '../../services/ligaService';
import { getAvatarSource } from '../../utils/avatars';

// NUEVO (idiomas): días y meses según el idioma elegido
const DIAS  = () => i18n.t('fechas.diasCortos', { returnObjects: true });
const MESES = () => i18n.t('fechas.mesesAbrev', { returnObjects: true });

function formatFecha(isoString) {
  if (!isoString) return '--';
  const cleanIso = String(isoString).split('T')[0];
  const parts = cleanIso.split('-');
  if (parts.length === 3) {
    const year  = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day   = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d)) {
      return `${DIAS()[d.getDay()]} ${d.getDate()} ${MESES()[d.getMonth()]}, ${d.getFullYear()}`;
    }
  }
  const d = new Date(isoString);
  if (isNaN(d)) return isoString;
  return `${DIAS()[d.getDay()]} ${d.getDate()} ${MESES()[d.getMonth()]}, ${d.getFullYear()}`;
}

// HH:mm (el backend devuelve TIME como '10:00:00')
function formatHora(hora) {
  if (!hora) return '--';
  return String(hora).substring(0, 5);
}

function SuccessScreen({ retador, onPress }) {
  const { t } = useTranslation();
  const firstName = (retador.nombre ?? retador.fullName ?? t('solicitudes.exito.elRetador')).split(' ')[0];
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.vsCircle}>
          <Image source={getAvatarSource(retador.foto_perfil_url)} style={styles.vsAvatar} />
        </View>
        <Text style={styles.successTitle}>{t('solicitudes.exito.aceptadoRetador', { nombre: firstName })}</Text>
        <Text style={styles.successSubtitle}>{t('solicitudes.exito.chateaRetador')}</Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onPress}>
        <Text style={styles.accentBtnText}>{t('solicitudes.exito.irPartidos')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ClaseSuccessScreen({ alumno, onPress }) {
  const { t } = useTranslation();
  const firstName = (alumno.nombre_alumno ?? alumno.nombre ?? t('solicitudes.exito.elAlumno')).split(' ')[0];
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.vsCircle}>
          <Image source={getAvatarSource(alumno.foto_alumno ?? alumno.foto_perfil_url)} style={styles.vsAvatar} />
        </View>
        <Text style={styles.successTitle}>{t('solicitudes.exito.claseAceptada', { nombre: firstName })}</Text>
        <Text style={styles.successSubtitle}>{t('solicitudes.exito.chateaAlumno')}</Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onPress}>
        <Text style={styles.accentBtnText}>{t('solicitudes.exito.irPartidos')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// NUEVO: confirmación al aceptar un reto de amigo
function RetoAceptadoScreen({ reto, onVerPartido, onVolver }) {
  const { t } = useTranslation();
  const firstName = (reto.nombre_creador ?? t('solicitudes.exito.tuAmigo')).split(' ')[0];
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.vsCircle}>
          <Image source={getAvatarSource(reto.foto_creador)} style={styles.vsAvatar} />
        </View>
        <Text style={styles.successTitle}>{t('solicitudes.exito.retoAceptado', { nombre: firstName })}</Text>
        <Text style={styles.successSubtitle}>{t('solicitudes.exito.retoConfirmado')}</Text>
      </View>
      <TouchableOpacity style={[styles.accentBtn, { marginBottom: 12 }]} onPress={onVerPartido}>
        <Text style={styles.accentBtnText}>{t('solicitudes.exito.verPartido')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.outlineBtn} onPress={onVolver}>
        <Text style={styles.outlineBtnText}>{t('solicitudes.exito.irPartidos')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function MisSolicitudesScreen({ navigation, route }) {
  const { t } = useTranslation();   // NUEVO: idiomas
  const tipo = route?.params?.tipo ?? 'partidos'; // 'partidos' | 'clases'
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retadorAceptado, setRetadorAceptado] = useState(null);
  const [accionLoading, setAccionLoading] = useState(null);
  const [solicitudesClase, setSolicitudesClase] = useState([]);
  const [claseAceptada, setClaseAceptada] = useState(null);
  const [accionClaseLoading, setAccionClaseLoading] = useState(null);

  // NUEVO: retos directos de amigos
  const [retosAmigos, setRetosAmigos] = useState([]);
  const [accionRetoLoading, setAccionRetoLoading] = useState(null);
  const [retoAceptado, setRetoAceptado] = useState(null);

  // NUEVO: dobles (invitaciones y parejas por aprobar)
  const [doblesPend, setDoblesPend] = useState([]);
  const [accionDoblesLoading, setAccionDoblesLoading] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [res, claseRes, retosRes, doblesRes] = await Promise.allSettled([
        solicitudService.misSolicitudes(),
        claseService.solicitudesProfesor(),
        partidoService.retosRecibidos(),
        doblesService.pendientes(),
      ]);
      setDoblesPend(
        doblesRes.status === 'fulfilled' && Array.isArray(doblesRes.value) ? doblesRes.value : []
      );
      if (res.status === 'fulfilled') setDatos(res.value);
      else setDatos(null);
      if (claseRes.status === 'fulfilled' && Array.isArray(claseRes.value)) {
        setSolicitudesClase(claseRes.value);
      } else {
        setSolicitudesClase([]);
      }
      setRetosAmigos(
        retosRes.status === 'fulfilled' && Array.isArray(retosRes.value) ? retosRes.value : []
      );
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

  const partidos = datos?.partidos ?? (datos?.partido ? [datos.partido] : []);
  const solicitudes = datos?.solicitudes ?? datos?.postulantes ?? [];

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
      Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorAceptarRetador'));
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
      Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorRechazarRetador'));
    } finally {
      setAccionLoading(null);
    }
  }

  // NUEVO: aceptar / rechazar reto de amigo
  async function handleResponderReto(reto, aceptar) {
    const idPartido = reto.id_partido;
    const nombre = (reto.nombre_creador ?? t('solicitudes.exito.tuAmigo')).split(' ')[0];

    const ejecutar = async () => {
      try {
        setAccionRetoLoading(idPartido);
        await partidoService.responderReto(idPartido, aceptar);
        setRetosAmigos(prev => prev.filter(r => r.id_partido !== idPartido));
        if (aceptar) setRetoAceptado(reto);
      } catch (e) {
        Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorResponderReto'));
      } finally {
        setAccionRetoLoading(null);
      }
    };

    if (aceptar) {
      ejecutar();
    } else {
      Alert.alert(t('solicitudes.alertas.rechazarReto'), t('solicitudes.alertas.rechazarRetoMensaje', { nombre }), [
        { text: t('solicitudes.alertas.no'), style: 'cancel' },
        { text: t('solicitudes.alertas.siRechazar'), style: 'destructive', onPress: ejecutar },
      ]);
    }
  }

  // NUEVO: dobles — responder una invitación (compañero, rival o compañero retador)
  async function handleInvitacionDobles(item, aceptar) {
    const esEquipoLiga = item.tipo === 'EQUIPO_LIGA';
    const clave = esEquipoLiga ? `eq-${item.id_liga_inscripcion}` : `inv-${item.id_partido}`;
    const ejecutar = async () => {
      try {
        setAccionDoblesLoading(clave);
        const res = esEquipoLiga
          ? await ligaService.responderEquipo(item.id_liga_inscripcion, aceptar)   // NUEVO: equipo de liga
          : await doblesService.responderInvitacion(item.id_partido, aceptar);
        Alert.alert(aceptar ? t('solicitudes.alertas.listo') : t('solicitudes.alertas.invitacionRechazada'), res?.mensaje ?? '');
        cargar();
      } catch (e) {
        Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorInvitacion'));
      } finally {
        setAccionDoblesLoading(null);
      }
    };
    if (aceptar) return ejecutar();
    const aviso = item.rol === 'COMPANERO_RETADOR'
      ? t('solicitudes.alertas.avisoCompaneroRetador')
      : item.rol === 'COMPANERO_LIGA'
        ? t('solicitudes.alertas.avisoCompaneroLiga', { nombre: primerNombre(item.nombre_invitador) })
        : item.rol === 'RIVAL_LIGA'
          ? t('solicitudes.alertas.avisoRivalLiga')
          : t('solicitudes.alertas.avisoCancelaTodos');
    Alert.alert(t('solicitudes.alertas.rechazarInvitacion'), aviso, [
      { text: t('solicitudes.alertas.no'), style: 'cancel' },
      { text: t('solicitudes.alertas.siRechazar'), style: 'destructive', onPress: ejecutar },
    ]);
  }

  // NUEVO: dobles — aprobar o rechazar a una pareja retadora
  async function handleParejaDobles(item, aceptar) {
    const clave = `par-${item.id_partido}-${item.id_lider}`;
    const ejecutar = async () => {
      try {
        setAccionDoblesLoading(clave);
        const res = await doblesService.responderPareja(item.id_partido, item.id_lider, aceptar);
        Alert.alert(res?.estado === 'CONFIRMADO' ? t('solicitudes.alertas.partidoConfirmado') : t('solicitudes.alertas.listoSimple'), res?.mensaje ?? '');
        cargar();
      } catch (e) {
        Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorPareja'));
      } finally {
        setAccionDoblesLoading(null);
      }
    };
    if (aceptar) return ejecutar();
    Alert.alert(t('solicitudes.alertas.rechazarPareja'), t('solicitudes.alertas.rechazarParejaMensaje', { a: primerNombre(item.nombre_retador), b: primerNombre(item.nombre_companero_retador) }), [
      { text: t('solicitudes.alertas.no'), style: 'cancel' },
      { text: t('solicitudes.alertas.siRechazar'), style: 'destructive', onPress: ejecutar },
    ]);
  }

  function textoInvitacion(item) {
    const quien = primerNombre(item.nombre_invitador);
    // Los roles (COMPANERO, RIVAL...) vienen del backend y no se traducen; solo sus textos
    if (item.rol === 'COMPANERO') return t('solicitudes.inv.companero', { quien });
    if (item.rol === 'RIVAL') return t('solicitudes.inv.rival', { quien });
    if (item.rol === 'RIVAL_LIGA') return t('solicitudes.inv.rivalLiga', { quien });
    if (item.rol === 'COMPANERO_LIGA') return t('solicitudes.inv.companeroLiga', { quien });
    return t('solicitudes.inv.companeroRetador', { quien });
  }

  async function handleAceptarClase(solicitudClase) {
    const idClase = solicitudClase.id_clase ?? solicitudClase.id;
    try {
      setAccionClaseLoading(idClase);
      await claseService.aceptar(idClase);
      setClaseAceptada(solicitudClase);
    } catch (e) {
      Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorAceptarClase'));
    } finally {
      setAccionClaseLoading(null);
    }
  }

  async function handleRechazarClase(solicitudClase) {
    const idClase = solicitudClase.id_clase ?? solicitudClase.id;
    Alert.alert(t('solicitudes.alertas.rechazarClase'), t('solicitudes.alertas.rechazarClaseMensaje'), [
      { text: t('solicitudes.alertas.no'), style: 'cancel' },
      {
        text: t('solicitudes.alertas.siRechazar'), style: 'destructive',
        onPress: async () => {
          try {
            setAccionClaseLoading(idClase);
            await claseService.rechazar(idClase);
            setSolicitudesClase(prev => prev.filter(sc => (sc.id_clase ?? sc.id) !== idClase));
          } catch (e) {
            Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorRechazarClase'));
          } finally {
            setAccionClaseLoading(null);
          }
        },
      },
    ]);
  }

  async function handleCancelarPartido(partidoItem) {
    const idPartido = partidoItem.id_partido ?? partidoItem.id;
    Alert.alert(t('solicitudes.alertas.cancelarPartido'), t('solicitudes.alertas.cancelarPartidoMensaje'), [
      { text: t('solicitudes.alertas.no'), style: 'cancel' },
      {
        text: t('solicitudes.alertas.siCancelar'), style: 'destructive',
        onPress: async () => {
          try {
            await partidoService.cancelar(idPartido);
            setDatos(prev => ({
              ...prev,
              partidos: (prev?.partidos ?? []).filter(p => (p.id_partido ?? p.id) !== idPartido),
              partido: null,
            }));
          } catch (e) {
            Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorCancelar'));
          }
        },
      },
    ]);
  }

  if (retoAceptado) {
    return (
      <SafeAreaView style={styles.safe}>
        <RetoAceptadoScreen
          reto={retoAceptado}
          onVerPartido={() => navigation.replace('DetallePartido', { partido: { id_partido: retoAceptado.id_partido } })}
          onVolver={() => navigation.navigate('MainTabs', { screen: 'Partidos' })}
        />
      </SafeAreaView>
    );
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
        <Text style={styles.headerTitle}>{tipo === 'clases' ? t('solicitudes.tituloClases') : t('solicitudes.titulo')}</Text>
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

          {/* ── Sección PARTIDOS ── */}
          {tipo === 'partidos' && (
            <>
              {/* ── 0. DOBLES (solo si hay pendientes) ── */}
              {doblesPend.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 0 }]}>{t('solicitudes.dobles')}</Text>
                  <Text style={styles.sectionHint}>{t('solicitudes.doblesHint')}</Text>
                  {doblesPend.map(item => {
                    const esPareja = item.tipo === 'PAREJA';
                    const esEquipoLiga = item.tipo === 'EQUIPO_LIGA';
                    const esDeLiga = esEquipoLiga || item.rol === 'RIVAL_LIGA';
                    const clave = esPareja
                      ? `par-${item.id_partido}-${item.id_lider}`
                      : esEquipoLiga ? `eq-${item.id_liga_inscripcion}` : `inv-${item.id_partido}`;
                    const cargando = accionDoblesLoading === clave;
                    const yaAprobe = Number(item.ya_aprobe ?? 0) === 1;
                    const compAprobo = Number(item.companero_aprobo ?? 0) === 1;
                    return (
                      <View key={clave} style={[styles.retadorCard, styles.retoAmigoCard]}>
                        {esPareja ? (
                          <View style={styles.parejaAvatares}>
                            <Image source={getAvatarSource(item.foto_retador)} style={[styles.parejaAvatar, { top: 0, left: 0 }]} />
                            <Image source={getAvatarSource(item.foto_companero_retador)} style={[styles.parejaAvatar, { bottom: 0, right: 0 }]} />
                          </View>
                        ) : (
                          <Image source={getAvatarSource(item.foto_invitador)} style={styles.retadorAvatar} />
                        )}
                        <View style={styles.retadorInfo}>
                          <View style={[styles.tipoRetoChip, styles.tipoRetoLiga]}>
                            <Text style={[styles.tipoRetoText, styles.tipoRetoTextLiga]}>
                              {esDeLiga ? t('solicitudes.ligaDobles') : t('solicitudes.doblesSets', { sets: Number(item.num_sets) === 3 ? t('partidos.sets3') : t('partidos.sets5') })}
                            </Text>
                          </View>
                          <Text style={styles.retadorName} numberOfLines={2}>
                            {esPareja
                              ? t('solicitudes.quierenRetarlos', { a: primerNombre(item.nombre_retador), b: primerNombre(item.nombre_companero_retador) })
                              : textoInvitacion(item)}
                          </Text>
                          <Text style={styles.retadorClub} numberOfLines={1}>
                            {esDeLiga ? (item.nombre_liga ?? t('solicitudes.ligaDeDobles')) : (item.nombre_cancha ?? '')}
                          </Text>
                          {item.fecha ? (
                            <View style={styles.metaRow}>
                              <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                              <Text style={styles.metaText}> {formatFecha(item.fecha)}</Text>
                              <Text style={{ width: 10 }} />
                              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                              <Text style={styles.metaText}> {formatHora(item.hora)}</Text>
                            </View>
                          ) : null}
                          {item.rol === 'RIVAL_LIGA' && (
                            <Text style={styles.doblesEstado}>{t('solicitudes.bastaUno')}</Text>
                          )}
                          {esPareja && (yaAprobe || compAprobo) && (
                            <Text style={styles.doblesEstado}>
                              {yaAprobe ? t('solicitudes.yaAprobaste') : t('solicitudes.companeroAprobo')}
                            </Text>
                          )}
                        </View>
                        <View style={styles.accionesCol}>
                          {!(esPareja && yaAprobe) && (
                            <TouchableOpacity
                              style={[styles.aceptarBtn, cargando && { opacity: 0.5 }]}
                              onPress={() => (esPareja ? handleParejaDobles(item, true) : handleInvitacionDobles(item, true))}
                              disabled={cargando}
                            >
                              {cargando
                                ? <ActivityIndicator size="small" color={colors.textPrimary} />
                                : <Text style={styles.aceptarText}>{esPareja ? t('solicitudes.aprobar') : t('solicitudes.aceptar')}</Text>}
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[styles.rechazarBtn, cargando && { opacity: 0.5 }]}
                            onPress={() => (esPareja ? handleParejaDobles(item, false) : handleInvitacionDobles(item, false))}
                            disabled={cargando}
                          >
                            <Text style={styles.rechazarText}>{t('solicitudes.rechazar')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}

              {/* ── 1. RETOS DE AMIGOS ── */}
              <Text style={[styles.sectionTitle, doblesPend.length === 0 && { marginTop: 0 }]}>{t('solicitudes.retosRecibidos')}</Text>
              <Text style={styles.sectionHint}>{t('solicitudes.retosHint')}</Text>
              {retosAmigos.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>{t('solicitudes.sinRetos')}</Text>
                </View>
              ) : (
                retosAmigos.map(r => {
                  const cargandoReto = accionRetoLoading === r.id_partido;
                  return (
                    <View key={`reto-${r.id_partido}`} style={[styles.retadorCard, styles.retoAmigoCard]}>
                      <Image source={getAvatarSource(r.foto_creador)} style={styles.retadorAvatar} />
                      <View style={styles.retadorInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.retadorName} numberOfLines={1}>{r.nombre_creador ?? t('solicitudes.amigo')}</Text>
                          <Ionicons name="trophy" size={13} color={colors.textPrimary} style={{ marginLeft: 6 }} />
                          <Text style={styles.retadorRanking}> {r.ranking_creador ?? '--'}</Text>
                        </View>
                        <View style={[styles.tipoRetoChip, r.id_liga ? styles.tipoRetoLiga : null]}>
                          <Text style={[styles.tipoRetoText, r.id_liga ? styles.tipoRetoTextLiga : null]} numberOfLines={1}>
                            {r.id_liga ? (r.nombre_liga ?? t('solicitudes.liga')) : t('solicitudes.amistoso')}
                          </Text>
                        </View>
                        <Text style={styles.retadorClub}>
                          {r.nombre_cancha ?? ''}{r.num_sets ? `  ·  ${Number(r.num_sets) === 3 ? t('partidos.sets3') : t('partidos.sets5')}` : ''}
                        </Text>
                        <View style={styles.metaRow}>
                          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                          <Text style={styles.metaText}> {formatFecha(r.fecha)}</Text>
                          <Text style={{ width: 10 }} />
                          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                          <Text style={styles.metaText}> {formatHora(r.hora)}</Text>
                        </View>
                      </View>
                      <View style={styles.accionesCol}>
                        <TouchableOpacity
                          style={[styles.aceptarBtn, cargandoReto && { opacity: 0.5 }]}
                          onPress={() => handleResponderReto(r, true)}
                          disabled={cargandoReto}
                        >
                          {cargandoReto
                            ? <ActivityIndicator size="small" color={colors.textPrimary} />
                            : <Text style={styles.aceptarText}>{t('solicitudes.aceptar')}</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.rechazarBtn, cargandoReto && { opacity: 0.5 }]}
                          onPress={() => handleResponderReto(r, false)}
                          disabled={cargandoReto}
                        >
                          <Text style={styles.rechazarText}>{t('solicitudes.rechazar')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}

              {/* ── 2. MIS CONVOCATORIAS ── */}
              <Text style={styles.sectionTitle}>{t('solicitudes.convocatorias')}</Text>
              <Text style={styles.sectionHint}>{t('solicitudes.convocatoriasHint')}</Text>
              {partidos.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>{t('solicitudes.sinConvocatorias')}</Text>
                </View>
              ) : (
                partidos.map((p, idx) => {
                  const pId = p.id_partido ?? p.id ?? idx;
                  return (
                    <View key={pId} style={styles.partidoCard}>
                      <Image
                        source={{ uri: p.foto_cancha_url ?? p.uri ?? 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=200&q=80' }}
                        style={styles.partidoImg}
                      />
                      <View style={styles.partidoInfo}>
                        <Text style={styles.partidoCancha}>{p.nombre_cancha ?? p.cancha ?? t('solicitudes.cancha')}</Text>
                        <View style={styles.metaRow}>
                          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                          <Text style={styles.metaText}> {formatFecha(p.fecha ?? p.fecha_partido)}</Text>
                          <Text style={{ width: 10 }} />
                          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                          <Text style={styles.metaText}> {formatHora(p.hora ?? p.hora_partido)}</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => handleCancelarPartido(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle-outline" size={26} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}

              {/* ── 3. JUGADORES RETÁNDOTE (postulantes a mis convocatorias) ── */}
              <Text style={styles.sectionTitle}>{t('solicitudes.retandote')}</Text>
              <Text style={styles.sectionHint}>{t('solicitudes.retandoteHint')}</Text>
              {solicitudesFiltradas.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    {partidos.length === 0 ? t('solicitudes.creaConvocatoria') : t('solicitudes.nadiePostulado')}
                  </Text>
                </View>
              ) : (
                solicitudesFiltradas.map((s, i) => {
                  const idSolicitud = s.id_solicitud ?? s.id ?? String(i);
                  const cargando = accionLoading === idSolicitud;
                  return (
                    <View key={`${idSolicitud}-${s.id_usuario ?? i}`} style={styles.retadorCard}>
                      <Image source={getAvatarSource(s.foto_perfil_url)} style={styles.retadorAvatar} />
                      <View style={styles.retadorInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.retadorName} numberOfLines={1}>
                            {s.apellidos ? `${s.nombre ?? ''} ${s.apellidos}`.trim() : (s.nombre ?? s.name ?? t('solicitudes.jugador'))}
                          </Text>
                          {s.ranking != null && (
                            <>
                              <Ionicons name="trophy" size={13} color={colors.textPrimary} style={{ marginLeft: 6 }} />
                              <Text style={styles.retadorRanking}> {s.ranking}</Text>
                            </>
                          )}
                        </View>
                        <Text style={styles.retadorClub}>{s.nombre_cancha ?? s.club ?? ''}</Text>
                        <View style={styles.metaRow}>
                          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                          <Text style={styles.metaText}> {formatFecha(s.fecha ?? s.date)}</Text>
                          <Text style={{ width: 10 }} />
                          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                          <Text style={styles.metaText}> {formatHora(s.hora ?? s.time)}</Text>
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
                            : <Text style={styles.aceptarText}>{t('solicitudes.aceptar')}</Text>
                          }
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.rechazarBtn, cargando && { opacity: 0.5 }]}
                          onPress={() => handleRechazar(s)}
                          disabled={cargando}
                        >
                          <Text style={styles.rechazarText}>{t('solicitudes.rechazar')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* ── Sección CLASES ── */}
          {tipo === 'clases' && (
            <>
              {solicitudesClase.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>{t('solicitudes.sinClases')}</Text>
                </View>
              ) : (
                solicitudesClase.map((sc, i) => {
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
                          <Text style={styles.retadorName}>{sc.nombre_alumno ?? sc.nombre ?? t('solicitudes.alumno')}</Text>
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
                            : <Text style={styles.aceptarText}>{t('solicitudes.aceptar')}</Text>
                          }
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.rechazarBtn, cargandoClase && { opacity: 0.5 }]}
                          onPress={() => handleRechazarClase(sc)}
                          disabled={cargandoClase}
                        >
                          <Text style={styles.rechazarText}>{t('solicitudes.rechazar')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

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

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2, marginTop: 20 },
  // NUEVO: dobles
  parejaAvatares: { width: 56, height: 56 },
  parejaAvatar: {
    position: 'absolute', width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#ccc', borderWidth: 2, borderColor: colors.surface,
  },
  doblesEstado: { fontSize: 12, fontWeight: '700', color: colors.accent, marginTop: 4 },
  sectionHint: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },

  retadorCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, gap: 12, marginBottom: 12,
  },
  retoAmigoCard: { backgroundColor: colors.accentLight }, // resalta los retos recibidos
  tipoRetoChip: {
    alignSelf: 'flex-start', backgroundColor: colors.background, borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2, marginBottom: 4, maxWidth: '100%',
  },
  tipoRetoLiga: { backgroundColor: colors.dark },
  tipoRetoText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  tipoRetoTextLiga: { color: colors.accent },
  retadorAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ccc' },
  retadorInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  retadorName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
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
  outlineBtn: {
    borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 30, paddingVertical: 16, alignItems: 'center',
  },
  outlineBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
});