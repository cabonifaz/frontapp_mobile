import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, ImageBackground, Dimensions, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants';
import { partidoService } from '../../services/partidoService';
import { authService } from '../../services/authService';
import { getAvatarSource } from '../../utils/avatars';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 200;
const AVATAR_SIZE = 90;

export function DetallePartidoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const itemInicial = route?.params?.partido ?? {};
  const [item, setItem] = useState(itemInicial);
  const [cargando, setCargando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [usuarioActualId, setUsuarioActualId] = useState(null);
  const [respondiendo, setRespondiendo] = useState(false); // NUEVO

  const partidoId = itemInicial.id_partido ?? itemInicial.id_encuentro ?? itemInicial.id;

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

  const esMiCreacion =
    idParticipante != null && usuarioActualId != null
      ? Number(usuarioActualId) !== Number(idParticipante)
      : false;

  const datosCreador = {
    id:      idCreador,
    name:    item.creador ?? item.nombre_yo ?? 'Creador',
    ranking: item.ranking_creador ?? item.ranking_yo ?? '--',
    pts:     item.puntos_creador ?? item.puntos_yo ?? 0,
    avatar:  item.foto_perfil_url_creador ?? item.foto_yo ?? null,
  };

  const datosParticipante = {
    id:      item.id_usuario_rival ?? item.id_rival ?? item.id_usuario,
    name:    item.participante ?? item.rival ?? item.nombre_rival ?? 'Participante',
    ranking: item.ranking_rival ?? '--',
    pts:     item.puntos_rival ?? 0,
    avatar:  item.foto_perfil_url_rival ?? item.foto_perfil_url_rival_alt ?? item.foto_rival ?? null,
  };

  const yo    = esMiCreacion ? datosCreador : datosParticipante;
  const rival = esMiCreacion ? datosParticipante : datosCreador;

  const partido = {
    id:       partidoId,
    club:     item.nombre_cancha ?? item.cancha ?? item.lugar ?? item.club ?? 'Cancha',
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
  const soyInvitado = esPendiente && !soyCreador;
  const rivalNombre = String(rival.name ?? '').split(' ')[0];
  // NUEVO: tipo de partido (liga / rankeado antiguo / amistoso)
  const esLiga      = Number(item.es_liga ?? 0) === 1 || item.id_liga != null;
  const codigoTipo  = item.tipo_reto_codigo ?? '';
  const esRankeado  = codigoTipo === 'TIPO_RANKEADO' || String(item.tipo_reto ?? '').toLowerCase().includes('rank');
  const esRetoLiga  = esLiga || esRankeado;
  const numSets     = Number(item.num_sets ?? 5);
  const formatoSets = numSets === 3 ? '2 de 3 sets' : '3 de 5 sets';

  async function handleCancelar() {
    Alert.alert('Cancelar partido', '¿Seguro que quieres cancelar este partido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar', style: 'destructive',
        onPress: async () => {
          try {
            setCancelando(true);
            if (partido.id) await partidoService.cancelar(partido.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message ?? 'No se pudo cancelar el partido.');
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
          Alert.alert('Reto aceptado', `El partido con ${rivalNombre} está confirmado. Coordinen los detalles por el chat.`);
        } else {
          navigation.goBack();
        }
      } catch (e) {
        Alert.alert('Error', e.message ?? 'No se pudo responder el reto.');
      } finally {
        setRespondiendo(false);
      }
    };

    if (aceptar) {
      ejecutar();
    } else {
      Alert.alert('Rechazar reto', '¿Seguro que quieres rechazar este reto?', [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, rechazar', style: 'destructive', onPress: ejecutar },
      ]);
    }
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
              <Text style={styles.tipoLigaLabel}>Partido de liga · {formatoSets}</Text>
              <Text style={styles.tipoLigaNombre} numberOfLines={2}>{item.nombre_liga ?? 'Liga de ranking'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.tipoAmistoso}>
            <Ionicons name={esRankeado ? 'ribbon-outline' : 'happy-outline'} size={16} color={colors.textPrimary} />
            <Text style={styles.tipoAmistosoText}>
              {esRankeado ? 'Rankeado' : 'Amistoso'} · {formatoSets}
            </Text>
          </View>
        )}

        {/* Dos jugadores */}
        <View style={styles.playersRow}>
          <View style={styles.playerCol}>
            <View style={styles.avatarWrap}>
              <Image source={getAvatarSource(yo.avatar, yo.name)} style={styles.avatar} />
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={11} color={colors.primary} />
                <Text style={styles.rankBadgeText}> {yo.ranking}</Text>
              </View>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{String(yo.name).split(' ')[0]}</Text>
            <Text style={styles.playerPts}>{yo.pts} pts</Text>
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
              <Text style={styles.playerName}>Rival</Text>
              <Text style={styles.playerPts}>Buscando...</Text>
            </View>
          ) : (
            <View style={styles.playerCol}>
              <View style={styles.avatarWrap}>
                <Image source={getAvatarSource(rival.avatar, rival.name)} style={styles.avatar} />
                <View style={styles.rankBadge}>
                  <Ionicons name="trophy" size={11} color={colors.primary} />
                  <Text style={styles.rankBadgeText}> {rival.ranking}</Text>
                </View>
              </View>
              <Text style={styles.playerName} numberOfLines={1}>{String(rival.name).split(' ')[0]}</Text>
              <Text style={styles.playerPts}>{rival.pts} pts</Text>
            </View>
          )}
        </View>

        {/* Detalles */}
        <Text style={styles.sectionTitle}>Detalles del partido</Text>

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

          const yoSets    = setsData.filter(s => esMiCreacion ? s.local > s.visit : s.visit > s.local).length;
          const rivalSets = setsData.filter(s => esMiCreacion ? s.visit > s.local : s.local > s.visit).length;

          return (
            <>
              <Text style={styles.sectionTitle}>Resultado final</Text>

              <View style={styles.resultadoPrimario}>
                <Text style={styles.resultadoNum}>{yoSets}</Text>
                <Text style={styles.resultadoSep}> - </Text>
                <Text style={styles.resultadoNum}>{rivalSets}</Text>
              </View>

              <View style={[styles.detailCard, { flexDirection: 'column', gap: 10, alignItems: 'stretch' }]}>
                {setsData.length > 0 ? setsData.map(s => (
                  <View key={s.n} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.detailSub}>Set {s.n}</Text>
                    <Text style={styles.detailMain}>
                      {esMiCreacion ? s.local : s.visit}  –  {esMiCreacion ? s.visit : s.local}
                    </Text>
                  </View>
                )) : (
                  <Text style={[styles.detailSub, { textAlign: 'center' }]}>Sin sets registrados</Text>
                )}
              </View>
            </>
          );
        })()}

        {!esFinalizado && !esBuscando && !esPendiente && (
          <Text style={styles.mandatoryNote}>
            {esLiga
              ? 'Resultado a 3 de 5 sets. Suma o resta puntos de liga: 3-0 ±3, 3-1 ±2, 3-2 ±1. Colócalo hasta 12 hrs luego del encuentro.'
              : 'Es mandatorio para los competidores colocar los resultados hasta 12 hrs luego del encuentro.'}
          </Text>
        )}

        {/* NUEVO: reto directo pendiente */}
        {esPendiente && (
          <View style={styles.pendienteCard}>
            <Ionicons name="hourglass-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.pendienteText}>
              {soyInvitado
                ? `${rivalNombre} te retó a un partido ${esRetoLiga ? 'de liga' : 'amistoso'}.`
                : `Esperando que ${rivalNombre} acepte tu reto.`}
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
              <Text style={styles.resultadosBtnText}>{respondiendo ? 'Enviando...' : 'Aceptar reto'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleResponderReto(false)}
              disabled={respondiendo}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.cancelBtnText}>Rechazar reto</Text>
            </TouchableOpacity>
          </>
        )}

        {!esBuscando && !esPendiente && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => {
              navigation.navigate('MatchChat', {
                idPartido: partido.id,
                rival: { name: rival.name, avatar: rival.avatar },
              });
            }}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.chatBtnText}>Abrir Chat del Partido</Text>
          </TouchableOpacity>
        )}

        {!esFinalizado && (!esPendiente || soyCreador) && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelar} disabled={cancelando}>
            <Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.cancelBtnText}>
              {cancelando ? 'Cancelando...' : esPendiente ? 'Cancelar reto' : 'Cancelar partido'}
            </Text>
          </TouchableOpacity>
        )}

        {!esFinalizado && !esBuscando && !esPendiente && (
          <TouchableOpacity
            style={styles.resultadosBtn}
            onPress={() => navigation.navigate('ColocarResultados', {
              partido: { ...item, ...partido, id_partido: partido.id, yo, rival, esCreador: esMiCreacion },
            })}
          >
            <Ionicons name="trophy-outline" size={20} color={colors.primary} />
            <Text style={styles.resultadosBtnText}>
              {item.id_resultado ? 'Ver resultado publicado' : 'Colocar resultados'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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