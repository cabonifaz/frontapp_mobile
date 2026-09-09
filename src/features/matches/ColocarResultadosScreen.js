import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { resultadoService } from '../../services/resultadoService';

const AVATAR_DEFAULT = require('../../../assets/avatar_general.png');

function fuenteImagen(url) {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return { uri: url };
  }
  return AVATAR_DEFAULT;
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

function StarRating({ rating, onRate }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onRate(n)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={n <= rating ? 'star' : 'star-outline'}
            size={32}
            color={n <= rating ? colors.dark : colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ConfirmationView({ numSets, partido, rivalName, onReview, onAgree, loading }) {
  // Compute sets from partido object
  const sets = Array.from({ length: numSets }, (_, i) => {
    const local = partido[`set${i + 1}_puntos_local`];
    const visit = partido[`set${i + 1}_puntos_visitante`];
    if (local == null && visit == null) return null;
    return { local: local ?? 0, visit: visit ?? 0 };
  }).filter(Boolean);

  // Compute sets-won totals
  const localWins = sets.filter(s => s.local > s.visit).length;
  const visitWins = sets.filter(s => s.visit > s.local).length;

  return (
    <View style={styles.confirmContainer}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={styles.confirmTitle}>
          {rivalName} ha publicado estos resultados, ¿estás de acuerdo con ellos?
        </Text>

        {/* Big sets-won display */}
        <View style={styles.setsWonRow}>
          <Text style={styles.setsWonNum}>{localWins}</Text>
          <Text style={styles.setsWonSep}> - </Text>
          <Text style={styles.setsWonNum}>{visitWins}</Text>
        </View>

        {/* Individual sets */}
        <View style={styles.confirmScoreCard}>
          {sets.map((s, i) => (
            <View key={i} style={styles.confirmScoreRow}>
              <Text style={styles.confirmSetLabel}>Set {i + 1}</Text>
              <Text style={styles.confirmScoreText}>{s.local} : {s.visit}</Text>
            </View>
          ))}
          {sets.length === 0 && (
            <Text style={[styles.confirmSetLabel, { textAlign: 'center' }]}>Sin sets registrados</Text>
          )}
        </View>
      </View>

      <View style={styles.confirmBtns}>
        <TouchableOpacity style={styles.reviewBtn} onPress={onReview} disabled={loading}>
          <Text style={styles.reviewBtnText}>No, deseo revisión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.agreeBtn} onPress={onAgree} disabled={loading}>
          <Text style={styles.agreeBtnText}>Sí, de acuerdo</Text>
        </TouchableOpacity>
      </View>
    </View>
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

  const numSets   = partido.num_sets ?? 5;
  const setsToWin = Math.ceil(numSets / 2); // 2 for "2 de 3", 3 for "3 de 5"

  // Set-by-set state
  const [confirmedSets, setConfirmedSets] = useState([]); // array of { my, rival }
  const [curMy,   setCurMy]   = useState('');
  const [curRival, setCurRival] = useState('');

  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');

  const [confirmed, setConfirmed] = useState(Boolean(partido.id_resultado));

  const [publicando,  setPublicando]  = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const [tipoResultado,  setTipoResultado]  = useState('normal');
  const [jugadorEspecial, setJugadorEspecial] = useState(null);

  // Derived values for normal set-by-set flow
  const myWins    = confirmedSets.filter(s => Number(s.my) > Number(s.rival)).length;
  const rivalWins = confirmedSets.filter(s => Number(s.rival) > Number(s.my)).length;
  const matchDone = myWins >= setsToWin || rivalWins >= setsToWin;
  const currentSetNum = confirmedSets.length + 1;

  const canConfirmSet =
    curMy.trim() !== '' && curRival.trim() !== '' &&
    !isNaN(Number(curMy)) && !isNaN(Number(curRival));

  function handleConfirmSet() {
    if (!canConfirmSet || matchDone) return;
    setConfirmedSets(prev => [...prev, { my: curMy.trim(), rival: curRival.trim() }]);
    setCurMy('');
    setCurRival('');
  }

  // Who controls publishing in normal mode
  const mostrarFormulario = esCreador || tipoResultado !== 'normal';

  // canPublish logic
  let canPublish = false;
  if (tipoResultado === 'walkover') {
    canPublish = jugadorEspecial !== null;
  } else if (tipoResultado === 'abandono') {
    canPublish = jugadorEspecial !== null;
  } else {
    canPublish = matchDone;
  }

  async function handlePublicar() {
    try {
      setPublicando(true);

      let sets;
      if (tipoResultado === 'walkover') {
        sets = Array.from({ length: numSets }, () => ({
          mi_puntaje:    jugadorEspecial === 'yo' ? 0 : 15,
          puntaje_rival: jugadorEspecial === 'yo' ? 15 : 0,
        }));
      } else if (tipoResultado === 'abandono') {
        // confirmed sets + remaining sets auto-filled against abandoner
        const played = confirmedSets.map(s => ({
          mi_puntaje:    Number(s.my)    || 0,
          puntaje_rival: Number(s.rival) || 0,
        }));
        const remaining = Array.from(
          { length: numSets - confirmedSets.length },
          () => ({
            mi_puntaje:    jugadorEspecial === 'yo' ? 0 : 15,
            puntaje_rival: jugadorEspecial === 'yo' ? 15 : 0,
          })
        );
        sets = [...played, ...remaining];
      } else {
        // normal: send confirmedSets
        sets = confirmedSets.map(s => ({
          mi_puntaje:    Number(s.my)    || 0,
          puntaje_rival: Number(s.rival) || 0,
        }));
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
      const mensajeError = e.response?.data?.mensaje || e.message || 'No se pudo publicar el resultado.';
      Alert.alert('Error', mensajeError);
    } finally {
      setPublicando(false);
    }
  }

  async function handleConfirmar(estaDeAcuerdo) {
    try {
      setConfirmando(true);
      // Compute sets from partido object directly
      const sets = Array.from({ length: numSets }, (_, i) => {
        const local = partido[`set${i + 1}_puntos_local`];
        const visit = partido[`set${i + 1}_puntos_visitante`];
        if (local == null && visit == null) return null;
        return { mi_puntaje: Number(local) || 0, puntaje_rival: Number(visit) || 0 };
      }).filter(Boolean);

      if (idPartido) {
        await resultadoService.confirmar(idPartido, { estaDeAcuerdo, idRival: rival.id, sets });
      }
      navigation.navigate('MainTabs', { screen: 'Partidos' });
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo confirmar el resultado.');
    } finally {
      setConfirmando(false);
    }
  }

  if (confirmed) {
    return (
      <SafeAreaView style={styles.safe}>
        <ConfirmationView
          numSets={numSets}
          partido={partido}
          rivalName={rival.name.split(' ')[0]}
          onReview={() => handleConfirmar(false)}
          onAgree={() => handleConfirmar(true)}
          loading={confirmando}
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
        <Text style={styles.headerTitle}>Resultados</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Tipo de resultado */}
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

          {/* Waiting block: challenger in normal mode */}
          {!mostrarFormulario && (
            <View style={styles.waitingContainer}>
              <Ionicons name="time-outline" size={36} color={colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={styles.waitingTitle}>Esperando resultados</Text>
              <Text style={styles.waitingSubtitle}>
                Solo {rival.name.split(' ')[0]} puede ingresar los resultados.
                Cambia a Walkover o Abandono si aplica.
              </Text>
            </View>
          )}

          {/* Selector de jugador para walkover / abandono */}
          {tipoResultado !== 'normal' && (
            <View style={styles.jugadorSelector}>
              <Text style={styles.jugadorSelectorLabel}>
                {tipoResultado === 'walkover' ? '¿Quién no se presentó?' : '¿Quién abandonó?'}
              </Text>
              <View style={styles.jugadorBtns}>
                {[
                  { key: 'yo',    display: yo.name.split(' ')[0],    avatar: yo.avatar },
                  { key: 'rival', display: rival.name.split(' ')[0], avatar: rival.avatar },
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

          {/* Walkover: show auto-filled scores read-only */}
          {mostrarFormulario && tipoResultado === 'walkover' && (
            <View style={styles.playersBlock}>
              <View style={styles.playerCol}>
                <Image source={fuenteImagen(yo.avatar)} style={styles.avatar} />
                <Text style={styles.playerName} numberOfLines={1}>{yo.name.split(' ')[0]}</Text>
                <Text style={styles.playerPts}>{yo.pts} pts</Text>
              </View>
              <View style={styles.scoresCol}>
                {Array.from({ length: numSets }, (_, i) => ({
                  my:    jugadorEspecial === 'yo' ? '0' : jugadorEspecial === 'rival' ? '15' : '',
                  rival: jugadorEspecial === 'rival' ? '0' : jugadorEspecial === 'yo' ? '15' : '',
                })).map((s, i) => (
                  <ScoreRow
                    key={i}
                    index={i}
                    myScore={s.my}
                    rivalScore={s.rival}
                    readonly
                  />
                ))}
              </View>
              <View style={styles.playerCol}>
                <Image source={fuenteImagen(rival.avatar)} style={styles.avatar} />
                <Text style={styles.playerName} numberOfLines={1}>{rival.name.split(' ')[0]}</Text>
                <Text style={styles.playerPts}>{rival.pts} pts</Text>
              </View>
            </View>
          )}

          {/* Normal / Abandono: set-by-set input */}
          {mostrarFormulario && tipoResultado !== 'walkover' && (
            <>
              {/* Match result summary if sets played */}
              {confirmedSets.length > 0 && (
                <View style={styles.matchResultRow}>
                  <Text style={styles.matchResultText}>{myWins} - {rivalWins}</Text>
                </View>
              )}

              {/* Confirmed sets (read-only) */}
              {confirmedSets.map((s, i) => (
                <ScoreRow
                  key={i}
                  index={i}
                  myScore={s.my}
                  rivalScore={s.rival}
                  readonly
                />
              ))}

              {/* Current set input (only if match not done yet) */}
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
                      <Text style={styles.playerName} numberOfLines={1}>{rival.name.split(' ')[0]}</Text>
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

              {tipoResultado === 'abandono' && (
                <Text style={styles.abandonoNote}>
                  Los sets vacíos se registran 15-0 a favor del jugador que continuó.
                </Text>
              )}
            </>
          )}

          {/* Rating + Comment: shown after matchDone in normal mode; always for WO/abandono */}
          {mostrarFormulario && (matchDone || tipoResultado !== 'normal') && (
            <>
              <Text style={styles.sectionTitle}>
                ¿Qué tal fue jugar con {rival.name.split(' ')[0]}?
              </Text>
              <StarRating rating={rating} onRate={setRating} />

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

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Publish button: only shown when mostrarFormulario */}
        {mostrarFormulario && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.confirmBtn, !canPublish && styles.confirmBtnDisabled]}
              disabled={!canPublish || publicando}
              onPress={handlePublicar}
            >
              <Ionicons
                name="stats-chart-outline"
                size={20}
                color={canPublish ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.confirmBtnText, !canPublish && styles.confirmBtnTextDisabled]}>
                {publicando ? 'Publicando...' : 'Confirmar resultados'}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },

  content: { paddingHorizontal: 20, paddingTop: 16 },

  playersBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  playerCol: { alignItems: 'center', width: 72 },
  avatar: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: '#ccc',
    marginBottom: 6,
  },
  playerName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  playerPts: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  scoresCol: { flex: 1, justifyContent: 'center', gap: 10, marginTop: 4 },
  scoreRow: { alignItems: 'center', gap: 6 },
  setLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  scoreBoxes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreInput: {
    width: 52, height: 48,
    backgroundColor: colors.surface,
    borderRadius: 10,
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scoreInputReadonly: { opacity: 0.6 },
  scoreSeparator: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },

  tipoToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 4,
    marginBottom: 20,
  },
  tipoBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 26,
  },
  tipoBtnActive: { backgroundColor: colors.accent },
  tipoBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tipoBtnTextActive: { color: colors.primary, fontWeight: '700' },

  jugadorSelector: { marginBottom: 20 },
  jugadorSelectorLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  jugadorBtns: { flexDirection: 'row', gap: 12 },
  jugadorBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  jugadorBtnActive: { backgroundColor: colors.accent },
  jugadorAvatar: { width: 48, height: 48, borderRadius: 24, marginBottom: 8 },
  jugadorBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  jugadorBtnTextActive: { color: colors.primary, fontWeight: '700' },

  abandonoNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 17,
  },

  waitingContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  waitingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  matchResultRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  matchResultText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textPrimary,
    letterSpacing: 2,
  },

  confirmSetBtn: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  confirmSetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },

  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },

  commentInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 100,
    marginBottom: 24,
  },

  photoBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  photoBoxText: { fontSize: 14, color: colors.textSecondary },

  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
  },
  confirmBtnDisabled: { backgroundColor: colors.surface },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  confirmBtnTextDisabled: { color: colors.textSecondary },

  confirmContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 24,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
  },
  setsWonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  setsWonNum: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  setsWonSep: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  confirmScoreCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  confirmScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmSetLabel: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  confirmScoreText: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },

  confirmBtns: { gap: 12 },
  reviewBtn: {
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  reviewBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  agreeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  agreeBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
