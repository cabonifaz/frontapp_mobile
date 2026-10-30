// NUEVO (07): marcador EN VIVO de un partido.
// - Amigos y seguidores lo ven actualizarse (se refresca cada 5 s).
// - Los jugadores del partido o un administrador anotan los puntos del set en juego
//   con los botones + / − y pueden corregir un set anterior tocándolo.
// - Al terminar, el resultado oficial se publica y confirma como siempre (Colocar resultados).
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator,
  Alert, Modal, TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { RANKED_LIME } from '../../components/common/RankedLogo';
import { enVivoService } from '../../services/enVivoService';
import { authService } from '../../services/authService';
import { partidoService } from '../../services/partidoService';                         // NUEVO (08)
import { SelectorAmigoModal } from '../../components/common/SelectorAmigoModal';        // NUEVO (08)
import { getAvatarSource } from '../../utils/avatars';
import { validarSet, cargarReglasSet } from '../../utils/reglasSet';

const ROJO = '#FF3B30';
const REFRESCO_MS = 5000;

export function PuntoEnVivo({ size = 10 }) {
  const opacidad = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(opacidad, { toValue: 0.25, duration: 700, useNativeDriver: true }),
      Animated.timing(opacidad, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [opacidad]);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ROJO, opacity: opacidad }} />;
}

const primerNombre = (n) => String(n ?? '').trim().split(' ')[0];

function Lado({ jugadores, sets, ganador, alineado }) {
  const { t } = useTranslation();
  // NUEVO (08): los retirados se ven en gris y el sustituto por aceptar con un reloj
  const visibles = jugadores.filter(j => (j.estado ?? 'ACTIVO') !== 'SUSTITUTO_PENDIENTE');
  const activos = jugadores.filter(j => (j.estado ?? 'ACTIVO') === 'ACTIVO');
  const retirados = jugadores.filter(j => j.estado === 'RETIRADO');
  const pendiente = jugadores.find(j => j.estado === 'SUSTITUTO_PENDIENTE');
  return (
    <View style={[styles.lado, { alignItems: alineado }]}>
      <View style={styles.avatares}>
        {visibles.map((j, i) => (
          <Image
            key={j.id_usuario}
            source={getAvatarSource(j.foto)}
            style={[styles.avatar, i > 0 && styles.avatarPareja, ganador && styles.avatarGanador,
                    j.estado === 'RETIRADO' && styles.avatarRetirado]}
          />
        ))}
        {pendiente && (
          <View style={[styles.avatar, styles.avatarPareja, styles.avatarPendiente]}>
            <Ionicons name="hourglass-outline" size={22} color="#FFFFFF" />
          </View>
        )}
      </View>
      <Text style={[styles.nombre, ganador && styles.nombreGanador]} numberOfLines={2}>
        {activos.map(j => primerNombre(j.nombre)).join(' y ') || '—'}
      </Text>
      {retirados.length > 0 && (
        <Text style={styles.retiradoTxt} numberOfLines={1}>
          {t('vivo.retirado', { nombre: retirados.map(j => primerNombre(j.nombre)).join(' y ') })}
        </Text>
      )}
      {pendiente && (
        <Text style={styles.retiradoTxt} numberOfLines={1}>{t('vivo.esperandoSustituto', { nombre: primerNombre(pendiente.nombre) })}</Text>
      )}
      <Text style={[styles.setsGanados, ganador && { color: RANKED_LIME }]}>{sets}</Text>
    </View>
  );
}

