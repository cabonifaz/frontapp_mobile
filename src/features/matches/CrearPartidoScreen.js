import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { maestroService } from '../../services/maestroService';
import { partidoService } from '../../services/partidoService';
import { amistadService } from '../../services/amistadService';
import { ligaService } from '../../services/ligaService';
import { getAvatarSource } from '../../utils/avatars';
import { TIPOS_JUEGO, DEPORTE_DEFAULT } from '../../constants/maestro';

const HORAS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

function getHorasDisponibles(fechaSeleccionada) {
  if (!fechaSeleccionada || fechaSeleccionada.key !== '0') return HORAS;
  const horaActual = new Date().getHours();
  return HORAS.filter(h => parseInt(h, 10) > horaActual);
}
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function getNextDays(n = 14) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push({ key: String(i), day: d.getDate(), month: MESES[d.getMonth()], iso: `${yyyy}-${mm}-${dd}` });
  }
  return days;
}

const TIPO_JUEGO_MAP = {
  'Singles': TIPOS_JUEGO.SINGLES,
  'Dobles':  TIPOS_JUEGO.DOBLES,
};

// NUEVO: modalidades del amistoso
const MODALIDADES = [
  { key: 'abierta', label: 'Convocatoria' },
  { key: 'amigo',   label: 'Retar a amigo' },
];

const DAYS = getNextDays(14);

