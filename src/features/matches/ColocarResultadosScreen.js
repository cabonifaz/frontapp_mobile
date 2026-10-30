import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import api from '../../services/api';
import { resultadoService } from '../../services/resultadoService';
import { authService } from '../../services/authService';
import { getAvatarSource } from '../../utils/avatars';
import { elegirFotos, subirFotosPartido, MAX_FOTOS } from '../../utils/fotosEncuentro';   // NUEVO: fotos
import { validarSet, puntosParaGanar, cargarReglasSet } from '../../utils/reglasSet';   // NUEVO (07): reglas del set
import { enVivoService } from '../../services/enVivoService';   // NUEVO (07): marcador del partido en vivo

const AVATAR_DEFAULT = require('../../../assets/avatar_general.png');
const MAX_CORRECCIONES = 3; // igual que CFG_VIAJES_MAX_REVISION

// CORREGIDO: antes solo aceptaba fotos de internet (http) y los avatares
// de la app (ej. 'avatar_masculino_2') salían como el ícono genérico.
function fuenteImagen(url) {
  return url ? getAvatarSource(url) : AVATAR_DEFAULT;
}

// NUEVO: confirmar (con calificación) y corregir resultado
async function confirmarResultado(idPartido, estaDeAcuerdo, calificacion) {
  return api.post(`/api/GestionResultado/${idPartido}/confirmar`, {
    esta_de_acuerdo: estaDeAcuerdo,
    calificacion: calificacion > 0 ? calificacion : null,
  });
}

async function revisarResultado(idPartido, sets, calificacion) {
  return api.post(`/api/GestionResultado/${idPartido}/revisar`, {
    sets,
    calificacion: calificacion > 0 ? calificacion : null,
  });
}

function ScoreRow({ index, myScore, rivalScore, onChangeMyScore, onChangeRivalScore, readonly }) {
  const { t } = useTranslation();
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.setLabel}>{t('colocar.set', { n: index + 1 })}</Text>
      <View style={styles.scoreBoxes}>
        <TextInput
          style={[styles.scoreInput, readonly && styles.scoreInputReadonly]}
          keyboardType="number-pad"
          maxLength={2}
          value={myScore}
          onChangeText={onChangeMyScore}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          textAlign="center"
          editable={!readonly}
        />
        <Text style={styles.scoreSeparator}>:</Text>
        <TextInput
          style={[styles.scoreInput, readonly && styles.scoreInputReadonly]}
          keyboardType="number-pad"
          maxLength={2}
          value={rivalScore}
          onChangeText={onChangeRivalScore}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          textAlign="center"
          editable={!readonly}
        />
      </View>
    </View>
  );
}

function StarRating({ rating, onRate, size = 32 }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onRate(n === rating ? 0 : n)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={n <= rating ? 'star' : 'star-outline'}
            size={size}
            color={n <= rating ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Resumen de sets desde MI punto de vista
function ResumenSets({ sets, yoNombre, rivalNombre }) {
  const { t } = useTranslation();
  const misSets   = sets.filter(s => Number(s.my) > Number(s.rival)).length;
  const susSets   = sets.filter(s => Number(s.rival) > Number(s.my)).length;
  return (
    <>
      <View style={styles.setsWonRow}>
        <View style={styles.setsWonCol}>
          <Text style={styles.setsWonNum}>{misSets}</Text>
          <Text style={styles.setsWonName} numberOfLines={1}>{yoNombre}</Text>
        </View>
        <Text style={styles.setsWonSep}>-</Text>
        <View style={styles.setsWonCol}>
          <Text style={styles.setsWonNum}>{susSets}</Text>
          <Text style={styles.setsWonName} numberOfLines={1}>{rivalNombre}</Text>
        </View>
      </View>
      <View style={styles.confirmScoreCard}>
        {sets.map((s, i) => (
          <View key={i} style={styles.confirmScoreRow}>
            <Text style={styles.confirmSetLabel}>{t('colocar.set', { n: i + 1 })}</Text>
            <Text style={styles.confirmScoreText}>{s.my} : {s.rival}</Text>
          </View>
        ))}
        {sets.length === 0 && (
          <Text style={[styles.confirmSetLabel, { textAlign: 'center' }]}>{t('colocar.sinSets')}</Text>
        )}
      </View>
    </>
  );
}

// Pantalla para quien debe revisar: confirmar (con estrellas) o corregir
function ConfirmationView({ sets, rivalName, enRevision, puedeCorregir, rating, onRate, onCorregir, onAgree, loading }) {
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={styles.confirmContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.confirmTitle}>
        {enRevision
          ? t('colocar.confirmCorrigio', { nombre: rivalName })
          : t('colocar.confirmPublico', { nombre: rivalName })}
      </Text>

      <ResumenSets sets={sets} yoNombre={t('colocar.tu')} rivalNombre={rivalName} />

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('colocar.queTal', { nombre: rivalName })}</Text>
      <StarRating rating={rating} onRate={onRate} />
      <Text style={styles.hintText}>{t('colocar.calificacionHint')}</Text>

      <View style={styles.confirmBtns}>
        <TouchableOpacity style={styles.agreeBtn} onPress={onAgree} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.agreeBtnText}>{t('colocar.deAcuerdo')}</Text>}
        </TouchableOpacity>
        {puedeCorregir ? (
          <TouchableOpacity style={styles.reviewBtn} onPress={onCorregir} disabled={loading}>
            <Text style={styles.reviewBtnText}>{t('colocar.corregir')}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hintText}>{t('colocar.maxCorrecciones')}</Text>
        )}
      </View>
    </ScrollView>
  );
}

