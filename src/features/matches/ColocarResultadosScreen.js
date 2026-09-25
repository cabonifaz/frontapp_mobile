import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import api from '../../services/api';
import { resultadoService } from '../../services/resultadoService';
import { authService } from '../../services/authService';

const AVATAR_DEFAULT = require('../../../assets/avatar_general.png');
const MAX_CORRECCIONES = 3; // igual que CFG_VIAJES_MAX_REVISION

function fuenteImagen(url) {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return { uri: url };
  }
  return AVATAR_DEFAULT;
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
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.setLabel}>Set {index + 1}</Text>
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
            <Text style={styles.confirmSetLabel}>Set {i + 1}</Text>
            <Text style={styles.confirmScoreText}>{s.my} : {s.rival}</Text>
          </View>
        ))}
        {sets.length === 0 && (
          <Text style={[styles.confirmSetLabel, { textAlign: 'center' }]}>Sin sets registrados</Text>
        )}
      </View>
    </>
  );
}

// Pantalla para quien debe revisar: confirmar (con estrellas) o corregir
function ConfirmationView({ sets, rivalName, enRevision, puedeCorregir, rating, onRate, onCorregir, onAgree, loading }) {
  return (
    <ScrollView contentContainerStyle={styles.confirmContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.confirmTitle}>
        {enRevision
          ? `${rivalName} corrigió el resultado. ¿Estás de acuerdo?`
          : `${rivalName} publicó este resultado. ¿Estás de acuerdo?`}
      </Text>

      <ResumenSets sets={sets} yoNombre="Tú" rivalNombre={rivalName} />

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>¿Qué tal fue jugar con {rivalName}?</Text>
      <StarRating rating={rating} onRate={onRate} />
      <Text style={styles.hintText}>Opcional. Tu calificación se suma a su perfil de jugador.</Text>

      <View style={styles.confirmBtns}>
        <TouchableOpacity style={styles.agreeBtn} onPress={onAgree} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.agreeBtnText}>Sí, de acuerdo</Text>}
        </TouchableOpacity>
        {puedeCorregir ? (
          <TouchableOpacity style={styles.reviewBtn} onPress={onCorregir} disabled={loading}>
            <Text style={styles.reviewBtnText}>No, corregir resultado</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.hintText}>Se alcanzó el máximo de correcciones para este partido.</Text>
        )}
      </View>
    </ScrollView>
  );
}

