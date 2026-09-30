import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Image, ImageBackground, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { colors } from '../../constants';
import { claseService } from '../../services/claseService';
import { getAvatarSource } from '../../utils/avatars';
import { sumarHoras } from './horasClase';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 200;
const AVATAR_SIZE = 110;
const COVER_DEFAULT = 'https://images.unsplash.com/photo-1495555961986-b22e827a8f31?w=800&q=80';

// Estado de la clase a partir del código (SP actualizado) o del nombre (respaldo)
function codigoEstado(d) {
  if (d.estado_codigo) return d.estado_codigo;
  const n = String(d.estado ?? '').toLowerCase();
  if (n.includes('solicit')) return 'CLASE_SOLICITADA';
  if (n.includes('acept'))   return 'CLASE_ACEPTADA';
  if (n.includes('complet')) return 'CLASE_COMPLETADA';
  if (n.includes('rechaz'))  return 'CLASE_RECHAZADA';
  if (n.includes('cancel'))  return 'CLASE_CANCELADA';
  return null;
}

const ESTADO_UI = {
  // NUEVO (idiomas): "texto" es la clave de traducción del estado
  CLASE_SOLICITADA: { texto: 'estados.solicitada', bg: '#FFF3E0', color: '#E65100' },
  CLASE_ACEPTADA:   { texto: 'estados.aceptada',   bg: '#E3F2FD', color: '#1565C0' },
  CLASE_COMPLETADA: { texto: 'estados.completada', bg: '#E8F5E9', color: '#2E7D32' },
  CLASE_RECHAZADA:  { texto: 'estados.rechazada',  bg: '#FFEBEE', color: '#C62828' },
  CLASE_CANCELADA:  { texto: 'estados.cancelado',  bg: '#FFEBEE', color: '#C62828' },
};