function CanchaModal({ visible, onClose, onSelect, courts, loadingCanchas }) {
  const [search, setSearch] = useState('');

  const filtered = courts.filter(c => {
    const nombreCancha = c.name ?? c.nombre ?? '';
    return nombreCancha.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Selecciona una cancha</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cancha"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            underlineColorAndroid="transparent"
          />
        </View>

        {loadingCanchas ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.modalListContent}>
            {filtered.map(c => {
              const idCancha = c.id_maestro ?? c.id;
              const nombreCancha = c.name ?? c.nombre ?? 'Cancha';
              const uriCancha = c.uri ?? c.foto_url;
              const direccionCancha = c.address ?? c.descripcion;

              return (
                <TouchableOpacity key={idCancha} style={styles.courtCard} onPress={() => onSelect(c)}>
                  {uriCancha ? (
                    <Image source={{ uri: uriCancha }} style={styles.courtImg} />
                  ) : (
                    <View style={[styles.courtImg, styles.canchaImgPlaceholder]}>
                      <Ionicons name="image-outline" size={28} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courtName}>{nombreCancha}</Text>
                    {direccionCancha ? (
                      <View style={styles.addressRow}>
                        <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.courtAddress}> {direccionCancha}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// NUEVO: selector de amigo para el reto directo
function AmigoModal({ visible, onClose, onSelect, onIrRanking }) {
  const [amigos, setAmigos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setSearch('');
    amistadService.listarAmigos()
      .then(res => setAmigos(Array.isArray(res) ? res : []))
      .catch(() => setAmigos([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const term = search.trim().toLowerCase();
  const filtrados = term
    ? amigos.filter(a => (a.nombre_completo ?? '').toLowerCase().includes(term))
    : amigos;

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>¿A qué amigo quieres retar?</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {amigos.length > 0 && (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar amigo"
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              underlineColorAndroid="transparent"
            />
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : amigos.length === 0 ? (
          <View style={styles.amigosEmpty}>
            <Ionicons name="people-outline" size={44} color={colors.textSecondary} />
            <Text style={styles.amigosEmptyTitle}>Aún no tienes amigos</Text>
            <Text style={styles.amigosEmptyText}>
              Envía solicitudes de amistad desde el perfil de los jugadores del ranking.
            </Text>
            <TouchableOpacity style={[styles.accentBtn, { paddingHorizontal: 40 }]} onPress={onIrRanking}>
              <Text style={styles.accentBtnText}>Ir al ranking</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.modalListContent}>
            {filtrados.map(a => (
              <TouchableOpacity key={a.id_usuario} style={styles.courtCard} onPress={() => onSelect(a)}>
                <Image source={getAvatarSource(a.foto_perfil_url)} style={styles.amigoAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.courtName} numberOfLines={1}>{a.nombre_completo}</Text>
                  <View style={styles.addressRow}>
                    <Ionicons name="trophy" size={13} color={colors.textSecondary} />
                    <Text style={styles.courtAddress}> {a.posicion_ranking ?? 'N/R'}   {Number(a.puntaje_total ?? 0).toFixed(1)} pts</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function SuccessScreen({ onPress }) {
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.successCircle}>
          <MaterialCommunityIcons name="tennis" size={72} color={colors.dark} />
        </View>
        <Text style={styles.successTitle}>{'¡Genial!\nHas creado una partida'}</Text>
        <Text style={styles.successSubtitle}>
          Acepta al jugador con el que desees jugar desde "Mis Solicitudes"
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={() => onPress('MisSolicitudes')}>
        <Text style={styles.accentBtnText}>Ir a mis solicitudes</Text>
      </TouchableOpacity>
    </View>
  );
}

// NUEVO: confirmación del reto directo
function RetoEnviadoScreen({ amigo, onPress }) {
  const firstName = (amigo?.nombre_completo ?? 'tu amigo').split(' ')[0];
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.successCircle}>
          <Image source={getAvatarSource(amigo?.foto_perfil_url)} style={styles.successAvatar} />
        </View>
        <Text style={styles.successTitle}>{`Reto enviado a\n${firstName}`}</Text>
        <Text style={styles.successSubtitle}>
          Cuando {firstName} lo acepte, el partido quedará confirmado y podrán coordinar por el chat.
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onPress}>
        <Text style={styles.accentBtnText}>Ir a mis partidos</Text>
      </TouchableOpacity>
    </View>
  );
}

export function CrearPartidoScreen({ navigation, route }) {
  const tipo = route?.params?.tipo ?? 'Rankeado';
  const amigoInicial = route?.params?.amigo ?? null; // llega desde PlayerProfile o AmigosScreen
  // NUEVO: reto de liga (llega desde LigaDetalle con { liga, rival })
  const ligaParam  = route?.params?.liga ?? null;
  const rivalLiga  = route?.params?.rival ?? null;
  const esLiga     = !!ligaParam;
  const esAmistoso = !esLiga && tipo !== 'Rankeado';

  const [cancha, setCancha] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const [tipoJuego, setTipoJuego] = useState('Singles');
  const [numSets, setNumSets] = useState(5);
  const [showCanchaModal, setShowCanchaModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [creando, setCreando] = useState(false);

  // NUEVO: modalidad y amigo seleccionado
  const [modalidad, setModalidad] = useState(amigoInicial ? 'amigo' : 'abierta');
  const [amigo, setAmigo] = useState(amigoInicial);
  const [showAmigoModal, setShowAmigoModal] = useState(false);
  const [retoEnviado, setRetoEnviado] = useState(null);

  const esDirecto = esAmistoso && modalidad === 'amigo';

  // --- CANCHAS REALES DESDE LA API ---
  const [canchas, setCanchas] = useState([]);
  const [loadingCanchas, setLoadingCanchas] = useState(true);

  useEffect(() => {
    async function fetchCanchas() {
      try {
        const res = await maestroService.canchas();
        setCanchas(res ?? []);
      } catch (e) {
        console.error('Error al cargar canchas:', e);
      } finally {
        setLoadingCanchas(false);
      }
    }
    fetchCanchas();
  }, []);

  useEffect(() => {
    if (hora && fecha) {
      const disponibles = getHorasDisponibles(fecha);
      if (!disponibles.includes(hora)) setHora(null);
    }
  }, [fecha]);

  const horasDisponibles = getHorasDisponibles(fecha);
  const inicioLiga = ligaParam?.fecha_inicio ? String(ligaParam.fecha_inicio).split('T')[0] : null;
  const finLiga    = ligaParam?.fecha_fin ? String(ligaParam.fecha_fin).split('T')[0] : null;
  const diasDisponibles = esLiga
    ? DAYS.filter(d => (!inicioLiga || d.iso >= inicioLiga) && (!finLiga || d.iso <= finLiga))
    : DAYS;
  const canConfirm = !!cancha && !!fecha && !!hora && !creando
    && (!esDirecto || !!amigo)
    && (!esLiga || !!rivalLiga);

  const handleCrear = async () => {
    if (!canConfirm) return;
    try {
      setCreando(true);
      const datos = {
        id_cancha: cancha.id_maestro ?? cancha.id,
        fecha: fecha.iso,
        hora,
        id_tipo_juego: TIPO_JUEGO_MAP[tipoJuego] ?? TIPOS_JUEGO.SINGLES,
        id_deporte: DEPORTE_DEFAULT,
      };

      if (esLiga) {
        await ligaService.retar(ligaParam.id_liga, {
          id_rival:  rivalLiga.id_usuario,
          id_cancha: datos.id_cancha,
          fecha:     datos.fecha,
          hora:      datos.hora,
        });
        setRetoEnviado(rivalLiga);
      } else if (tipo === 'Rankeado') {
        await partidoService.crearRankeado(datos);
      } else if (esDirecto) {
        await partidoService.crearAmistosoDirecto({ ...datos, num_sets: numSets, id_rival: amigo.id_usuario });
        setRetoEnviado(amigo);
      } else {
        await partidoService.crearAmistoso({ ...datos, num_sets: numSets });
      }
      setSuccess(true);
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo crear el partido.');
    } finally {
      setCreando(false);
    }
  };

  const irATab = (index) => navigation.reset({
    index: 0,
    routes: [{
      name: 'MainTabs',
      state: { index, routes: [{ name: 'Home' }, { name: 'Ranking' }, { name: 'Resultados' }, { name: 'Partidos' }, { name: 'Perfil' }] },
    }],
  });

  if (success && retoEnviado) {
    return (
      <SafeAreaView style={styles.safe}>
        <RetoEnviadoScreen amigo={retoEnviado} onPress={() => irATab(3)} />
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <SuccessScreen onPress={() => navigation.reset({
          index: 1,
          routes: [
            {
              name: 'MainTabs',
              state: { index: 3, routes: [{ name: 'Home' }, { name: 'Ranking' }, { name: 'Resultados' }, { name: 'Partidos' }, { name: 'Perfil' }] },
            },
            { name: 'MisSolicitudes' },
          ],
        })} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {esLiga ? 'Reto de liga' : esDirecto ? 'Retar a un amigo' : `Crear Partido ${tipo}`}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Reglas de matchmaking — solo Rankeado */}
        {tipo === 'Rankeado' && (
          <View style={styles.matchmakingCard}>
            <View style={styles.matchmakingHeader}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
              <Text style={styles.matchmakingTitle}>Reglas de matchmaking</Text>
            </View>
            <View style={styles.matchmakingRow}>
              <Ionicons name="trophy-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.matchmakingText}>Se emparejará con jugadores dentro de ±3 posiciones de tu ranking</Text>
            </View>
            <View style={styles.matchmakingRow}>
              <Ionicons name="ribbon-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.matchmakingText}>El resultado afecta tu posición en el ranking global</Text>
            </View>
            <View style={styles.matchmakingRow}>
              <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.matchmakingText}>Debes ingresar el resultado dentro de 12 horas del partido</Text>
            </View>
          </View>
        )}

        {/* NUEVO: ¿Con quién? — solo Amistoso */}
        {esAmistoso && (
          <>
            <Text style={styles.sectionTitle}>¿Con quién quieres jugar?</Text>
            <View style={[styles.toggle, { marginBottom: 12 }]}>
              {MODALIDADES.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.toggleBtn, modalidad === m.key && styles.toggleBtnActive]}
                  onPress={() => setModalidad(m.key)}
                >
                  <Text style={[styles.toggleText, modalidad === m.key && styles.toggleTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {esDirecto ? (
              <TouchableOpacity style={styles.canchaCard} onPress={() => setShowAmigoModal(true)} activeOpacity={0.8}>
                {amigo ? (
                  <Image source={getAvatarSource(amigo.foto_perfil_url)} style={styles.amigoAvatar} />
                ) : (
                  <View style={[styles.amigoAvatar, styles.canchaImgPlaceholder]}>
                    <Ionicons name="person-add-outline" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.canchaName}>{amigo ? amigo.nombre_completo : 'Selecciona un amigo'}</Text>
                  <Text style={styles.canchaHint}>
                    {amigo ? 'Toca para cambiar' : 'Solo él recibirá el reto'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <Text style={styles.mandatoryNote}>
                Cualquier jugador podrá postularse y tú eliges a quién aceptar.
              </Text>
            )}
          </>
        )}

        {/* NUEVO: reto de liga — rival fijo y reglas */}
        {esLiga && (
          <>
            <View style={styles.ligaCard}>
              <Ionicons name="trophy" size={16} color={colors.accent} />
              <Text style={styles.ligaNombre} numberOfLines={2}>{ligaParam.nombre_oficial}</Text>
            </View>
            <View style={styles.canchaCard}>
              <Image source={getAvatarSource(rivalLiga?.foto_perfil_url)} style={styles.amigoAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.canchaName}>{rivalLiga?.nombre_completo ?? 'Rival'}</Text>
                <Text style={styles.canchaHint}>
                  {rivalLiga?.posicion ? `${rivalLiga.posicion}° en la tabla` : 'Rival de liga'}
                  {rivalLiga?.puntos != null ? ` · ${rivalLiga.puntos} pts` : ''}
                </Text>
              </View>
            </View>
            <Text style={styles.mandatoryNote}>
              Singles al mejor de 5 sets. El resultado suma o resta puntos de liga (3-0: ±3, 3-1: ±2, 3-2: ±1).
            </Text>
          </>
        )}

        {/* Selector de Cancha */}
        <TouchableOpacity style={styles.canchaCard} onPress={() => setShowCanchaModal(true)} activeOpacity={0.8}>
          {cancha && (cancha.foto_url ?? cancha.uri) ? (
            <Image source={{ uri: cancha.foto_url ?? cancha.uri }} style={styles.canchaImg} />
          ) : (
            <View style={[styles.canchaImg, styles.canchaImgPlaceholder]}>
              <Ionicons name={cancha ? 'tennisball-outline' : 'image-outline'} size={28} color={colors.textSecondary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.canchaName}>
              {cancha ? (cancha.nombre ?? cancha.name) : 'Selecciona una cancha'}
            </Text>
            <Text style={styles.canchaHint}>
              {cancha ? 'Toca para cambiar' : 'Toca para seleccionar una cancha'}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.mandatoryNote}>
          Es mandatorio para el anfitrión del partido separar la cancha elegida por un medio independiente.
        </Text>

        {/* Selección de Fecha */}
        <Text style={styles.sectionTitle}>Selecciona una fecha cercana</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hChipRow}
          style={styles.hScroll}
        >
          {diasDisponibles.map(d => {
            const active = fecha?.key === d.key;
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.dateChip, active && styles.dateChipActive]}
                onPress={() => setFecha(d)}
              >
                <Text style={[styles.dateChipNum, active && styles.dateChipNumActive]}>{d.day}</Text>
                <Text style={[styles.dateChipMonth, active && styles.dateChipMonthActive]}>{d.month}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selección de Hora */}
        <Text style={styles.sectionTitle}>Selecciona horas disponibles</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hChipRow}
          style={styles.hScroll}
        >
          {horasDisponibles.map(h => {
            const active = hora === h;
            return (
              <TouchableOpacity
                key={h}
                style={[styles.horaChip, active && styles.horaChipActive]}
                onPress={() => setHora(h)}
              >
                <Text style={[styles.horaChipText, active && styles.horaChipTextActive]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tipo de juego (en liga siempre es singles) */}
        {!esLiga && (
          <>
            <Text style={styles.sectionTitle}>Selecciona tipo de juego</Text>
            <View style={styles.toggle}>
              {['Singles', 'Dobles'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.toggleBtn, tipoJuego === t && styles.toggleBtnActive]}
                  onPress={() => setTipoJuego(t)}
                >
                  <Text style={[styles.toggleText, tipoJuego === t && styles.toggleTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Formato de sets — solo Amistoso */}
        {esAmistoso && (
          <>
            <Text style={styles.sectionTitle}>Formato de partido</Text>
            <View style={styles.toggle}>
              {[3, 5].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.toggleBtn, numSets === n && styles.toggleBtnActive]}
                  onPress={() => setNumSets(n)}
                >
                  <Text style={[styles.toggleText, numSets === n && styles.toggleTextActive]}>
                    {n === 3 ? '2 de 3' : '3 de 5'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Botón confirmar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          disabled={!canConfirm}
          onPress={handleCrear}
        >
          {creando ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.confirmBtnText, !canConfirm && styles.confirmBtnTextDisabled]}>
              {esDirecto || esLiga ? 'Enviar reto' : 'Confirmar'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <CanchaModal
        visible={showCanchaModal}
        onClose={() => setShowCanchaModal(false)}
        onSelect={c => { setCancha(c); setShowCanchaModal(false); }}
        courts={canchas}
        loadingCanchas={loadingCanchas}
      />

      <AmigoModal
        visible={showAmigoModal}
        onClose={() => setShowAmigoModal(false)}
        onSelect={a => { setAmigo(a); setShowAmigoModal(false); }}
        onIrRanking={() => { setShowAmigoModal(false); irATab(1); }}
      />
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

  content: { paddingHorizontal: 20, paddingTop: 20 },

  matchmakingCard: {
    backgroundColor: colors.accentLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  matchmakingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  matchmakingTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  matchmakingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  matchmakingText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  canchaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 14,
    marginBottom: 14,
  },
  canchaImg: { width: 70, height: 70, borderRadius: 10, backgroundColor: colors.surface },
  canchaImgPlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canchaName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  canchaHint: { fontSize: 13, color: colors.textSecondary },

  amigoAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ccc' },

  ligaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.dark, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
  },
  ligaNombre: { flex: 1, fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  mandatoryNote: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 24 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },

  hScroll: { marginHorizontal: -20, marginBottom: 24 },
  hChipRow: { paddingHorizontal: 20, gap: 10 },

  dateChip: {
    width: 68,
    height: 72,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipActive: { backgroundColor: colors.accent },
  dateChipNum: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  dateChipNumActive: { color: colors.primary },
  dateChipMonth: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  dateChipMonthActive: { color: colors.primary },

  horaChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horaChipActive: { backgroundColor: colors.accent },
  horaChipText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  horaChipTextActive: { color: colors.primary, fontWeight: '700' },

  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 28 },
  toggleBtnActive: { backgroundColor: colors.accent },
  toggleText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: colors.primary, fontWeight: '700' },

  bottomBar: { paddingHorizontal: 20, paddingVertical: 16 },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  confirmBtnDisabled: { backgroundColor: colors.surface },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  confirmBtnTextDisabled: { color: colors.textSecondary },

  // Modales
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, flex: 1, paddingRight: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },
  modalListContent: { paddingBottom: 20 },
  courtCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
    gap: 14,
  },
  courtImg: { width: 80, height: 80, borderRadius: 10, backgroundColor: colors.background },
  courtName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  courtAddress: { fontSize: 13, color: colors.textSecondary },

  amigosEmpty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32, gap: 10 },
  amigosEmptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  amigosEmptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 12 },

  // Success
  successContainer: { flex: 1, paddingHorizontal: 32, paddingBottom: 40, paddingTop: 20 },
  successCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successAvatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#FFFFFF' },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  successSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  accentBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center' },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});