function BotonesPuntos({ onMas, onMenos, deshabilitado }) {
  return (
    <View style={styles.botones}>
      <TouchableOpacity style={[styles.btnMas, deshabilitado && styles.btnOff]} onPress={onMas} disabled={deshabilitado} activeOpacity={0.7}>
        <Ionicons name="add" size={34} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btnMenos, deshabilitado && styles.btnOff]} onPress={onMenos} disabled={deshabilitado} activeOpacity={0.7}>
        <Ionicons name="remove" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export function PartidoEnVivoScreen({ navigation, route }) {
  const { t } = useTranslation();
  const idPartido = route?.params?.idPartido;
  const [d, setD] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [editar, setEditar] = useState(null);   // { numero_set, a, b }
  const [elegirDelegado, setElegirDelegado] = useState(false);   // NUEVO (08)
  const enviando = useRef(0);
  const cola = useRef(Promise.resolve());
  const ultimoCambio = useRef(0);   // hora del último toque: descarta lecturas pedidas antes
  const [idUsuario, setIdUsuario] = useState(null);   // para saber si soy jugador
  useEffect(() => { authService.getUserId().then(id => setIdUsuario(id != null ? Number(id) : null)).catch(() => {}); }, []);

  const cargar = useCallback(async () => {
    if (!idPartido || enviando.current > 0) return;
    const pedido = Date.now();
    try {
      const res = await enVivoService.detalle(idPartido);
      if (enviando.current === 0 && pedido >= ultimoCambio.current) setD(res);
    } catch {
      // se mantiene lo último que se mostró
    } finally {
      setCargando(false);
    }
  }, [idPartido]);

  useEffect(() => { cargarReglasSet(); }, []);

  useFocusEffect(useCallback(() => {
    cargar();
    const timer = setInterval(cargar, REFRESCO_MS);
    return () => clearInterval(timer);
  }, [cargar]));

  if (cargando && !d) {
    return (
      <SafeAreaView style={[styles.safe, styles.centro]}>
        <ActivityIndicator size="large" color={RANKED_LIME} />
      </SafeAreaView>
    );
  }

  const estado = d?.estado_vivo ?? 'SIN_INICIAR';
  const enJuego = estado === 'EN_JUEGO';
  const finalizado = estado === 'FINALIZADO';
  const puedoMarcar = Number(d?.puedo_marcar ?? 0) === 1;
  const esDobles = Number(d?.es_dobles ?? 0) === 1;
  const meta = Number(d?.puntos_set ?? (esDobles ? 21 : 15));
  const jugadores = Array.isArray(d?.jugadores) ? d.jugadores : [];
  const lado1 = jugadores.filter(j => Number(j.lado) === 1);
  const lado2 = jugadores.filter(j => Number(j.lado) === 2);
  const sets = (Array.isArray(d?.sets) ? d.sets : []).slice().sort((a, b) => a.numero_set - b.numero_set);
  const setActual = Number(d?.set_actual ?? 1);
  const actual = sets.find(s => Number(s.numero_set) === setActual) ?? { numero_set: setActual, puntos_lado1: 0, puntos_lado2: 0 };
  const setsNecesarios = Math.ceil(Number(d?.num_sets ?? 5) / 2);
  const s1 = Number(d?.sets_lado1 ?? 0);
  const s2 = Number(d?.sets_lado2 ?? 0);
  // NUEVO (08): abandono durante el partido
  const ladoAbandono = d?.abandono_lado != null ? Number(d.abandono_lado) : null;
  const decidido = s1 >= setsNecesarios || s2 >= setsNecesarios || ladoAbandono != null;
  // El lado 1 es el del anfitrión (quien creó el partido; en dobles, su pareja). Solo ese lado publica el resultado.
  // Si hubo abandono, publica el lado que se quedó.
  const yoEnPartido = jugadores.find(j => idUsuario != null && Number(j.id_usuario) === Number(idUsuario));
  const miLado = Number(yoEnPartido?.lado ?? 0);
  const soyActivo = (yoEnPartido?.estado ?? 'ACTIVO') === 'ACTIVO' && miLado > 0;
  const ladoPublica = ladoAbandono != null ? (ladoAbandono === 1 ? 2 : 1) : 1;
  const soyAnfitrion = soyActivo && miLado === ladoPublica;
  const soyRival = soyActivo && miLado > 0 && miLado !== ladoPublica;
  const eventos = (Array.isArray(d?.eventos) ? d.eventos : [])
    .slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  const delegados = Array.isArray(d?.delegados) ? d.delegados : [];
  const requeridos = esDobles ? 2 : 1;
  const faltaJugador = [1, 2].some(l => jugadores.length > 0
    && jugadores.filter(j => Number(j.lado) === l && (j.estado ?? 'ACTIVO') === 'ACTIVO').length < requeridos);
  const soyJugador = Number(d?.soy_jugador ?? 0) === 1;

  // Botones + / −: se ve al instante y se envía SOLO el cambio (+1 / −1).
  // El servidor lo aplica al set que está en juego, así dos personas anotando no se pisan.
  function cambiar(lado, delta) {
    const a = Math.max(0, Number(actual.puntos_lado1) + (lado === 1 ? delta : 0));
    const b = Math.max(0, Number(actual.puntos_lado2) + (lado === 2 ? delta : 0));
    if (a > 99 || b > 99) return;
    setD(prev => ({
      ...prev,
      sets: [...sets.filter(s => Number(s.numero_set) !== setActual),
             { numero_set: setActual, puntos_lado1: a, puntos_lado2: b, terminado: 0 }],
    }));
    encolar(() => enVivoService.sumar(idPartido, lado, delta));
  }

  // Corrección de un set (marcador completo)
  function enviar(numeroSet, a, b) {
    encolar(() => enVivoService.marcar(idPartido, numeroSet, a, b));
  }

  function encolar(peticion) {
    ultimoCambio.current = Date.now();
    enviando.current += 1;
    cola.current = cola.current
      .then(peticion)
      .catch(e => Alert.alert(t('vivo.titulo'), e.message ?? t('vivo.errorMarcar')))
      .finally(() => {
        enviando.current -= 1;
        if (enviando.current === 0) cargar();
      });
  }

  async function iniciar() {
    setIniciando(true);
    try {
      await enVivoService.iniciar(idPartido);
      await cargar();
    } catch (e) {
      Alert.alert(t('vivo.titulo'), e.message ?? t('vivo.errorIniciar'));
    } finally {
      setIniciando(false);
    }
  }

  function terminar() {
    Alert.alert(t('vivo.terminarTitulo'), t('vivo.terminarMensaje'), [
      { text: t('comun.cancelar'), style: 'cancel' },
      {
        text: t('vivo.terminar'),
        style: 'destructive',
        onPress: async () => {
          try { await enVivoService.finalizar(idPartido); await cargar(); }
          catch (e) { Alert.alert(t('vivo.titulo'), e.message); }
        },
      },
    ]);
  }

  function guardarEdicion() {
    const a = Number(editar.a);
    const b = Number(editar.b);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 99 || b > 99) {
      Alert.alert(t('vivo.titulo'), t('reglasSet.invalido'));
      return;
    }
    // Un set anterior debe quedar terminado con un marcador válido
    if (editar.numero_set < setActual) {
      const err = validarSet(a, b, esDobles);
      if (err) { Alert.alert(t('vivo.titulo'), t(err.clave, err.params)); return; }
    }
    enviar(editar.numero_set, a, b);
    setEditar(null);
  }

  const gana1 = finalizado && (ladoAbandono === 2 || (ladoAbandono == null && s1 > s2));
  const gana2 = finalizado && (ladoAbandono === 1 || (ladoAbandono == null && s2 > s1));

  // NUEVO (08): abandonar el partido en juego
  function abandonar() {
    Alert.alert(t('retiro.abandonarTitulo'), t('retiro.abandonarMensaje'), [
      { text: t('comun.cancelar'), style: 'cancel' },
      {
        text: t('retiro.abandonar'),
        style: 'destructive',
        onPress: async () => {
          try { await partidoService.retirarse(idPartido); await cargar(); }
          catch (e) { Alert.alert(t('vivo.titulo'), e.message); }
        },
      },
    ]);
  }

  // NUEVO (08): dar permiso a un amigo para anotar
  async function delegarA(amigo) {
    setElegirDelegado(false);
    try {
      const res = await enVivoService.delegar(idPartido, amigo.id_usuario);
      Alert.alert(t('vivo.delegarTitulo'), res?.mensaje ?? '');
      await cargar();
    } catch (e) {
      Alert.alert(t('vivo.delegarTitulo'), e.message);
    }
  }

  function quitarDelegado(dl) {
    Alert.alert(t('vivo.quitarPermiso'), t('vivo.quitarPermisoMensaje', { nombre: primerNombre(dl.nombre) }), [
      { text: t('comun.cancelar'), style: 'cancel' },
      {
        text: t('vivo.quitar'),
        style: 'destructive',
        onPress: async () => {
          try { await enVivoService.quitarDelegado(idPartido, dl.id_usuario); await cargar(); }
          catch (e) { Alert.alert(t('vivo.titulo'), e.message); }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCentro}>
          {enJuego && <PuntoEnVivo />}
          <Text style={styles.headerTitulo}>
            {enJuego ? t('vivo.enVivo') : finalizado ? t('vivo.finalizado') : t('vivo.titulo')}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        {/* Marcador */}
        <View style={styles.marcador}>
          <Lado jugadores={lado1} sets={s1} ganador={gana1} alineado="flex-start" />
          <View style={styles.centroMarcador}>
            <Text style={styles.etiquetaSets}>{t('vivo.sets')}</Text>
            <Text style={styles.vs}>VS</Text>
          </View>
          <Lado jugadores={lado2} sets={s2} ganador={gana2} alineado="flex-end" />
        </View>

        {/* NUEVO (08): lo que está pasando (abandono, retiro, sustituto) */}
        {ladoAbandono != null && (
          <View style={styles.banner}>
            <Ionicons name="flag" size={18} color="#FFFFFF" />
            <Text style={styles.bannerTxt}>
              {t('vivo.bannerAbandono', { nombre: (ladoAbandono === 1 ? lado1 : lado2).filter(j => j.estado === 'RETIRADO').map(j => primerNombre(j.nombre)).join(' y ') || '—' })}
            </Text>
          </View>
        )}
        {ladoAbandono == null && faltaJugador && !finalizado && (
          <View style={[styles.banner, styles.bannerEspera]}>
            <Ionicons name="hourglass-outline" size={18} color="#FFFFFF" />
            <Text style={styles.bannerTxt}>
              {jugadores.some(j => j.estado === 'SUSTITUTO_PENDIENTE') ? t('vivo.bannerEsperaSustituto') : t('vivo.bannerRetiro')}
            </Text>
          </View>
        )}

        {/* Set en juego */}
        {estado !== 'SIN_INICIAR' && !finalizado && (
          <View style={styles.setActual}>
            <Text style={styles.setActualTitulo}>
              {t('vivo.setDe', { n: setActual, total: d?.num_sets ?? '-' })}  ·  {t('vivo.aPuntos', { n: meta })}
            </Text>
            <View style={styles.puntosFila}>
              {puedoMarcar && <BotonesPuntos onMas={() => cambiar(1, 1)} onMenos={() => cambiar(1, -1)} deshabilitado={!enJuego} />}
              <Text style={styles.puntos}>{actual.puntos_lado1}</Text>
              <Text style={styles.puntosSep}>-</Text>
              <Text style={styles.puntos}>{actual.puntos_lado2}</Text>
              {puedoMarcar && <BotonesPuntos onMas={() => cambiar(2, 1)} onMenos={() => cambiar(2, -1)} deshabilitado={!enJuego} />}
            </View>
            {Number(actual.puntos_lado1) === meta - 1 && Number(actual.puntos_lado2) === meta - 1 && (
              <Text style={styles.aviso}>{t('vivo.desempate', { n: meta - 1 })}</Text>
            )}
          </View>
        )}

        {/* Sets jugados */}
        {sets.length > 0 && (
          <View style={styles.tarjeta}>
            <Text style={styles.tarjetaTitulo}>{t('vivo.marcadorSets')}</Text>
            {sets.map(s => {
              const terminado = Number(s.terminado) === 1;
              const a = Number(s.puntos_lado1);
              const b = Number(s.puntos_lado2);
              return (
                <TouchableOpacity
                  key={s.numero_set}
                  style={styles.filaSet}
                  disabled={!puedoMarcar}
                  onPress={() => setEditar({ numero_set: Number(s.numero_set), a: String(a), b: String(b) })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filaSetLabel}>{t('vivo.set', { n: s.numero_set })}</Text>
                  <Text style={[styles.filaSetPts, terminado && a > b && styles.ptsGanador]}>{a}</Text>
                  <Text style={styles.filaSetSep}>-</Text>
                  <Text style={[styles.filaSetPts, terminado && b > a && styles.ptsGanador]}>{b}</Text>
                  <View style={{ flex: 1 }} />
                  {terminado
                    ? <Ionicons name="checkmark-circle" size={18} color={colors.positive} />
                    : <Text style={styles.enJuegoTxt}>{t('vivo.enJuego')}</Text>}
                  {puedoMarcar && <Ionicons name="create-outline" size={16} color={colors.textSecondary} style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Estados */}
        {estado === 'SIN_INICIAR' && (
          puedoMarcar ? (
            <TouchableOpacity style={styles.btnPrincipal} onPress={iniciar} disabled={iniciando} activeOpacity={0.85}>
              {iniciando ? <ActivityIndicator color={colors.primary} /> : <PuntoEnVivo />}
              <Text style={styles.btnPrincipalTxt}>{t('vivo.iniciar')}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.info}>{t('vivo.aunNo')}</Text>
          )
        )}

        {puedoMarcar && estado === 'SIN_INICIAR' && <Text style={styles.info}>{t('vivo.explicacionIniciar')}</Text>}

        {finalizado && (
          <View style={styles.tarjeta}>
            <Text style={styles.finTitulo}>{t('vivo.terminoTitulo')}</Text>
            <Text style={[styles.info, { color: colors.textSecondary }]}>{t('vivo.terminoMensaje')}</Text>
          </View>
        )}

        {/* CORREGIDO: si el marcador ya decidió el partido, el siguiente paso es el resultado oficial */}
        {finalizado && decidido && soyAnfitrion && (
          <TouchableOpacity
            style={styles.btnPrincipal}
            onPress={() => navigation.navigate('DetallePartido', { partido: { id_partido: idPartido } })}
            activeOpacity={0.85}
          >
            <Ionicons name="trophy-outline" size={20} color={colors.primary} />
            <Text style={styles.btnPrincipalTxt}>{t('vivo.publicarOficial')}</Text>
          </TouchableOpacity>
        )}

        {finalizado && decidido && soyRival && (
          <Text style={styles.info}>{t('vivo.esperaAnfitrion')}</Text>
        )}

        {/* CORREGIDO: "Reanudar" solo cuando se terminó a mano sin que nadie haya ganado
            (si el marcador ya decidió el partido, reanudar lo volvía a cerrar al instante) */}
        {finalizado && !decidido && puedoMarcar && (
          <TouchableOpacity style={styles.btnSecundario} onPress={iniciar} disabled={iniciando}>
            <Ionicons name="play-circle-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.btnSecundarioTxt}>{t('vivo.reanudar')}</Text>
          </TouchableOpacity>
        )}

        {puedoMarcar && enJuego && (
          <TouchableOpacity style={styles.btnSecundario} onPress={terminar}>
            <Ionicons name="stop-circle-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.btnSecundarioTxt}>{t('vivo.terminar')}</Text>
          </TouchableOpacity>
        )}

        {/* NUEVO (08): abandonar mientras se juega */}
        {enJuego && soyJugador && (
          <TouchableOpacity style={styles.btnSecundario} onPress={abandonar}>
            <Ionicons name="exit-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.btnSecundarioTxt}>{t('retiro.abandonar')}</Text>
          </TouchableOpacity>
        )}

        {/* NUEVO (08): amigos con permiso para anotar el marcador */}
        {soyJugador && !finalizado && (
          <View style={styles.tarjeta}>
            <Text style={styles.tarjetaTitulo}>{t('vivo.permisosTitulo')}</Text>
            <Text style={[styles.info, styles.infoTarjeta]}>{t('vivo.permisosTexto')}</Text>
            {delegados.map(dl => (
              <View key={dl.id_usuario} style={styles.filaDelegado}>
                <Image source={getAvatarSource(dl.foto)} style={styles.avatarMini} />
                <Text style={styles.nombreDelegado} numberOfLines={1}>{dl.nombre}</Text>
                <TouchableOpacity onPress={() => quitarDelegado(dl)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.btnDelegar} onPress={() => setElegirDelegado(true)}>
              <Ionicons name="person-add-outline" size={18} color={colors.primary} />
              <Text style={styles.btnDelegarTxt}>{t('vivo.darPermiso')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* NUEVO (08): lo que pasó en el partido */}
        {eventos.length > 0 && (
          <View style={styles.tarjeta}>
            <Text style={styles.tarjetaTitulo}>{t('vivo.eventosTitulo')}</Text>
            {eventos.map((e, i) => (
              <View key={`${e.tipo}-${e.fecha}-${i}`} style={styles.filaEvento}>
                <View style={[styles.puntoEvento, { backgroundColor: COLOR_EVENTO[e.tipo] ?? colors.textSecondary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.textoEvento}>
                    {t(`vivo.eventos.${e.tipo}`, { nombre: primerNombre(e.nombre), otro: primerNombre(e.nombre_afectado), defaultValue: e.tipo })}
                  </Text>
                  <Text style={styles.horaEvento}>{String(e.fecha ?? '').substring(11, 16)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {d?.nombre_cancha ? (
          <View style={styles.cancha}>
            <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.canchaTxt}>{d.nombre_cancha}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Corregir un set */}
      <Modal visible={!!editar} transparent animationType="fade" onRequestClose={() => setEditar(null)}>
        <View style={styles.modalFondo}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>{t('vivo.corregirSet', { n: editar?.numero_set })}</Text>
            <View style={styles.modalFila}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.modalNombre} numberOfLines={1}>{lado1.filter(j => (j.estado ?? 'ACTIVO') === 'ACTIVO').map(j => primerNombre(j.nombre)).join(' y ')}</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={editar?.a ?? ''}
                  onChangeText={v => setEditar(e => ({ ...e, a: v.replace(/\D/g, '') }))}
                />
              </View>
              <Text style={styles.modalSep}>-</Text>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.modalNombre} numberOfLines={1}>{lado2.filter(j => (j.estado ?? 'ACTIVO') === 'ACTIVO').map(j => primerNombre(j.nombre)).join(' y ')}</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={editar?.b ?? ''}
                  onChangeText={v => setEditar(e => ({ ...e, b: v.replace(/\D/g, '') }))}
                />
              </View>
            </View>
            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.modalCancelar} onPress={() => setEditar(null)}>
                <Text style={styles.modalCancelarTxt}>{t('comun.cancelar')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalGuardar} onPress={guardarEdicion}>
                <Text style={styles.modalGuardarTxt}>{t('vivo.guardar')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* NUEVO (08): elegir amigo para anotar */}
      <SelectorAmigoModal
        visible={elegirDelegado}
        titulo={t('vivo.elegirDelegado')}
        excluir={[...jugadores.map(j => j.id_usuario), ...delegados.map(dl => dl.id_usuario)]}
        onClose={() => setElegirDelegado(false)}
        onSelect={delegarA}
        onSinAmigos={() => { setElegirDelegado(false); Alert.alert(t('vivo.delegarTitulo'), t('retiro.sinAmigos')); }}
      />
    </SafeAreaView>
  );
}

// NUEVO (08): color del punto de cada evento
const COLOR_EVENTO = {
  RETIRO: '#F5B800', ABANDONO: '#FF3B30', SUSTITUTO_INVITADO: '#7CC4FF', SUSTITUTO_ACEPTADO: '#2ECC71',
  SUSTITUTO_RECHAZADO: '#F5B800', VIVO_INICIO: '#2ECC71', VIVO_FIN: '#4A6172', DELEGADO: '#7CC4FF', CANCELADO: '#FF3B30',
};

const styles = StyleSheet.create({
  // NUEVO (08)
  avatarRetirado: { opacity: 0.35 },
  avatarPendiente: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  retiradoTxt: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,59,48,0.25)', borderRadius: 14, padding: 12, marginTop: 6 },
  bannerEspera: { backgroundColor: 'rgba(245,184,0,0.22)' },
  bannerTxt: { flex: 1, color: '#FFFFFF', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  infoTarjeta: { color: colors.textSecondary, textAlign: 'left', marginTop: 0, marginBottom: 8 },
  filaDelegado: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  avatarMini: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ccc' },
  nombreDelegado: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  btnDelegar: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.accent, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginTop: 8 },
  btnDelegarTxt: { fontSize: 13, fontWeight: '800', color: colors.primary },
  filaEvento: { flexDirection: 'row', gap: 10, paddingVertical: 7 },
  puntoEvento: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  textoEvento: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  horaEvento: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  safe: { flex: 1, backgroundColor: colors.dark },
  centro: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerCentro: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitulo: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },

  contenido: { padding: 16, paddingBottom: 40 },

  marcador: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  lado: { flex: 1 },
  avatares: { flexDirection: 'row', marginBottom: 8 },
  avatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: '#1E2433' },
  avatarPareja: { marginLeft: -16 },
  avatarGanador: { borderColor: RANKED_LIME },
  nombre: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  nombreGanador: { fontWeight: '900' },
  setsGanados: { color: '#FFFFFF', fontSize: 52, fontWeight: '900', marginTop: 2 },
  centroMarcador: { alignItems: 'center', paddingTop: 22, width: 54 },
  etiquetaSets: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  vs: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '900', marginTop: 6 },

  setActual: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 16, marginTop: 8, alignItems: 'center' },
  setActualTitulo: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  puntosFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 10 },
  puntos: { color: '#FFFFFF', fontSize: 64, fontWeight: '900', minWidth: 72, textAlign: 'center' },
  puntosSep: { color: 'rgba(255,255,255,0.4)', fontSize: 40, fontWeight: '300' },
  aviso: { color: RANKED_LIME, fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'center' },

  botones: { alignItems: 'center', gap: 8 },
  btnMas: { width: 56, height: 56, borderRadius: 28, backgroundColor: RANKED_LIME, alignItems: 'center', justifyContent: 'center' },
  btnMenos: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  btnOff: { opacity: 0.35 },

  tarjeta: { backgroundColor: colors.background, borderRadius: 18, padding: 16, marginTop: 16 },
  tarjetaTitulo: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  filaSet: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  filaSetLabel: { width: 60, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  filaSetPts: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, minWidth: 26, textAlign: 'center' },
  filaSetSep: { fontSize: 16, color: colors.textSecondary, marginHorizontal: 6 },
  ptsGanador: { fontWeight: '900', color: colors.positive },
  enJuegoTxt: { fontSize: 12, fontWeight: '800', color: ROJO },

  btnPrincipal: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: RANKED_LIME, borderRadius: 30, paddingVertical: 17, marginTop: 24,
  },
  btnPrincipalTxt: { fontSize: 16, fontWeight: '800', color: colors.primary },
  btnSecundario: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.background, borderRadius: 30, paddingVertical: 15, marginTop: 16,
  },
  btnSecundarioTxt: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  info: { color: 'rgba(255,255,255,0.65)', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 19 },
  finTitulo: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  cancha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 20 },
  canchaTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: colors.background, borderRadius: 20, padding: 20, width: '100%' },
  modalTitulo: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 16 },
  modalFila: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 14 },
  modalNombre: { fontSize: 13, color: colors.textSecondary, marginBottom: 6, maxWidth: 110 },
  modalInput: {
    width: 76, height: 60, borderRadius: 14, backgroundColor: colors.surface, textAlign: 'center',
    fontSize: 26, fontWeight: '800', color: colors.textPrimary,
  },
  modalSep: { fontSize: 26, color: colors.textSecondary, marginBottom: 14 },
  modalBotones: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalCancelar: { flex: 1, borderRadius: 24, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: colors.textPrimary },
  modalCancelarTxt: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  modalGuardar: { flex: 1, borderRadius: 24, paddingVertical: 13, alignItems: 'center', backgroundColor: colors.accent },
  modalGuardarTxt: { fontSize: 15, fontWeight: '800', color: colors.primary },
});