function formatPuntos(p) {
  const n = Number(p ?? 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function Estrellas({ valor, onChange, size = 30 }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity
          key={n}
          disabled={!onChange}
          onPress={() => onChange?.(n)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={n <= valor ? 'star' : 'star-outline'}
            size={size}
            color={n <= valor ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Pantalla que ve el PROFESOR al completar: los puntos son del alumno
function PuntosScreen({ puntos, nombreAlumno, onVolver }) {
  const { t } = useTranslation();
  const alumno = String(nombreAlumno ?? t('clases.detalle.tuAlumno')).split(' ')[0];
  return (
    <View style={styles.puntosContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.puntosCircle}>
          <Ionicons name="checkmark-circle" size={80} color={colors.accent} />
        </View>
        <Text style={styles.puntosTitle}>{t('clases.detalle.completada')}</Text>
        <Text style={styles.puntosSubtitle}>
          {t('clases.detalle.gano', { nombre: alumno })}<Text style={styles.puntosNum}>{formatPuntos(puntos)} {Number(puntos) === 1 ? t('clases.detalle.punto') : t('clases.detalle.puntos')}</Text>
        </Text>
        <Text style={styles.puntosNote}>{t('clases.detalle.ahoraPodra', { nombre: alumno })}</Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onVolver}>
        <Text style={styles.accentBtnText}>{t('clases.detalle.volver')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function DetalleClaseScreen({ navigation, route }) {
  const { t } = useTranslation();   // NUEVO: idiomas
  const insets = useSafeAreaInsets();
  const claseParams = route?.params?.clase ?? {};
  const idClase = claseParams.id_clase ?? claseParams.id_encuentro ?? claseParams.id ?? null;

  const [detalle, setDetalle] = useState(null);
  const [idUsuarioActual, setIdUsuarioActual] = useState(null);
  const [puntosCompletados, setPuntosCompletados] = useState(null);
  const [accion, setAccion] = useState(null); // 'cancelar' | 'completar' | 'aceptar' | 'rechazar' | 'calificar'

  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    SecureStore.getItemAsync('id_usuario').then(id => setIdUsuarioActual(Number(id)));
  }, []);

  const cargar = useCallback(() => {
    if (!idClase) return;
    claseService.detalle(idClase)
      .then(res => { if (res) setDetalle(res); })
      .catch(() => {});
  }, [idClase]);

  useEffect(() => { cargar(); }, [cargar]);

  const d = detalle ?? claseParams;
  const estado = codigoEstado(d);
  const estadoUi = ESTADO_UI[estado];

  // ¿Soy alumno o profesor? (null = aún cargando, no mostrar acciones)
  const soyAlumno = idUsuarioActual != null && d.id_alumno != null
    ? Number(d.id_alumno) === idUsuarioActual
    : null;
  const soyProfesor = soyAlumno === false;

  const nombreOtro = soyAlumno
    ? (d.nombre_profesor ?? d.nombre_rival ?? d.rival ?? t('clases.detalle.profesor'))
    : (d.nombre_alumno  ?? d.nombre_rival ?? d.rival ?? t('clases.detalle.alumno'));
  const fotoOtro = soyAlumno
    ? (d.foto_profesor ?? d.foto_perfil_url_rival ?? null)
    : (d.foto_alumno   ?? d.foto_perfil_url_rival ?? null);
  const rankingOtro = soyAlumno
    ? (d.ranking_profesor ?? d.ranking_rival ?? '--')
    : (d.ranking_alumno   ?? d.ranking_rival ?? '--');

  const nombreCancha = d.nombre_cancha ?? d.lugar ?? t('crear.cancha.nombre');
  const direccion    = d.descripcion   ?? d.direccion ?? d.address ?? '';
  const fecha        = d.fecha_clase   ?? d.fecha_partido ?? d.fecha ?? '--';
  const horaRaw      = d.hora_clase ?? d.hora_partido ?? d.hora;
  const hora         = typeof horaRaw === 'string' ? horaRaw.substring(0, 5) : '--';
  const duracionHoras = Math.max(1, Math.round(Number(d.duracion_minutos ?? 60) / 60));
  const horario      = hora !== '--' ? `${hora} – ${sumarHoras(hora, duracionHoras)}` : '--';
  const coverUri     = d.foto_cancha_url ?? COVER_DEFAULT;

  const notaDada   = d.calificacion != null && Number(d.calificacion) > 0 ? Number(d.calificacion) : null;
  const califProf  = d.calificacion_profesor != null ? Number(d.calificacion_profesor) : null;
  const totalCalif = Number(d.total_calificaciones_profesor ?? 0);

  // Qué acciones corresponden según estado y rol
  const puedeCancelar  = estado === 'CLASE_SOLICITADA' || estado === 'CLASE_ACEPTADA';
  const puedeResponder = soyProfesor && estado === 'CLASE_SOLICITADA';
  const puedeCompletar = soyProfesor && estado === 'CLASE_ACEPTADA';
  const puedeCalificar = soyAlumno === true && estado === 'CLASE_COMPLETADA' && notaDada == null;
  const puedeChatear   = estado !== 'CLASE_RECHAZADA' && estado !== 'CLASE_CANCELADA';

  function formatFecha(f) {
    if (!f || f === '--') return '--';
    const [year, month, day] = (String(f).split('T')[0]).split('-').map(Number);
    const months = i18n.t('fechas.mesesAbrev', { returnObjects: true });
    return `${day} ${months[month - 1]} ${year}`;
  }

  async function ejecutar(nombreAccion, fn) {
    try {
      setAccion(nombreAccion);
      await fn();
    } catch (e) {
      Alert.alert(t('clases.detalle.noSePudo'), e.message ?? t('clases.detalle.intentaNuevo'));
    } finally {
      setAccion(null);
    }
  }

  function handleCancelar() {
    Alert.alert(t('clases.detalle.cancelarTitulo'), t('clases.detalle.cancelarMensaje'), [
      { text: t('solicitudes.alertas.no'), style: 'cancel' },
      {
        text: t('solicitudes.alertas.siCancelar'), style: 'destructive',
        onPress: () => ejecutar('cancelar', async () => {
          await claseService.cancelar(idClase);
          navigation.goBack();
        }),
      },
    ]);
  }

  function handleCompletar() {
    Alert.alert(t('clases.detalle.completarTitulo'), t('clases.detalle.completarMensaje', { nombre: String(nombreOtro).split(' ')[0] }), [
      { text: t('solicitudes.alertas.no'), style: 'cancel' },
      {
        text: t('clases.detalle.siCompletar'),
        onPress: () => ejecutar('completar', async () => {
          const res = await claseService.completar(idClase);
          setPuntosCompletados(res?.puntosGanados ?? 0);
        }),
      },
    ]);
  }

  function handleAceptar() {
    ejecutar('aceptar', async () => {
      await claseService.aceptar(idClase);
      cargar();
    });
  }

  function handleRechazar() {
    Alert.alert(t('solicitudes.alertas.rechazarClase'), t('solicitudes.alertas.rechazarClaseMensaje'), [
      { text: t('solicitudes.alertas.no'), style: 'cancel' },
      {
        text: t('solicitudes.alertas.siRechazar'), style: 'destructive',
        onPress: () => ejecutar('rechazar', async () => {
          await claseService.rechazar(idClase);
          navigation.goBack();
        }),
      },
    ]);
  }

  function handleCalificar() {
    ejecutar('calificar', async () => {
      await claseService.dejarFeedback(idClase, { calificacion: nota, comentario: comentario.trim() || null });
      Alert.alert(t('clases.detalle.gracias'), t('clases.detalle.graciasMensaje'));
      cargar();
    });
  }

  function handleChatear() {
    navigation.navigate('MatchChat', {
      idClase,
      rival: { name: nombreOtro, avatar: fotoOtro },
    });
  }

  if (puntosCompletados != null) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <PuntosScreen
          puntos={puntosCompletados}
          nombreAlumno={d.nombre_alumno}
          onVolver={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: coverUri }} style={styles.cover}>
        <View style={[styles.coverHeader, { marginTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <View style={styles.sheet}>
        {/* Avatar fuera del ScrollView para que no se recorte */}
        <View style={styles.avatarWrap}>
          <Image source={getAvatarSource(fotoOtro)} style={styles.avatar} />
          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={13} color={colors.primary} />
            <Text style={styles.rankBadgeText}> {rankingOtro}</Text>
          </View>
        </View>

      <ScrollView
        contentContainerStyle={[styles.sheetContent, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.name}>{nombreOtro}</Text>
        {soyAlumno !== null && (
          <Text style={styles.role}>{soyAlumno ? t('clases.detalle.profesor') : t('clases.detalle.alumno')}</Text>
        )}

        {/* Calificación del profesor (visible para el alumno) */}
        {soyAlumno && (
          <View style={styles.califChip}>
            <Ionicons name="star" size={14} color={colors.accent} />
            <Text style={styles.califValor}>{califProf != null ? califProf.toFixed(1) : '—'}</Text>
            <Text style={styles.califTexto}>
              {totalCalif > 0 ? t('clases.detalle.comoProfesor', { n: totalCalif }) : t('clases.detalle.sinCalif')}
            </Text>
          </View>
        )}

        {estadoUi && (
          <View style={[styles.estadoBadge, { backgroundColor: estadoUi.bg }]}>
            <Text style={[styles.estadoText, { color: estadoUi.color }]}>{t(estadoUi.texto)}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('clases.detalle.detalles')}</Text>

        <View style={styles.detailCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailMain}>{nombreCancha}</Text>
            {!!direccion && (
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailSub}> {direccion}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rowCards}>
          <View style={[styles.detailCard, { flex: 1, marginRight: 10 }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {formatFecha(fecha)}</Text>
          </View>
          <View style={[styles.detailCard, { flex: 1 }]}>
            <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.detailMain}> {horario}</Text>
          </View>
        </View>

        {/* Puntos de una clase completada */}
        {estado === 'CLASE_COMPLETADA' && d.puntos_ganados != null && (
          <Text style={styles.puntosInfo}>
            {soyAlumno
              ? t('clases.detalle.ganaste', { pts: formatPuntos(d.puntos_ganados) })
              : t('clases.detalle.otroGano', { nombre: String(nombreOtro).split(' ')[0], pts: formatPuntos(d.puntos_ganados) })}
          </Text>
        )}

        {/* ALUMNO: calificar al profesor */}
        {puedeCalificar && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>{t('clases.detalle.queTal', { nombre: String(nombreOtro).split(' ')[0] })}</Text>
            <Estrellas valor={nota} onChange={setNota} />
            <TextInput
              style={styles.feedbackInput}
              placeholder={t('clases.detalle.comentario')}
              placeholderTextColor={colors.textSecondary}
              value={comentario}
              onChangeText={setComentario}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.feedbackBtn, nota === 0 && styles.btnDisabled]}
              disabled={nota === 0 || accion === 'calificar'}
              onPress={handleCalificar}
            >
              {accion === 'calificar'
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={styles.feedbackBtnText}>{t('clases.detalle.enviarCalif')}</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Calificación ya dada (alumno o profesor la ven) */}
        {estado === 'CLASE_COMPLETADA' && notaDada != null && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>
              {soyAlumno ? t('clases.detalle.tuCalif') : t('clases.detalle.califAlumno')}
            </Text>
            <Estrellas valor={notaDada} size={24} />
            {!!d.comentario && <Text style={styles.feedbackComentario}>"{d.comentario}"</Text>}
          </View>
        )}

        <View style={{ height: 16 }} />

        {/* PROFESOR: aceptar / rechazar solicitud */}
        {puedeResponder && (
          <>
            <TouchableOpacity style={styles.completadaBtn} onPress={handleAceptar} disabled={!!accion}>
              <Ionicons name="checkmark" size={20} color={colors.primary} />
              <Text style={styles.completadaBtnText}>{accion === 'aceptar' ? t('clases.detalle.aceptando') : t('clases.detalle.aceptarClase')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 12 }]} onPress={handleRechazar} disabled={!!accion}>
              <Text style={styles.cancelBtnText}>{accion === 'rechazar' ? t('clases.detalle.rechazando') : t('clases.detalle.rechazar')}</Text>
            </TouchableOpacity>
          </>
        )}

        {puedeChatear && (
          <TouchableOpacity style={styles.chatActionBtn} onPress={handleChatear}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.cancelBtnText}>{t('clases.detalle.chatear')}</Text>
          </TouchableOpacity>
        )}

        {puedeCancelar && !puedeResponder && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelar} disabled={!!accion}>
            <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.cancelBtnText}>{accion === 'cancelar' ? t('clases.detalle.cancelando') : t('clases.detalle.cancelarClase')}</Text>
          </TouchableOpacity>
        )}

        {puedeCompletar && (
          <TouchableOpacity style={styles.completadaBtn} onPress={handleCompletar} disabled={!!accion}>
            <Ionicons name="checkmark-done" size={20} color={colors.primary} />
            <Text style={styles.completadaBtnText}>{accion === 'completar' ? t('clases.detalle.guardando') : t('clases.detalle.claseCompletada')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  cover: { width: SCREEN_W, height: COVER_H },
  coverHeader: { flexDirection: 'row', paddingHorizontal: 20 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },

  sheet: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28,
  },
  sheetContent: { paddingHorizontal: 20, paddingTop: AVATAR_SIZE / 2 + 48, alignItems: 'center' },
  avatarWrap: { position: 'absolute', top: -(AVATAR_SIZE / 2), alignSelf: 'center', alignItems: 'center', zIndex: 2, elevation: 2 },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4, borderColor: colors.background, backgroundColor: '#ccc',
  },
  rankBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginTop: 8,
  },
  rankBadgeText: { fontSize: 15, fontWeight: 'bold', color: colors.primary },

  name: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 2 },
  role: { fontSize: 14, color: colors.textSecondary, marginBottom: 10 },

  califChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surface, borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10,
  },
  califValor: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  califTexto: { fontSize: 12, color: colors.textSecondary },

  estadoBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 20 },
  estadoText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, alignSelf: 'flex-start', marginBottom: 12 },
  detailCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, gap: 10, marginBottom: 10, width: '100%',
  },
  rowCards: { flexDirection: 'row', width: '100%' },
  detailMain: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  detailSub: { fontSize: 13, color: colors.textSecondary },

  puntosInfo: { fontSize: 13, color: colors.textSecondary, alignSelf: 'flex-start', marginTop: 4, marginBottom: 6 },

  feedbackCard: {
    width: '100%', backgroundColor: colors.accentLight, borderRadius: 16,
    padding: 16, marginTop: 10, alignItems: 'center', gap: 12,
  },
  feedbackTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: 8 },
  feedbackInput: {
    width: '100%', minHeight: 70, backgroundColor: colors.background,
    borderRadius: 12, padding: 12, fontSize: 14, color: colors.textPrimary,
  },
  feedbackBtn: {
    width: '100%', backgroundColor: colors.accent, borderRadius: 26,
    paddingVertical: 14, alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  feedbackBtnText: { fontSize: 15, fontWeight: '800', color: colors.primary },
  feedbackComentario: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  btnDisabled: { backgroundColor: colors.surface },

  chatActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 30, paddingVertical: 16, width: '100%', marginBottom: 12, marginTop: 12,
  },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 30, paddingVertical: 16, width: '100%', marginBottom: 12,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  completadaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.accent,
    borderRadius: 30, paddingVertical: 18, width: '100%',
  },
  completadaBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },

  puntosContainer: { flex: 1, paddingHorizontal: 32, paddingBottom: 40, paddingTop: 20 },
  puntosCircle: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: colors.accentLight, alignItems: 'center',
    justifyContent: 'center', marginBottom: 32,
  },
  puntosTitle: { fontSize: 26, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  puntosSubtitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  puntosNum: { color: colors.accent },
  puntosNote: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  accentBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center' },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});