// Pantalla para quien hizo la última edición
function EsperandoView({ sets, rivalName, enRevision, onVolver }) {
  return (
    <ScrollView contentContainerStyle={styles.confirmContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.waitingIcon}>
        <Ionicons name="hourglass-outline" size={34} color={colors.textPrimary} />
      </View>
      <Text style={styles.confirmTitle}>Esperando a {rivalName}</Text>
      <Text style={styles.waitingSubtitle}>
        {enRevision
          ? `Enviaste una corrección. ${rivalName} debe confirmarla o corregirla.`
          : `Publicaste el resultado. ${rivalName} debe confirmarlo o corregirlo.`}
      </Text>
      <ResumenSets sets={sets} yoNombre="Tú" rivalNombre={rivalName} />
      <TouchableOpacity style={[styles.reviewBtn, { marginTop: 24 }]} onPress={onVolver}>
        <Text style={styles.reviewBtnText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export function ColocarResultadosScreen({ navigation, route }) {
  const partido = route?.params?.partido ?? {};
  const idPartido = partido.id_partido ?? partido.id ?? null;
  const esCreador = partido.esCreador ?? true;

  const rival = {
    id:      partido.rival?.id      ?? partido.id_rival      ?? partido.id_usuario_rival ?? null,
    name:    partido.rival?.name    ?? partido.name           ?? partido.nombre_rival     ?? 'Rival',
    avatar:  partido.rival?.avatar  ?? partido.avatar         ?? partido.foto_rival       ?? null,
    pts:     partido.rival?.pts     ?? partido.pts            ?? partido.puntos_rival     ?? 0,
    ranking: partido.rival?.ranking ?? partido.ranking        ?? partido.ranking_rival    ?? '--',
  };
  const yo = {
    name:   partido.yo?.name   ?? partido.nombre_yo ?? 'Tú',
    avatar: partido.yo?.avatar ?? partido.avatar_yo ?? null,
    pts:    partido.yo?.pts    ?? partido.puntos_yo  ?? 0,
  };
  const rivalFirst = String(rival.name).split(' ')[0];

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
  const yoSoyLocal  = userId != null && idLocal != null ? Number(idLocal) === userId : esCreador;
  const yoSoyEditor = userId != null && idEditor != null ? Number(idEditor) === userId : esCreador;

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

  // ── Formulario ────────────────────────────────────────────────────────────
  const [modoCorreccion, setModoCorreccion] = useState(false);
  const [confirmedSets, setConfirmedSets] = useState([]); // [{ my, rival }]
  const [curMy,   setCurMy]   = useState('');
  const [curRival, setCurRival] = useState('');

  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');

  const [publicando,  setPublicando]  = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const [tipoResultado,  setTipoResultado]  = useState('normal');
  const [jugadorEspecial, setJugadorEspecial] = useState(null);

  const myWins    = confirmedSets.filter(s => Number(s.my) > Number(s.rival)).length;
  const rivalWins = confirmedSets.filter(s => Number(s.rival) > Number(s.my)).length;
  const matchDone = myWins >= setsToWin || rivalWins >= setsToWin;
  const currentSetNum = confirmedSets.length + 1;

  const canConfirmSet =
    curMy.trim() !== '' && curRival.trim() !== '' &&
    !isNaN(Number(curMy)) && !isNaN(Number(curRival)) &&
    Number(curMy) !== Number(curRival);

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

  function setsParaEnviar() {
    if (!modoCorreccion && tipoResultado === 'walkover') {
      return Array.from({ length: numSets }, () => ({
        mi_puntaje:    jugadorEspecial === 'yo' ? 0 : 15,
        puntaje_rival: jugadorEspecial === 'yo' ? 15 : 0,
      }));
    }
    if (!modoCorreccion && tipoResultado === 'abandono') {
      const played = confirmedSets.map(s => ({
        mi_puntaje:    Number(s.my)    || 0,
        puntaje_rival: Number(s.rival) || 0,
      }));
      const remaining = Array.from({ length: numSets - confirmedSets.length }, () => ({
        mi_puntaje:    jugadorEspecial === 'yo' ? 0 : 15,
        puntaje_rival: jugadorEspecial === 'yo' ? 15 : 0,
      }));
      return [...played, ...remaining];
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
          'Corrección enviada',
          `${rivalFirst} deberá confirmar o corregir el resultado.`,
          [{ text: 'Entendido', onPress: () => navigation.goBack() }]
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

      Alert.alert(
        '¡Resultado publicado!',
        'Se ha enviado el resultado. Queda pendiente de la confirmación de tu rival.',
        [{ text: 'Entendido', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      const mensajeError = e.response?.data?.mensaje || e.message || 'No se pudo enviar el resultado.';
      Alert.alert('Error', mensajeError);
    } finally {
      setPublicando(false);
    }
  }

  async function handleAceptar() {
    try {
      setConfirmando(true);
      await confirmarResultado(idPartido, true, rating);
      Alert.alert('Resultado confirmado', '¡Gracias! El resultado quedó registrado.', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Partidos' }) },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo confirmar el resultado.');
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
        <Text style={styles.headerTitle}>{modoCorreccion ? 'Corregir resultado' : 'Resultados'}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {modoCorreccion ? (
            <View style={styles.correccionBanner}>
              <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.correccionText}>
                Corrige los sets que estén mal. {rivalFirst} deberá confirmar tu corrección.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Tipo de resultado</Text>
              <View style={styles.tipoToggle}>
                {[
                  { key: 'normal',   label: 'Normal' },
                  { key: 'walkover', label: 'Walkover' },
                  { key: 'abandono', label: 'Abandono' },
                ].map(op => (
                  <TouchableOpacity
                    key={op.key}
                    style={[styles.tipoBtn, tipoResultado === op.key && styles.tipoBtnActive]}
                    onPress={() => {
                      setTipoResultado(op.key);
                      setJugadorEspecial(null);
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
              <Text style={styles.waitingTitle}>Esperando resultados</Text>
              <Text style={styles.waitingSubtitle}>
                Solo {rivalFirst} puede ingresar los resultados.
                Cambia a Walkover o Abandono si aplica.
              </Text>
            </View>
          )}

          {/* Selector de jugador para walkover / abandono */}
          {!modoCorreccion && tipoResultado !== 'normal' && (
            <View style={styles.jugadorSelector}>
              <Text style={styles.jugadorSelectorLabel}>
                {tipoResultado === 'walkover' ? '¿Quién no se presentó?' : '¿Quién abandonó?'}
              </Text>
              <View style={styles.jugadorBtns}>
                {[
                  { key: 'yo',    display: yo.name.split(' ')[0],    avatar: yo.avatar },
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

          {/* Walkover: marcador automático */}
          {mostrarFormulario && !modoCorreccion && tipoResultado === 'walkover' && (
            <View style={styles.playersBlock}>
              <View style={styles.playerCol}>
                <Image source={fuenteImagen(yo.avatar)} style={styles.avatar} />
                <Text style={styles.playerName} numberOfLines={1}>{yo.name.split(' ')[0]}</Text>
                <Text style={styles.playerPts}>{yo.pts} pts</Text>
              </View>
              <View style={styles.scoresCol}>
                {Array.from({ length: numSets }, () => ({
                  my:    jugadorEspecial === 'yo' ? '0' : jugadorEspecial === 'rival' ? '15' : '',
                  rival: jugadorEspecial === 'rival' ? '0' : jugadorEspecial === 'yo' ? '15' : '',
                })).map((s, i) => (
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

          {/* Normal / Abandono / Corrección: set por set */}
          {mostrarFormulario && (modoCorreccion || tipoResultado !== 'walkover') && (
            <>
              {confirmedSets.length > 0 && (
                <View style={styles.matchResultRow}>
                  <Text style={styles.matchResultText}>{myWins} - {rivalWins}</Text>
                  <Text style={styles.matchResultSub}>Tú · {rivalFirst}</Text>
                </View>
              )}

              {confirmedSets.map((s, i) => (
                <ScoreRow key={i} index={i} myScore={s.my} rivalScore={s.rival} readonly />
              ))}

              {confirmedSets.length > 0 && (
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => { setConfirmedSets([]); setCurMy(''); setCurRival(''); }}
                >
                  <Ionicons name="refresh" size={15} color={colors.textSecondary} />
                  <Text style={styles.resetText}>Volver a ingresar los sets</Text>
                </TouchableOpacity>
              )}

              {!matchDone && (
                <>
                  <View style={styles.playersBlock}>
                    <View style={styles.playerCol}>
                      <Image source={fuenteImagen(yo.avatar)} style={styles.avatar} />
                      <Text style={styles.playerName} numberOfLines={1}>{yo.name.split(' ')[0]}</Text>
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

                  <TouchableOpacity
                    style={[styles.confirmSetBtn, !canConfirmSet && styles.confirmBtnDisabled]}
                    onPress={handleConfirmSet}
                    disabled={!canConfirmSet}
                  >
                    <Text style={[styles.confirmSetBtnText, !canConfirmSet && styles.confirmBtnTextDisabled]}>
                      Confirmar Set {currentSetNum}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {!modoCorreccion && tipoResultado === 'abandono' && (
                <Text style={styles.abandonoNote}>
                  Los sets vacíos se registran 15-0 a favor del jugador que continuó.
                </Text>
              )}
            </>
          )}

          {/* Calificación (+ comentario al publicar) */}
          {mostrarFormulario && (matchDone || (!modoCorreccion && tipoResultado !== 'normal')) && (
            <>
              <Text style={styles.sectionTitle}>¿Qué tal fue jugar con {rivalFirst}?</Text>
              <StarRating rating={rating} onRate={setRating} />
              <Text style={[styles.hintText, { marginTop: -12, marginBottom: 20 }]}>
                Opcional. Se suma a su calificación como jugador.
              </Text>

              {!modoCorreccion && (
                <>
                  <Text style={styles.sectionTitle}>Deja un comentario de tu rival</Text>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="50 palabras como máximo."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={4}
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                  />

                  <Text style={styles.sectionTitle}>Sube fotos del encuentro</Text>
                  <View style={styles.photoBox}>
                    <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                    <Text style={styles.photoBoxText}>Toca para subir fotos</Text>
                  </View>
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
                {publicando ? 'Enviando...' : modoCorreccion ? 'Enviar corrección' : 'Confirmar resultados'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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