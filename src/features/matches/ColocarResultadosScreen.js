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

function ScoreRow({ index, myScore, rivalScore, onChangeMyScore, onChangeRivalScore }) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.setLabel}>Set {index + 1}</Text>
      <View style={styles.scoreBoxes}>
        <TextInput
          style={styles.scoreInput}
          keyboardType="number-pad"
          maxLength={2}
          value={myScore}
          onChangeText={onChangeMyScore}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          textAlign="center"
        />
        <Text style={styles.scoreSeparator}>:</Text>
        <TextInput
          style={styles.scoreInput}
          keyboardType="number-pad"
          maxLength={2}
          value={rivalScore}
          onChangeText={onChangeRivalScore}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          textAlign="center"
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

function ConfirmationView({ scores, rivalName, onReview, onAgree, loading }) {
  return (
    <View style={styles.confirmContainer}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={styles.confirmTitle}>
          {rivalName} ha publicado estos resultados, ¿estás de acuerdo con ellos?
        </Text>

        <View style={styles.confirmScoreCard}>
          {scores.map((s, i) => (
            <View key={i} style={styles.confirmScoreRow}>
              <Text style={styles.confirmSetLabel}>Set {i + 1}</Text>
              <Text style={styles.confirmScoreText}>{s.my || '0'} : {s.rival || '0'}</Text>
            </View>
          ))}
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

  // 🟢 CORREGIDO: primero intenta leer el objeto anidado que manda DetallePartidoScreen
  // (partido.rival / partido.yo), y si no viene, cae a los campos planos legacy.
  const rival = {
    id:      partido.rival?.id     ?? partido.id_rival ?? partido.id_usuario_rival ?? null,
    name:    partido.rival?.name   ?? partido.name     ?? partido.nombre_rival ?? 'Rival',
    avatar:  partido.rival?.avatar ?? partido.avatar   ?? partido.foto_rival   ?? 'https://i.pravatar.cc/150?img=17',
    pts:     partido.rival?.pts    ?? partido.pts      ?? partido.puntos_rival  ?? 0,
    ranking: partido.rival?.ranking ?? partido.ranking ?? partido.ranking_rival ?? '--',
  };
  const yo = {
    name:   partido.yo?.name   ?? partido.nombre_yo ?? 'Tú',
    avatar: partido.yo?.avatar ?? partido.avatar_yo ?? 'https://i.pravatar.cc/150?img=1',
    pts:    partido.yo?.pts    ?? partido.puntos_yo ?? 0,
  };

  // 🟢 CORREGIDO: recuperar los sets ya publicados en la BD (si existen), en vez de
  // arrancar siempre en blanco. Soporta tanto set1_puntos_local/visitante (nombres
  // actuales del SP) como set1_local/visitante (por si algún endpoint viejo los usa).
  const [scores, setScores] = useState([
    {
      my:    String(partido.set1_puntos_local ?? partido.set1_local ?? ''),
      rival: String(partido.set1_puntos_visitante ?? partido.set1_visitante ?? ''),
    },
    {
      my:    String(partido.set2_puntos_local ?? partido.set2_local ?? ''),
      rival: String(partido.set2_puntos_visitante ?? partido.set2_visitante ?? ''),
    },
    {
      my:    String(partido.set3_puntos_local ?? partido.set3_local ?? ''),
      rival: String(partido.set3_puntos_visitante ?? partido.set3_visitante ?? ''),
    },
  ]);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // 🟢 CORREGIDO: si ya existe un resultado publicado (id_resultado no nulo),
  // saltamos directo a la pantalla de confirmación con los marcadores reales.
  const [confirmed, setConfirmed] = useState(
    Boolean(partido.id_resultado)
  );

  const [publicando, setPublicando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const updateScore = (index, side, value) => {
    setScores(prev => prev.map((s, i) => i === index ? { ...s, [side]: value } : s));
  };

  const canConfirm = scores.some(s => s.my !== '' || s.rival !== '');

  async function handlePublicar() {
    try {
      setPublicando(true);
      const sets = scores
        .filter(s => s.my !== '' && s.rival !== '')
        .map(s => ({ mi_puntaje: Number(s.my) || 0, puntaje_rival: Number(s.rival) || 0 }));

      if (idPartido) {
        await resultadoService.publicar(idPartido, {
          idRival:          rival.id,
          calificacionRival: rating,
          comentario:       comment,
          sets,
        });
      }

      Alert.alert(
        '¡Resultado publicado!',
        'Se ha enviado el resultado. Queda pendiente de la confirmación de tu rival.',
        [
          {
            text: 'Entendido',
            onPress: () => navigation.goBack(),
          },
        ]
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
      const sets = scores
        .filter(s => s.my !== '' && s.rival !== '')
        .map(s => ({ mi_puntaje: Number(s.my) || 0, puntaje_rival: Number(s.rival) || 0 }));
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
          scores={scores}
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

          {/* Players + scores */}
          <View style={styles.playersBlock}>
            <View style={styles.playerCol}>
              <Image source={fuenteImagen(yo.avatar)} style={styles.avatar} />
              <Text style={styles.playerName} numberOfLines={1}>{yo.name.split(' ')[0]}</Text>
              <Text style={styles.playerPts}>{yo.pts} pts</Text>
            </View>

            <View style={styles.scoresCol}>
              {scores.map((s, i) => (
                <ScoreRow
                  key={i}
                  index={i}
                  myScore={s.my}
                  rivalScore={s.rival}
                  onChangeMyScore={v => updateScore(i, 'my', v)}
                  onChangeRivalScore={v => updateScore(i, 'rival', v)}
                />
              ))}
            </View>

            <View style={styles.playerCol}>
              <Image source={fuenteImagen(rival.avatar)} style={styles.avatar} />
              <Text style={styles.playerName} numberOfLines={1}>{rival.name.split(' ')[0]}</Text>
              <Text style={styles.playerPts}>{rival.pts} pts</Text>
            </View>
          </View>

          {/* Rating */}
          <Text style={styles.sectionTitle}>
            ¿Qué tal fue jugar con {rival.name.split(' ')[0]}?
          </Text>
          <StarRating rating={rating} onRate={setRating} />

          {/* Comment */}
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

          {/* Photo upload placeholder */}
          <Text style={styles.sectionTitle}>Sube fotos del encuentro</Text>
          <View style={styles.photoBox}>
            <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.photoBoxText}>Toca para subir fotos</Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
            disabled={!canConfirm || publicando}
            onPress={handlePublicar}
          >
            <Ionicons
              name="stats-chart-outline"
              size={20}
              color={canConfirm ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.confirmBtnText, !canConfirm && styles.confirmBtnTextDisabled]}>
              {publicando ? 'Publicando...' : 'Confirmar resultados'}
            </Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 28,
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
  scoreSeparator: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
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
    marginBottom: 32,
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