// Pantalla para quien hizo la última edición
function EsperandoView({ sets, rivalName, enRevision, onVolver }) {
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={styles.confirmContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.waitingIcon}>
        <Ionicons name="hourglass-outline" size={34} color={colors.textPrimary} />
      </View>
      <Text style={styles.confirmTitle}>{t('colocar.esperandoA', { nombre: rivalName })}</Text>
      <Text style={styles.waitingSubtitle}>
        {enRevision
          ? t('colocar.enviasteCorreccion', { nombre: rivalName })
          : t('colocar.publicaste', { nombre: rivalName })}
      </Text>
      <ResumenSets sets={sets} yoNombre={t('colocar.tu')} rivalNombre={rivalName} />
      <TouchableOpacity style={[styles.reviewBtn, { marginTop: 24 }]} onPress={onVolver}>
        <Text style={styles.reviewBtnText}>{t('colocar.volver')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export function ColocarResultadosScreen({ navigation, route }) {
  const { t } = useTranslation();   // NUEVO: idiomas
  const partido = route?.params?.partido ?? {};
  // NUEVO (09): desde el detalle llega el tipo ya decidido (walkover / abandono) y quién faltó
  const tipoSugeridoParam    = ['walkover', 'abandono'].includes(route?.params?.tipoSugerido) ? route.params.tipoSugerido : null;
  const ausenteSugeridoParam = ['yo', 'rival'].includes(route?.params?.ausenteSugerido) ? route.params.ausenteSugerido : null;
  const idPartido = partido.id_partido ?? partido.id ?? null;
  const esCreador = partido.esCreador ?? true;

  const rival = {
    id:      partido.rival?.id      ?? partido.id_rival      ?? partido.id_usuario_rival ?? null,
    name:    partido.rival?.name    ?? partido.name           ?? partido.nombre_rival     ?? t('colocar.rival'),
    avatar:  partido.rival?.avatar  ?? partido.avatar         ?? partido.foto_rival       ?? null,
    pts:     partido.rival?.pts     ?? partido.pts            ?? partido.puntos_rival     ?? 0,
    ranking: partido.rival?.ranking ?? partido.ranking        ?? partido.ranking_rival    ?? '--',
  };
  const yo = {
    name:   partido.yo?.name   ?? partido.nombre_yo ?? t('colocar.tu'),
    avatar: partido.yo?.avatar ?? partido.avatar_yo ?? null,
    pts:    partido.yo?.pts    ?? partido.puntos_yo  ?? 0,
  };
  // En dobles el "rival" es una pareja ("Eva y Fito"): se muestra completo
  const esDoblesPartido = !!partido.esDobles || Number(partido.es_dobles ?? 0) === 1;
  const rivalFirst = esDoblesPartido ? String(rival.name) : String(rival.name).split(' ')[0];
  const yoFirst    = esDoblesPartido ? String(yo.name) : String(yo.name).split(' ')[0];

  const numSets   = partido.num_sets ?? 5;
  const setsToWin = Math.ceil(numSets / 2); // 2 para "2 de 3", 3 para "3 de 5"

  // ── Usuario actual ────────────────────────────────────────────────────────
  const [userId, setUserId] = useState(null);
  const [userIdListo, setUserIdListo] = useState(false);
  useEffect(() => {
    authService.getUserId()
      .then(id => setUserId(id != null ? Number(id) : null))
      .catch(() => setUserId(null))
      .finally(() => setUserIdListo(true));
  }, []);

  // ── Estado del resultado existente ────────────────────────────────────────
  const idResultado   = partido.id_resultado ?? null;
  const codigoConf    = partido.estado_confirmacion_codigo;       // viene del SP actualizado (04)
  const cerrado       = ['RES_CONFIRMADO', 'RES_VENCIDO'].includes(codigoConf);
  const hayResultado  = !!idResultado && !cerrado;
  const enRevision    = codigoConf === 'RES_EN_REVISION';
  const idLocal       = partido.id_jugador_local ?? null;
  const idEditor      = partido.id_ultimo_editor ?? idLocal;
  const viajes        = Number(partido.viajes_revision ?? 0);

  // Si el SP aún no envía estos datos, se asume que el creador publicó (comportamiento anterior)
  // En dobles (y en singles con el SP actualizado) la base de datos indica si MI LADO
  // es el local y si MI LADO hizo la última edición.
  const yoSoyLocal  = partido.soy_equipo_local != null
    ? Number(partido.soy_equipo_local) === 1
    : (userId != null && idLocal != null ? Number(idLocal) === userId : esCreador);
  const yoSoyEditor = partido.soy_equipo_editor != null
    ? Number(partido.soy_equipo_editor) === 1
    : (userId != null && idEditor != null ? Number(idEditor) === userId : esCreador);

  // Sets existentes desde MI punto de vista (se ignoran sets 0-0 no jugados)
  const setsExistentes = Array.from({ length: numSets }, (_, i) => {
    const l = partido[`set${i + 1}_puntos_local`];
    const v = partido[`set${i + 1}_puntos_visitante`];
    if (l == null && v == null) return null;
    const s = yoSoyLocal
      ? { my: String(l ?? 0), rival: String(v ?? 0) }
      : { my: String(v ?? 0), rival: String(l ?? 0) };
    return s.my === '0' && s.rival === '0' ? null : s;
  }).filter(Boolean);

  // NUEVO (07): puntos por set según la configuración del servidor (15 / 21 por defecto)
  const [, setReglasListas] = useState(false);
  useEffect(() => { cargarReglasSet().then(() => setReglasListas(true)); }, []);

  // ── Formulario ────────────────────────────────────────────────────────────
  const [modoCorreccion, setModoCorreccion] = useState(false);
  const [confirmedSets, setConfirmedSets] = useState([]); // [{ my, rival }]
  const [curMy,   setCurMy]   = useState('');
  const [curRival, setCurRival] = useState('');

  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');

  // NUEVO (07): si el partido se jugó EN VIVO, los sets terminados se cargan solos
  // (desde mi lado de la cancha) para no volver a escribir el marcador.
  const [desdeVivo, setDesdeVivo] = useState(false);
  const [setsVivoBase, setSetsVivoBase] = useState([]);   // NUEVO (08): sets jugados antes de un abandono
  const [retiroDetectado, setRetiroDetectado] = useState(hayResultado ? null : tipoSugeridoParam);   // NUEVO (08): 'walkover' | 'abandono'
  const [ausenteSugerido, setAusenteSugerido] = useState(hayResultado ? null : ausenteSugeridoParam); // NUEVO (09): 'yo' | 'rival'
  const tocoTipo = useRef(false);   // NUEVO (09): si el jugador ya eligió otra pestaña, no se la cambiamos
  useEffect(() => {
    if (!idPartido || !userIdListo || hayResultado) return;
    let activo = true;
    enVivoService.detalle(idPartido)
      .then(v => {
        if (!activo || !v) return;
        const jugadoresVivo = Array.isArray(v.jugadores) ? v.jugadores : [];
        const yoEnVivo = jugadoresVivo.find(j => userId != null && Number(j.id_usuario) === userId);
        const miLado = yoEnVivo ? Number(yoEnVivo.lado) : (esCreador ? 1 : 2);

        // NUEVO (08): si un lado se quedó sin jugador (retiro o abandono), se propone walkover/abandono
        // CORREGIDO (09): primero se mira el lado rival; mi lado solo si el rival está completo
        const requeridos = esDoblesPartido ? 2 : 1;
        const activos = (l) => jugadoresVivo.filter(j => Number(j.lado) === l && (j.estado ?? 'ACTIVO') === 'ACTIVO').length;
        const incompleto = (l) => jugadoresVivo.length > 0 && activos(l) < requeridos;
        const ladoRivalVivo = miLado === 1 ? 2 : 1;
        const ladoIncompleto = incompleto(ladoRivalVivo) ? ladoRivalVivo : incompleto(miLado) ? miLado : null;
        if (ladoIncompleto) {
          const eventos = Array.isArray(v.eventos) ? v.eventos : [];
          const fueAbandono = Number(v.abandono_lado) === ladoIncompleto
            || eventos.some(e => e.tipo === 'ABANDONO' && Number(e.lado) === ladoIncompleto);
          const tipo = fueAbandono ? 'abandono' : 'walkover';
          const ausente = ladoIncompleto === miLado ? 'yo' : 'rival';
          setRetiroDetectado(tipo);
          setAusenteSugerido(ausente);
          if (!tocoTipo.current) {
            setTipoResultado(tipo);
            setJugadorEspecial(ausente);
          }
        }

        if (v.estado_vivo === 'SIN_INICIAR') return;
        const setsVivo = (Array.isArray(v.sets) ? v.sets : [])
          .filter(s => Number(s.terminado) === 1)
          .sort((a, b) => Number(a.numero_set) - Number(b.numero_set))
          .slice(0, numSets)
          .map(s => (miLado === 1
            ? { my: String(s.puntos_lado1), rival: String(s.puntos_lado2) }
            : { my: String(s.puntos_lado2), rival: String(s.puntos_lado1) }));
        if (setsVivo.length) {
          setSetsVivoBase(setsVivo);
          setConfirmedSets(prev => (prev.length ? prev : setsVivo));
          setDesdeVivo(true);
        }
      })
      .catch(() => {});   // sin partido en vivo: se ingresa a mano como siempre
    return () => { activo = false; };
  }, [idPartido, userIdListo, hayResultado]);

  const [publicando,  setPublicando]  = useState(false);
  const [fotos, setFotos] = useState([]);              // NUEVO: fotos elegidas (aún en el celular)
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  async function agregarFotos() {
    const nuevas = await elegirFotos(MAX_FOTOS - fotos.length);
    if (nuevas.length) setFotos(prev => [...prev, ...nuevas].slice(0, MAX_FOTOS));
  }
  const [confirmando, setConfirmando] = useState(false);

  const [tipoResultado,  setTipoResultado]  = useState(!hayResultado && tipoSugeridoParam ? tipoSugeridoParam : 'normal');
  const [jugadorEspecial, setJugadorEspecial] = useState(!hayResultado && tipoSugeridoParam ? ausenteSugeridoParam : null);

  const myWins    = confirmedSets.filter(s => Number(s.my) > Number(s.rival)).length;
  const rivalWins = confirmedSets.filter(s => Number(s.rival) > Number(s.my)).length;
  const matchDone = myWins >= setsToWin || rivalWins >= setsToWin;
  const currentSetNum = confirmedSets.length + 1;

  // NUEVO (07): sin empates; a 15 (dobles a 21) y desde 14-14 (20-20) se gana por 2
  const setCompleto = curMy.trim() !== '' && curRival.trim() !== '';
  const errorSet = setCompleto ? validarSet(curMy.trim(), curRival.trim(), esDoblesPartido) : null;
  const canConfirmSet = setCompleto && !errorSet;
  const puntosWO = puntosParaGanar(esDoblesPartido);   // walkover / abandono: 15-0 o 21-0

  function handleConfirmSet() {
    if (!canConfirmSet || matchDone) return;
    setConfirmedSets(prev => [...prev, { my: curMy.trim(), rival: curRival.trim() }]);
    setCurMy('');
    setCurRival('');
  }

  // En corrección siempre se muestra el formulario; al publicar, solo el creador (o WO/abandono)
  const mostrarFormulario = modoCorreccion || esCreador || tipoResultado !== 'normal';

  let canPublish = false;
  if (modoCorreccion) {
    canPublish = matchDone;
  } else if (tipoResultado === 'walkover' || tipoResultado === 'abandono') {
    canPublish = jugadorEspecial !== null;
  } else {
    canPublish = matchDone;
  }

  // CORREGIDO (08): walkover y abandono ya no piden puntajes.
  //  · Walkover: el que se presentó gana los sets necesarios (2 o 3) por 15-0 / 21-0.
  //  · Abandono: se respetan los sets jugados en vivo y el que se quedó gana los que faltaban.
  function setsGenerados() {
    const ganaYo = jugadorEspecial === 'rival';
    const base = tipoResultado === 'abandono' ? setsVivoBase : [];
    const lista = base.map(x => ({ my: String(x.my), rival: String(x.rival) }));
    let misSets = lista.filter(x => Number(x.my) > Number(x.rival)).length;
    let susSets = lista.filter(x => Number(x.rival) > Number(x.my)).length;
    while ((ganaYo ? misSets : susSets) < setsToWin && lista.length < numSets) {
      lista.push(ganaYo ? { my: String(puntosWO), rival: '0' } : { my: '0', rival: String(puntosWO) });
      if (ganaYo) misSets += 1; else susSets += 1;
    }
    return lista;
  }

  function setsParaEnviar() {
    if (!modoCorreccion && (tipoResultado === 'walkover' || tipoResultado === 'abandono')) {
      return setsGenerados().map(x => ({ mi_puntaje: Number(x.my), puntaje_rival: Number(x.rival) }));
    }
    return confirmedSets.map(s => ({
      mi_puntaje:    Number(s.my)    || 0,
      puntaje_rival: Number(s.rival) || 0,
    }));
  }

  async function handlePublicar() {
    try {
      setPublicando(true);
      const sets = setsParaEnviar();

      if (modoCorreccion) {
        await revisarResultado(idPartido, sets, rating);
        Alert.alert(
          t('colocar.correccionEnviada'),
          t('colocar.correccionEnviadaMensaje', { nombre: rivalFirst }),
          [{ text: t('colocar.entendido'), onPress: () => navigation.goBack() }]
        );
        return;
      }

      if (idPartido) {
        await resultadoService.publicar(idPartido, {
          idRival:           rival.id,
          calificacionRival: rating,
          comentario:        comment,
          sets,
        });
      }

      // NUEVO: subir las fotos del encuentro (si alguna falla, el resultado ya quedó publicado)
      let fallaron = 0;
      if (idPartido && fotos.length) {
        setSubiendoFotos(true);
        const subidas = await subirFotosPartido(idPartido, fotos);
        fallaron = fotos.length - subidas;
        setSubiendoFotos(false);
      }

      Alert.alert(
        t('colocar.publicado'),
        fallaron > 0 ? `${t('colocar.publicadoMensaje')}\n\n${t('fotos.errorSubir')}` : t('colocar.publicadoMensaje'),
        [{ text: t('colocar.entendido'), onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      const mensajeError = e.response?.data?.mensaje || e.message || t('colocar.errorEnviar');
      Alert.alert(t('comun.error'), mensajeError);
    } finally {
      setPublicando(false);
    }
  }

  async function handleAceptar() {
    try {
      setConfirmando(true);
      await confirmarResultado(idPartido, true, rating);
      Alert.alert(t('colocar.confirmado'), t('colocar.confirmadoMensaje'), [
        { text: t('colocar.ok'), onPress: () => navigation.navigate('MainTabs', { screen: 'Partidos' }) },
      ]);
    } catch (e) {
      Alert.alert(t('comun.error'), e.message ?? t('colocar.errorConfirmar'));
    } finally {
      setConfirmando(false);
    }
  }

  function handleCorregir() {
    setConfirmedSets(setsExistentes);
    setCurMy('');
    setCurRival('');
    setTipoResultado('normal');
    setModoCorreccion(true);
  }

  // ── Vistas de un resultado ya publicado ───────────────────────────────────
  if (hayResultado && !userIdListo) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (hayResultado && !modoCorreccion && yoSoyEditor) {
    return (
      <SafeAreaView style={styles.safe}>
        <EsperandoView
          sets={setsExistentes}
          rivalName={rivalFirst}
          enRevision={enRevision}
          onVolver={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  if (hayResultado && !modoCorreccion) {
    return (
      <SafeAreaView style={styles.safe}>
        <ConfirmationView
          sets={setsExistentes}
          rivalName={rivalFirst}
          enRevision={enRevision}
          puedeCorregir={viajes < MAX_CORRECCIONES}
          rating={rating}
          onRate={setRating}
          onCorregir={handleCorregir}
          onAgree={handleAceptar}
          loading={confirmando}
        />
      </SafeAreaView>
    );
  }

  // ── Formulario (publicar o corregir) ──────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (modoCorreccion ? setModoCorreccion(false) : navigation.goBack())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{modoCorreccion ? t('colocar.tituloCorregir') : t('colocar.titulo')}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {modoCorreccion ? (
            <View style={styles.correccionBanner}>
              <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.correccionText}>{t('colocar.bannerCorreccion', { nombre: rivalFirst })}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>{t('colocar.tipoResultado')}</Text>
              <View style={styles.tipoToggle}>
                {[
                  { key: 'normal',   label: t('colocar.normal') },
                  { key: 'walkover', label: t('colocar.walkover') },
                  { key: 'abandono', label: t('colocar.abandono') },
                ].map(op => (
                  <TouchableOpacity
                    key={op.key}
                    style={[styles.tipoBtn, tipoResultado === op.key && styles.tipoBtnActive]}
                    onPress={() => {
                      tocoTipo.current = true;
                      setTipoResultado(op.key);
                      // NUEVO (09): en walkover / abandono queda marcado quien se retiró (se puede cambiar)
                      setJugadorEspecial(op.key !== 'normal' ? ausenteSugerido : null);
                      setConfirmedSets([]);
                      setCurMy('');
                      setCurRival('');
                    }}
                  >
                    <Text style={[styles.tipoBtnText, tipoResultado === op.key && styles.tipoBtnTextActive]}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Retado en modo normal: espera a que el creador publique */}
          {!mostrarFormulario && (
            <View style={styles.waitingContainer}>
              <Ionicons name="time-outline" size={36} color={colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={styles.waitingTitle}>{t('colocar.esperandoResultados')}</Text>
              <Text style={styles.waitingSubtitle}>
                {t(esDoblesPartido ? 'colocar.soloPueden' : 'colocar.soloPuede', { nombre: rivalFirst })}
              </Text>
            </View>
          )}

          {/* Selector de jugador para walkover / abandono */}
          {!modoCorreccion && tipoResultado !== 'normal' && (
            <View style={styles.jugadorSelector}>
              <Text style={styles.jugadorSelectorLabel}>
                {tipoResultado === 'walkover' ? t('colocar.quienNoSePresento') : t('colocar.quienAbandono')}
              </Text>
              <View style={styles.jugadorBtns}>
                {[
                  { key: 'yo',    display: yoFirst,    avatar: yo.avatar },
                  { key: 'rival', display: rivalFirst,               avatar: rival.avatar },
                ].map(j => (
                  <TouchableOpacity
                    key={j.key}
                    style={[styles.jugadorBtn, jugadorEspecial === j.key && styles.jugadorBtnActive]}
                    onPress={() => setJugadorEspecial(j.key)}
                  >
                    <Image source={fuenteImagen(j.avatar)} style={styles.jugadorAvatar} />
                    <Text style={[styles.jugadorBtnText, jugadorEspecial === j.key && styles.jugadorBtnTextActive]}>
                      {j.display}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Walkover / abandono: marcador automático, sin puntajes */}
          {mostrarFormulario && !modoCorreccion && tipoResultado !== 'normal' && (
            <View style={styles.playersBlock}>
              <View style={styles.playerCol}>
                <Image source={fuenteImagen(yo.avatar)} style={styles.avatar} />
                <Text style={styles.playerName} numberOfLines={1}>{yoFirst}</Text>
                <Text style={styles.playerPts}>{yo.pts} pts</Text>
              </View>
              <View style={styles.scoresCol}>
                {(jugadorEspecial ? setsGenerados() : Array.from({ length: setsToWin }, () => ({ my: '', rival: '' })))
                  .map((s, i) => (
                    <ScoreRow key={i} index={i} myScore={s.my} rivalScore={s.rival} readonly />
                  ))}
              </View>
              <View style={styles.playerCol}>
                <Image source={fuenteImagen(rival.avatar)} style={styles.avatar} />
                <Text style={styles.playerName} numberOfLines={1}>{rivalFirst}</Text>
                <Text style={styles.playerPts}>{rival.pts} pts</Text>
              </View>
            </View>
          )}

          {/* NUEVO (08): explica por qué se propuso walkover / abandono */}
          {retiroDetectado && !modoCorreccion && tipoResultado !== 'normal' && (
            <View style={styles.avisoVivo}>
              <Ionicons name="flag-outline" size={16} color={colors.primary} />
              <Text style={styles.avisoVivoTxt}>
                {t(retiroDetectado === 'abandono' ? 'colocar.retiroAbandono' : 'colocar.retiroWalkover')}
              </Text>
            </View>
          )}

          {/* Normal / Corrección: set por set (walkover y abandono ya no piden puntajes) */}
          {mostrarFormulario && (modoCorreccion || tipoResultado === 'normal') && (
            <>
              {confirmedSets.length > 0 && (
                <View style={styles.matchResultRow}>
                  <Text style={styles.matchResultText}>{myWins} - {rivalWins}</Text>
                  <Text style={styles.matchResultSub}>{t('colocar.resultadoSub', { nombre: rivalFirst })}</Text>
                </View>
              )}

              {confirmedSets.map((s, i) => (
                <ScoreRow key={i} index={i} myScore={s.my} rivalScore={s.rival} readonly />
              ))}

              {/* NUEVO (07): aviso cuando el marcador viene del partido en vivo */}
              {desdeVivo && !modoCorreccion && tipoResultado === 'normal' && confirmedSets.length > 0 && (
                <View style={styles.avisoVivo}>
                  <Ionicons name="radio" size={16} color={colors.primary} />
                  <Text style={styles.avisoVivoTxt}>{t('colocar.desdeVivo')}</Text>
                </View>
              )}

              {confirmedSets.length > 0 && (
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => { setConfirmedSets([]); setCurMy(''); setCurRival(''); setDesdeVivo(false); }}
                >
                  <Ionicons name="refresh" size={15} color={colors.textSecondary} />
                  <Text style={styles.resetText}>{t('colocar.reingresar')}</Text>
                </TouchableOpacity>
              )}

              {!matchDone && (
                <>
                  <View style={styles.playersBlock}>
                    <View style={styles.playerCol}>
                      <Image source={fuenteImagen(yo.avatar)} style={styles.avatar} />
                      <Text style={styles.playerName} numberOfLines={1}>{yoFirst}</Text>
                      <Text style={styles.playerPts}>{yo.pts} pts</Text>
                    </View>
                    <View style={styles.scoresCol}>
                      <ScoreRow
                        index={confirmedSets.length}
                        myScore={curMy}
                        rivalScore={curRival}
                        onChangeMyScore={setCurMy}
                        onChangeRivalScore={setCurRival}
                      />
                    </View>
                    <View style={styles.playerCol}>
                      <Image source={fuenteImagen(rival.avatar)} style={styles.avatar} />
                      <Text style={styles.playerName} numberOfLines={1}>{rivalFirst}</Text>
                      <Text style={styles.playerPts}>{rival.pts} pts</Text>
                    </View>
                  </View>

                  {/* NUEVO (07): explica por qué el marcador no es válido */}
                  {errorSet ? (
                    <Text style={styles.errorSet}>{t(errorSet.clave, errorSet.params)}</Text>
                  ) : (
                    <Text style={styles.reglaSet}>{t('reglasSet.recordatorio', { meta: puntosWO, empate: puntosWO - 1 })}</Text>
                  )}

                  <TouchableOpacity
                    style={[styles.confirmSetBtn, !canConfirmSet && styles.confirmBtnDisabled]}
                    onPress={handleConfirmSet}
                    disabled={!canConfirmSet}
                  >
                    <Text style={[styles.confirmSetBtnText, !canConfirmSet && styles.confirmBtnTextDisabled]}>
                      {t('colocar.confirmarSet', { n: currentSetNum })}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {!modoCorreccion && tipoResultado === 'abandono' && (
                <Text style={styles.abandonoNote}>{t('colocar.notaAbandono')}</Text>
              )}
            </>
          )}

          {/* Calificación (+ comentario al publicar) */}
          {mostrarFormulario && (matchDone || (!modoCorreccion && tipoResultado !== 'normal')) && (
            <>
              <Text style={styles.sectionTitle}>{t('colocar.queTal', { nombre: rivalFirst })}</Text>
              <StarRating rating={rating} onRate={setRating} />
              <Text style={[styles.hintText, { marginTop: -12, marginBottom: 20 }]}>{t('colocar.calificacionHint2')}</Text>

              {!modoCorreccion && (
                <>
                  <Text style={styles.sectionTitle}>{t('colocar.comentarioTitulo')}</Text>
                  <TextInput
                    style={styles.commentInput}
                    placeholder={t('colocar.comentarioPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={4}
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                  />

                  <Text style={styles.sectionTitle}>{t('colocar.fotosTitulo')}</Text>
                  {/* NUEVO: fotos del encuentro (hasta 5) */}
                  {fotos.length === 0 ? (
                    <TouchableOpacity style={styles.photoBox} onPress={agregarFotos} activeOpacity={0.8}>
                      <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                      <Text style={styles.photoBoxText}>{t('colocar.fotosTexto')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.fotosGrid}>
                      {fotos.map((uri, i) => (
                        <View key={uri + i} style={styles.fotoThumbWrap}>
                          <Image source={{ uri }} style={styles.fotoThumb} />
                          <TouchableOpacity
                            style={styles.fotoQuitar}
                            onPress={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {fotos.length < MAX_FOTOS && (
                        <TouchableOpacity style={[styles.fotoThumbWrap, styles.fotoAgregar]} onPress={agregarFotos}>
                          <Ionicons name="add" size={28} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  <Text style={styles.fotosHint}>{t('fotos.maximo', { n: MAX_FOTOS })}</Text>
                </>
              )}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {mostrarFormulario && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.confirmBtn, !canPublish && styles.confirmBtnDisabled]}
              disabled={!canPublish || publicando}
              onPress={handlePublicar}
            >
              <Ionicons
                name={modoCorreccion ? 'send-outline' : 'stats-chart-outline'}
                size={20}
                color={canPublish ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.confirmBtnText, !canPublish && styles.confirmBtnTextDisabled]}>
                {subiendoFotos ? t('fotos.subiendo') : publicando ? t('colocar.enviando') : modoCorreccion ? t('colocar.enviarCorreccion') : t('colocar.confirmarResultados')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // NUEVO (07)
  avisoVivo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accentLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8, marginBottom: 4 },
  avisoVivoTxt: { flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  errorSet: { color: '#D93025', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 4, marginBottom: 8, paddingHorizontal: 12 },
  reglaSet: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 8, paddingHorizontal: 12 },
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },

  content: { paddingHorizontal: 20, paddingTop: 16 },

  correccionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.accentLight, borderRadius: 14, padding: 14, marginBottom: 20,
  },
  correccionText: { flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 18 },

  playersBlock: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 8 },
  playerCol: { alignItems: 'center', width: 72 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ccc', marginBottom: 6 },
  playerName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  playerPts: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  scoresCol: { flex: 1, justifyContent: 'center', gap: 10, marginTop: 4 },
  scoreRow: { alignItems: 'center', gap: 6 },
  setLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  scoreBoxes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreInput: {
    width: 52, height: 48, backgroundColor: colors.surface, borderRadius: 10,
    fontSize: 22, fontWeight: 'bold', color: colors.textPrimary,
  },
  scoreInputReadonly: { opacity: 0.6 },
  scoreSeparator: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },

  tipoToggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 30, padding: 4, marginBottom: 20 },
  tipoBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 26 },
  tipoBtnActive: { backgroundColor: colors.accent },
  tipoBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tipoBtnTextActive: { color: colors.primary, fontWeight: '700' },

  jugadorSelector: { marginBottom: 20 },
  jugadorSelectorLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 10, textAlign: 'center' },
  jugadorBtns: { flexDirection: 'row', gap: 12 },
  jugadorBtn: {
    flex: 1, alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 10,
  },
  jugadorBtnActive: { backgroundColor: colors.accent },
  jugadorAvatar: { width: 48, height: 48, borderRadius: 24, marginBottom: 8 },
  jugadorBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  jugadorBtnTextActive: { color: colors.primary, fontWeight: '700' },

  abandonoNote: {
    fontSize: 12, color: colors.textSecondary, textAlign: 'center',
    marginTop: 4, marginBottom: 16, lineHeight: 17,
  },

  waitingContainer: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 24,
  },
  waitingTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  waitingSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  waitingIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16,
  },

  matchResultRow: { alignItems: 'center', marginBottom: 12 },
  matchResultText: { fontSize: 36, fontWeight: 'bold', color: colors.textPrimary, letterSpacing: 2 },
  matchResultSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginBottom: 8 },
  resetText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  confirmSetBtn: { backgroundColor: colors.accent, borderRadius: 20, paddingVertical: 12, alignItems: 'center', marginBottom: 16, marginTop: 4 },
  confirmSetBtnText: { fontSize: 15, fontWeight: '700', color: colors.primary },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 8 },
  hintText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, textAlign: 'center' },

  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 24, justifyContent: 'center' },

  commentInput: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    fontSize: 14, color: colors.textPrimary, minHeight: 100, marginBottom: 24,
  },

  photoBox: {
    backgroundColor: colors.surface, borderRadius: 14, height: 120,
    alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16,
  },
  photoBoxText: { fontSize: 14, color: colors.textSecondary },

  // NUEVO: fotos del encuentro
  fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  fotoThumbWrap: { width: 96, height: 96, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface },
  fotoThumb: { width: '100%', height: '100%' },
  fotoQuitar: {
    position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  fotoAgregar: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed' },
  fotosHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },

  bottomBar: { paddingHorizontal: 20, paddingVertical: 16 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18,
  },
  confirmBtnDisabled: { backgroundColor: colors.surface },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  confirmBtnTextDisabled: { color: colors.textSecondary },

  // Confirmación / espera
  confirmContainer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 32 },
  confirmTitle: {
    fontSize: 20, fontWeight: 'bold', color: colors.textPrimary,
    textAlign: 'center', lineHeight: 28, marginBottom: 12,
  },
  setsWonRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, gap: 12 },
  setsWonCol: { alignItems: 'center', minWidth: 80 },
  setsWonNum: { fontSize: 56, fontWeight: 'bold', color: colors.textPrimary },
  setsWonName: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  setsWonSep: { fontSize: 40, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 18 },
  confirmScoreCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 16 },
  confirmScoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confirmSetLabel: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  confirmScoreText: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },

  confirmBtns: { gap: 12, marginTop: 24 },
  reviewBtn: {
    borderWidth: 1.5, borderColor: colors.textPrimary, borderRadius: 30,
    paddingVertical: 16, alignItems: 'center',
  },
  reviewBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  agreeBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center', minHeight: 56, justifyContent: 'center' },
  agreeBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});