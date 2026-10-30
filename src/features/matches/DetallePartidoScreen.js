import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, ImageBackground, Dimensions, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { partidoService } from '../../services/partidoService';
import { authService } from '../../services/authService';
import { doblesService, primerNombre } from '../../services/doblesService';
import { getAvatarSource } from '../../utils/avatars';
// NUEVO (08): retiros, sustitutos y estado en vivo
import { enVivoService } from '../../services/enVivoService';
import { SelectorAmigoModal } from '../../components/common/SelectorAmigoModal';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 200;
const AVATAR_SIZE = 90;

export function DetallePartidoScreen({ navigation, route }) {
  const { t } = useTranslation();   // NUEVO: idiomas
  const insets = useSafeAreaInsets();
  const itemInicial = route?.params?.partido ?? {};
  const [item, setItem] = useState(itemInicial);
  const [cargando, setCargando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [usuarioActualId, setUsuarioActualId] = useState(null);
  const [respondiendo, setRespondiendo] = useState(false); // NUEVO
  const [jugadores, setJugadores] = useState([]);          // NUEVO: dobles

  const partidoId = itemInicial.id_partido ?? itemInicial.id_encuentro ?? itemInicial.id;

  // NUEVO (08): quién se retiró, sustitutos pendientes y eventos (vienen del detalle en vivo)
  const [vivoInfo, setVivoInfo] = useState(null);
  const [accion, setAccion] = useState(false);
  const [elegirSustituto, setElegirSustituto] = useState(false);
  const recargarEstado = React.useCallback(async () => {
    if (!partidoId) return;
    const [det, info, lista] = await Promise.all([
      partidoService.obtenerDetalle(partidoId).catch(() => null),
      enVivoService.detalle(partidoId).catch(() => null),
      doblesService.participantes(partidoId).catch(() => null),
    ]);
    const data = det?.data ?? det;
    if (data && typeof data === 'object') setItem(prev => ({ ...prev, ...data }));
    if (info) setVivoInfo(info);
    if (Array.isArray(lista) && Number((data ?? {}).es_dobles ?? 0) === 1) setJugadores(lista);
  }, [partidoId]);
  useEffect(() => {
    enVivoService.detalle(partidoId).then(setVivoInfo).catch(() => {});
  }, [partidoId]);

  useEffect(() => {
    async function obtenerIdUsuario() {
      try {
        const id = await authService.getUserId();
        setUsuarioActualId(id);
      } catch (e) {
        console.log('Error al obtener ID del usuario actual:', e);
      }
    }
    obtenerIdUsuario();
  }, []);

  useEffect(() => {
    async function cargarDetalle() {
      if (!partidoId) return;
      try {
        setCargando(true);
        const res = await partidoService.obtenerDetalle(partidoId);
        const data = res?.data ?? res;
        if (data && typeof data === 'object') {
          setItem((prev) => ({ ...prev, ...data }));
          // NUEVO: en dobles, traer a los 4 jugadores con su pareja
          if (Number(data.es_dobles ?? 0) === 1) {
            const lista = await doblesService.participantes(partidoId).catch(() => []);
            setJugadores(Array.isArray(lista) ? lista : []);
          }
        }
      } catch (error) {
        console.log('Error al obtener detalle del partido:', error);
      } finally {
        setCargando(false);
      }
    }
    cargarDetalle();
  }, [partidoId]);

  const limpiarFecha = (fechaStr) => {
    if (!fechaStr) return '--';
    const str = String(fechaStr).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    return str;
  };

  const limpiarHora = (horaStr) => {
    if (!horaStr) return '--';
    const str = String(horaStr).trim();
    if (str.includes('T')) return str.split('T')[1].substring(0, 5);
    return str.length > 5 ? str.substring(0, 5) : str;
  };

  const idCreador     = item.id_creador ?? item.id_usuario_creador ?? null;
  const idParticipante = item.id_usuario_rival ?? item.id_rival ?? item.id_usuario ?? null;

  // NUEVO (07): tocar la foto de un jugador abre su perfil
  function verPerfil(idUsuario, nombre, foto) {
    if (!idUsuario || Number(idUsuario) === Number(usuarioActualId)) return;
    navigation.navigate('PlayerProfile', { player: { id_usuario: idUsuario, nombre, avatar: foto } });
  }

  const esMiCreacion =
    idParticipante != null && usuarioActualId != null
      ? Number(usuarioActualId) !== Number(idParticipante)
      : false;

  const datosCreador = {
    id:      idCreador,
    name:    item.creador ?? item.nombre_yo ?? t('detalle.creador'),
    ranking: item.ranking_creador ?? item.ranking_yo ?? '--',
    pts:     item.puntos_creador ?? item.puntos_yo ?? 0,
    avatar:  item.foto_perfil_url_creador ?? item.foto_yo ?? null,
  };

  const datosParticipante = {
    id:      item.id_usuario_rival ?? item.id_rival ?? item.id_usuario,
    name:    item.participante ?? item.rival ?? item.nombre_rival ?? t('detalle.participante'),
    ranking: item.ranking_rival ?? '--',
    pts:     item.puntos_rival ?? 0,
    avatar:  item.foto_perfil_url_rival ?? item.foto_perfil_url_rival_alt ?? item.foto_rival ?? null,
  };

  const yo    = esMiCreacion ? datosCreador : datosParticipante;
  const rival = esMiCreacion ? datosParticipante : datosCreador;

  const partido = {
    id:       partidoId,
    club:     item.nombre_cancha ?? item.cancha ?? item.lugar ?? item.club ?? t('detalle.cancha'),
    address:  item.direccion_cancha ?? item.direccion ?? '',
    date:     limpiarFecha(item.fecha_partido ?? item.fecha),
    time:     limpiarHora(item.hora_partido ?? item.hora),
    coverUri: item.foto_cancha_url ?? item.coverUri ?? 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
  };

  const estadoPartido = Number(item.estado_partido ?? 0);
  const esBuscando    = estadoPartido === 28; // BUSCANDO: sin rival confirmado
  const esFinalizado  = estadoPartido === 31 || estadoPartido === 32; // 31=Finalizado, 32=Cancelado

  // NUEVO: reto directo a un amigo esperando respuesta
  const esPendiente = estadoPartido === 29;
  const soyCreador  = idCreador != null && Number(usuarioActualId) === Number(idCreador);
  const soyInvitado = esPendiente && !soyCreador && Number(item.es_dobles ?? 0) !== 1;
  const rivalNombre = String(rival.name ?? '').split(' ')[0];
  // NUEVO: tipo de partido (liga / rankeado antiguo / amistoso)
  const esLiga      = Number(item.es_liga ?? 0) === 1 || item.id_liga != null;
  const codigoTipo  = item.tipo_reto_codigo ?? '';
  const esRankeado  = codigoTipo === 'TIPO_RANKEADO' || String(item.tipo_reto ?? '').toLowerCase().includes('rank');
  const esRetoLiga  = esLiga || esRankeado;
  const numSets     = Number(item.num_sets ?? 5);
  const formatoSets = numSets === 3 ? t('detalle.formato3') : t('detalle.formato5');

  // NUEVO: dobles
  const esDoblesPartido = Number(item.es_dobles ?? 0) === 1;
  const yoJugador   = jugadores.find(j => Number(j.es_yo) === 1) ?? null;
  const miEquipo    = Number(yoJugador?.equipo ?? item.mi_equipo ?? 0) || null;
  const miPareja    = jugadores.filter(j => Number(j.equipo) === miEquipo);
  const parejaRival = jugadores.filter(j => Number(j.equipo) !== miEquipo);
  // NUEVO (08): los que juegan de verdad (sin retirados ni sustitutos por aceptar)
  const activo = (j) => Number(j.retirado ?? 0) !== 1 && Number(j.es_sustituto_pendiente ?? 0) !== 1;
  const miParejaActiva    = miPareja.filter(activo);
  const parejaRivalActiva = parejaRival.filter(activo);
  const pendientesDobles = jugadores.filter(j => j.estado_codigo === 'PART_INVITADO');
  const soyInvitadoDobles = esDoblesPartido && yoJugador?.estado_codigo === 'PART_INVITADO';
  const nombresPareja = (lista) => lista.map(j => primerNombre(j.nombre ?? j.nombre_completo)).join(' y ');
  // Orientación del marcador: mi lado primero (sirve para singles y dobles)
  const yoEsLocal = item.soy_equipo_local != null ? Number(item.soy_equipo_local) === 1 : esMiCreacion;

  // ── NUEVO (08): retiros ────────────────────────────────────────────────
  const esConfirmado = estadoPartido === 30;
  const jugVivo   = Array.isArray(vivoInfo?.jugadores) ? vivoInfo.jugadores : [];
  const yoVivo    = jugVivo.find(j => Number(j.id_usuario) === Number(usuarioActualId));
  const miLado    = Number(yoVivo?.lado ?? 0);
  const requeridos = esDoblesPartido ? 2 : 1;
  const activosLado = (l) => jugVivo.filter(j => Number(j.lado) === l && j.estado === 'ACTIVO').length;
  const faltaEnLado = (l) => jugVivo.length > 0 && activosLado(l) < requeridos;
  const pendienteLado = (l) => jugVivo.some(j => Number(j.lado) === l && j.estado === 'SUSTITUTO_PENDIENTE');
  const retiradoIds = jugVivo.filter(j => j.estado === 'RETIRADO').map(j => Number(j.id_usuario));
  const estaRetirado = (id) => id != null && retiradoIds.includes(Number(id));
  const soyActivo  = yoVivo?.estado === 'ACTIVO';
  const yoRetirado = yoVivo?.estado === 'RETIRADO';
  const soySustitutoPendiente = esConfirmado && (yoVivo?.estado === 'SUSTITUTO_PENDIENTE'
    || jugadores.some(j => Number(j.es_yo) === 1 && Number(j.es_sustituto_pendiente) === 1));
  const ladoRival  = miLado === 1 ? 2 : miLado === 2 ? 1 : 0;
  const rivalIncompleto = esConfirmado && soyActivo && ladoRival > 0 && faltaEnLado(ladoRival);
  const miLadoIncompleto = esConfirmado && soyActivo && miLado > 0 && faltaEnLado(miLado);
  const sinResultado = !item.id_resultado;
  const nombresRetirados = jugVivo.filter(j => j.estado === 'RETIRADO').map(j => primerNombre(j.nombre)).join(' y ');
  // Cancelar: solo el creador; si ya está confirmado, solo hasta 5 horas antes
  const inicioPartido = (() => {
    const f = limpiarFecha(item.fecha_partido ?? item.fecha);
    const h = limpiarHora(item.hora_partido ?? item.hora);
    const d = new Date(`${f}T${h.length === 5 ? `${h}:00` : h}`);
    return isNaN(d.getTime()) ? null : d;
  })();
  const horasParaInicio = inicioPartido ? (inicioPartido.getTime() - Date.now()) / 3600000 : null;
  const puedeCancelar = soyCreador && !esFinalizado && (!esConfirmado || horasParaInicio == null || horasParaInicio >= 5);
  const puedeRetirarse = esConfirmado && soyActivo && sinResultado;

  function handleRetirarse() {
    const enVivo = vivoInfo?.estado_vivo === 'EN_JUEGO';
    Alert.alert(
      enVivo ? t('retiro.abandonarTitulo') : t('retiro.titulo'),
      enVivo ? t('retiro.abandonarMensaje') : (esDoblesPartido ? t('retiro.mensajeDobles') : t('retiro.mensaje')),
      [
        { text: t('solicitudes.alertas.no'), style: 'cancel' },
        {
          text: enVivo ? t('retiro.abandonar') : t('retiro.confirmar'),
          style: 'destructive',
          onPress: async () => {
            try {
              setAccion(true);
              const res = await partidoService.retirarse(partido.id);
              Alert.alert(t('retiro.listo'), res?.mensaje ?? '');
              await recargarEstado();
            } catch (e) {
              Alert.alert(t('comun.error'), e.message);
            } finally {
              setAccion(false);
            }
          },
        },
      ],
    );
  }

  async function handleInvitarSustituto(amigo) {
    setElegirSustituto(false);
    try {
      setAccion(true);
      const res = await partidoService.invitarSustituto(partido.id, amigo.id_usuario);
      Alert.alert(t('retiro.sustitutoTitulo'), res?.mensaje ?? '');
      await recargarEstado();
    } catch (e) {
      Alert.alert(t('comun.error'), e.message);
    } finally {
      setAccion(false);
    }
  }

  async function handleResponderSustituto(aceptar) {
    try {
      setAccion(true);
      const res = await partidoService.responderSustituto(partido.id, aceptar);
      Alert.alert(t('retiro.sustitutoTitulo'), res?.mensaje ?? '');
      if (!aceptar) { navigation.goBack(); return; }
      await recargarEstado();
    } catch (e) {
      Alert.alert(t('comun.error'), e.message);
    } finally {
      setAccion(false);
    }
  }

  async function handleCancelar() {
    Alert.alert(t('solicitudes.alertas.cancelarPartido'), t('solicitudes.alertas.cancelarPartidoMensaje'), [
      { text: t('solicitudes.alertas.no'), style: 'cancel' },
      {
        text: t('solicitudes.alertas.siCancelar'), style: 'destructive',
        onPress: async () => {
          try {
            setCancelando(true);
            if (partido.id) await partidoService.cancelar(partido.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorCancelar'));
          } finally {
            setCancelando(false);
          }
        },
      },
    ]);
  }

  // NUEVO: el amigo invitado acepta o rechaza el reto
  async function handleResponderReto(aceptar) {
    const ejecutar = async () => {
      try {
        setRespondiendo(true);
        await partidoService.responderReto(partido.id, aceptar);
        if (aceptar) {
          setItem(prev => ({ ...prev, estado_partido: 30 })); // Confirmado
          Alert.alert(t('detalle.retoAceptado'), t('detalle.retoAceptadoMensaje', { nombre: rivalNombre }));
        } else {
          navigation.goBack();
        }
      } catch (e) {
        Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorResponderReto'));
      } finally {
        setRespondiendo(false);
      }
    };

    if (aceptar) {
      ejecutar();
    } else {
      Alert.alert(t('detalle.rechazarReto'), t('detalle.rechazarRetoMensaje'), [
        { text: t('solicitudes.alertas.no'), style: 'cancel' },
        { text: t('solicitudes.alertas.siRechazar'), style: 'destructive', onPress: ejecutar },
      ]);
    }
  }

  // NUEVO: responder invitación de dobles desde el detalle
  async function handleInvitacionDobles(aceptar) {
    const ejecutar = async () => {
      try {
        setRespondiendo(true);
        const res = await doblesService.responderInvitacion(partido.id, aceptar);
        if (!aceptar) { navigation.goBack(); return; }
        Alert.alert(t('solicitudes.alertas.listo'), res?.mensaje ?? '');
        const [det, lista] = await Promise.all([
          partidoService.obtenerDetalle(partido.id).catch(() => null),
          doblesService.participantes(partido.id).catch(() => []),
        ]);
        if (det) setItem(prev => ({ ...prev, ...(det?.data ?? det) }));
        setJugadores(Array.isArray(lista) ? lista : []);
      } catch (e) {
        Alert.alert(t('comun.error'), e.message ?? t('solicitudes.alertas.errorInvitacion'));
      } finally {
        setRespondiendo(false);
      }
    };
    if (aceptar) return ejecutar();
    Alert.alert(t('solicitudes.alertas.rechazarInvitacion'), esLiga ? t('solicitudes.alertas.avisoRivalLiga') : t('solicitudes.alertas.avisoCancelaTodos'), [
      { text: t('solicitudes.alertas.no'), style: 'cancel' },
      { text: t('solicitudes.alertas.siRechazar'), style: 'destructive', onPress: ejecutar },
    ]);
  }

  if (usuarioActualId === null) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Cover */}
      <ImageBackground source={{ uri: partido.coverUri }} style={styles.cover}>
        <SafeAreaView>
          <View style={[styles.coverHeader, { marginTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Sheet */}
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        {cargando && <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 12 }} />}

        {/* NUEVO: tipo de partido */}
        {esLiga ? (
          <View style={styles.tipoLiga}>
            <Ionicons name="trophy" size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipoLigaLabel}>{t('detalle.partidoLiga', { formato: formatoSets })}</Text>
              <Text style={styles.tipoLigaNombre} numberOfLines={2}>{item.nombre_liga ?? t('detalle.ligaRanking')}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.tipoAmistoso}>
            <Ionicons name={esRankeado ? 'ribbon-outline' : 'happy-outline'} size={16} color={colors.textPrimary} />
            <Text style={styles.tipoAmistosoText}>
              {esRankeado ? t('detalle.rankeado') : t('detalle.amistoso')}{esDoblesPartido ? t('detalle.doblesSufijo') : ''} · {formatoSets}
            </Text>
          </View>
        )}

        {/* NUEVO: dobles — dos parejas */}
        {esDoblesPartido ? (
          <View style={styles.playersRow}>
            {[
              { clave: 'pareja',  titulo: t('detalle.tuPareja'), lista: miPareja },
              { clave: 'rivales', titulo: t('detalle.rivales'),  lista: parejaRival },
            ].map((lado, idx) => (
              <React.Fragment key={lado.clave}>
                {idx === 1 && <Text style={styles.vsLabel}>vs</Text>}
                <View style={styles.playerCol}>
                  <Text style={styles.parejaTitulo}>{lado.titulo}</Text>
                  {lado.lista.length === 0 ? (
                    <View style={styles.parejaVacia}>
                      <Ionicons name="people-outline" size={28} color={colors.textSecondary} />
                      <Text style={styles.playerPts}>{t('detalle.buscandoPareja')}</Text>
                    </View>
                  ) : lado.lista.map(j => (
                    <TouchableOpacity
                      key={j.id_usuario}
                      style={[styles.dobleJugador, Number(j.retirado) === 1 && styles.retirado]}
                      activeOpacity={0.7}
                      disabled={Number(j.es_yo) === 1}
                      onPress={() => verPerfil(j.id_usuario, j.nombre ?? j.nombre_completo, j.foto_perfil_url)}
                    >
                      <Image source={getAvatarSource(j.foto_perfil_url, j.nombre)} style={styles.dobleAvatar} />
                      <View style={{ flexShrink: 1 }}>
                        <Text style={styles.dobleNombre} numberOfLines={1}>
                          {Number(j.es_yo) === 1 ? t('detalle.tu') : primerNombre(j.nombre ?? j.nombre_completo)}
                        </Text>
                        <Text style={j.estado_codigo === 'PART_INVITADO' || Number(j.retirado) === 1 ? styles.doblePendiente : styles.playerPts}>
                          {Number(j.retirado) === 1 ? t('retiro.retirado')
                            : Number(j.es_sustituto_pendiente) === 1 ? t('retiro.sustitutoPorAceptar')
                            : j.estado_codigo === 'PART_INVITADO' ? t('detalle.porAceptar')
                            : `${Number(j.puntaje_total ?? 0).toFixed(1)} pts`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </React.Fragment>
            ))}
          </View>
        ) : (
        <View style={styles.playersRow}>
          <View style={[styles.playerCol, yoRetirado && styles.retirado]}>
            <View style={styles.avatarWrap}>
              <Image source={getAvatarSource(yo.avatar, yo.name)} style={styles.avatar} />
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={11} color={colors.primary} />
                <Text style={styles.rankBadgeText}> {yo.ranking}</Text>
              </View>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{String(yo.name).split(' ')[0]}</Text>
            <Text style={yoRetirado ? styles.doblePendiente : styles.playerPts}>{yoRetirado ? t('retiro.retirado') : `${yo.pts} pts`}</Text>
          </View>

          <Text style={styles.vsLabel}>vs</Text>

          {esBuscando ? (
            <View style={styles.playerCol}>
              <View style={styles.avatarWrap}>
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person-add-outline" size={32} color={colors.textSecondary} />
                </View>
                <View style={styles.rankBadge}>
                  <Ionicons name="trophy" size={11} color={colors.primary} />
                  <Text style={styles.rankBadgeText}> --</Text>
                </View>
              </View>
              <Text style={styles.playerName}>{t('detalle.rival')}</Text>
              <Text style={styles.playerPts}>{t('detalle.buscando')}</Text>
            </View>
          ) : (
            <View style={[styles.playerCol, estaRetirado(rival.id) && styles.retirado]}>
              <TouchableOpacity
                style={styles.avatarWrap}
                activeOpacity={0.8}
                onPress={() => verPerfil(rival.id, rival.name, rival.avatar)}
              >
                <Image source={getAvatarSource(rival.avatar, rival.name)} style={styles.avatar} />
                <View style={styles.rankBadge}>
                  <Ionicons name="trophy" size={11} color={colors.primary} />
                  <Text style={styles.rankBadgeText}> {rival.ranking}</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.playerName} numberOfLines={1}>{String(rival.name).split(' ')[0]}</Text>
              <Text style={estaRetirado(rival.id) ? styles.doblePendiente : styles.playerPts}>
                {estaRetirado(rival.id) ? t('retiro.retirado') : `${rival.pts} pts`}
              </Text>
            </View>
          )}
        </View>
        )}

        {/* NUEVO (08): avisos de retiro / sustituto */}
        {esConfirmado && sinResultado && rivalIncompleto && (
          <View style={styles.aviso}>
            <Ionicons name="flag-outline" size={18} color={colors.primary} />
            <Text style={styles.avisoTxt}>
              {pendienteLado(ladoRival) ? t('retiro.avisoRivalSustituto', { nombre: nombresRetirados })
                : t('retiro.avisoRivalWalkover', { nombre: nombresRetirados })}
            </Text>
          </View>
        )}
        {esConfirmado && sinResultado && miLadoIncompleto && (
          <View style={styles.aviso}>
            <Ionicons name="person-remove-outline" size={18} color={colors.primary} />
            <Text style={styles.avisoTxt}>
              {pendienteLado(miLado) ? t('retiro.avisoMiSustitutoPendiente') : t('retiro.avisoMiCompanero', { nombre: nombresRetirados })}
            </Text>
          </View>
        )}
        {yoRetirado && (
          <View style={styles.aviso}>
            <Ionicons name="exit-outline" size={18} color={colors.primary} />
            <Text style={styles.avisoTxt}>{t('retiro.avisoMeRetire')}</Text>
          </View>
        )}

        {/* Detalles */}
        <Text style={styles.sectionTitle}>{t('detalle.detalles')}</Text>

        <View style={styles.detailCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailMain}>{partido.club}</Text>
            {partido.address ? (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailSub}> {partido.address}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.rowCards}>
          <View style={[styles.detailCard, { flex: 1, marginRight: 10 }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {partido.date}</Text>
          </View>
          <View style={[styles.detailCard, { flex: 1 }]}>
            <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {partido.time}</Text>
          </View>
        </View>

        {/* Resultado final (solo cuando está Finalizado) */}
        {esFinalizado && (() => {
          const numSetsPartido = item.num_sets ?? 5;
          const setsData = Array.from({ length: numSetsPartido }, (_, i) => {
            const local = item[`set${i + 1}_puntos_local`];
            const visit = item[`set${i + 1}_puntos_visitante`];
            if (local == null && visit == null) return null;
            return { n: i + 1, local: local ?? 0, visit: visit ?? 0 };
          }).filter(Boolean);

          const yoSets    = setsData.filter(s => yoEsLocal ? s.local > s.visit : s.visit > s.local).length;
          const rivalSets = setsData.filter(s => yoEsLocal ? s.visit > s.local : s.local > s.visit).length;

          return (
            <>
              <Text style={styles.sectionTitle}>{t('detalle.resultadoFinal')}</Text>

              <View style={styles.resultadoPrimario}>
                <Text style={styles.resultadoNum}>{yoSets}</Text>
                <Text style={styles.resultadoSep}> - </Text>
                <Text style={styles.resultadoNum}>{rivalSets}</Text>
              </View>

              <View style={[styles.detailCard, { flexDirection: 'column', gap: 10, alignItems: 'stretch' }]}>
                {setsData.length > 0 ? setsData.map(s => (
                  <View key={s.n} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.detailSub}>{t('detalle.set', { n: s.n })}</Text>
                    <Text style={styles.detailMain}>
                      {yoEsLocal ? s.local : s.visit}  –  {yoEsLocal ? s.visit : s.local}
                    </Text>
                  </View>
                )) : (
                  <Text style={[styles.detailSub, { textAlign: 'center' }]}>{t('detalle.sinSets')}</Text>
                )}
              </View>
            </>
          );
        })()}

        {!esFinalizado && !esBuscando && !esPendiente && (
          <Text style={styles.mandatoryNote}>
            {esLiga ? t('detalle.notaLiga') : t('detalle.notaAmistoso')}
          </Text>
        )}

        {/* NUEVO: dobles — estado de invitaciones / convocatoria */}
        {esDoblesPartido && (esPendiente || esBuscando) && (
          <View style={styles.pendienteCard}>
            <Ionicons name={esBuscando ? 'search-outline' : 'hourglass-outline'} size={20} color={colors.textPrimary} />
            <Text style={styles.pendienteText}>
              {soyInvitadoDobles
                ? (esLiga ? t('detalle.invitadoLiga') : t('detalle.invitadoDobles'))
                : esBuscando
                  ? t('detalle.convocatoriaPublicada')
                  : t('detalle.esperando', { nombres: nombresPareja(pendientesDobles) || t('detalle.losInvitados') })}
            </Text>
          </View>
        )}

        {soyInvitadoDobles && (
          <>
            <TouchableOpacity
              style={[styles.resultadosBtn, { marginBottom: 12 }]}
              onPress={() => handleInvitacionDobles(true)}
              disabled={respondiendo}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.resultadosBtnText}>{respondiendo ? t('detalle.enviando') : esLiga ? t('detalle.aceptarReto') : t('detalle.aceptarInvitacion')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleInvitacionDobles(false)} disabled={respondiendo}>
              <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.cancelBtnText}>{t('detalle.rechazar')}</Text>
            </TouchableOpacity>
          </>
        )}

        {esDoblesPartido && esBuscando && !soyInvitadoDobles && (
          <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('MisSolicitudes')}>
            <Ionicons name="people-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.chatBtnText}>{t('detalle.verParejas')}</Text>
          </TouchableOpacity>
        )}

        {/* NUEVO: reto directo pendiente (singles) */}
        {esPendiente && !esDoblesPartido && (
          <View style={styles.pendienteCard}>
            <Ionicons name="hourglass-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.pendienteText}>
              {soyInvitado
                ? t(esRetoLiga ? 'detalle.teRetoLiga' : 'detalle.teRetoAmistoso', { nombre: rivalNombre })
                : t('detalle.esperandoAcepte', { nombre: rivalNombre })}
            </Text>
          </View>
        )}

        {soyInvitado && (
          <>
            <TouchableOpacity
              style={[styles.resultadosBtn, { marginBottom: 12 }]}
              onPress={() => handleResponderReto(true)}
              disabled={respondiendo}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.resultadosBtnText}>{respondiendo ? t('detalle.enviando') : t('detalle.aceptarReto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleResponderReto(false)}
              disabled={respondiendo}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.cancelBtnText}>{t('detalle.rechazarReto')}</Text>
            </TouchableOpacity>
          </>
        )}

        {!esBuscando && !esPendiente && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => {
              navigation.navigate('MatchChat', {
                idPartido: partido.id,
                rival: esDoblesPartido
                  ? { name: `${nombresPareja(miParejaActiva)} vs ${nombresPareja(parejaRivalActiva)}`, avatar: parejaRivalActiva[0]?.foto_perfil_url ?? null }
                  : { name: rival.name, avatar: rival.avatar },
              });
            }}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.chatBtnText}>{t('detalle.abrirChat')}</Text>
          </TouchableOpacity>
        )}

        {/* CORREGIDO (08): cancelar solo el creador y, si está confirmado, hasta 5 horas antes */}
        {puedeCancelar && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelar} disabled={cancelando}>
            <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.cancelBtnText}>
              {cancelando ? t('detalle.cancelando') : esPendiente ? t('detalle.cancelarReto') : t('detalle.cancelarPartido')}
            </Text>
          </TouchableOpacity>
        )}

        {/* NUEVO (08): retirarse (antes de empezar = retiro; en vivo = abandono) */}
        {puedeRetirarse && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleRetirarse} disabled={accion}>
            <Ionicons name="exit-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.cancelBtnText}>{t('retiro.boton')}</Text>
          </TouchableOpacity>
        )}
        {soyCreador && esConfirmado && !puedeCancelar && !esFinalizado && sinResultado && (
          <Text style={styles.mandatoryNote}>{t('retiro.notaCancelar')}</Text>
        )}

        {/* NUEVO (07): seguir / anotar el marcador en vivo */}
        {/* NUEVO (08): me invitaron a reemplazar a un jugador */}
        {soySustitutoPendiente && (
          <View style={styles.aviso}>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
            <Text style={styles.avisoTxt}>{t('retiro.teInvitanSustituto')}</Text>
          </View>
        )}
        {soySustitutoPendiente && (
          <>
            <TouchableOpacity style={styles.resultadosBtn} onPress={() => handleResponderSustituto(true)} disabled={accion}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.resultadosBtnText}>{t('retiro.aceptarSustituto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleResponderSustituto(false)} disabled={accion}>
              <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.cancelBtnText}>{t('retiro.rechazarSustituto')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* NUEVO (08): dobles — invitar a un amigo a reemplazar a mi compañero */}
        {esDoblesPartido && miLadoIncompleto && sinResultado && !pendienteLado(miLado) && (
          <TouchableOpacity style={styles.resultadosBtn} onPress={() => setElegirSustituto(true)} disabled={accion}>
            <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            <Text style={styles.resultadosBtnText}>{t('retiro.invitarSustituto')}</Text>
          </TouchableOpacity>
        )}

        {!esFinalizado && !esBuscando && !esPendiente && !item.id_resultado && !rivalIncompleto && !miLadoIncompleto && !yoRetirado && (
          <TouchableOpacity
            style={styles.vivoBtn}
            onPress={() => navigation.navigate('PartidoEnVivo', { idPartido: partido.id })}
          >
            <View style={styles.vivoPunto} />
            <Text style={styles.vivoBtnText}>{t('vivo.boton')}</Text>
          </TouchableOpacity>
        )}

        {!esFinalizado && !esBuscando && !esPendiente && !yoRetirado && !soySustitutoPendiente && (
          <TouchableOpacity
            style={styles.resultadosBtn}
            onPress={() => navigation.navigate('ColocarResultados', {
              partido: esDoblesPartido
                ? {
                    ...item, ...partido, id_partido: partido.id,
                    yo:    { name: nombresPareja(miParejaActiva), avatar: yoJugador?.foto_perfil_url ?? null, pts: Number(yoJugador?.puntaje_total ?? 0).toFixed(1) },
                    rival: {
                      id:     (parejaRivalActiva[0] ?? parejaRival[0])?.id_usuario ?? null,
                      name:   nombresPareja(parejaRivalActiva.length ? parejaRivalActiva : parejaRival),
                      avatar: (parejaRivalActiva[0] ?? parejaRival[0])?.foto_perfil_url ?? null,
                      pts:    Number((parejaRivalActiva[0] ?? parejaRival[0])?.puntaje_total ?? 0).toFixed(1),
                    },
                    esCreador: miEquipo === 1,   // publica la pareja del creador
                    esDobles: true,
                  }
                : { ...item, ...partido, id_partido: partido.id, yo, rival, esCreador: esMiCreacion },
            })}
          >
            <Ionicons name="trophy-outline" size={20} color={colors.primary} />
            <Text style={styles.resultadosBtnText}>
              {item.id_resultado ? t('detalle.verResultado') : rivalIncompleto ? t('retiro.reclamarWalkover') : t('detalle.colocarResultados')}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* NUEVO (08): elegir a un amigo como sustituto */}
      <SelectorAmigoModal
        visible={elegirSustituto}
        titulo={t('retiro.elegirSustituto')}
        excluir={jugadores.map(j => j.id_usuario)}
        onClose={() => setElegirSustituto(false)}
        onSelect={handleInvitarSustituto}
        onSinAmigos={() => { setElegirSustituto(false); Alert.alert(t('retiro.sustitutoTitulo'), t('retiro.sinAmigos')); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  cover: { width: SCREEN_W, height: COVER_H },
  coverHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
    width: '100%',
  },
  playerCol: { alignItems: 'center', flex: 1 },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#ccc',
    borderWidth: 3, borderColor: colors.background,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  rankBadgeText: { fontSize: 13, fontWeight: 'bold', color: colors.primary },
  vsLabel: {
    fontSize: 18, fontWeight: 'bold', color: colors.textSecondary,
    alignSelf: 'center', marginTop: AVATAR_SIZE / 2 - 10,
  },
  playerName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  playerPts: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: colors.textPrimary,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 10,
    width: '100%',
  },
  rowCards: { flexDirection: 'row', width: '100%' },
  detailMain: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  detailSub: { fontSize: 13, color: colors.textSecondary },
  mandatoryNote: {
    fontSize: 13, color: colors.textSecondary,
    lineHeight: 19, marginBottom: 24,
    alignSelf: 'flex-start',
  },

  // NUEVO: etiqueta de tipo de partido
  tipoLiga: {
    flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%',
    backgroundColor: colors.dark, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
  },
  tipoLigaLabel: { fontSize: 11, fontWeight: '700', color: colors.accent },
  tipoLigaNombre: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginTop: 2 },
  tipoAmistoso: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 20,
  },
  tipoAmistosoText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },

  // NUEVO: dobles
  parejaTitulo: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  parejaVacia: { alignItems: 'center', gap: 6, paddingVertical: 12 },
  dobleJugador: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, alignSelf: 'stretch' },
  dobleAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ccc' },
  dobleNombre: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  doblePendiente: { fontSize: 12, fontWeight: '700', color: colors.accent },
  pendienteCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.accentLight, borderRadius: 14,
    padding: 16, marginTop: 8, marginBottom: 16, width: '100%',
  },
  pendienteText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 30, paddingVertical: 16,
    width: '100%', marginBottom: 12,
  },
  chatBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 30, paddingVertical: 16,
    width: '100%', marginBottom: 12,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  // NUEVO (08)
  retirado: { opacity: 0.4 },
  aviso: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.accentLight,
    borderRadius: 14, padding: 12, marginTop: 12, marginBottom: 4, width: '100%',
  },
  avisoTxt: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary, lineHeight: 18 },
  // NUEVO (07)
  vivoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.dark, borderRadius: 30, paddingVertical: 16, marginBottom: 12, width: '100%',
  },
  vivoPunto: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30' },
  vivoBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  resultadosBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 30, paddingVertical: 18,
    width: '100%',
  },
  resultadosBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },

  resultadoPrimario: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  resultadoNum: { fontSize: 56, fontWeight: 'bold', color: colors.textPrimary },
  resultadoSep: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
});